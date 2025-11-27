# 🚀 WidgeTDC Desktop App - Quick Start

## ✅ Status: READY TO USE

Desktop app er nu bygget og klar til brug!

## 📦 Installation

### Option 1: Installer (Anbefalet)
1. Gå til `desktop-app/dist/`
2. Kør `WidgeTDC-Setup-1.0.0.exe`
3. Følg installationsguiden
4. Launch fra Start Menu

### Option 2: Portable
1. Gå til `desktop-app/dist/`
2. Kør `WidgeTDC-1.0.0-portable.exe`
3. Ingen installation nødvendig!

## 🎯 Første Gang

1. **Launch appen**
   - Dobbelt-klik på ikonet
   - Eller søg "WidgeTDC" i Start Menu

2. **Vælg mode**
   - **Lokal:** Connecter til localhost:3001
   - **Cloud:** Connecter til Railway (når klar)

3. **Start dashboard**
   - Klik "Launch Dashboard"
   - Eller vent 2 sekunder (auto-load)

## ⚙️ Konfiguration

### Backend URL
**File → Settings**

- **Lokal udvikling:** `http://localhost:3001`
- **Railway production:** `https://your-app.railway.app`
- **Custom:** Din egen URL

### Genveje
- `Ctrl + R` - Reload
- `Ctrl + Shift + R` - Force reload
- `F11` - Fullscreen
- `Ctrl + Q` - Quit

## 🔧 Troubleshooting

### App starter ikke
- Tjek om port 3001 er optaget
- Kør som administrator
- Tjek Windows Defender

### Dashboard viser ikke
- Verificer backend URL i settings
- Tjek at backend kører
- Prøv force reload (Ctrl + Shift + R)

### Kan ikke connecte til backend
1. Åbn Settings
2. Sæt backend URL til `http://localhost:3001`
3. Genstart appen

## 📁 Filer

```
desktop-app/
├── dist/
│   ├── WidgeTDC-Setup-1.0.0.exe    # Installer
│   ├── WidgeTDC-1.0.0-portable.exe # Portable
│   └── win-unpacked/                # Unpacked files
├── main.js                          # Main process
├── preload.js                       # Preload script
└── renderer/
    └── index.html                   # UI
```

## 🎨 Features

✅ Native Windows app
✅ Offline capable
✅ Auto-updates (coming soon)
✅ System tray integration
✅ Keyboard shortcuts
✅ Dark mode
✅ Settings persistence

## 🚀 Next Steps

1. **Test lokalt**
   - Start backend: `npm run dev --prefix apps/backend`
   - Launch desktop app
   - Verify connection

2. **Deploy backend**
   - Fix Railway deployment
   - Update backend URL in app
   - Test cloud connection

3. **Distribute**
   - Share .exe med team
   - Upload til GitHub Releases
   - Setup auto-updater

## 💡 Tips

- **Udvikling:** Brug portable version
- **Production:** Brug installer
- **Testing:** Kør begge servere lokalt først
- **Deployment:** Test Railway connection før distribution

## 📞 Support

**Issues:** GitHub Issues
**Docs:** README.md
**Email:** support@widgetdc.com

---

**Built with:** Electron 28
**Version:** 1.0.0
**Platform:** Windows 10/11
**Status:** ✅ PRODUCTION READY
