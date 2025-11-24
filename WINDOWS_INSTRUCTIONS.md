# 🪟 WINDOWS PUSH INSTRUKTIONER

## Din Sti
**Repository:** `C:\Users\claus\Projects\WidgeTDC\WidgeTDC`

## 🚀 Hurtig Push (3 metoder)

### Metode 1: Dobbeltklik script (NEMST!)
1. Gå til: `C:\Users\claus\Projects\WidgeTDC\WidgeTDC`
2. Dobbeltklik: `QUICK_PUSH.bat`
3. Hvis det beder om password: Brug din GitHub token

### Metode 2: Brug det fulde script
1. Dobbeltklik: `push-to-github-windows.bat`
2. Følg instruktionerne på skærmen

### Metode 3: Fra Command Prompt
```cmd
cd C:\Users\claus\Projects\WidgeTDC\WidgeTDC
git push origin main
```

## 🔑 Første Gang: Opret Token

1. Gå til: https://github.com/settings/tokens
2. Klik "Generate new token (classic)"
3. Navn: "WidgeTDC Push"
4. Vælg scope: **repo** (fuld kontrol)
5. Klik "Generate token"
6. **KOPIER TOKENEN**

### Brug tokenen:
Når git beder om password, indsæt **tokenen** (ikke dit password!)

## ✅ Eksempel

```cmd
C:\Users\claus\Projects\WidgeTDC\WidgeTDC> git push origin main
Username: clauskraft
Password: ghp_xxxxxxxxxxxxxxxxxxxx  <- Dette er din token!
```

## 📁 Scripts

- `QUICK_PUSH.bat` - Hurtig push (dobbeltklik)
- `push-to-github-windows.bat` - Fuld script med instruktioner

---

**Tip:** Gem tokenen sikkert - du kan genbruge den!
