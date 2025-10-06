// src/services/geminiService.ts
import { GoogleGenerativeAI, GenerativeModel } from '@google/generative-ai';
import * as vscode from 'vscode';
import { SecretStorageService } from './secretStorage';
import { WebFeature } from '../webStatusApi';

export class GeminiService {
  private static instance: GeminiService;
  private genAI: GoogleGenerativeAI | null = null;
  private model: GenerativeModel | null = null;
  private outputChannel: vscode.OutputChannel | undefined;
  private isInitialized = false;

  private constructor() {}

  static getInstance(): GeminiService {
    if (!GeminiService.instance) {
      GeminiService.instance = new GeminiService();
    }
    return GeminiService.instance;
  }

  setOutputChannel(channel: vscode.OutputChannel) {
    this.outputChannel = channel;
  }

  async initialize(): Promise<boolean> {
    try {
      const secretStorage = SecretStorageService.getInstance();
      const apiKey = await secretStorage.getGeminiApiKey();

      if (!apiKey) {
        this.outputChannel?.appendLine('⚠️ Gemini API key not found');
        return false;
      }

      this.genAI = new GoogleGenerativeAI(apiKey);
      this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.0-flash-exp' });

      this.isInitialized = true;
      this.outputChannel?.appendLine('✅ Gemini AI initialized successfully');
      return true;

    } catch (error) {
      this.outputChannel?.appendLine(`❌ Failed to initialize Gemini: ${error}`);
      this.isInitialized = false;
      return false;
    }
  }

  // Legacy method - keeping for backward compatibility
  async generateFix(feature: WebFeature, codeContext: string): Promise<string> {
    // Detect language from context or default to generic
    return this.generateFixForLanguage(feature, codeContext, 'generic');
  }

