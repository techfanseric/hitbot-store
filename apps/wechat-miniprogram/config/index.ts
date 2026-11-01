import path from 'node:path';
import { defineConfig, type UserConfigExport } from '@tarojs/cli';

const config: UserConfigExport = {
  projectName: 'hitbot-store-miniprogram',
  date: '2026-06-08',
  designWidth: 375,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
    375: 2,
  },
  sourceRoot: 'src',
  outputRoot: 'dist',
  framework: 'react',
  defineConstants: {
    HITBOT_STORE_URL: JSON.stringify(process.env.TARO_APP_STORE_URL || 'https://www.hitbot.cc'),
  },
  compiler: 'webpack5',
  cache: {
    enable: false,
  },
  alias: {
    '@': path.resolve(__dirname, '..', 'src'),
  },
  copy: {
    patterns: [
      {
        from: 'src/assets',
        to: 'dist/assets',
      },
    ],
    options: {},
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {},
      },
      cssModules: {
        enable: false,
        config: {
          namingPattern: 'module',
          generateScopedName: '[name]__[local]___[hash:base64:5]',
        },
      },
    },
  },
  h5: {},
};

export default defineConfig(() => config);
