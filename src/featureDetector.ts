import * as vscode from 'vscode';
import { WebFeature, WebStatusApiClient } from './webStatusApi';
import { getPatternsForLanguage } from './utils/patterns';

export interface DetectedFeature {
  feature: WebFeature;
  range: vscode.Range;
  severity: vscode.DiagnosticSeverity;
  message: string;
  line: number;
}

export class FeatureDetector {
  private apiClient = WebStatusApiClient.getInstance();

  async detectFeatures(document: vscode.TextDocument): Promise<DetectedFeature[]> {
    const detectedFeatures: DetectedFeature[] = [];
    const text = document.getText();
    const language = document.languageId;

    // Get patterns for this language
    const patterns = getPatternsForLanguage(language);
    
    for (const patternInfo of patterns) {
      let match;
      patternInfo.pattern.lastIndex = 0; // Reset regex
      
      while ((match = patternInfo.pattern.exec(text)) !== null) {
        const feature = this.apiClient.getFeature(patternInfo.featureId);
        
        if (feature) {
          const startPos = document.positionAt(match.index);
          const endPos = document.positionAt(match.index + match[0].length);
          const range = new vscode.Range(startPos, endPos);
          
          const baselineStatus = this.apiClient.getBaselineStatus(feature);
          
          detectedFeatures.push({
            feature,
            range,
            severity: this.getSeverityFromStatus(baselineStatus.status),
            message: `${feature.name}: ${baselineStatus.statusText}`,
            line: startPos.line
          });
        }
        
        // Prevent infinite loops on zero-length matches
        if (match.index === patternInfo.pattern.lastIndex) {
          patternInfo.pattern.lastIndex++;
        }
      }
    }

    return detectedFeatures;
  }

  private getSeverityFromStatus(status: string): vscode.DiagnosticSeverity {
    switch (status) {
      case 'limited':
        return vscode.DiagnosticSeverity.Warning;
      case 'newly':
        return vscode.DiagnosticSeverity.Information;
      case 'widely':
        return vscode.DiagnosticSeverity.Hint;
      default:
        return vscode.DiagnosticSeverity.Information;
    }
  }
}
