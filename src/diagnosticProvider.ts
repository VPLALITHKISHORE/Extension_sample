// src/diagnosticProvider.ts
import * as vscode from 'vscode';
import { EnhancedFeatureDetector, EnhancedDetectedFeature } from './enhancedFeatureDetector';
import { WebFeature } from './webStatusApi';

export class CompatibilityDiagnosticProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private featureDetector: EnhancedFeatureDetector;
  private outputChannel: vscode.OutputChannel | undefined;

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('baselineGuard');
    this.featureDetector = new EnhancedFeatureDetector();
  }

  setOutputChannel(channel: vscode.OutputChannel) {
    this.outputChannel = channel;
    this.featureDetector.setOutputChannel(channel);
  }

  async provideDiagnostics(document: vscode.TextDocument): Promise<void> {
    try {
      const startTime = Date.now();
      const detectedFeatures = await this.featureDetector.detectFeatures(document);
      
      const diagnostics: vscode.Diagnostic[] = detectedFeatures.map(detected => 
        this.createEnhancedDiagnostic(detected, document)
      );

      this.diagnosticCollection.set(document.uri, diagnostics);
      
      const analysisTime = Date.now() - startTime;
      
      if (diagnostics.length > 0) {
        this.outputChannel?.appendLine(
          `🔍 Found ${diagnostics.length} compatibility issues in ${document.fileName} (${analysisTime}ms)`
        );
      } else {
        this.outputChannel?.appendLine(
          `✅ No compatibility issues found in ${document.fileName} (${analysisTime}ms)`
        );
      }

    } catch (error) {
      this.outputChannel?.appendLine(`❌ Diagnostic analysis failed: ${error}`);
    }
  }

  private createEnhancedDiagnostic(
    detected: EnhancedDetectedFeature, 
    document: vscode.TextDocument
  ): vscode.Diagnostic {
    const feature = detected.feature;
    const message = this.createDeveloperFriendlyMessage(feature, document.languageId, detected.confidence);
    
    const diagnostic = new vscode.Diagnostic(
      detected.range,
      message,
      detected.severity
    );

    diagnostic.source = 'BaselineGuard';
    diagnostic.code = {
      value: feature.feature_id,
      target: vscode.Uri.parse(feature.spec.links[0]?.link || 'https://web.dev/baseline/')
    };

    // Add comprehensive related information
    const relatedInfo = this.createRelatedInformation(feature, document.languageId, detected);
    diagnostic.relatedInformation = relatedInfo;

    return diagnostic;
  }

  private createDeveloperFriendlyMessage(feature: WebFeature, language: string, confidence: number): string {
    const baselineStatus = feature.baseline?.status || 'unknown';
    const statusEmoji = this.getStatusEmoji(baselineStatus);
    
    // Get supported browsers count
    const supportedCount = Object.values(feature.browser_implementations)
      .filter(impl => impl.status === 'available').length;
    const totalBrowsers = Object.keys(feature.browser_implementations).length;

    let message = `${statusEmoji} ${feature.name}\n`;
    message += `Browser Support: ${supportedCount}/${totalBrowsers} browsers`;
    
    // Add confidence indicator
    const confidencePercent = Math.round(confidence * 100);
    if (confidence < 0.8) {
      message += ` (${confidencePercent}% confidence)`;
    }

    // Add specific guidance based on language
    const guidance = this.getLanguageSpecificGuidance(feature, language);
    if (guidance) {
      message += `\n${guidance}`;
    }

    return message;
  }

  private getLanguageSpecificGuidance(feature: WebFeature, language: string): string {
    const baselineStatus = feature.baseline?.status || 'unknown';
    
    if (language === 'css' || language === 'scss' || language === 'less') {
      if (baselineStatus === 'newly' || baselineStatus === 'limited') {
        return '💡 Add fallback CSS using @supports';
      }
    } else if (language === 'javascript' || language === 'typescript') {
      if (baselineStatus === 'newly' || baselineStatus === 'limited') {
        return '💡 Use feature detection or polyfill';
      }
    } else if (language === 'html') {
      if (baselineStatus === 'newly' || baselineStatus === 'limited') {
        return '💡 Provide fallback content';
      }
    }
    
    return '';
  }

  private createRelatedInformation(
    feature: WebFeature, 
    language: string,
    detected: EnhancedDetectedFeature
  ): vscode.DiagnosticRelatedInformation[] {
    const related: vscode.DiagnosticRelatedInformation[] = [];
    const dummyLocation = new vscode.Location(
      vscode.Uri.parse(''),
      new vscode.Range(0, 0, 0, 0)
    );

    // Detection method
    const methodEmoji = detected.detectionMethod === 'ast' ? '🎯' : '🔍';
    related.push(new vscode.DiagnosticRelatedInformation(
      dummyLocation,
      `${methodEmoji} Detected using: ${detected.detectionMethod.toUpperCase()} analysis`
    ));

    // Baseline status
    if (feature.baseline) {
      const statusText = this.getDetailedBaselineStatus(feature.baseline);
      related.push(new vscode.DiagnosticRelatedInformation(
        dummyLocation,
        `📊 ${statusText}`
      ));
    }

    // Browser support - grouped by status
    const supported: string[] = [];
    const unsupported: string[] = [];

    Object.entries(feature.browser_implementations).forEach(([browser, impl]) => {
      const browserName = this.formatBrowserName(browser);
      if (impl.status === 'available') {
        supported.push(`${browserName} (v${impl.version}+)`);
      } else {
        unsupported.push(browserName);
      }
    });

    if (supported.length > 0) {
      related.push(new vscode.DiagnosticRelatedInformation(
        dummyLocation,
        `✅ Supported: ${supported.join(', ')}`
      ));
    }

    if (unsupported.length > 0) {
      related.push(new vscode.DiagnosticRelatedInformation(
        dummyLocation,
        `❌ Not supported: ${unsupported.join(', ')}`
      ));
    }

    // Usage statistics
    if (feature.usage?.chrome?.daily) {
      const usagePercent = (feature.usage.chrome.daily * 100).toFixed(4);
      related.push(new vscode.DiagnosticRelatedInformation(
        dummyLocation,
        `📈 Used in ${usagePercent}% of Chrome page loads`
      ));
    }

    // Quick action hint
    related.push(new vscode.DiagnosticRelatedInformation(
      dummyLocation,
      `🤖 Press Ctrl+. or click lightbulb for AI-powered fixes`
    ));

    return related;
  }

  private getDetailedBaselineStatus(baseline: { status: string; low_date?: string }): string {
    const status = baseline.status;
    const date = baseline.low_date;
    
    switch (status) {
      case 'widely':
        return `Widely available (Baseline since ${date || 'N/A'})`;
      case 'newly':
        return `Newly available (Baseline since ${date || 'N/A'}) - Use with caution`;
      case 'limited':
        return `Limited availability - Consider fallbacks`;
      default:
        return 'Unknown availability status';
    }
  }

  private getStatusEmoji(status: string): string {
    switch (status) {
      case 'widely': return '✅';
      case 'newly': return '🟡';
      case 'limited': return '⚠️';
      default: return '❓';
    }
  }

  private formatBrowserName(browser: string): string {
    const names: { [key: string]: string } = {
      'chrome': 'Chrome',
      'firefox': 'Firefox',
      'safari': 'Safari',
      'edge': 'Edge',
      'chrome_android': 'Chrome Mobile',
      'firefox_android': 'Firefox Mobile',
      'safari_ios': 'Safari iOS'
    };
    return names[browser] || browser;
  }

  clearDiagnostics(document: vscode.TextDocument) {
    this.diagnosticCollection.delete(document.uri);
  }

  dispose() {
    this.diagnosticCollection.dispose();
    this.featureDetector.clearCache();
  }
}
