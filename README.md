# 🛡️ BaselineGuard

**AI-Powered Web Compatibility Checker for VS Code**

> Real-time detection and AI-powered fixes for web compatibility issues as you code.

[![Version](https://img.shields.io/badge/version-2.0.0-blue.svg)](https://github.com/VPLALITHKISHORE/Extension_sample)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![VS Code](https://img.shields.io/badge/VS%20Code-1.74.0+-007ACC.svg)](https://code.visualstudio.com/)
[![Made with TypeScript](https://img.shields.io/badge/Made%20with-TypeScript-3178C6.svg)](https://www.typescriptlang.org/)

## ✨ Features

### 🔍 Real-Time Detection
- Instant analysis of JavaScript, TypeScript, CSS, and HTML files
- AST-based detection for JavaScript/TypeScript
- Pattern matching for CSS and HTML
- Confidence scoring for reliable detection

### 🌐 Browser Compatibility Checking
- Live data from WebStatus API
- Detailed browser support information
- Usage statistics from Chrome
- Three-tier status system:
  - ✅ Widely Available
  - 🟡 Newly Available
  - ⚠️ Limited Support

### 🤖 AI-Powered Solutions
- Gemini AI integration for intelligent fixes
- Context-aware suggestions
- Fallback code generation
- Progressive enhancement strategies

### 📊 Interactive Dashboard
- Comprehensive compatibility overview
- Feature usage statistics
- Browser support details
- Real-time status updates

### ⚡ Smart Features
- Cached API responses for performance
- Intelligent feature detection
- Detailed diagnostic messages
- Quick-fix suggestions

## 🚀 Getting Started

1. **Install the Extension**
   ```
   ext install baseline-guard
   ```

2. **Configure AI Features (Optional)**
   - Get API key from [Google AI Studio](https://aistudio.google.com/app/apikey)
   - Press `Ctrl+Shift+P`
   - Run "BaselineGuard: Setup Gemini Key"
   - Enter your API key

3. **Start Coding**
   - Open any web development file
   - Get instant compatibility feedback
   - Use quick fixes with `Ctrl+.`

## 💡 Usage Examples

### JavaScript/TypeScript Detection
```javascript
// BaselineGuard will show compatibility info
const pattern = new URLPattern({ pathname: '/books/:id' });
//    ^^^^^^^ 🟡 Newly available - Limited browser support
```

### CSS Feature Detection
```css
.container {
  container-type: inline-size;
  /* 🟡 Newly available - Consider @supports */
}
```

### HTML Element Support
```html
<dialog open>
  <!-- ⚠️ Limited support - Add polyfill -->
</dialog>
```

## ⚙️ Configuration

```json
{
  "baselineGuard.enabled": true,
  "baselineGuard.enableAI": true
}
```

## 🎮 Available Commands

| Command | Description |
|---------|-------------|
| `BaselineGuard: Open Dashboard` | Open interactive dashboard |
| `BaselineGuard: Analyze File` | Analyze current file |
| `BaselineGuard: Generate Fix` | Get AI-powered solution |
| `BaselineGuard: Refresh` | Update compatibility data |
| `BaselineGuard: Setup Gemini Key` | Configure AI features |
| `BaselineGuard: Toggle` | Enable/disable extension |

## 📊 Feature Detection

The extension detects:

### JavaScript APIs
- URLPattern
- View Transitions
- Container Queries
- Web Components
- And more...

### CSS Features
- Container Queries
- Cascade Layers
- Modern Layout Features
- New Selectors
- And more...

### HTML Elements
- `<dialog>`
- Custom Elements
- Web Components
- And more...

## 🔧 Technical Details

- Real-time AST analysis for JavaScript/TypeScript
- Pattern-based detection for CSS/HTML
- Cached API responses (1-hour duration)
- Confidence scoring system
- Performance optimized

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🔗 Links

- [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=BaselineHelper.baseline-guard)
- [GitHub Repository](https://github.com/VPLALITHKISHORE/Extension_sample)
- [Issue Tracker](https://github.com/VPLALITHKISHORE/Extension_sample/issues)

---

<p align="center">
  <strong>Made with ❤️ by BaselineHelper</strong>
</p>

<p align="center">
  <sub>Built with TypeScript, VS Code Extension API, WebStatus API, and Google Gemini</sub>
</p>