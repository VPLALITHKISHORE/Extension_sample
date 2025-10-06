export const WEBSTATUS_API_URL = 'https://api.webstatus.dev/v1/features';
export const CACHE_DURATION = 3600000; // 1 hour in milliseconds
export const EXTENSION_NAME = 'BaselineGuard';

export const SEVERITY_MAPPING = {
  limited: 'Warning',
  newly: 'Information',
  widely: 'Hint'
} as const;

export const STATUS_ICONS = {
  limited: '⚠️',
  newly: '🟡', 
  widely: '✅',
  unknown: '❓'
} as const;

export const BROWSERS = {
  chrome: 'Chrome',
  firefox: 'Firefox', 
  safari: 'Safari',
  edge: 'Edge',
  chrome_android: 'Chrome Android',
  firefox_android: 'Firefox Android',
  safari_ios: 'Safari iOS'
} as const;

export const SUPPORTED_LANGUAGES = [
  'javascript',
  'typescript',
  'css',
  'scss', 
  'less',
  'html',
  'javascriptreact',
  'typescriptreact'
] as const;
