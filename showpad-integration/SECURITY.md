# Security Guide - TDC Showpad Integration

**KRITISK: Sikker håndtering af Showpad credentials**

## 🔐 Security Overview

TDC Showpad credentials giver adgang til:
- ✅ Alle TDC brand assets
- ✅ Interne templates
- ✅ Confidential brand guidelines
- ✅ Licensed images og content

**DERFOR:** Credentials SKAL håndteres med maksimal sikkerhed.

---

## 🚨 Critical Security Rules

### ❌ ALDRIG GØR DETTE:

```typescript
// ❌ FARLIGT: Hardcoded credentials
const password = 'Solhøjsvej_45'; // ALDRIG!

// ❌ FARLIGT: Credentials i source code
const config = {
  username: 'clauskraft@gmail.com',
  password: 'Solhøjsvej_45'
};

// ❌ FARLIGT: Commit til git
git add .env.showpad
git commit -m "Added Showpad credentials" // ALDRIG!

// ❌ FARLIGT: Log credentials
console.log('Password:', password);
```

### ✅ ALTID GØR DETTE:

```typescript
// ✅ SIKKERT: Environment variables
const password = process.env.SHOWPAD_PASSWORD;

// ✅ SIKKERT: Encrypted storage
const password = await vault.getSecret('SHOWPAD_PASSWORD');

// ✅ SIKKERT: .gitignore configured
// .env.showpad er ALDRIG tracked

// ✅ SIKKERT: Masked logging
logger.info('Auth successful', { username: '***', password: '***' });
```

---

## 📁 Credential Storage

### Method 1: Environment Variables (Development)

**File:** `.env.showpad` (NEVER committed)

```env
# TDC Showpad Credentials
SHOWPAD_SUBDOMAIN=tdcerhverv
SHOWPAD_USERNAME=clauskraft@gmail.com
SHOWPAD_PASSWORD=Solhøjsvej_45

# OAuth (if configured)
SHOWPAD_CLIENT_ID=your_client_id_here
SHOWPAD_CLIENT_SECRET=your_client_secret_here

# API Configuration
SHOWPAD_API_VERSION=v4
SHOWPAD_BASE_URL=https://tdcerhverv.showpad.biz
```

**Setup:**
```powershell
# Copy template
cp .env.showpad.template .env.showpad

# Edit with secure editor (ikke notepad)
code .env.showpad

# Set restrictive permissions
icacls .env.showpad /inheritance:r /grant:r "$env:USERNAME:(R)"
```

### Method 2: Encrypted Vault (Production)

**Anbefalet for production:**

```typescript
// backend/services/credential-vault.ts
import { encryptAES256, decryptAES256 } from './crypto';

class CredentialVault {
  private masterKey: string;
  
  constructor() {
    // Master key fra secure key management
    this.masterKey = process.env.VAULT_MASTER_KEY!;
  }

  async storeCredential(key: string, value: string): Promise<void> {
    const encrypted = encryptAES256(value, this.masterKey);
    await db.query(
      'INSERT INTO encrypted_credentials (key, value) VALUES ($1, $2)',
      [key, encrypted]
    );
  }

  async getCredential(key: string): Promise<string> {
    const result = await db.query(
      'SELECT value FROM encrypted_credentials WHERE key = $1',
      [key]
    );
    return decryptAES256(result.rows[0].value, this.masterKey);
  }
}

// Usage
const vault = new CredentialVault();
const password = await vault.getCredential('SHOWPAD_PASSWORD');
```

### Method 3: Azure Key Vault (Enterprise)

```typescript
import { SecretClient } from '@azure/keyvault-secrets';

const client = new SecretClient(
  process.env.AZURE_KEYVAULT_URL!,
  new DefaultAzureCredential()
);

const secret = await client.getSecret('showpad-password');
const password = secret.value;
```

---

## 🔒 OAuth 2.0 Setup (Anbefalet)

**Fordele:**
- ✅ Ingen passwords i config
- ✅ Token rotation
- ✅ Granular permissions (scopes)
- ✅ Revokable access

### Step 1: Create OAuth Client in Showpad

1. Log ind på https://tdcerhverv.showpad.biz
2. Gå til **Admin Settings → Integrations → API**
3. Klik **"Manage OAuth Clients"**
4. Klik **"+ Add Client"**

**Configuration:**
```
Name: WidgeTDC PPT Integration
Redirect URL: http://localhost:3000/auth/showpad/callback
Description: AI-powered presentation generation
Website: https://widgetdc.example.com
Scopes:
  - read_content
  - read_user_management
  - read_division_management
```

5. **IMPORTANT:** Copy Client ID og Client Secret
6. Store i `.env.showpad`:

```env
SHOWPAD_CLIENT_ID=abc123xyz...
SHOWPAD_CLIENT_SECRET=def456uvw...
```

### Step 2: Implement OAuth Flow

