# 🛡️ Frontend Sovereignty: Analyse & Nyt Design

## 1. Analyse af Nuværende Situation

### Problemet
Vi har oplevet en "fragile frontend" situation:
1.  **Port Konflikter:** Frontend har kørt på port 8888, som var optaget af en anden applikation ("DOT"), hvilket førte til at Electron viste forkert indhold.
2.  **Afhængigheds-Kaos:** Electron appen er for tæt koblet til udviklingsserveren (`localhost`). Hvis dev-serveren fejler eller porten skifter, dør desktop appen.
3.  **Manglende Robusthed:** WidgetBoardet (selve hjertet af applikationen) er afhængig af at en masse eksterne services (backend, DB, dev-server) "står rigtigt" for overhovedet at vise noget.
4.  **State Usikkerhed:** Widgets forsvinder eller vises forkert fordi `localStorage` og state management (`zustand`) ikke er synkroniseret robust nok med backendens forventninger.

### Konklusion
Nuværende arkitektur behandler frontend som en "slave" af backend/dev-miljøet. **Dette skal vendes om.** Frontend skal være "Sovereign" (suveræn) - den skal altid kunne starte, vise UI, og håndtere fejl yndefuldt, selv hvis resten af verden brænder.

---

## 2. Nyt Design: "Frontend First" Arkitektur

### Grundprincip: "The UI Never Dies"
Frontend skal være en selvstændig, robust enhed der *aldrig* viser en hvid skærm eller en anden apps indhold.

### A. Robust Boot-Up Process (The "Safe Mode")
Frontend skal have en indbygget "Safe Mode".
1.  **Init:** App starter.
2.  **Check:** Kan vi nå backend? Er config valid?
3.  **Failure Handling:** Hvis nej -> Vis "Offline Dashboard" med cachede data. Vis ALDRIG ingenting.
4.  **Self-Healing:** Hvis widgets mangler (som vi så), skal appen automatisk gendanne et standard-layout (allerede implementeret som "Rescue Mode", men skal formaliseres).

### B. Electron som "Garant" (The "Container")
Electron skal ikke bare være et vindue til `localhost`.
1.  **Production First:** I production skal Electron *altid* servere statiske filer fra disken, ikke via HTTP. Dette eliminerer port-konflikter fuldstændigt.
2.  **Embedded Server:** Electron skal selv kunne agere mini-server for frontend hvis nødvendigt, så vi ikke er afhængige af `npm run dev`.

### C. Widget "Survival" Strategy
Widgets er appens livsblod.
1.  **Local First:** Widget konfigurationer gemmes *altid* lokalt først (IndexedDB/LocalStorage). Backend er kun til synkronisering.
2.  **Default Fallback:** Hvis en widget fejler (crasher), skal den erstattes af en "Error Widget" der viser fejlen, i stedet for at crashe hele boardet.
3.  **Registry Validation:** Ved opstart valideres alle gemte widgets mod `WidgetRegistry`. Ukendte widgets (fra gamle versioner) deaktiveres pænt i stedet for at ødelægge layoutet.

---

## 3. Implementeringsplan

### Fase 1: Stabilisering (NU)
- [x] **Port Standardisering:** Alt flyttes til port 5173. Port 8888 er bandlyst.
- [x] **Rescue Mode:** Automatisk gendannelse af widgets ved tomt board.
- [ ] **Hardened Electron Boot:** Electron skal tjekke om port 5173 faktisk svarer *før* den loader URL'en, og ellers vise en pæn "Starting Server..." skærm.

### Fase 2: Robusthed (Næste uge)
- [ ] **Error Boundaries:** Pak hver widget ind i en React Error Boundary.
- [ ] **Offline Mode:** Implementer basal offline funktionalitet for kerne-widgets.

### Fase 3: Sovereignty (Fremtid)
- [ ] **Static Build Distribution:** Electron pakkes *kun* med statisk build. Dev-mode bliver en eksplicit "udvikler-feature", ikke standard.

Dette design sikrer, at **Frontend er Kongen**. Backend og infrastruktur er blot tjenere der leverer data.
