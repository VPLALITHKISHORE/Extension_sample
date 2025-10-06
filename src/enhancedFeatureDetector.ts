// src/enhancedFeatureDetector.ts
import * as vscode from 'vscode';
import * as ts from 'typescript';
import { WebStatusApiClient, WebFeature } from './webStatusApi';
import { ENHANCED_WEB_PATTERNS, PatternInfo } from './utils/enhancedPatterns';

export interface EnhancedDetectedFeature {
  feature: WebFeature;
  range: vscode.Range;
  severity: vscode.DiagnosticSeverity;
  confidence: number;
  context: string;
  detectionMethod: 'ast' | 'regex';
}

export class EnhancedFeatureDetector {
  private apiClient = WebStatusApiClient.getInstance();
  private cache = new Map<string, EnhancedDetectedFeature[]>();
  private outputChannel?: vscode.OutputChannel;

  async detectFeatures(document: vscode.TextDocument): Promise<EnhancedDetectedFeature[]> {
    const cacheKey = `${document.uri.toString()}-${document.version}`;
    
    // Check cache
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const detectedFeatures: EnhancedDetectedFeature[] = [];
    const language = document.languageId;

    // Get patterns for this language
    const patterns = ENHANCED_WEB_PATTERNS.filter(p => p.language.includes(language));

    this.outputChannel?.appendLine(`\n========================================`);
    this.outputChannel?.appendLine(`📄 Analyzing: ${document.fileName}`);
    this.outputChannel?.appendLine(`🔤 Language: ${language}`);
    this.outputChannel?.appendLine(`📊 Available patterns: ${patterns.length}`);
    this.outputChannel?.appendLine(`========================================\n`);

    // Use AST for TypeScript/JavaScript
    if (this.isTypeScriptLike(language)) {
      this.outputChannel?.appendLine(`🎯 Running AST analysis...`);
      const astFeatures = await this.detectWithAST(document, patterns);
      detectedFeatures.push(...astFeatures);
      this.outputChannel?.appendLine(`✅ AST detected: ${astFeatures.length} features\n`);
    }

    // Use regex for all languages (including fallback)
    this.outputChannel?.appendLine(`🔍 Running REGEX analysis...`);
    const regexFeatures = await this.detectWithRegex(document, patterns);
    detectedFeatures.push(...regexFeatures);
    this.outputChannel?.appendLine(`✅ REGEX detected: ${regexFeatures.length} features\n`);

    // Remove duplicates and filter by confidence
    const filtered = this.filterAndDeduplicateFeatures(detectedFeatures);
    
    this.outputChannel?.appendLine(`📊 Total before filtering: ${detectedFeatures.length}`);
    this.outputChannel?.appendLine(`✨ Total after filtering: ${filtered.length}\n`);
    
    // Cache results
    this.cache.set(cacheKey, filtered);
    
    // Limit cache size
    if (this.cache.size > 10) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    return filtered;
  }

  private isTypeScriptLike(language: string): boolean {
    return ['typescript', 'javascript', 'typescriptreact', 'javascriptreact'].includes(language);
  }

  private async detectWithAST(
    document: vscode.TextDocument,
    patterns: PatternInfo[]
  ): Promise<EnhancedDetectedFeature[]> {
    const detectedFeatures: EnhancedDetectedFeature[] = [];
    
    try {
      const sourceFile = ts.createSourceFile(
        document.fileName,
        document.getText(),
        ts.ScriptTarget.Latest,
        true
      );

      const astPatterns = patterns.filter(p => p.astPattern);
      this.outputChannel?.appendLine(`   AST patterns to check: ${astPatterns.length}`);
      
      for (const patternInfo of astPatterns) {
        this.outputChannel?.appendLine(`\n   🔍 Checking AST: ${patternInfo.featureId}`);
        const nodes = this.findASTNodes(sourceFile, patternInfo);
        
        this.outputChannel?.appendLine(`      Found ${nodes.length} AST nodes`);
        
        for (const node of nodes) {
          const feature = this.apiClient.getFeature(patternInfo.featureId);
          if (!feature) {
            this.outputChannel?.appendLine(`      ❌ Feature "${patternInfo.featureId}" NOT in API`);
            continue;
          }

          this.outputChannel?.appendLine(`      ✅ Feature FOUND: ${feature.name}`);

          const start = ts.getLineAndCharacterOfPosition(sourceFile, node.getStart());
          const end = ts.getLineAndCharacterOfPosition(sourceFile, node.getEnd());
          
          const startPos = new vscode.Position(start.line, start.character);
          const endPos = new vscode.Position(end.line, end.character);
          const range = new vscode.Range(startPos, endPos);
          
          const context = this.getNodeContext(node, sourceFile);
          const severity = this.getSeverity(feature);
          
          detectedFeatures.push({
            feature,
            range,
            severity,
            confidence: patternInfo.confidence,
            context,
            detectionMethod: 'ast'
          });

          this.outputChannel?.appendLine(`      ✅ ADDED TO RESULTS`);
        }
      }
    } catch (error) {
      this.outputChannel?.appendLine(`   ⚠️ AST parsing failed: ${error}`);
    }

    return detectedFeatures;
  }

