# 🚀 NEM PUSH TIL GITHUB

## Hurtig Start

### Linux/Mac/WSL:
```bash
./push-to-github.sh
```

### Windows:
```cmd
push-to-github.bat
```

## Hvad gør scriptet?

1. ✅ Tjekker om der er commits at pushe
2. 🔄 Prøver at pushe automatisk
3. 📋 Giver instruktioner hvis autentificering mangler

## Hvis push fejler (første gang)

### Opret Personal Access Token:

1. Gå til: https://github.com/settings/tokens
2. Klik "Generate new token (classic)"
3. Navn: "WidgeTDC Push"
4. Vælg scope: **repo** (fuld kontrol)
5. Klik "Generate token"
6. **KOPIER TOKENEN** (du ser den kun én gang!)

### Brug tokenen:

**Option A: Kør script igen og indtast token når det beder om password**
```bash
./push-to-github.sh
# Brugernavn: dit GitHub brugernavn
# Password: indsæt tokenen
```

**Option B: Brug environment variabel (nemmest!)**
```bash
# Linux/Mac/WSL:
export GITHUB_TOKEN='din_token_her'
./push-to-github.sh

# Windows:
set GITHUB_TOKEN=din_token_her
push-to-github.bat
```

## Eksempel

```bash
# 1. Opret token på GitHub (se link ovenfor)

# 2. Sæt token:
export GITHUB_TOKEN='ghp_xxxxxxxxxxxxxxxxxxxx'

# 3. Kør script:
./push-to-github.sh

# ✅ Done! Commits er pushet!
```

## Fejlfinding

**"Permission denied"**
- Tjek at tokenen har 'repo' scope
- Opret ny token hvis nødvendigt

**"Could not read Username"**
- Brug environment variabel metode (Option B)
- Eller push manuelt: `git push origin main`

**"No commits to push"**
- Alt er allerede pushet! ✅

---

**Tip:** Gem tokenen sikkert - du kan genbruge den til fremtidige pushes!