  // New method with language-specific fixes
  async generateFixForLanguage(
    feature: WebFeature, 
    codeContext: string,
    language: string
  ): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
      if (!this.isInitialized) {
        return 'AI service not available. Please setup your Gemini API key.';
      }
    }

    try {
      const prompt = this.buildLanguageSpecificPrompt(feature, codeContext, language);
      
      this.outputChannel?.appendLine(`🤖 Generating ${language} fix for: ${feature.name}`);
      
      const result = await this.model!.generateContent(prompt);
      return result.response.text();

    } catch (error) {
      this.outputChannel?.appendLine(`❌ AI generation failed: ${error}`);
      return this.getFallbackFixForLanguage(feature, language);
    }
  }

  private buildLanguageSpecificPrompt(
    feature: WebFeature,
    codeContext: string,
    language: string
  ): string {
    const browserSupport = Object.entries(feature.browser_implementations)
      .map(([browser, impl]) => `${browser}: ${impl.status} (v${impl.version})`)
      .join(', ');

    const baselineStatus = feature.baseline?.status || 'unknown';

    // CSS-specific prompt
    if (language === 'css' || language === 'scss' || language === 'less') {
      return `You are a CSS expert specializing in browser compatibility.

**Feature:** ${feature.name}
**ID:** ${feature.feature_id}
**Status:** ${baselineStatus}
**Browser Support:** ${browserSupport}

**Current CSS Code:**
\`\`\`css
${codeContext}
\`\`\`

**Provide a CSS-only solution with:**
1. Brief explanation (2 sentences)
2. CSS @supports feature detection with fallback
3. Complete working CSS example
4. Browser compatibility notes

Format as markdown. Keep it concise and CSS-focused.`;
    }

    // JavaScript-specific prompt
    if (language === 'javascript' || language === 'typescript' || 
        language === 'javascriptreact' || language === 'typescriptreact') {
      return `You are a JavaScript expert specializing in browser compatibility.

**Feature:** ${feature.name}
**ID:** ${feature.feature_id}
**Status:** ${baselineStatus}
**Browser Support:** ${browserSupport}

**Current JavaScript Code:**
\`\`\`javascript
${codeContext}
\`\`\`

**Provide a JavaScript-only solution with:**
1. Brief explanation (2 sentences)
2. Feature detection approach
3. Polyfill recommendation (if available with npm package name)
4. Complete working JavaScript example with fallback

Format as markdown. Keep it concise and JS-focused.`;
    }

    // HTML-specific prompt
    if (language === 'html') {
      return `You are an HTML expert specializing in browser compatibility.

**Feature:** ${feature.name}
**Status:** ${baselineStatus}
**Browser Support:** ${browserSupport}

**Current HTML:**
\`\`\`html
${codeContext}
\`\`\`

**Provide an HTML-only solution with:**
1. Brief explanation (2 sentences)
2. Fallback HTML for unsupported browsers
3. Complete working example
4. Progressive enhancement approach

Format as markdown. Keep it concise and HTML-focused.`;
    }

    // Generic prompt for other languages
    return `You are a web development expert.

**Feature:** ${feature.name}
**Status:** ${baselineStatus}

**Code Context:**
\`\`\`${language}
${codeContext}
\`\`\`

**Provide:**
1. Brief explanation of compatibility issue
2. Solution appropriate for ${language}
3. Working code example
4. Browser support details

Keep it concise and practical.`;
  }

  private getFallbackFixForLanguage(feature: WebFeature, language: string): string {
    const featureName = feature.name;
    const specLink = feature.spec.links[0]?.link || 'N/A';
    
    if (language === 'css' || language === 'scss' || language === 'less') {
      return `## CSS Compatibility Fix for ${featureName}

**Issue:** Limited browser support for this CSS feature.

**Solution:**

\`\`\`css
/* Fallback for older browsers */
.element {
  /* Basic styles that work everywhere */
  /* Add your fallback properties here */
}

/* Modern feature for supported browsers */
@supports (${feature.feature_id}: value) {
  .element {
    ${feature.feature_id}: value;
    /* Additional modern styles */
  }
}
\`\`\`

**Explanation:** 
- Use @supports to detect feature availability
- Provide fallback styles first
- Progressively enhance for modern browsers

**Browser Support:** Check [Can I Use](https://caniuse.com/?search=${feature.feature_id})

**Spec:** ${specLink}`;
    }

    if (language === 'javascript' || language === 'typescript' || 
        language === 'javascriptreact' || language === 'typescriptreact') {
      return `## JavaScript Compatibility Fix for ${featureName}

**Issue:** Limited browser support for this API.

**Solution:**

\`\`\`javascript
// Feature detection
if ('${feature.feature_id}' in window) {
  // Use modern API
  console.log('Feature supported');
} else {
  // Fallback for older browsers
  console.warn('${featureName} not supported, using fallback');
  // Add fallback implementation
}
\`\`\`

**Polyfill Options:**
- Check [npm](https://www.npmjs.com/search?q=${feature.feature_id}) for polyfills
- Consider using [core-js](https://www.npmjs.com/package/core-js)

**Explanation:**
Always check feature availability before using. Provide meaningful fallbacks.

**Spec:** ${specLink}`;
    }

    if (language === 'html') {
      return `## HTML Compatibility Fix for ${featureName}

**Issue:** Limited browser support for this HTML feature.

**Solution:**

\`\`\`html
<!-- Fallback content -->
<div class="fallback">
  <!-- Content that works everywhere -->
</div>

<!-- Modern feature (hidden if not supported) -->
<div class="modern" hidden>
  <!-- Your modern HTML here -->
</div>

<script>
if (supportsFeature()) {
  document.querySelector('.modern').hidden = false;
  document.querySelector('.fallback').hidden = true;
}
</script>
\`\`\`

**Explanation:** Provide fallback HTML, then progressively enhance.

**Spec:** ${specLink}`;
    }

    // Generic fallback
    return `## Compatibility Fix for ${featureName}

**Issue:** This feature has limited browser support.

**Recommendation:**
1. Use feature detection
2. Provide fallbacks for older browsers
3. Test in target browsers

**Resources:**
- [MDN Web Docs](https://developer.mozilla.org/en-US/search?q=${feature.feature_id})
- [Can I Use](https://caniuse.com/?search=${feature.feature_id})
- **Spec:** ${specLink}`;
  }

  async explainFeature(feature: WebFeature): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
      if (!this.isInitialized) {
        return 'AI service not available. Please setup your Gemini API key.';
      }
    }

    try {
      const prompt = `Explain the web feature "${feature.name}" (${feature.feature_id}) in developer-friendly terms:

1. What it does (2 sentences)
2. When and why to use it (2 sentences)
3. Browser compatibility overview
4. Common use cases (2-3 examples)
5. Simple code example

Keep explanation concise and practical. Format as markdown.`;

      const result = await this.model!.generateContent(prompt);
      return result.response.text();

    } catch (error) {
      return `## ${feature.name}

**Description:** Check the specification for details about this feature.

**Browser Support:**
${Object.entries(feature.browser_implementations)
  .map(([browser, impl]) => `- ${browser}: ${impl.status} (v${impl.version})`)
  .join('\n')}

**Specification:** ${feature.spec.links[0]?.link || 'N/A'}`;
    }
  }

  isAvailable(): boolean {
    return this.isInitialized;
  }
}
