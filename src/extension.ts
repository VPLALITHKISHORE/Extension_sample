import * as vscode from 'vscode';
import { WebStatusApiClient } from './webStatusApi';
import { CompatibilityDiagnosticProvider } from './diagnosticProvider';
import { SUPPORTED_LANGUAGES } from './utils/constants';

let outputChannel: vscode.OutputChannel;
let apiClient: WebStatusApiClient;
let statusBarItem: vscode.StatusBarItem;
let diagnosticProvider: CompatibilityDiagnosticProvider;

export async function activate(context: vscode.ExtensionContext) {
    console.log('BaselineGuard: Extension is activating...');
    
    try {
        // Create output channel
        outputChannel = vscode.window.createOutputChannel('BaselineGuard');
        context.subscriptions.push(outputChannel);
        
        outputChannel.appendLine('🚀 BaselineGuard: Extension activated successfully!');
        
        // Create status bar item
        statusBarItem = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Right, 100);
        statusBarItem.command = 'baselineGuard.openDashboard';
        statusBarItem.text = '$(shield) BaselineGuard';
        statusBarItem.tooltip = 'BaselineGuard - Web Compatibility Checker';
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
        
        // Register commands
        registerCommands(context);
        
        // Set up file analysis
        await setupFileAnalysis(context);
        
        // Show activation message
        vscode.window.showInformationMessage('BaselineGuard extension is now active! 🎉');
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
            const cacheInfo = apiClient.getCacheInfo();
            statusBarItem.text = `$(shield) BaselineGuard: Clean ✅`;
            statusBarItem.tooltip = `BaselineGuard - No compatibility issues found`;
        }
        
    } catch (error) {
        outputChannel.appendLine(`❌ Status bar update failed: ${error}`);
    }
}

function registerCommands(context: vscode.ExtensionContext) {
    // Hello command with API info
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
            
            const message = `Hello from BaselineGuard! 🛡️\n\nFeatures cached: ${cacheInfo.size}\nLast updated: ${new Date(cacheInfo.lastFetch).toLocaleString()}${analysisInfo}`;
            vscode.window.showInformationMessage(message);
            outputChannel.appendLine('✅ Hello command executed');
        } catch (error) {
            vscode.window.showInformationMessage('Hello from BaselineGuard! 🛡️ (API not loaded)');
            outputChannel.appendLine(`⚠️ Hello command: ${error}`);
        }
    });
    
    // Dashboard command with real data
    const dashboardCommand = vscode.commands.registerCommand('baselineGuard.openDashboard', async () => {
        try {
            statusBarItem.text = '$(loading~spin) Loading...';
            const features = await apiClient.fetchFeatures();
            
            // Count features by status
            const stats = {
                total: features.length,
                newly: features.filter(f => f.baseline?.status === 'newly').length,
                widely: features.filter(f => f.baseline?.status === 'widely').length,
                limited: features.filter(f => f.baseline?.status === 'limited').length,
                unknown: features.filter(f => !f.baseline).length
            };
            
            const message = `📊 BaselineGuard Dashboard\n\nTotal Features: ${stats.total}\n✅ Widely Available: ${stats.widely}\n🟡 Newly Available: ${stats.newly}\n⚠️ Limited Availability: ${stats.limited}\n❓ Unknown Status: ${stats.unknown}`;
            
            vscode.window.showInformationMessage(message);
            statusBarItem.text = `$(shield) BaselineGuard (${features.length})`;
            outputChannel.appendLine(`✅ Dashboard: ${features.length} features displayed`);
            
        } catch (error) {
            vscode.window.showErrorMessage('Failed to load dashboard data');
            statusBarItem.text = '$(shield) BaselineGuard: Error';
            outputChannel.appendLine(`❌ Dashboard error: ${error}`);
        }
    });
    
    // Refresh command
    const refreshCommand = vscode.commands.registerCommand('baselineGuard.refresh', async () => {
        try {
            statusBarItem.text = '$(loading~spin) Refreshing...';
            outputChannel.appendLine('🔄 Refreshing data...');
            
            // Force refresh by clearing cache
            apiClient.forceRefresh();
            const features = await apiClient.fetchFeatures();
            
            // Re-analyze current document if supported
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
    
    // Analyze current file command
    const analyzeFileCommand = vscode.commands.registerCommand('baselineGuard.analyzeFile', async () => {
        const activeEditor = vscode.window.activeTextEditor;
        if (!activeEditor) {
            vscode.window.showWarningMessage('No active file to analyze');
            return;
        }
        
        if (!SUPPORTED_LANGUAGES.includes(activeEditor.document.languageId as any)) {
            vscode.window.showWarningMessage(`File type '${activeEditor.document.languageId}' is not supported for analysis`);
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
                // Open Problems panel to show results
                vscode.commands.executeCommand('workbench.panel.markers.view.focus');
            } else {
                vscode.window.showInformationMessage('Analysis complete: No compatibility issues found! ✅');
            }
            
            outputChannel.appendLine(`✅ Manual analysis: ${issues.length} findings in ${activeEditor.document.fileName}`);
            
        } catch (error) {
            vscode.window.showErrorMessage('Failed to analyze file');
            outputChannel.appendLine(`❌ Manual analysis failed: ${error}`);
            statusBarItem.text = '$(shield) BaselineGuard: Error';
        }
    });
    
    // Toggle extension command
    const toggleCommand = vscode.commands.registerCommand('baselineGuard.toggle', async () => {
        const config = vscode.workspace.getConfiguration('baselineGuard');
        const enabled = config.get<boolean>('enabled', true);
        await config.update('enabled', !enabled, vscode.ConfigurationTarget.Global);
        
        const status = !enabled ? 'enabled' : 'disabled';
        vscode.window.showInformationMessage(`BaselineGuard ${status}`);
        outputChannel.appendLine(`🔄 Extension ${status}`);
        
        // Update status bar to reflect state
        if (!enabled) {
            statusBarItem.text = '$(shield) BaselineGuard: Enabled';
        } else {
            statusBarItem.text = '$(shield) BaselineGuard: Disabled';
        }
    });
    
    context.subscriptions.push(
        helloCommand, 
        dashboardCommand, 
        refreshCommand, 
        analyzeFileCommand,
        toggleCommand
    );
    
    outputChannel.appendLine('✅ All commands registered');
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
