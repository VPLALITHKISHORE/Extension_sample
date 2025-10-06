// src/extension.ts
import * as vscode from 'vscode';
import { WebStatusApiClient } from './webStatusApi';
import { CompatibilityDiagnosticProvider } from './diagnosticProvider';
import { SUPPORTED_LANGUAGES } from './utils/constants';
import { SecretStorageService } from './services/secretStorage';
import { GeminiService } from './services/geminiService';
import { CompatibilityCodeActionProvider } from './codeActionProvider';
import { DashboardProvider } from './dashboardProvider';

let outputChannel: vscode.OutputChannel;
let apiClient: WebStatusApiClient;
let statusBarItem: vscode.StatusBarItem;
let diagnosticProvider: CompatibilityDiagnosticProvider;
let geminiService: GeminiService;
let dashboardProvider: DashboardProvider;

export async function activate(context: vscode.ExtensionContext) {
    console.log('BaselineGuard: Extension is activating...');
    
    try {
        // Create output channel
        outputChannel = vscode.window.createOutputChannel('BaselineGuard');
        context.subscriptions.push(outputChannel);
        
        outputChannel.appendLine('🚀 BaselineGuard: Extension activated successfully!');
        
        // Initialize secret storage
        SecretStorageService.initialize(context);
        outputChannel.appendLine('✅ Secret storage initialized');
        
        // Initialize Gemini service
        geminiService = GeminiService.getInstance();
        geminiService.setOutputChannel(outputChannel);
        await geminiService.initialize();
        
        // Create status bar item
        statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBarItem.command = 'baselineGuard.openDashboard';
        statusBarItem.text = '$(shield) BaselineGuard';
        statusBarItem.tooltip = 'BaselineGuard - AI-Powered Web Compatibility Checker';
        statusBarItem.show();
        context.subscriptions.push(statusBarItem);
        
        // Initialize diagnostic provider
        diagnosticProvider = new CompatibilityDiagnosticProvider();
        diagnosticProvider.setOutputChannel(outputChannel);
        context.subscriptions.push(diagnosticProvider);
        outputChannel.appendLine('✅ Diagnostic provider initialized');
        
        // Initialize API client
        apiClient = WebStatusApiClient.getInstance();
        apiClient.setOutputChannel(outputChannel);
        outputChannel.appendLine('✅ API client initialized');
        
        // Try to fetch initial data
        statusBarItem.text = '$(loading~spin) BaselineGuard: Loading...';
        const features = await apiClient.fetchFeatures();
        statusBarItem.text = `$(shield) BaselineGuard (${features.length})`;
        outputChannel.appendLine(`✅ Loaded ${features.length} web features`);
        
        // Register Dashboard Provider
        dashboardProvider = new DashboardProvider(context.extensionUri, apiClient);
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider(
                DashboardProvider.viewType,
                dashboardProvider
            )
        );
        outputChannel.appendLine('✅ Dashboard provider registered');
        
        // Register Code Action Provider (Quick Fix)
        const codeActionProvider = new CompatibilityCodeActionProvider();
        context.subscriptions.push(
            vscode.languages.registerCodeActionsProvider(
                SUPPORTED_LANGUAGES.map(lang => ({ language: lang })),
                codeActionProvider,
                {
                    providedCodeActionKinds: [vscode.CodeActionKind.QuickFix]
                }
            )
        );
        outputChannel.appendLine('✅ Code action provider registered (Quick Fix enabled)');
        
        // Register commands
        registerCommands(context);
        
        // Set up file analysis
        await setupFileAnalysis(context);
        
        // Show activation message with AI status
        const aiStatus = geminiService.isAvailable() ? '🤖 AI Ready' : '⚠️ Setup AI Key';
        vscode.window.showInformationMessage(`BaselineGuard extension is now active! 🎉 (${aiStatus})`);
        outputChannel.show();
        
        console.log('BaselineGuard: Extension activated successfully');
        
    } catch (error) {
        outputChannel?.appendLine(`❌ Extension activation failed: ${error}`);
        statusBarItem.text = '$(shield) BaselineGuard: Error';
        console.error('BaselineGuard activation error:', error);
    }
}