  private findASTNodes(sourceFile: ts.SourceFile, patternInfo: PatternInfo): ts.Node[] {
    const nodes: ts.Node[] = [];
    const astPattern = patternInfo.astPattern!;

    function visit(node: ts.Node) {
      // Check for NewExpression (new IntersectionObserver, etc.)
      if (astPattern.nodeType === ts.SyntaxKind.NewExpression && ts.isNewExpression(node)) {
        const expr = node.expression;
        if (ts.isIdentifier(expr) && astPattern.objectName) {
          if (expr.text === astPattern.objectName) {
            nodes.push(node);
          }
        }
      }
      
      // Check for CallExpression (navigator.share(), etc.)
      else if (astPattern.nodeType === ts.SyntaxKind.CallExpression && ts.isCallExpression(node)) {
        const expr = node.expression;
        if (ts.isPropertyAccessExpression(expr)) {
          if (astPattern.methodName && expr.name.text === astPattern.methodName) {
            if (astPattern.objectName) {
              if (ts.isIdentifier(expr.expression) && expr.expression.text === astPattern.objectName) {
                nodes.push(node);
              }
            } else {
              nodes.push(node);
            }
          }
        }
      }
      
      // Check for optional chaining
      else if (astPattern.nodeType === ts.SyntaxKind.QuestionDotToken) {
        if (ts.isPropertyAccessExpression(node) && node.questionDotToken) {
          nodes.push(node);
        }
      }
      
      ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return nodes;
  }

  private getNodeContext(node: ts.Node, sourceFile: ts.SourceFile): string {
    const start = Math.max(0, node.getStart() - 50);
    const end = Math.min(sourceFile.getFullText().length, node.getEnd() + 50);
    return sourceFile.getFullText().substring(start, end);
  }

  private async detectWithRegex(
    document: vscode.TextDocument,
    patterns: PatternInfo[]
  ): Promise<EnhancedDetectedFeature[]> {
    const detectedFeatures: EnhancedDetectedFeature[] = [];
    const text = document.getText();

    for (const patternInfo of patterns) {
      // Skip AST patterns if we already detected them
      if (patternInfo.astPattern && this.isTypeScriptLike(document.languageId)) {
        this.outputChannel?.appendLine(`   ⏭️ Skipping ${patternInfo.featureId} (has AST, using AST instead)`);
        continue;
      }

      this.outputChannel?.appendLine(`\n   🔍 Checking REGEX: ${patternInfo.featureId}`);
      this.outputChannel?.appendLine(`      Pattern: ${patternInfo.pattern}`);

      let match;
      let matchCount = 0;
      patternInfo.pattern.lastIndex = 0;
      
      while ((match = patternInfo.pattern.exec(text)) !== null) {
        matchCount++;
        this.outputChannel?.appendLine(`      ✅ REGEX MATCH #${matchCount}: "${match[0]}" at position ${match.index}`);

        const feature = this.apiClient.getFeature(patternInfo.featureId);
        if (!feature) {
          this.outputChannel?.appendLine(`      ❌ Feature "${patternInfo.featureId}" NOT in API`);
          continue;
        }

        this.outputChannel?.appendLine(`      ✅ Feature FOUND in API: ${feature.name}`);

        const startPos = document.positionAt(match.index);
        const endPos = document.positionAt(match.index + match[0].length);
        const range = new vscode.Range(startPos, endPos);
        
        let confidence = patternInfo.confidence;
        
        // Context validation for ambiguous patterns
        if (patternInfo.contextRequired) {
          const lineText = document.lineAt(startPos.line).text;
          confidence = this.validateContext(match[0], lineText, patternInfo);
          
          this.outputChannel?.appendLine(`      🎯 Confidence check: ${confidence}`);
          
          if (confidence < 0.5) {
            this.outputChannel?.appendLine(`      ⏭️ Skipped (confidence too low: ${confidence})`);
            continue;
          }
        }
        
        const context = this.getLineContext(document, startPos.line);
        const severity = this.getSeverity(feature);
        
        detectedFeatures.push({
          feature,
          range,
          severity,
          confidence,
          context,
          detectionMethod: 'regex'
        });

        this.outputChannel?.appendLine(`      ✅ ADDED TO RESULTS (severity: ${this.severityToString(severity)})`);
        
        // Prevent infinite loops
        if (match.index === patternInfo.pattern.lastIndex) {
          patternInfo.pattern.lastIndex++;
        }
      }

      if (matchCount === 0) {
        this.outputChannel?.appendLine(`      ❌ No regex matches found`);
      }
    }

    return detectedFeatures;
  }

  private severityToString(severity: vscode.DiagnosticSeverity): string {
    switch (severity) {
      case vscode.DiagnosticSeverity.Error: return 'Error';
      case vscode.DiagnosticSeverity.Warning: return 'Warning';
      case vscode.DiagnosticSeverity.Information: return 'Info';
      case vscode.DiagnosticSeverity.Hint: return 'Hint';
      default: return 'Unknown';
    }
  }

  private validateContext(match: string, lineText: string, patternInfo: PatternInfo): number {
    switch (patternInfo.featureId) {
      case 'js-optional-chaining':
        // Not a ternary operator
        return lineText.includes('?.') && !lineText.match(/\?[^.]/g) ? 0.9 : 0.3;
      
      case 'js-private-fields':
        // In class context
        return /class\s+/.test(lineText) || lineText.trim().startsWith('#') ? 0.9 : 0.4;
      
      case 'js-top-level-await':
        // Not inside a function
        return !lineText.includes('async') && lineText.trim().startsWith('await') ? 0.8 : 0.3;
        
      default:
        return patternInfo.confidence;
    }
  }

  private getLineContext(document: vscode.TextDocument, lineNumber: number): string {
    const startLine = Math.max(0, lineNumber - 2);
    const endLine = Math.min(document.lineCount - 1, lineNumber + 2);
    
    let context = '';
    for (let i = startLine; i <= endLine; i++) {
      context += document.lineAt(i).text + '\n';
    }
    return context;
  }

  private getSeverity(feature: WebFeature): vscode.DiagnosticSeverity {
    const status = feature.baseline?.status;
    
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

  private filterAndDeduplicateFeatures(features: EnhancedDetectedFeature[]): EnhancedDetectedFeature[] {
    const seen = new Map<string, EnhancedDetectedFeature>();
    
    for (const feature of features) {
      const key = `${feature.feature.feature_id}-${feature.range.start.line}`;
      
      // Keep the higher confidence detection
      if (!seen.has(key) || seen.get(key)!.confidence < feature.confidence) {
        seen.set(key, feature);
      }
    }
    
    // Filter out low confidence detections
    const filtered = Array.from(seen.values()).filter(f => f.confidence >= 0.6);
    
    // Log what was filtered out
    const removed = features.length - filtered.length;
    if (removed > 0) {
      this.outputChannel?.appendLine(`🗑️ Filtered out ${removed} duplicates/low-confidence detections`);
    }
    
    return filtered;
  }

  setOutputChannel(channel: vscode.OutputChannel) {
    this.outputChannel = channel;
  }

  clearCache() {
    this.cache.clear();
  }
}
