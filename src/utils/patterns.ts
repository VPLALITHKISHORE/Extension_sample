export interface FeaturePattern {
  pattern: RegExp;
  featureId: string;
  language: string[];
}

export const CSS_PATTERNS: FeaturePattern[] = [
  {
    pattern: /content-visibility\s*:/g,
    featureId: 'content-visibility',
    language: ['css', 'scss', 'less']
  },
  {
    pattern: /@container\s*\(/g,
    featureId: 'css-container-queries',
    language: ['css', 'scss', 'less']
  },
  {
    pattern: /aspect-ratio\s*:/g,
    featureId: 'css-aspect-ratio',
    language: ['css', 'scss', 'less']
  }
];

export const JS_PATTERNS: FeaturePattern[] = [
  {
    pattern: /URLPattern\s*\(/g,
    featureId: 'urlpattern',
    language: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact']
  },
  {
    pattern: /navigator\.clipboard/g,
    featureId: 'async-clipboard', 
    language: ['javascript', 'typescript', 'javascriptreact', 'typescriptreact']
  }
];

export function getPatternsForLanguage(language: string): FeaturePattern[] {
  const allPatterns = [...CSS_PATTERNS, ...JS_PATTERNS];
  return allPatterns.filter(pattern => pattern.language.includes(language));
}