```typescript
// backend/services/showpad-oauth.ts
export class ShowpadOAuth {
  private clientId: string;
  private clientSecret: string;
  private redirectUri: string;

  async getAuthorizationUrl(): Promise<string> {
    const params = new URLSearchParams({
      client_id: this.clientId,
      redirect_uri: this.redirectUri,
      response_type: 'code',
      scope: 'read_content read_user_management'
    });
    
    return `https://${subdomain}.showpad.biz/api/v3/oauth2/authorize?${params}`;
  }

  async exchangeCodeForToken(code: string): Promise<TokenResponse> {
    const response = await fetch(
      `https://${subdomain}.showpad.biz/api/v3/oauth2/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(
            `${this.clientId}:${this.clientSecret}`
          ).toString('base64')
        },
        body: new URLSearchParams({
          grant_type: 'authorization_code',
          code,
          redirect_uri: this.redirectUri
        })
      }
    );

    return response.json();
  }

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch(
      `https://${subdomain}.showpad.biz/api/v3/oauth2/token`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': 'Basic ' + Buffer.from(
            `${this.clientId}:${this.clientSecret}`
          ).toString('base64')
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken
        })
      }
    );

    return response.json();
  }
}
```

---

## 🛡️ Security Best Practices

### 1. Access Control

```typescript
// Restrict Showpad access to authorized users
@RequireRole(['admin', 'powerpoint_generator'])
async getShowpadAssets(req: Request, res: Response) {
  // Only admins can access Showpad
}
```

### 2. Audit Logging

```typescript
// Log all Showpad API calls
logger.audit({
  action: 'showpad.asset.download',
  user: req.user.email,
  asset: assetId,
  timestamp: new Date(),
  ip: req.ip
});
```

### 3. Rate Limiting

```typescript
// Prevent credential brute force
const rateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many auth attempts'
});

app.use('/api/showpad/auth', rateLimiter);
```

### 4. Token Storage

```typescript
// ALDRIG store tokens i localStorage
// ❌ localStorage.setItem('showpad_token', token); // FARLIGT!

// ✅ Use httpOnly cookies
res.cookie('showpad_token', token, {
  httpOnly: true,
  secure: true, // HTTPS only
  sameSite: 'strict',
  maxAge: 3600000 // 1 hour
});
```

### 5. Credential Rotation

```bash
# Rotate passwords hver 90 dage
# Implementer reminder system:
```

```typescript
async function checkCredentialAge() {
  const lastRotation = await db.query(
    'SELECT created_at FROM credentials WHERE key = $1',
    ['SHOWPAD_PASSWORD']
  );
  
  const daysSinceRotation = 
    (Date.now() - lastRotation.rows[0].created_at) / (1000 * 60 * 60 * 24);
  
  if (daysSinceRotation > 90) {
    sendAlert({
      type: 'credential_rotation_needed',
      service: 'Showpad',
      days_old: daysSinceRotation
    });
  }
}
```

---

## 🚫 .gitignore Configuration

**CRITICAL:** Ensure these files are NEVER committed:

```gitignore
# .gitignore (project root)

# Showpad credentials
.env.showpad
.env.showpad.local
showpad-credentials.json

# OAuth tokens
showpad-tokens/
*.showpad-token

# Downloaded assets (can be regenerated)
cache/showpad/
showpad-integration/cache/

# Logs (may contain sensitive data)
logs/showpad-*.log
showpad-debug.log

# Backup files
*.env.showpad.backup
```

**Verify .gitignore works:**
```powershell
# Check what would be committed
git status

# Should NOT show .env.showpad
# If it does, run:
git rm --cached .env.showpad
git commit -m "Remove credentials from tracking"
```

---

## 🔍 Security Checklist

### Before Deployment:

- [ ] `.env.showpad` in `.gitignore`
- [ ] No hardcoded credentials in source
- [ ] OAuth client configured (production)
- [ ] Credentials encrypted in database
- [ ] Audit logging enabled
- [ ] Rate limiting configured
- [ ] HTTPS enforced for API calls
- [ ] Token auto-refresh implemented
- [ ] Access control configured
- [ ] Security scan passed

### Monitoring:

- [ ] Failed auth attempts logged
- [ ] Unusual API usage detected
- [ ] Token expiration alerts
- [ ] Credential rotation reminders
- [ ] Audit log review weekly

---

## 🆘 Credential Compromise Response

**If credentials are exposed:**

### Immediate Actions (Within 1 hour):

1. **Revoke Access**
   ```
   - Log ind på Showpad
   - Revoke OAuth client
   - Change password
   ```

2. **Rotate Credentials**
   ```powershell
   # Generate new credentials
   npm run showpad:rotate-credentials
   ```

3. **Review Audit Logs**
   ```sql
   SELECT * FROM audit_logs 
   WHERE service = 'showpad' 
   AND timestamp > NOW() - INTERVAL '24 hours'
   ORDER BY timestamp DESC;
   ```

4. **Notify Stakeholders**
   - TDC IT Security
   - WidgeTDC team
   - Affected users

### Investigation:

- Check git history: `git log --all --full-history -- "*env.showpad*"`
- Review all commits last 30 days
- Scan for credential leaks: `gitleaks detect`
- Check Docker logs for exposure

---

## 📚 Security Resources

### Tools:

- **gitleaks:** Scan for credential leaks
  ```bash
  gitleaks detect --source . --verbose
  ```

- **git-secrets:** Prevent credential commits
  ```bash
  git secrets --install
  git secrets --register-aws
  ```

- **truffleHog:** Find secrets in git history
  ```bash
  truffleHog git file://. --only-verified
  ```

### Documentation:

- [OWASP API Security Top 10](https://owasp.org/www-project-api-security/)
- [Showpad Security Best Practices](https://developer.showpad.com/docs/security)
- [Azure Key Vault Documentation](https://docs.microsoft.com/azure/key-vault/)

---

## 🤝 Team Responsibilities

### Developers:
- Never commit credentials
- Use environment variables
- Report suspected leaks immediately

### DevOps:
- Manage production credentials
- Monitor security alerts
- Perform credential rotation

### Security Team:
- Audit logs review
- Penetration testing
- Incident response

---

**Remember:** Security is everyone's responsibility! 🔐

**Questions?** Contact CLAK or TDC IT Security.
