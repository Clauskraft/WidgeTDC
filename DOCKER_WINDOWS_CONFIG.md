# 🐳 Docker Windows Konfiguration - D:\dOCKER

**Dato:** 2025-01-27  
**Status:** Konfiguration for Docker Desktop på Windows med WSL2

---

## 📍 Nuværende Placering

Docker WSL2 data er flyttet til:
```
D:\dOCKER\wsl\DockerDesktopWSL\data\
```

---

## ⚙️ Konfiguration af Docker Desktop

### Metode 1: Docker Desktop Settings (Anbefalet)

1. **Åbn Docker Desktop**
2. Gå til **Settings** (⚙️ ikon)
3. Vælg **Resources** → **Advanced**
4. Under **Disk image location**, klik **Browse**
5. Vælg mappen: `D:\dOCKER`
6. Klik **Apply & Restart**

**Note:** Docker Desktop vil automatisk flytte data til den nye placering.

---

### Metode 2: WSL2 Distribution Flytning (Hvis Metode 1 ikke virker)

Hvis Docker Desktop ikke automatisk flytter data, kan du manuelt flytte WSL2 distributionen:

#### Step 1: Stop Docker Desktop og WSL

```powershell
# Stop Docker Desktop
wsl --shutdown

# Stop specifikke distributioner
wsl --terminate DockerDesktopWSL
wsl --terminate docker-desktop
wsl --terminate docker-desktop-data
```

#### Step 2: Eksporter WSL Distribution

```powershell
# Eksporter Docker Desktop data distribution
wsl --export docker-desktop-data D:\dOCKER\docker-desktop-data-backup.tar

# Eksporter Docker Desktop distribution
wsl --export docker-desktop D:\dOCKER\docker-desktop-backup.tar
```

#### Step 3: Fjern Gamle Distributioner

```powershell
# Fjern gamle distributioner (EFTER backup!)
wsl --unregister docker-desktop-data
wsl --unregister docker-desktop
```

#### Step 4: Importér til Ny Placering

```powershell
# Importér til ny placering
wsl --import docker-desktop-data D:\dOCKER\wsl\DockerDesktopWSL\data\data --version 2 D:\dOCKER\docker-desktop-data-backup.tar

wsl --import docker-desktop D:\dOCKER\wsl\DockerDesktopWSL\data\main --version 2 D:\dOCKER\docker-desktop-backup.tar
```

#### Step 5: Start Docker Desktop

Start Docker Desktop igen - den skulle nu bruge den nye placering.

---

## 🔧 WSL2 Konfiguration (.wslconfig)

Opret eller opdater `.wslconfig` filen i din bruger hjemmemappe (`C:\Users\claus\.wslconfig`):

```ini
[wsl2]
# Standard placering for WSL2 distributioner
# Docker Desktop bruger sin egen konfiguration, men dette kan hjælpe med generel WSL2 performance

# Memory limit (juster efter dit system)
memory=4GB

# CPU cores (juster efter dit system)
processors=2

# Swap file placering
swap=D:\\dOCKER\\wsl\\swap.vhdx

# Page reporting (bedre performance)
pageReporting=true

# Nested virtualization
nestedVirtualization=false

# VM idle timeout
vmIdleTimeout=60000
```

---

## 📦 Docker Compose Volumes

WidgeTDC's `docker-compose.yml` bruger **named volumes**, som automatisk bliver gemt i Docker's data directory. Disse volumes følger Docker Desktop's konfiguration.

### Nuværende Volumes i docker-compose.yml:

```yaml
volumes:
  neo4j_data:      # Gemmes i D:\dOCKER\wsl\DockerDesktopWSL\data\data\ext4.vhdx
  neo4j_logs:      # Gemmes i D:\dOCKER\wsl\DockerDesktopWSL\data\data\ext4.vhdx
  postgres_data:   # Gemmes i D:\dOCKER\wsl\DockerDesktopWSL\data\data\ext4.vhdx
  redis_data:      # Gemmes i D:\dOCKER\wsl\DockerDesktopWSL\data\data\ext4.vhdx
```

**Ingen ændringer nødvendige** - Docker håndterer volumes automatisk.

---

## 🔍 Verificering

### Tjek Docker Data Placering

```powershell
# Tjek WSL distributioner
wsl --list --verbose

# Tjek Docker Desktop indstillinger
# Docker Desktop → Settings → Resources → Advanced → Disk image location
```

### Tjek Docker Volumes

```powershell
# Liste alle Docker volumes
docker volume ls

# Inspect specifik volume
docker volume inspect widgetdc_neo4j_data
```

### Test Docker Compose

```powershell
# Start services
docker-compose up -d

# Tjek status
docker-compose ps

# Tjek logs
docker-compose logs -f
```

---

## 🚨 Troubleshooting

### Problem: Docker Desktop kan ikke finde data

**Løsning:**
1. Tjek at `D:\dOCKER\wsl\DockerDesktopWSL\data\` eksisterer
2. Tjek WSL distributioner: `wsl --list --verbose`
3. Prøv at genstarte Docker Desktop
4. Hvis nødvendigt, brug Metode 2 (manuel flytning)

### Problem: Volumes mangler data

**Løsning:**
1. Tjek om volumes eksisterer: `docker volume ls`
2. Hvis volumes er tomme, kan det være nødvendigt at gendanne fra backup
3. Eller start med nye volumes (data vil gå tabt)

### Problem: WSL2 fejl

**Løsning:**
```powershell
# Genstart WSL
wsl --shutdown
# Vent 10 sekunder
# Start Docker Desktop igen
```

---

## 📝 Noter

- **Backup:** Altid lav backup før flytning af Docker data
- **Plads:** Tjek at D:\ har nok plads (Docker kan bruge mange GB)
- **Performance:** D:\ skal være en hurtig disk (SSD anbefalet)
- **Permissions:** Sikr at Docker Desktop har læse/skrive adgang til D:\dOCKER

---

## ✅ Checklist

- [ ] Docker Desktop er stoppet
- [ ] Data er flyttet til D:\dOCKER
- [ ] Docker Desktop indstillinger er opdateret (Metode 1)
- [ ] ELLER WSL distributioner er flyttet (Metode 2)
- [ ] Docker Desktop starter korrekt
- [ ] `docker-compose up -d` virker
- [ ] Volumes kan tilgås
- [ ] Services kører (neo4j, postgres, redis)

---

**Opdateret:** 2025-01-27

