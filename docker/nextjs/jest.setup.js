// Jest セットアップファイル
// 高度権限制御システムテスト用設定

import '@testing-library/jest-dom';

// グローバルモック設定
global.fetch = jest.fn();

// Next.js環境変数モック
process.env.NODE_ENV = 'test';
process.env.AWS_REGION = 'ap-northeast-1';
process.env.PERMISSION_FILTER_FUNCTION_NAME = 'test-permission-filter';
process.env.AUDIT_LOG_FUNCTION_NAME = 'test-audit-log';

// Next.js router mock
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    prefetch: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
  }),
  useSearchParams: () => ({
    get: jest.fn(),
  }),
  usePathname: () => '/test-path',
}));

// IntersectionObserver mock
global.IntersectionObserver = class IntersectionObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// ResizeObserver mock
global.ResizeObserver = class ResizeObserver {
  constructor() {}
  disconnect() {}
  observe() {}
  unobserve() {}
};

// コンソール出力の制御（テスト時のノイズ削減）
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// テスト後のクリーンアップ
afterEach(() => {
  jest.clearAllMocks();
});