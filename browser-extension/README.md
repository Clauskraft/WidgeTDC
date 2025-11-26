# WidgeTDC Browser Extension

AI-powered browser assistant with semantic search and knowledge capture.

## Features

### 🎯 Smart Text Selection
- Select any text on a webpage
- Get instant AI-powered actions:
  - 💾 **Save** - Store to your knowledge base
  - 🔍 **Search Similar** - Find related content
  - ❓ **Ask AI** - Get instant answers

### 📚 Page Capture
- Automatically capture page content
- Extract metadata (author, date, description)
- Store in semantic vector database
- Search across all captured content

### 🤖 AI Assistant Sidebar
- Floating sidebar with AI capabilities
- Semantic search results
- AI-generated answers
- Beautiful, modern UI

### 🔗 Backend Integration
- Connects to WidgeTDC platform
- Real-time semantic search
- Knowledge graph integration
- Multi-modal support

## Installation

### From Source

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-org/WidgeTDC.git
   cd WidgeTDC/browser-extension
   ```

2. **Load in Chrome**
   - Open Chrome and go to `chrome://extensions/`
   - Enable "Developer mode" (top right)
   - Click "Load unpacked"
   - Select the `browser-extension` folder

3. **Configure Backend URL**
   - Click the extension icon
   - Go to Options
   - Set your WidgeTDC backend URL (default: `http://localhost:3000`)

## Usage

### Text Selection Actions

1. **Select text** on any webpage
2. **Floating buttons appear** with options:
   - Save to knowledge base
   - Search for similar content
   - Ask AI about the selection

### Page Capture

1. **Click extension icon**
2. **Select "Capture Page"**
3. Content is automatically:
   - Extracted and cleaned
   - Sent to backend
   - Indexed for search

### Sidebar

1. **Click extension icon** → "Open Sidebar"
2. **Search** your knowledge base
3. **Ask questions** to AI
4. **View results** in beautiful interface

## Configuration

### Backend URL

Set in extension options:
```
Default: http://localhost:3000/api
Production: https://api.widgetdc.com/api
```

### Permissions

The extension requires:
- `activeTab` - Access current tab content
- `storage` - Store settings
- `contextMenus` - Right-click menu
- `tabs` - Manage tabs

## Development

### File Structure

```
browser-extension/
├── manifest.json       # Extension manifest (v3)
├── content.js         # Content script (injected)
├── content.css        # Styles
├── background.js      # Service worker
├── popup.html         # Extension popup
├── options.html       # Settings page
└── icons/            # Extension icons
```

### Building

No build step required - pure JavaScript!

### Testing

1. Make changes to files
2. Go to `chrome://extensions/`
3. Click "Reload" on WidgeTDC extension
4. Test on any webpage

## Features in Detail

### Smart Content Extraction

- Removes scripts, styles, ads
- Extracts main content only
- Preserves formatting
- Captures metadata

### Semantic Search

- Vector-based similarity
- Hybrid keyword + semantic
- Re-ranked results
- Cross-modal search

### AI Assistance

- Context-aware answers
- Multi-hop reasoning
- Knowledge graph integration
- Real-time responses

## Privacy

- **No data collection** - All data stays on your server
- **Local processing** - Content processed locally
- **Secure communication** - HTTPS only in production
- **User control** - You own your data

## Keyboard Shortcuts

- `Alt+S` - Save current page
- `Alt+F` - Open search sidebar
- `Alt+Q` - Quick AI question
- `Esc` - Close sidebar

## Troubleshooting

### Extension not working?

1. Check backend is running
2. Verify URL in options
3. Check browser console for errors
4. Reload extension

### No results in search?

1. Ensure content is captured
2. Wait for indexing (few seconds)
3. Try different search terms
4. Check backend logs

### Sidebar not appearing?

1. Check for conflicts with other extensions
2. Verify permissions granted
3. Try reloading the page
4. Check z-index conflicts

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes
4. Test thoroughly
5. Submit pull request

## License

MIT License - See LICENSE file

## Support

- **Issues**: GitHub Issues
- **Docs**: https://docs.widgetdc.com
- **Discord**: https://discord.gg/widgetdc

---

**Made with ❤️ by the WidgeTDC Team**
