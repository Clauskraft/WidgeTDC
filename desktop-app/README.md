# WidgeTDC Desktop App

Desktop application for WidgeTDC that can run locally while connecting to Railway backend.

## Features

- 🖥️ Native desktop application (Windows, Mac, Linux)
- 🔗 Connects to Railway backend
- ⚙️ Configurable backend URL
- 💾 Local settings storage
- 🎨 Native menus and shortcuts
- 📦 Portable executable

## Installation

### From Release (Recommended)

1. Download the latest release for your platform:
   - **Windows**: `WidgeTDC-Setup-1.0.0.exe` or `WidgeTDC-1.0.0-portable.exe`
   - **Mac**: `WidgeTDC-1.0.0.dmg`
   - **Linux**: `WidgeTDC-1.0.0.AppImage` or `widgetdc_1.0.0_amd64.deb`

2. Run the installer or portable executable

3. Configure backend URL in Settings (default: Railway production)

### From Source

```bash
# Install dependencies
cd desktop-app
npm install

# Development
npm start

# Build for your platform
npm run build

# Build for specific platform
npm run build:win   # Windows
npm run build:mac   # macOS
npm run build:linux # Linux
```

## Configuration

### Backend URL

The app connects to Railway by default. To change:

1. Open Settings (File → Settings)
2. Enter your backend URL:
   - Production: `https://your-app.railway.app`
   - Local: `http://localhost:3000`
3. Click Save and restart

### Settings Location

Settings are stored locally:
- **Windows**: `%APPDATA%\widgetdc-desktop\config.json`
- **Mac**: `~/Library/Application Support/widgetdc-desktop/config.json`
- **Linux**: `~/.config/widgetdc-desktop/config.json`

## Building

### Prerequisites

- Node.js 18+
- npm or yarn

### Build Commands

```bash
# Install dependencies
npm install

# Build for current platform
npm run build

# Build for Windows (creates installer + portable)
npm run build:win

# Build for macOS (creates DMG)
npm run build:mac

# Build for Linux (creates AppImage + DEB)
npm run build:linux
```

### Output

Built files are in `dist/`:
- Windows: `.exe` installer and portable
- macOS: `.dmg` disk image
- Linux: `.AppImage` and `.deb` package

## Usage

### First Run

1. Launch the application
2. The app will connect to the default Railway backend
3. If needed, configure custom backend URL in Settings

### Keyboard Shortcuts

- `Ctrl/Cmd + R` - Reload
- `Ctrl/Cmd + Shift + R` - Force reload
- `Ctrl/Cmd + Q` - Quit
- `F11` - Toggle fullscreen
- `Ctrl/Cmd + +/-` - Zoom in/out

### Menu Options

**File**
- Settings - Configure backend URL and preferences
- Exit - Close application

**View**
- Reload - Refresh the app
- Toggle DevTools - Open developer tools
- Zoom controls
- Fullscreen

**Help**
- Documentation - Open online docs
- About - Version information

## Development

### Project Structure

```
desktop-app/
├── main.js          # Electron main process
├── preload.js       # Preload script (IPC bridge)
├── package.json     # Dependencies and build config
├── assets/          # Icons and images
└── renderer/        # Frontend files (built from widget-board)
```

### Running in Development

```bash
# Terminal 1: Start Vite dev server
cd apps/widget-board
npm run dev

# Terminal 2: Start Electron
cd desktop-app
npm start
```

### Environment Variables

```bash
# Backend URL
BACKEND_URL=https://your-app.railway.app

# Node environment
NODE_ENV=development
```

## Deployment

### Automatic Builds

GitHub Actions can build for all platforms:

```yaml
# .github/workflows/build-desktop.yml
name: Build Desktop App
on: [push, pull_request]
jobs:
  build:
    runs-on: ${{ matrix.os }}
    strategy:
      matrix:
        os: [windows-latest, macos-latest, ubuntu-latest]
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: cd desktop-app && npm install
      - run: cd desktop-app && npm run build
      - uses: actions/upload-artifact@v3
        with:
          name: ${{ matrix.os }}-build
          path: desktop-app/dist/*
```

### Code Signing

For production releases:

**Windows:**
```bash
# Set certificate
export CSC_LINK=path/to/certificate.pfx
export CSC_KEY_PASSWORD=your_password
npm run build:win
```

**macOS:**
```bash
# Set Apple ID
export APPLE_ID=your@email.com
export APPLE_ID_PASSWORD=app-specific-password
npm run build:mac
```

## Troubleshooting

### App won't start

- Check if port 5173 is available (dev mode)
- Verify backend URL in settings
- Check logs in console

### Can't connect to backend

1. Verify backend URL is correct
2. Check if Railway app is running
3. Test URL in browser first
4. Check firewall settings

### Build fails

- Ensure all dependencies installed
- Check Node.js version (18+)
- Clear `node_modules` and reinstall
- Check disk space for build output

## Updates

The app can check for updates automatically:

1. New version released on GitHub
2. App checks on startup
3. User prompted to download
4. Auto-install on next launch

## Security

- No sensitive data stored locally
- All API calls to Railway backend
- Settings encrypted at rest
- HTTPS only for production

## License

MIT License - See LICENSE file

## Support

- **Issues**: GitHub Issues
- **Docs**: https://docs.widgetdc.com
- **Email**: support@widgetdc.com

---

**Built with Electron**  
**Version**: 1.0.0  
**Platform**: Windows, macOS, Linux
