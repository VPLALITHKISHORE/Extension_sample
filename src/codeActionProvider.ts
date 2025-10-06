// src/codeActionProvider.ts
import * as vscode from 'vscode';
import { WebStatusApiClient } from './webStatusApi';
import { GeminiService } from './services/geminiService';

export class CompatibilityCodeActionProvider implements vscode.CodeActionProvider {
  private geminiService = GeminiService.getInstance();
  private apiClient = WebStatusApiClient.getInstance();

  provideCodeActions(
    document: vscode.TextDocument,
    range: vscode.Range | vscode.Selection,
    context: vscode.CodeActionContext,
    token: vscode.CancellationToken
  ): vscode.ProviderResult<(vscode.CodeAction | vscode.Command)[]> {
    
    const actions: vscode.CodeAction[] = [];

    // Get BaselineGuard diagnostics at this position
    const diagnostics = context.diagnostics.filter(
      d => d.source === 'BaselineGuard'
    );

    if (diagnostics.length === 0) {
      return actions;
    }

    for (const diagnostic of diagnostics) {
      // Add "Generate AI Fix" action
      const aiFixAction = new vscode.CodeAction(
        '🤖 Generate AI Fix',
        vscode.CodeActionKind.QuickFix
      );
      aiFixAction.diagnostics = [diagnostic];
      aiFixAction.command = {
        command: 'baselineGuard.generateFixForDiagnostic',
        title: 'Generate AI Fix',
        arguments: [document, diagnostic, range]
      };
      aiFixAction.isPreferred = true; // Makes it the default quick fix
      actions.push(aiFixAction);

      // Add "Explain Feature" action
      const explainAction = new vscode.CodeAction(
        '❓ Explain This Feature',
        vscode.CodeActionKind.QuickFix
      );
      explainAction.diagnostics = [diagnostic];
      explainAction.command = {
        command: 'baselineGuard.explainFeature',
        title: 'Explain Feature',
        arguments: [document, diagnostic]
      };
      actions.push(explainAction);

      // Add "View Browser Support" action
      const browserSupportAction = new vscode.CodeAction(
        '🌐 View Browser Support',
        vscode.CodeActionKind.QuickFix
      );
      browserSupportAction.diagnostics = [diagnostic];
      browserSupportAction.command = {
        command: 'baselineGuard.showBrowserSupport',
        title: 'View Browser Support',
        arguments: [document, diagnostic]
      };
      actions.push(browserSupportAction);
    }

    return actions;
  }
}
