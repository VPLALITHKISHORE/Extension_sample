// src/dashboardProvider.ts
import * as vscode from 'vscode';
import { WebStatusApiClient, WebFeature } from './webStatusApi';

export class DashboardProvider implements vscode.WebviewViewProvider {
  public static readonly viewType = 'baselineGuard.dashboardView';
  private _view?: vscode.WebviewView;

  constructor(
    private readonly _extensionUri: vscode.Uri,
    private apiClient: WebStatusApiClient
  ) {}

  public resolveWebviewView(
    webviewView: vscode.WebviewView,
    context: vscode.WebviewViewResolveContext,
    _token: vscode.CancellationToken
  ) {
    this._view = webviewView;

    webviewView.webview.options = {
      enableScripts: true,
      localResourceRoots: [this._extensionUri]
    };

    webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

    // Handle messages from the webview
    webviewView.webview.onDidReceiveMessage(async (data) => {
      switch (data.type) {
        case 'refresh':
          await this.refresh();
          break;
        case 'openFeature':
          this.openFeatureDetails(data.featureId);
          break;
      }
    });

    // Initial load
    this.refresh();
  }

  public async refresh() {
    if (this._view) {
      const features = await this.apiClient.fetchFeatures();
      const dashboardData = this.prepareDashboardData(features);
      
      this._view.webview.postMessage({
        type: 'update',
        data: dashboardData
      });
    }
  }

  private prepareDashboardData(features: WebFeature[]) {
    const stats = {
      total: features.length,
      widely: features.filter(f => f.baseline?.status === 'widely').length,
      newly: features.filter(f => f.baseline?.status === 'newly').length,
      limited: features.filter(f => f.baseline?.status === 'limited').length,
      unknown: features.filter(f => !f.baseline).length
    };

    // Improved category detection based on feature name and spec
    const categories = {
      css: 0,
      javascript: 0,
      html: 0,
      api: 0
    };

    features.forEach(f => {
      const id = f.feature_id.toLowerCase();
      const name = f.name.toLowerCase();
      const specUrl = f.spec.links[0]?.link.toLowerCase() || '';
      
      // CSS features
      if (
        id.includes('css') || 
        name.includes('css') ||
        specUrl.includes('css') ||
        id.startsWith('at-') || // CSS at-rules like @container
        name.includes('selector') ||
        name.includes('property') ||
        name.includes('pseudo') ||
        name.includes('grid') ||
        name.includes('flex') ||
        name.includes('animation') ||
        name.includes('transition')
      ) {
        categories.css++;
      }
      // HTML features
      else if (
        id.includes('html') || 
        name.includes('html') ||
        specUrl.includes('html') ||
        name.includes('element') ||
        name.includes('<') ||
        name.includes('attribute') ||
        name.includes('tag')
      ) {
        categories.html++;
      }
      // JavaScript features
      else if (
        id.includes('js-') || 
        id.includes('javascript') ||
        name.includes('javascript') ||
        specUrl.includes('ecmascript') ||
        name.includes('promise') ||
        name.includes('async') ||
        name.includes('await') ||
        name.includes('class') ||
        name.includes('module') ||
        name.includes('import') ||
        name.includes('export')
      ) {
        categories.javascript++;
      }
      // Everything else is an API
      else {
        categories.api++;
      }
    });

    // Browser support distribution
    const browserSupport: { [browser: string]: number } = {};
    features.forEach(f => {
      Object.entries(f.browser_implementations).forEach(([browser, impl]) => {
        if (impl.status === 'available') {
          browserSupport[browser] = (browserSupport[browser] || 0) + 1;
        }
      });
    });

    // Recent features (newly available)
    const recentFeatures = features
      .filter(f => f.baseline?.status === 'newly')
      .slice(0, 10)
      .map(f => ({
        id: f.feature_id,
        name: f.name,
        date: f.baseline?.low_date || 'N/A'
      }));

    return {
      stats,
      categories,
      browserSupport,
      recentFeatures,
      lastUpdated: new Date().toISOString()
    };
  }


  private openFeatureDetails(featureId: string) {
    const feature = this.apiClient.getFeature(featureId);
    if (feature) {
      const specUrl = feature.spec.links[0]?.link;
      if (specUrl) {
        vscode.env.openExternal(vscode.Uri.parse(specUrl));
      }
    }
  }

  private _getHtmlForWebview(webview: vscode.Webview): string {
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>BaselineGuard Dashboard</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      padding: 16px;
      color: var(--vscode-foreground);
      background-color: var(--vscode-editor-background);
    }

    h1 {
      font-size: 24px;
      margin-bottom: 20px;
      color: var(--vscode-titleBar-activeForeground);
    }

