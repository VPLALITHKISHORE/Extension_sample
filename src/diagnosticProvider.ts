import * as vscode from 'vscode';
import { FeatureDetector, DetectedFeature } from './featureDetector';
import { WebFeature } from './webStatusApi';

export class CompatibilityDiagnosticProvider {
  private diagnosticCollection: vscode.DiagnosticCollection;
  private featureDetector: FeatureDetector;
  private outputChannel: vscode.OutputChannel | undefined;

  constructor() {
    this.diagnosticCollection = vscode.languages.createDiagnosticCollection('baselineGuard');
    this.featureDetector = new FeatureDetector();
  }

  setOutputChannel(channel: vscode.OutputChannel) {
    this.outputChannel = channel;
  }

  async provideDiagnostics(document: vscode.TextDocument): Promise<void> {
    try {
      const detectedFeatures = await this.featureDetector.detectFeatures(document);
      const diagnostics: vscode.Diagnostic[] = detectedFeatures.map(detected => 
        this.createDiagnostic(detected)
      );

      this.diagnosticCollection.set(document.uri, diagnostics);
      
      if (diagnostics.length > 0) {
        this.outputChannel?.appendLine(
          `🔍 Found ${diagnostics.length} compatibility issues in ${document.fileName}`
        );
      }

    } catch (error) {
      this.outputChannel?.appendLine(`❌ Diagnostic analysis failed: ${error}`);
    }
  }

  private createDiagnostic(detected: DetectedFeature): vscode.Diagnostic {
    const diagnostic = new vscode.Diagnostic(
      detected.range,
      detected.message,
      detected.severity
    );

    diagnostic.source = 'BaselineGuard';
    diagnostic.code = {
      value: detected.feature.feature_id,
      target: vscode.Uri.parse(detected.feature.spec.links[0]?.link || 'https://web.dev/baseline/')
    };

    // Add browser support information
    const browserInfo = this.getBrowserSupportInfo(detected.feature);
    if (browserInfo.length > 0) {
      diagnostic.relatedInformation = browserInfo;
    }

    return diagnostic;
  }

  private getBrowserSupportInfo(feature: WebFeature): vscode.DiagnosticRelatedInformation[] {
    const related: vscode.DiagnosticRelatedInformation[] = [];
    const dummyLocation = new vscode.Location(
      vscode.Uri.parse(''),
      new vscode.Range(0, 0, 0, 0)
    );

    // Add browser support details
    Object.entries(feature.browser_implementations).forEach(([browser, impl]) => {
      const browserName = this.formatBrowserName(browser);
      const status = impl.status === 'available' ? '✅' : '❌';
      related.push(new vscode.DiagnosticRelatedInformation(
        dummyLocation,
        `${status} ${browserName}: ${impl.status} since version ${impl.version}`
      ));
    });

    return related;
  }

  private formatBrowserName(browser: string): string {
    const names: { [key: string]: string } = {
      'chrome': 'Chrome',
      'firefox': 'Firefox',
      'safari': 'Safari',
      'edge': 'Edge',
      'chrome_android': 'Chrome Android',
      'firefox_android': 'Firefox Android',
      'safari_ios': 'Safari iOS'
    };
    return names[browser] || browser;
  }

  clearDiagnostics(document: vscode.TextDocument) {
    this.diagnosticCollection.delete(document.uri);
  }

  dispose() {
    this.diagnosticCollection.dispose();
  }
}
