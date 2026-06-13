import Taro from '@tarojs/taro';
import {
  createHitbotMiniApiClient,
  type ApiRequestOptions,
  type ApiTransport,
} from '@hitbot/api-client';
import { miniEnv } from '@/config/env';

class TaroApiTransport implements ApiTransport {
  constructor(private readonly baseUrl: string) {}

  async request<TResponse, TBody = unknown>(options: ApiRequestOptions<TBody>): Promise<TResponse> {
    const response = await Taro.request<TResponse>({
      url: `${this.baseUrl}${options.path}`,
      method: options.method ?? 'GET',
      data: options.body,
      header: {
        'content-type': 'application/json',
        ...(options.token ? { authorization: `Bearer ${options.token}` } : {}),
      },
    });

    if (response.statusCode < 200 || response.statusCode >= 300) {
      throw new Error(`HITBOT mini API ${response.statusCode}: ${options.path}`);
    }

    return response.data;
  }
}

export const hitbotMiniApi = createHitbotMiniApiClient(
  miniEnv.apiBaseUrl ? { transport: new TaroApiTransport(miniEnv.apiBaseUrl) } : undefined,
);
