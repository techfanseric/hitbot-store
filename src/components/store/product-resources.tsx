import { Box, Download, FileText } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { formatResourceSize } from '@hitbot/domain';
import { Button } from '@/components/ui/button';
import type { AppLocale } from '@/i18n/routing';
import type { ProductResource } from '@/types/product';

export async function ProductResources({
  resources,
  locale,
}: {
  resources?: ProductResource[];
  locale: AppLocale;
}) {
  if (!resources?.length) return null;
  const t = await getTranslations('ProductResources');

  return (
    <section
      id="product-resources"
      aria-labelledby="product-resources-title"
      className="mt-8 scroll-mt-[80px] md:mt-[40px] md:scroll-mt-[120px]"
    >
      <h2 id="product-resources-title" className="mb-3 text-2xl font-semibold">
        {t('title')}
      </h2>
      <ul className="bg-bg-surface rounded-lg px-3 md:px-4">
        {resources.map((resource) => {
          const Icon = resource.kind === 'manual' ? FileText : Box;
          const metadata = [
            resource.format.toUpperCase(),
            resource.language ? t(resource.language === 'zh' ? 'chinese' : 'english') : '',
            resource.version,
            formatResourceSize(resource.sizeBytes),
            resource.isSample ? t('sample') : '',
          ]
            .filter(Boolean)
            .join(' · ');

          return (
            <li
              key={resource.id}
              className="flex min-h-[60px] items-center justify-between gap-2 py-2"
            >
              <div className="flex min-w-0 items-center gap-3">
                <Icon
                  aria-hidden="true"
                  className="text-text-muted hidden size-4 shrink-0 min-[400px]:block"
                />
                <div className="min-w-0">
                  <p className="text-text-strong text-[14px] font-medium break-words">
                    {resource.name[locale]}
                  </p>
                  <p className="text-text-muted mt-0.5 text-[12px] leading-relaxed break-words">
                    {metadata}
                  </p>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1">
                {resource.format === 'pdf' && (
                  <Button asChild variant="subtle" size="sm" className="px-2 text-[13px]">
                    <a
                      href={resource.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={t('viewLabel', { name: resource.name[locale] })}
                    >
                      {t('view')}
                    </a>
                  </Button>
                )}
                <Button asChild variant="subtle" size="sm" className="px-2 text-[13px]">
                  <a
                    href={resource.downloadUrl ?? resource.url}
                    download={resource.fileName}
                    aria-label={t('downloadLabel', { name: resource.name[locale] })}
                  >
                    <Download aria-hidden="true" className="hidden size-3.5 sm:block" />
                    {t('download')}
                  </a>
                </Button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
