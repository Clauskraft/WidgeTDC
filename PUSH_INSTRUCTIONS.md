# INSTRUKTIONER: PUSH TIL GITHUB

## ✅ STATUS
- Alle lokale skridt gennemført
- 2 commits klar til push
- Build tests bestået
- Push venter på autentificering

## 🚀 HVORDAN PUSHER DU?

### Option 1: Push direkte (hvis du har credentials sat op)
```bash
cd /workspaces/WidgeTDC
git push origin main
```

Hvis det spørger om brugernavn/password:
- **Brugernavn:** Din GitHub brugernavn
- **Password:** Brug en **Personal Access Token** (ikke dit password!)

### Option 2: Opret Personal Access Token (ANBEFALET)

1. **Gå til GitHub:**
   - https://github.com/settings/tokens
   - Eller: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)

2. **Opret ny token:**
   - Klik "Generate new token (classic)"
   - Navn: f.eks. "WidgeTDC Push"
   - Vælg scope: **repo** (fuld kontrol)
   - Klik "Generate token"
   - **KOPIER TOKENEN** (du ser den kun én gang!)

3. **Brug token ved push:**
   ```bash
   cd /workspaces/WidgeTDC
   git push origin main
   # Brugernavn: dit GitHub brugernavn
   # Password: indsæt tokenen (ikke dit password!)
   ```

### Option 3: Gem token permanent

```bash
cd /workspaces/WidgeTDC
git remote set-url origin https://TOKEN@github.com/Clauskraft/WidgeTDC.git
# Erstat TOKEN med din token
git push origin main
```

**⚠️ ADVARSEL:** Dette gemmer tokenen i git config. Slet den efter brug:
```bash
git remote set-url origin https://github.com/Clauskraft/WidgeTDC.git
```

### Option 4: Brug GitHub CLI (hvis installeret)

```bash
gh auth login
gh repo sync
```

## 📋 COMMITS DER SKAL PUSHES

1. `90ede41` - chore: format codebase with prettier/eslint
2. `ff17b37` - NN

## ✅ VERIFICER EFTER PUSH

```bash
git status
# Skal vise: "Your branch is up to date with 'origin/main'"
```

## 🔄 HVIS NOGET GÅR GALT

### Rollback (før push):
```bash
git reset --soft HEAD~1  # Behold ændringer staged
git reset HEAD~1          # Behold ændringer unstaged
```

### Se status:
```bash
git log origin/main..HEAD --oneline
git status
```

## 💡 TIP

Den nemmeste metode er **Option 2** - opret en Personal Access Token og brug den ved push.

---

**Næste skridt:** Vælg en metode ovenfor og push commits til GitHub! 🚀