    h2 {
      font-size: 18px;
      margin-top: 24px;
      margin-bottom: 12px;
      color: var(--vscode-foreground);
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .refresh-btn {
      background: var(--vscode-button-background);
      color: var(--vscode-button-foreground);
      border: none;
      padding: 8px 16px;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
    }

    .refresh-btn:hover {
      background: var(--vscode-button-hoverBackground);
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin-bottom: 24px;
    }

    .stat-card {
      background: var(--vscode-editor-inactiveSelectionBackground);
      padding: 16px;
      border-radius: 8px;
      border: 1px solid var(--vscode-panel-border);
    }

    .stat-value {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 4px;
    }

    .stat-label {
      font-size: 14px;
      opacity: 0.8;
    }

    .stat-card.total { border-left: 4px solid #0078d4; }
    .stat-card.widely { border-left: 4px solid #107c10; }
    .stat-card.newly { border-left: 4px solid #f9a825; }
    .stat-card.limited { border-left: 4px solid #e81123; }

    .chart-container {
      background: var(--vscode-editor-inactiveSelectionBackground);
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 20px;
      border: 1px solid var(--vscode-panel-border);
    }

    .bar-chart {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .bar-item {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .bar-label {
      min-width: 120px;
      font-size: 14px;
    }

    .bar-wrapper {
      flex: 1;
      height: 24px;
      background: var(--vscode-input-background);
      border-radius: 4px;
      overflow: hidden;
      position: relative;
    }

    .bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #0078d4, #00bcf2);
      transition: width 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: flex-end;
      padding-right: 8px;
    }

    .bar-value {
      font-size: 12px;
      color: white;
      font-weight: bold;
    }

    .pie-chart {
      display: flex;
      justify-content: center;
      margin: 20px 0;
    }

    .pie-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 16px;
      margin-top: 16px;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .legend-color {
      width: 16px;
      height: 16px;
      border-radius: 4px;
    }

    .legend-label {
      font-size: 14px;
    }

    .feature-list {
      background: var(--vscode-editor-inactiveSelectionBackground);
      padding: 16px;
      border-radius: 8px;
      border: 1px solid var(--vscode-panel-border);
    }

    .feature-item {
      padding: 12px;
      border-bottom: 1px solid var(--vscode-panel-border);
      cursor: pointer;
      transition: background 0.2s;
    }

    .feature-item:hover {
      background: var(--vscode-list-hoverBackground);
    }

    .feature-item:last-child {
      border-bottom: none;
    }

    .feature-name {
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 4px;
    }

    .feature-date {
      font-size: 12px;
      opacity: 0.7;
    }

    .loading {
      text-align: center;
      padding: 40px;
      opacity: 0.7;
    }

    .update-time {
      text-align: right;
      font-size: 12px;
      opacity: 0.6;
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🛡️ BaselineGuard Dashboard</h1>
    <button class="refresh-btn" onclick="refresh()">🔄 Refresh</button>
  </div>

  <div id="content" class="loading">Loading dashboard data...</div>

  <script>
    const vscode = acquireVsCodeApi();

    function refresh() {
      document.getElementById('content').innerHTML = '<div class="loading">Refreshing...</div>';
      vscode.postMessage({ type: 'refresh' });
    }

    function openFeature(featureId) {
      vscode.postMessage({ type: 'openFeature', featureId });
    }

    window.addEventListener('message', event => {
      const message = event.data;
      
      if (message.type === 'update') {
        renderDashboard(message.data);
      }
    });

    function renderDashboard(data) {
      const { stats, categories, browserSupport, recentFeatures, lastUpdated } = data;

      const html = \`
        <div class="stats-grid">
          <div class="stat-card total">
            <div class="stat-value">\${stats.total}</div>
            <div class="stat-label">Total Features</div>
          </div>
          <div class="stat-card widely">
            <div class="stat-value">\${stats.widely}</div>
            <div class="stat-label">✅ Widely Available</div>
          </div>
          <div class="stat-card newly">
            <div class="stat-value">\${stats.newly}</div>
            <div class="stat-label">🟡 Newly Available</div>
          </div>
          <div class="stat-card limited">
            <div class="stat-value">\${stats.limited}</div>
            <div class="stat-label">⚠️ Limited Support</div>
          </div>
        </div>

        <div class="chart-container">
          <h2>📊 Features by Category</h2>
          <div class="bar-chart">
            \${renderBarChart(categories)}
          </div>
        </div>

        <div class="chart-container">
          <h2>🌐 Browser Support Distribution</h2>
          <div class="bar-chart">
            \${renderBrowserChart(browserSupport, stats.total)}
          </div>
        </div>

        <div class="feature-list">
          <h2>🆕 Recently Available Features (Top 10)</h2>
          \${renderFeatureList(recentFeatures)}
        </div>

        <div class="update-time">Last updated: \${new Date(lastUpdated).toLocaleString()}</div>
      \`;

      document.getElementById('content').innerHTML = html;
    }

    function renderBarChart(data) {
      const maxValue = Math.max(...Object.values(data));
      return Object.entries(data)
        .map(([key, value]) => {
          const percentage = (value / maxValue * 100).toFixed(0);
          return \`
            <div class="bar-item">
              <div class="bar-label">\${capitalizeFirst(key)}</div>
              <div class="bar-wrapper">
                <div class="bar-fill" style="width: \${percentage}%">
                  <span class="bar-value">\${value}</span>
                </div>
              </div>
            </div>
          \`;
        })
        .join('');
    }

    function renderBrowserChart(data, total) {
      return Object.entries(data)
        .sort((a, b) => b[1] - a[1])
        .map(([browser, count]) => {
          const percentage = (count / total * 100).toFixed(1);
          return \`
            <div class="bar-item">
              <div class="bar-label">\${formatBrowserName(browser)}</div>
              <div class="bar-wrapper">
                <div class="bar-fill" style="width: \${percentage}%">
                  <span class="bar-value">\${count}</span>
                </div>
              </div>
            </div>
          \`;
        })
        .join('');
    }

    function renderFeatureList(features) {
      if (features.length === 0) {
        return '<div style="padding: 20px; text-align: center; opacity: 0.6;">No recently available features</div>';
      }

      return features.map(f => \`
        <div class="feature-item" onclick="openFeature('\${f.id}')">
          <div class="feature-name">🟡 \${f.name}</div>
          <div class="feature-date">Available since: \${f.date}</div>
        </div>
      \`).join('');
    }

    function capitalizeFirst(str) {
      return str.charAt(0).toUpperCase() + str.slice(1);
    }

    function formatBrowserName(browser) {
      const names = {
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

    // Request initial data
    refresh();
  </script>
</body>
</html>`;
  }
}
