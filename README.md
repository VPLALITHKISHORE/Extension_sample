# 🛡️ BaselineGuard

<div align="center">

**AI-Powered Web Compatibility Checker for VS Code**

*Write modern web code with confidence. Get instant compatibility insights and AI-powered fixes as you type.*

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/VPLALITHKISHORE/Extension_sample)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.74.0+-007ACC.svg)](https://code.visualstudio.com/)
[![Made with TypeScript](https://img.shields.io/badge/Made%20with-TypeScript-3178C6.svg)](https://www.typescriptlang.org/)

[Installation](#-installation) • [Features](#-features) • [Quick Start](#-quick-start) • [Documentation](#-usage-examples)

</div>

---

## 🎯 What is BaselineGuard?

BaselineGuard is your real-time companion for building cross-browser compatible web applications. It analyzes your code as you write, alerts you to compatibility issues, and provides AI-powered solutions—all without leaving VS Code.

**Stop guessing. Start knowing.**

### Why BaselineGuard?

✅ **Catch issues early** - Before they reach production  
✅ **Save debugging time** - Know exactly which browsers support your code  
✅ **Learn as you code** - Understand compatibility trade-offs  
✅ **AI-assisted fixes** - Get intelligent fallback suggestions  

---

## 📦 Installation

### From VS Code Marketplace

1. Open VS Code
2. Press `Ctrl+Shift+X` (Windows/Linux) or `Cmd+Shift+X` (Mac)
3. Search for "BaselineGuard"
4. Click **Install**

### From Command Line

```bash
ext install baseline-guard
```

---

## ✨ Features

### 🔍 **Real-Time Compatibility Detection**

Watch as BaselineGuard analyzes your code instantly:

- **JavaScript & TypeScript** - AST-based intelligent parsing
- **CSS** - Modern feature detection with pattern matching
- **HTML** - Element and attribute support checking
- **Confidence Scoring** - Know how reliable each detection is

### 🌐 **Live Browser Support Data**

Get up-to-date compatibility information:

- **WebStatus API Integration** - Real-time browser support data
- **Chrome Usage Statistics** - Know how many users are affected
- **Three-Tier Status System**:
  - ✅ **Widely Available** - Safe to use across all modern browsers
  - 🟡 **Newly Available** - Supported in latest versions, consider fallbacks
  - ⚠️ **Limited Support** - Use with caution, polyfills recommended

### 🤖 **AI-Powered Solutions**

Let Gemini AI help you write compatible code:

- **Smart Fix Suggestions** - Context-aware code alternatives
- **Automatic Fallbacks** - Progressive enhancement strategies
- **Best Practice Recommendations** - Learn while you code
- **One-Click Fixes** - Apply solutions instantly with `Ctrl+.`

### 📊 **Interactive Dashboard**

Visualize your project's compatibility at a glance:

- Comprehensive feature overview
- Browser support breakdown
- Usage statistics and trends
- Real-time status monitoring

### ⚡ **Performance Optimized**

Built for speed:

- **Cached API Responses** - 1-hour cache for instant results
- **Efficient AST Parsing** - Minimal performance impact
- **Smart Throttling** - Only analyze when needed

---

## 🚀 Quick Start

### Step 1: Install the Extension

Follow the [installation instructions](#-installation) above.

### Step 2: Configure AI Features (Recommended)

To unlock AI-powered fixes, you'll need a free Gemini API key:

1. **Get Your API Key**
   - Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Sign in with your Google account
   - Generate a new API key (it's free!)

2. **Configure BaselineGuard**
   - Press `Cmd+Shift+P` (Mac) or `Ctrl+Shift+P` (Windows/Linux)
   - Type `Baseline` and select **"BaselineGuard: Setup Gemini Key"**
   - Paste your API key and press Enter
   - You're all set! 🎉

### Step 3: Start Coding

Open any web development file (`.js`, `.ts`, `.css`, `.html`) and start coding. BaselineGuard will automatically:

- Highlight compatibility issues with colorful underlines
- Show browser support information on hover
- Offer quick fixes via the lightbulb icon 💡
- Update the dashboard in real-time

---

## 💡 Usage Examples

### JavaScript/TypeScript

BaselineGuard detects modern JavaScript APIs and provides compatibility insights:

```javascript
// URLPattern API - Newly available feature
const pattern = new URLPattern({ pathname: '/books/:id' });
//    ^^^^^^^^ 🟡 Newly available in Chrome 95+, Safari 16.4+
//    💡 Quick fix available: Use path-to-regexp fallback

// View Transitions API - Cutting edge feature
document.startViewTransition(() => {
//       ^^^^^^^^^^^^^^^^^^ ⚠️ Limited support - Chrome 111+ only
//       💡 AI Suggestion: Add feature detection wrapper
  updateDOM();
});
```

**Hover over any underlined code** to see:
- Which browsers support it
- Usage statistics
- Alternative approaches
- Quick fix options

### CSS

Modern CSS features are detected with helpful suggestions:

```css
.container {
  /* Container Queries - Newly available */
  container-type: inline-size;
  /* 🟡 Chrome 105+, Safari 16+ */
  /* 💡 Consider @supports rule for fallback */
}

.card {
  /* Cascade Layers - Modern feature */
  @layer components {
    /* ⚠️ Limited support */
    /* 💡 AI Suggestion: Use traditional specificity */
  }
}
```

### HTML

HTML5 elements and web components are monitored:

```html
<!-- Dialog Element -->
<dialog open>
  <!-- 🟡 Widely supported now, but consider polyfill for older browsers -->
  <form method="dialog">
    <button>Close</button>
  </form>
</dialog>

<!-- Custom Elements -->
<my-component>
  <!-- ✅ Web Components widely available -->
</my-component>
```

---

## ⚙️ Configuration

Customize BaselineGuard to your workflow:

```json
{
  // Enable/disable the extension
  "baselineGuard.enabled": true,
  
  // Enable AI-powered suggestions (requires API key)
  "baselineGuard.enableAI": true,
  
  // Diagnostic severity (error, warning, info)
  "baselineGuard.diagnosticSeverity": "warning",
  
  // Cache duration in milliseconds (default: 1 hour)
  "baselineGuard.cacheDuration": 3600000
}
```

**Access settings:**
- `Cmd+,` or `Ctrl+,` → Search "BaselineGuard"

---

## 🎮 Commands

Access all features via the command palette (`Cmd+Shift+P` / `Ctrl+Shift+P`):

| Command | Description | Shortcut |
|---------|-------------|----------|
| **BaselineGuard: Setup Gemini Key** | Configure your AI API key | - |
| **BaselineGuard: Open Dashboard** | View compatibility overview | - |
| **BaselineGuard: Analyze File** | Scan current file for issues | - |
| **BaselineGuard: Generate Fix** | Get AI-powered solution | `Ctrl+.` |
| **BaselineGuard: Refresh** | Update compatibility data | - |
| **BaselineGuard: Toggle** | Enable/disable extension | - |

💡 **Pro Tip:** Type `Baseline` in the command palette to see all available commands!

---

## 📊 Supported Features

### JavaScript/TypeScript APIs

<details>
<summary>Click to expand full list</summary>

- URLPattern API
- View Transitions API
- Container Queries (JS API)
- Web Components (Custom Elements, Shadow DOM)
- Import Maps
- Top-level Await
- Private Class Fields
- Optional Chaining
- Nullish Coalescing
- And 50+ more modern APIs...

</details>

### CSS Features

<details>
<summary>Click to expand full list</summary>

- Container Queries (`@container`)
- Cascade Layers (`@layer`)
- `:has()` Selector
- CSS Grid Level 2
- Subgrid
- `color-mix()`
- `color()` Function
- CSS Nesting
- `@scope` Rule
- And 40+ more features...

</details>

### HTML Elements & Attributes

<details>
<summary>Click to expand full list</summary>

- `<dialog>` Element
- Custom Elements (Web Components)
- `<template>` Element
- `loading` Attribute
- `decoding` Attribute
- Popover API
- And more...

</details>

---

## 🔧 How It Works

BaselineGuard uses a multi-layered approach:

1. **AST Parsing** - TypeScript/JavaScript files are parsed into Abstract Syntax Trees for accurate detection
2. **Pattern Matching** - CSS and HTML use intelligent regex patterns for feature identification
3. **WebStatus API** - Real-time compatibility data from Chrome's platform status
4. **AI Analysis** - Gemini AI provides context-aware suggestions and fixes
5. **Caching Layer** - Smart caching ensures fast performance without sacrificing accuracy

---

## 🤝 Contributing

We love contributions! Here's how you can help:

1. **Report Bugs** - [Open an issue](https://github.com/VPLALITHKISHORE/Extension_sample/issues)
2. **Suggest Features** - Share your ideas
3. **Submit PRs** - Fork, code, and submit
4. **Improve Docs** - Help others understand

See our [Contributing Guide](CONTRIBUTING.md) for details.

---

## 🐛 Troubleshooting

### AI features not working?

- Make sure you've set up your Gemini API key
- Press `Cmd+Shift+P` → "BaselineGuard: Setup Gemini Key"
- Check that `baselineGuard.enableAI` is `true`

### Features not being detected?

- Try `Cmd+Shift+P` → "BaselineGuard: Refresh"
- Check that the file type is supported (`.js`, `.ts`, `.css`, `.html`)
- Ensure the extension is enabled

### Need more help?

- Check [FAQ](https://github.com/VPLALITHKISHORE/Extension_sample/wiki/FAQ)
- [Ask on Discussions](https://github.com/VPLALITHKISHORE/Extension_sample/discussions)
- [Report an Issue](https://github.com/VPLALITHKISHORE/Extension_sample/issues)

---

## 📝 License

MIT License - see [LICENSE](LICENSE) file for details.

---

## 🔗 Links

- 📦 [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=BaselineHelper.baseline-guard)
- 💻 [GitHub Repository](https://github.com/VPLALITHKISHORE/Extension_sample)
- 🐛 [Issue Tracker](https://github.com/VPLALITHKISHORE/Extension_sample/issues)
- 📖 [Documentation Wiki](https://github.com/VPLALITHKISHORE/Extension_sample/wiki)
- 💬 [Discussions](https://github.com/VPLALITHKISHORE/Extension_sample/discussions)

---

<div align="center">

### ⭐ Star us on GitHub!

*If BaselineGuard helps you build better web apps, give us a star!*

**Made with ❤️ by BaselineHelper**

*Built with TypeScript • VS Code Extension API • WebStatus API • Google Gemini*

</div>