async function setupFileAnalysis(context: vscode.ExtensionContext) {
    try {
        // Analyze active editor on startup
        const activeEditor = vscode.window.activeTextEditor;
        if (activeEditor && SUPPORTED_LANGUAGES.includes(activeEditor.document.languageId as any)) {
            await analyzeDocument(activeEditor.document);
            await updateStatusBarForDocument(activeEditor.document);
        }

        // Analyze when switching editors
        const onDidChangeActiveTextEditor = vscode.window.onDidChangeActiveTextEditor(async editor => {
            if (editor && SUPPORTED_LANGUAGES.includes(editor.document.languageId as any)) {
                await analyzeDocument(editor.document);
                await updateStatusBarForDocument(editor.document);
            } else if (editor) {
                // Reset status bar for unsupported files
                const cacheInfo = apiClient.getCacheInfo();
                statusBarItem.text = `$(shield) BaselineGuard (${cacheInfo.size})`;
                statusBarItem.tooltip = `BaselineGuard - ${cacheInfo.size} features loaded`;
            }
        });

        // Analyze when document content changes (with debouncing)
        let changeTimeout: NodeJS.Timeout;
        const onDidChangeTextDocument = vscode.workspace.onDidChangeTextDocument(event => {
            if (SUPPORTED_LANGUAGES.includes(event.document.languageId as any)) {
                // Clear existing timeout
                clearTimeout(changeTimeout);
                
                // Debounce changes (analyze 1 second after user stops typing)
                changeTimeout = setTimeout(async () => {
                    await analyzeDocument(event.document);
                    await updateStatusBarForDocument(event.document);
                }, 1000);
            }
        });

        // Clear diagnostics when file is closed
        const onDidCloseTextDocument = vscode.workspace.onDidCloseTextDocument(document => {
            diagnosticProvider.clearDiagnostics(document);
        });

        context.subscriptions.push(
            onDidChangeActiveTextEditor,
            onDidChangeTextDocument,
            onDidCloseTextDocument
        );

        outputChannel.appendLine('✅ File analysis setup complete');
        
    } catch (error) {
        outputChannel.appendLine(`❌ File analysis setup failed: ${error}`);
    }
}

async function analyzeDocument(document: vscode.TextDocument) {
    try {
        await diagnosticProvider.provideDiagnostics(document);
    } catch (error) {
        outputChannel.appendLine(`❌ Document analysis failed: ${error}`);
    }
}

async function updateStatusBarForDocument(document: vscode.TextDocument) {
    try {
        const diagnostics = vscode.languages.getDiagnostics(document.uri);
        const issues = diagnostics.filter(d => d.source === 'BaselineGuard');
        
        if (issues.length > 0) {
            const warnings = issues.filter(d => d.severity === vscode.DiagnosticSeverity.Warning).length;
            const infos = issues.filter(d => d.severity === vscode.DiagnosticSeverity.Information).length;
            const hints = issues.filter(d => d.severity === vscode.DiagnosticSeverity.Hint).length;
            
            statusBarItem.text = `$(shield) BaselineGuard: ${warnings}⚠️ ${infos}🟡 ${hints}✅`;
            statusBarItem.tooltip = `BaselineGuard - ${issues.length} compatibility findings\n${warnings} limited, ${infos} newly available, ${hints} widely available`;
        } else {
            statusBarItem.text = `$(shield) BaselineGuard: Clean ✅`;
            statusBarItem.tooltip = `BaselineGuard - No compatibility issues found`;
        }
        
    } catch (error) {
        outputChannel.appendLine(`❌ Status bar update failed: ${error}`);
    }
}

