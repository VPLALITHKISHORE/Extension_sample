// src/utils/enhancedPatterns.ts
import * as ts from 'typescript';

export interface PatternInfo {
  featureId: string;
  pattern: RegExp;
  astPattern?: ASTPattern;
  language: string[];
  confidence: number;
  contextRequired?: boolean;
  category: 'html' | 'css' | 'javascript' | 'api';
  description: string;
}

export interface ASTPattern {
  nodeType: ts.SyntaxKind;
  propertyName?: string;
  methodName?: string;
  objectName?: string;
}

export const ENHANCED_WEB_PATTERNS: PatternInfo[] = [
  // ========== CSS FEATURES (Using correct WebStatus API feature IDs) ==========
  {
    featureId: 'container-queries',
    pattern: /@container\s*[^{]*\{/gi,
    language: ['css', 'scss', 'less', 'stylus'],
    confidence: 0.95,
    category: 'css',
    description: 'CSS Container Queries'
  },
  {
    featureId: 'content-visibility',
    pattern: /content-visibility\s*:/gi,
    language: ['css', 'scss', 'less', 'stylus'],
    confidence: 1.0,
    category: 'css',
    description: 'CSS content-visibility property'
  },
  {
    featureId: 'css-cascade-layers',
    pattern: /@layer\s+/gi,
    language: ['css', 'scss', 'less'],
    confidence: 0.95,
    category: 'css',
    description: 'CSS Cascade Layers'
  },
  {
    featureId: 'has',
    pattern: /:has\s*\(/gi,
    language: ['css', 'scss', 'less', 'stylus'],
    confidence: 0.9,
    category: 'css',
    description: 'CSS :has() pseudo-class'
  },
  {
    featureId: 'grid',
    pattern: /display\s*:\s*grid|grid-template-columns|grid-template-rows|grid-area/gi,
    language: ['css', 'scss', 'less', 'stylus'],
    confidence: 0.85,
    category: 'css',
    description: 'CSS Grid Layout'
  },
  {
    featureId: 'flexbox',
    pattern: /display\s*:\s*flex|flex-direction|flex-wrap|justify-content/gi,
    language: ['css', 'scss', 'less', 'stylus'],
    confidence: 0.8,
    category: 'css',
    description: 'CSS Flexbox'
  },
  {
    featureId: 'subgrid',
    pattern: /grid-template-(columns|rows)\s*:\s*subgrid/gi,
    language: ['css', 'scss', 'less'],
    confidence: 0.95,
    category: 'css',
    description: 'CSS Subgrid'
  },
  {
    featureId: 'backdrop-filter',
    pattern: /backdrop-filter\s*:/gi,
    language: ['css', 'scss', 'less', 'stylus'],
    confidence: 0.95,
    category: 'css',
    description: 'CSS backdrop-filter'
  },
  {
    featureId: 'aspect-ratio',
    pattern: /aspect-ratio\s*:/gi,
    language: ['css', 'scss', 'less', 'stylus'],
    confidence: 1.0,
    category: 'css',
    description: 'CSS aspect-ratio'
  },
  {
    featureId: 'css-nesting',
    pattern: /&\s*\{|&\s+\./gi,
    language: ['css', 'scss', 'less'],
    confidence: 0.7,
    category: 'css',
    description: 'CSS Nesting'
  },
  
  // ========== WEB APIs (Using correct WebStatus API feature IDs) ==========
  {
    featureId: 'urlpattern',
    pattern: /new\s+URLPattern\s*\(/g,
    language: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    confidence: 1.0,
    category: 'api',
    description: 'URLPattern API',
    astPattern: {
      nodeType: ts.SyntaxKind.NewExpression,
      objectName: 'URLPattern'
    }
  },
  {
    featureId: 'async-clipboard',
    pattern: /navigator\.clipboard\.(writeText|readText|write|read)/g,
    language: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    confidence: 0.95,
    category: 'api',
    description: 'Async Clipboard API'
  },
  {
    featureId: 'abortcontroller',
    pattern: /new\s+AbortController\s*\(/g,
    language: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    confidence: 1.0,
    category: 'api',
    description: 'AbortController',
    astPattern: {
      nodeType: ts.SyntaxKind.NewExpression,
      objectName: 'AbortController'
    }
  },
  {
    featureId: 'abortsignal',
    pattern: /AbortSignal\.(abort|timeout)/g,
    language: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    confidence: 0.95,
    category: 'api',
    description: 'AbortSignal static methods'
  },
  {
    featureId: 'intersectionobserver',
    pattern: /new\s+IntersectionObserver\s*\(/g,
    language: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    confidence: 1.0,
    category: 'api',
    description: 'Intersection Observer API',
    astPattern: {
      nodeType: ts.SyntaxKind.NewExpression,
      objectName: 'IntersectionObserver'
    }
  },
  {
    featureId: 'resizeobserver',
    pattern: /new\s+ResizeObserver\s*\(/g,
    language: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    confidence: 1.0,
    category: 'api',
    description: 'Resize Observer API',
    astPattern: {
      nodeType: ts.SyntaxKind.NewExpression,
      objectName: 'ResizeObserver'
    }
  },
  {
    featureId: 'mutationobserver',
    pattern: /new\s+MutationObserver\s*\(/g,
    language: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    confidence: 1.0,
    category: 'api',
    description: 'Mutation Observer API',
    astPattern: {
      nodeType: ts.SyntaxKind.NewExpression,
      objectName: 'MutationObserver'
    }
  },
  {
    featureId: 'web-share',
    pattern: /navigator\.share\s*\(/g,
    language: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    confidence: 0.95,
    category: 'api',
    description: 'Web Share API',
    astPattern: {
      nodeType: ts.SyntaxKind.CallExpression,
      objectName: 'navigator',
      methodName: 'share'
    }
  },
  {
    featureId: 'view-transitions',
    pattern: /document\.startViewTransition\s*\(/g,
    language: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    confidence: 1.0,
    category: 'api',
    description: 'View Transitions API',
    astPattern: {
      nodeType: ts.SyntaxKind.CallExpression,
      objectName: 'document',
      methodName: 'startViewTransition'
    }
  },
  {
    featureId: 'broadcastchannel',
    pattern: /new\s+BroadcastChannel\s*\(/g,
    language: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    confidence: 1.0,
    category: 'api',
    description: 'Broadcast Channel API',
    astPattern: {
      nodeType: ts.SyntaxKind.NewExpression,
      objectName: 'BroadcastChannel'
    }
  },
  {
    featureId: 'serviceworker',
    pattern: /navigator\.serviceWorker/g,
    language: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    confidence: 0.95,
    category: 'api',
    description: 'Service Worker API'
  },
  {
    featureId: 'web-animations',
    pattern: /\.animate\s*\(/g,
    language: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    confidence: 0.7,
    contextRequired: true,
    category: 'api',
    description: 'Web Animations API'
  },
  {
    featureId: 'fetch',
    pattern: /\bfetch\s*\(/g,
    language: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    confidence: 0.9,
    category: 'api',
    description: 'Fetch API'
  },
  {
    featureId: 'payment-request',
    pattern: /new\s+PaymentRequest\s*\(/g,
    language: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    confidence: 1.0,
    category: 'api',
    description: 'Payment Request API',
    astPattern: {
      nodeType: ts.SyntaxKind.NewExpression,
      objectName: 'PaymentRequest'
    }
  },
  {
    featureId: 'notification',
    pattern: /new\s+Notification\s*\(/g,
    language: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    confidence: 1.0,
    category: 'api',
    description: 'Notifications API',
    astPattern: {
      nodeType: ts.SyntaxKind.NewExpression,
      objectName: 'Notification'
    }
  },
  {
    featureId: 'geolocation',
    pattern: /navigator\.geolocation/g,
    language: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    confidence: 0.95,
    category: 'api',
    description: 'Geolocation API'
  },
  {
    featureId: 'indexeddb',
    pattern: /indexedDB\.open|IDBDatabase/g,
    language: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    confidence: 0.9,
    category: 'api',
    description: 'IndexedDB'
  },
  {
    featureId: 'websockets',
    pattern: /new\s+WebSocket\s*\(/g,
    language: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact'],
    confidence: 1.0,
    category: 'api',
    description: 'WebSocket API',
    astPattern: {
      nodeType: ts.SyntaxKind.NewExpression,
      objectName: 'WebSocket'
    }
  },
  {
    featureId: 'pointer-events',
    pattern: /onpointer(down|up|move|cancel|over|out|enter|leave)/gi,
    language: ['javascript', 'typescript', 'html', 'javascriptreact', 'typescriptreact'],
    confidence: 0.85,
    category: 'api',
    description: 'Pointer Events'
  },
  
  // ========== HTML FEATURES (Using correct WebStatus API feature IDs) ==========
  {
    featureId: 'dialog',
    pattern: /<dialog[>\s]/gi,
    language: ['html', 'javascriptreact', 'typescriptreact', 'vue', 'svelte'],
    confidence: 0.95,
    category: 'html',
    description: 'HTML <dialog> element'
  },
  {
    featureId: 'details',
    pattern: /<details[>\s]/gi,
    language: ['html', 'javascriptreact', 'typescriptreact', 'vue', 'svelte'],
    confidence: 0.95,
    category: 'html',
    description: 'HTML <details> element'
  },
  {
    featureId: 'picture',
    pattern: /<picture[>\s]/gi,
    language: ['html', 'javascriptreact', 'typescriptreact', 'vue', 'svelte'],
    confidence: 0.95,
    category: 'html',
    description: 'HTML <picture> element'
  },
  {
    featureId: 'loading-lazy',
    pattern: /loading\s*=\s*["']lazy["']/gi,
    language: ['html', 'javascriptreact', 'typescriptreact', 'vue'],
    confidence: 0.9,
    category: 'html',
    description: 'HTML loading=lazy attribute'
  },
  {
    featureId: 'template',
    pattern: /<template[>\s]/gi,
    language: ['html', 'javascriptreact', 'typescriptreact', 'vue'],
    confidence: 0.95,
    category: 'html',
    description: 'HTML <template> element'
  },
  {
    featureId: 'slot',
    pattern: /<slot[>\s]/gi,
    language: ['html', 'javascriptreact', 'typescriptreact', 'vue'],
    confidence: 0.95,
    category: 'html',
    description: 'HTML <slot> element'
  }
];

export function getPatternsForLanguage(language: string): PatternInfo[] {
  return ENHANCED_WEB_PATTERNS.filter(pattern => 
    pattern.language.includes(language)
  );
}

export function getPatternByFeatureId(featureId: string): PatternInfo | undefined {
  return ENHANCED_WEB_PATTERNS.find(pattern => pattern.featureId === featureId);
}

export function getPatternsByCategory(category: string): PatternInfo[] {
  return ENHANCED_WEB_PATTERNS.filter(pattern => pattern.category === category);
}

export function getAllPatterns(): PatternInfo[] {
  return ENHANCED_WEB_PATTERNS;
}
