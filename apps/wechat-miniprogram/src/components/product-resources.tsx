import { useEffect, useRef, useState } from 'react';
import Taro from '@tarojs/taro';
import { Button, Text, View } from '@tarojs/components';
import {
  formatResourceSize,
  localized,
  productResourcesPath,
  type ProductResource,
} from '@hitbot/domain';
import { miniEnv } from '@/config/env';
import './product-resources.scss';

// WeChat's service runtime does not provide the browser URL constructor.
function storeUrl(path: string) {
  return /^https?:\/\//.test(path)
    ? path
    : `${miniEnv.storeBaseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}`;
}

export function ProductResources({
  resources,
  slug,
}: {
  resources?: ProductResource[];
  slug: string;
}) {
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorId, setErrorId] = useState<string | null>(null);
  const inFlight = useRef(false);
  const downloadTask = useRef<Taro.DownloadTask>();
  const localFiles = useRef(new Map<string, string>());

  useEffect(
    () => () => {
      downloadTask.current?.abort();
    },
    [],
  );

  if (!resources?.length) return null;

  async function viewManual(resource: ProductResource) {
    if (inFlight.current) return;
    inFlight.current = true;
    setPendingId(resource.id);
    setErrorId(null);
    try {
      let filePath = localFiles.current.get(resource.url);
      if (!filePath) {
        const task = Taro.downloadFile({
          url: storeUrl(resource.url),
          timeout: 60000,
        });
        downloadTask.current = task;
        const response = await task;
        if (response.statusCode !== 200 || !response.tempFilePath)
          throw new Error('DOWNLOAD_FAILED');
        filePath = response.tempFilePath;
        localFiles.current.set(resource.url, filePath);
      }
      await Taro.openDocument({ filePath, fileType: 'pdf', showMenu: true });
    } catch {
      localFiles.current.delete(resource.url);
      setErrorId(resource.id);
    } finally {
      downloadTask.current = undefined;
      inFlight.current = false;
      setPendingId(null);
    }
  }

  async function copyModelLink() {
    try {
      await Taro.setClipboardData({ data: storeUrl(productResourcesPath(slug)) });
      await Taro.showToast({ title: '链接已复制，请在电脑浏览器打开', icon: 'none' });
    } catch {
      await Taro.showToast({ title: '复制失败，请重试', icon: 'none' });
    }
  }

  return (
    <View className="surface product-resources">
      <Text className="section-title">产品资料</Text>
      {resources.map((resource) => {
        const metadata = [
          resource.format.toUpperCase(),
          resource.language === 'zh' ? '简体中文' : resource.language === 'en' ? 'English' : '',
          resource.version,
          formatResourceSize(resource.sizeBytes),
          resource.isSample ? '示例' : '',
        ]
          .filter(Boolean)
          .join(' · ');
        const isManual = resource.format === 'pdf';
        return (
          <View key={resource.id} className="resource-row">
            <View className="resource-info">
              <Text className="resource-name">{localized(resource.name)}</Text>
              <Text className="resource-meta">{metadata}</Text>
              {errorId === resource.id && (
                <Text className="resource-error">手册打开失败，请重试</Text>
              )}
            </View>
            <Button
              className="resource-action"
              loading={pendingId === resource.id}
              disabled={isManual && pendingId !== null}
              onClick={() => (isManual ? viewManual(resource) : copyModelLink())}
            >
              {pendingId === resource.id
                ? '打开中'
                : isManual
                  ? errorId === resource.id
                    ? '重试'
                    : '查看'
                  : '复制链接'}
            </Button>
          </View>
        );
      })}
    </View>
  );
}