function registerCommands(context: vscode.ExtensionContext) {
    // Hello command
    const helloCommand = vscode.commands.registerCommand('baselineGuard.hello', async () => {
        try {
            const cacheInfo = apiClient.getCacheInfo();
            const activeEditor = vscode.window.activeTextEditor;
            let analysisInfo = '';
            
            if (activeEditor && SUPPORTED_LANGUAGES.includes(activeEditor.document.languageId as any)) {
                const diagnostics = vscode.languages.getDiagnostics(activeEditor.document.uri);
                const issues = diagnostics.filter(d => d.source === 'BaselineGuard');
                analysisInfo = `\nCurrent file: ${issues.length} compatibility issues`;
            }
            
            const aiStatus = geminiService.isAvailable() ? '✅ AI Ready' : '⚠️ Setup Required';
            const message = `Hello from BaselineGuard! 🛡️\n\nFeatures cached: ${cacheInfo.size}\nLast updated: ${new Date(cacheInfo.lastFetch).toLocaleString()}\nAI Status: ${aiStatus}${analysisInfo}`;
            vscode.window.showInformationMessage(message);
            outputChannel.appendLine('✅ Hello command executed');
        } catch (error) {
            vscode.window.showInformationMessage('Hello from BaselineGuard! 🛡️');
            outputChannel.appendLine(`⚠️ Hello command: ${error}`);
        }
    });
    
    // Dashboard command
    const dashboardCommand = vscode.commands.registerCommand('baselineGuard.openDashboard', async () => {
        try {
            await vscode.commands.executeCommand('baselineGuard.dashboardView.focus');
            outputChannel.appendLine('✅ Dashboard opened');
        } catch (error) {
            vscode.window.showErrorMessage('Failed to open dashboard');
            outputChannel.appendLine(`❌ Dashboard error: ${error}`);
        }
    });

    // Show Interactive Dashboard
    const showWebviewCommand = vscode.commands.registerCommand('baselineGuard.showWebview', async () => {
        try {
            await vscode.commands.executeCommand('baselineGuard.dashboardView.focus');
            outputChannel.appendLine('✅ Interactive dashboard opened');
        } catch (error) {
            vscode.window.showErrorMessage('Failed to show dashboard');
            outputChannel.appendLine(`❌ Webview error: ${error}`);
        }
    });
    
    // DEBUG API COMMAND - Shows actual feature IDs
    const debugApiCommand = vscode.commands.registerCommand('baselineGuard.debugApi', async () => {
        const features = await apiClient.fetchFeatures();
        
        // Search for observer-related features
        const observerFeatures = features.filter(f => 
            f.feature_id.toLowerCase().includes('observer') ||
            f.name.toLowerCase().includes('observer')
        );
        
        // Search for share/clipboard features
        const shareFeatures = features.filter(f =>
            f.feature_id.toLowerCase().includes('share') ||
            f.feature_id.toLowerCase().includes('clipboard') ||
            f.name.toLowerCase().includes('share') ||
            f.name.toLowerCase().includes('clipboard')
        );
        
        let output = '🔍 ACTUAL Feature IDs in WebStatus API:\n\n';
        output += '=== OBSERVER FEATURES ===\n';
        observerFeatures.forEach(f => {
            output += `ID: ${f.feature_id}\nName: ${f.name}\n\n`;
        });
        
        output += '\n=== SHARE/CLIPBOARD FEATURES ===\n';
        shareFeatures.forEach(f => {
            output += `ID: ${f.feature_id}\nName: ${f.name}\n\n`;
        });
        
        output += '\n=== FIRST 50 FEATURES (Sample) ===\n';
        features.slice(0, 50).forEach((f, i) => {
            output += `${i + 1}. ${f.feature_id} - ${f.name}\n`;
        });
        
        const doc = await vscode.workspace.openTextDocument({
            content: output,
            language: 'plaintext'
        });
        await vscode.window.showTextDocument(doc);
        
        outputChannel.appendLine(`✅ Listed ${features.length} features from API`);
    });
    
    // Refresh command
    const refreshCommand = vscode.commands.registerCommand('baselineGuard.refresh', async () => {
        try {
            statusBarItem.text = '$(loading~spin) Refreshing...';
            outputChannel.appendLine('🔄 Refreshing data...');
            
            apiClient.forceRefresh();
            const features = await apiClient.fetchFeatures();
            
            if (dashboardProvider) {
                await dashboardProvider.refresh();
            }
            
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor && SUPPORTED_LANGUAGES.includes(activeEditor.document.languageId as any)) {
                await analyzeDocument(activeEditor.document);
                await updateStatusBarForDocument(activeEditor.document);
            } else {
                statusBarItem.text = `$(shield) BaselineGuard (${features.length})`;
            }
            
            vscode.window.showInformationMessage(`Refreshed! ${features.length} features loaded.`);
            outputChannel.appendLine(`✅ Data refreshed: ${features.length} features`);
            
        } catch (error) {
            statusBarItem.text = '$(shield) BaselineGuard: Error';
            vscode.window.showErrorMessage('Failed to refresh data');
            outputChannel.appendLine(`❌ Refresh error: ${error}`);
        }
    });
    
    // Analyze file command
    const analyzeFileCommand = vscode.commands.registerCommand('baselineGuard.analyzeFile', async () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showWarningMessage('No active file to analyze');
            return;
        }
        
        if (!SUPPORTED_LANGUAGES.includes(activeEditor.document.languageId as any)) {
            vscode.window.showWarningMessage(`File type '${activeEditor.document.languageId}' is not supported`);
            return;
        }
        
        try {
            statusBarItem.text = '$(loading~spin) Analyzing...';
            await analyzeDocument(activeEditor.document);
            await updateStatusBarForDocument(activeEditor.document);
            
            const diagnostics = vscode.languages.getDiagnostics(activeEditor.document.uri);
            const issues = diagnostics.filter(d => d.source === 'BaselineGuard');
            
            if (issues.length > 0) {
                vscode.window.showInformationMessage(`Analysis complete: ${issues.length} compatibility findings`);
                vscode.commands.executeCommand('workbench.panel.markers.view.focus');
            } else {
                vscode.window.showInformationMessage('Analysis complete: No compatibility issues found! ✅');
            }
            
            outputChannel.appendLine(`✅ Manual analysis: ${issues.length} findings`);
            
        } catch (error) {
            vscode.window.showErrorMessage('Failed to analyze file');
            outputChannel.appendLine(`❌ Analysis failed: ${error}`);
            statusBarItem.text = '$(shield) BaselineGuard: Error';
        }
    });
    
    // Toggle command
    const toggleCommand = vscode.commands.registerCommand('baselineGuard.toggle', async () => {
        const config = vscode.workspace.getConfiguration('baselineGuard');
        const enabled = config.get<boolean>('enabled', true);
        await config.update('enabled', !enabled, vscode.ConfigurationTarget.Global);
        
        const status = !enabled ? 'enabled' : 'disabled';
        vscode.window.showInformationMessage(`BaselineGuard ${status}`);
        outputChannel.appendLine(`🔄 Extension ${status}`);
        
        statusBarItem.text = `$(shield) BaselineGuard: ${!enabled ? 'Enabled' : 'Disabled'}`;
    });
    
    // Setup API Key command
    const setupKeyCommand = vscode.commands.registerCommand('baselineGuard.setupGeminiKey', async () => {
        const apiKey = await vscode.window.showInputBox({
            prompt: 'Enter your Gemini API Key (Get it from: https://aistudio.google.com/app/apikey)',
            password: true,
            placeHolder: 'AIza...',
            ignoreFocusOut: true,
            validateInput: (value) => {
                if (!value || value.trim().length === 0) {
                    return 'API key cannot be empty';
                }
                if (!value.startsWith('AIza')) {
                    return 'Invalid API key format. Should start with "AIza"';
                }
                return null;
            }
        });

        if (apiKey) {
            try {
                const secretStorage = SecretStorageService.getInstance();
                await secretStorage.storeGeminiApiKey(apiKey);
                
                const success = await geminiService.initialize();
                
                if (success) {
                    vscode.window.showInformationMessage('✅ Gemini API key saved successfully! 🤖');
                    outputChannel.appendLine('✅ Gemini API key configured');
                } else {
                    vscode.window.showErrorMessage('❌ Failed to verify Gemini API key');
                }
            } catch (error) {
                vscode.window.showErrorMessage(`Failed to save API key: ${error}`);
            }
        }
    });

    // Generate Fix
    const generateFixCommand = vscode.commands.registerCommand('baselineGuard.generateFix', async () => {
        const editor = vscode.window.activeTextEditor;
        if (!editor) {
            vscode.window.showWarningMessage('No active editor');
            return;
        }

        if (!geminiService.isAvailable()) {
            const setup = await vscode.window.showWarningMessage(
                'Gemini AI is not configured. Setup now?',
                'Setup', 'Cancel'
            );
            if (setup === 'Setup') {
                vscode.commands.executeCommand('baselineGuard.setupGeminiKey');
            }
            return;
        }

        const position = editor.selection.active;
        const diagnostics = vscode.languages.getDiagnostics(editor.document.uri);
        const diagnostic = diagnostics.find(d => 
            d.range.contains(position) && d.source === 'BaselineGuard'
        );

        if (!diagnostic) {
            vscode.window.showInformationMessage('No compatibility issue at cursor. Place cursor on a warning.');
            return;
        }

        vscode.commands.executeCommand(
            'baselineGuard.generateFixForDiagnostic',
            editor.document,
            diagnostic,
            new vscode.Range(position, position)
        );
    });

    // Generate Fix for Diagnostic
    const generateFixForDiagnosticCommand = vscode.commands.registerCommand(
        'baselineGuard.generateFixForDiagnostic',
        async (document: vscode.TextDocument, diagnostic: vscode.Diagnostic, range: vscode.Range) => {
            if (!geminiService.isAvailable()) {
                const setup = await vscode.window.showWarningMessage(
                    'Gemini AI not configured. Setup now?',
                    'Setup', 'Cancel'
                );
                if (setup === 'Setup') {
                    vscode.commands.executeCommand('baselineGuard.setupGeminiKey');
                }
                return;
            }

            await vscode.window.withProgress({
                location: vscode.ProgressLocation.Notification,
                title: 'Generating AI fix...',
                cancellable: false
            }, async () => {
                try {
                    const featureId = typeof diagnostic.code === 'object' ? diagnostic.code.value : diagnostic.code;
                    const feature = apiClient.getFeature(featureId as string);

                    if (!feature) {
                        vscode.window.showErrorMessage('Feature information not found');
                        return;
                    }

                    const startLine = Math.max(0, range.start.line - 3);
                    const endLine = Math.min(document.lineCount - 1, range.end.line + 3);
                    let context = '';
                    for (let i = startLine; i <= endLine; i++) {
                        context += document.lineAt(i).text + '\n';
                    }

                    const suggestion = await geminiService.generateFixForLanguage(
                        feature,
                        context,
                        document.languageId
                    );

                    const formattedContent = `# 🤖 AI Fix for: ${feature.name}

**Language:** ${document.languageId.toUpperCase()}
**Status:** ${feature.baseline?.status || 'unknown'}
**File:** ${document.fileName}

---

${suggestion}

---

💡 **Tip:** Test in target browsers
📚 **Spec:** ${feature.spec.links[0]?.link || 'N/A'}
`;

                    const doc = await vscode.workspace.openTextDocument({
                        content: formattedContent,
                        language: 'markdown'
                    });
                    await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
                    
                    outputChannel.appendLine(`✅ AI fix generated for ${feature.name} (${document.languageId})`);

                } catch (error) {
                    vscode.window.showErrorMessage(`Failed to generate fix: ${error}`);
                    outputChannel.appendLine(`❌ Fix generation failed: ${error}`);
                }
            });
        }
    );

    // Explain Feature
    const explainFeatureCommand = vscode.commands.registerCommand(
        'baselineGuard.explainFeature',
        async (document: vscode.TextDocument, diagnostic: vscode.Diagnostic) => {
            const featureId = typeof diagnostic.code === 'object' ? diagnostic.code.value : diagnostic.code;
            const feature = apiClient.getFeature(featureId as string);

            if (!feature) {
                vscode.window.showErrorMessage('Feature information not found');
                return;
            }

            const explanation = await geminiService.explainFeature(feature);
            
            const doc = await vscode.workspace.openTextDocument({
                content: `# ${feature.name}\n\n${explanation}`,
                language: 'markdown'
            });
            await vscode.window.showTextDocument(doc, vscode.ViewColumn.Beside);
        }
    );

    // Show Browser Support
    const showBrowserSupportCommand = vscode.commands.registerCommand(
        'baselineGuard.showBrowserSupport',
        async (document: vscode.TextDocument, diagnostic: vscode.Diagnostic) => {
            const featureId = typeof diagnostic.code === 'object' ? diagnostic.code.value : diagnostic.code;
            const feature = apiClient.getFeature(featureId as string);

            if (!feature) {
                vscode.window.showErrorMessage('Feature information not found');
                return;
            }

            let message = `Browser Support: ${feature.name}\n\n`;
            
            Object.entries(feature.browser_implementations).forEach(([browser, impl]) => {
                const icon = impl.status === 'available' ? '✅' : '❌';
                message += `${icon} ${browser}: ${impl.status} (v${impl.version})\n`;
            });

            vscode.window.showInformationMessage(message, { modal: true });
        }
    );
    
    // Register all commands
    context.subscriptions.push(
        helloCommand, 
        dashboardCommand,
        showWebviewCommand,
        debugApiCommand,  // NEW DEBUG COMMAND
        refreshCommand, 
        analyzeFileCommand,
        toggleCommand,
        setupKeyCommand,
        generateFixCommand,
        generateFixForDiagnosticCommand,
        explainFeatureCommand,
        showBrowserSupportCommand
    );
    
    outputChannel.appendLine('✅ All commands registered (including debug)');
}

export function deactivate() {
    console.log('BaselineGuard: Extension deactivated');
    if (outputChannel) {
        outputChannel.appendLine('👋 BaselineGuard: Extension deactivated');
        outputChannel.dispose();
    }
    if (statusBarItem) {
        statusBarItem.dispose();
    }
    if (diagnosticProvider) {
        diagnosticProvider.dispose();
    }
}
