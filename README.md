# LexPulse · Legal Intelligence Agent (Traccia 2 · Stragiudiziale)

Applicazione web full-stack realizzata per l’**Hackathon di Intelligenza Artificiale per Giuristi (Traccia 2 — Monitoraggio e alerting strategico)**.

Trasforma una novità normativa (come le *Linee Guida AgID per l’adozione di IA nella PA v1.0 del 9 novembre 2026*, una ricerca web live, un PDF caricato o un testo libero) in analisi giuridica strutturata e comunicazioni differenziate per studio legale e clienti.

---

## Architettura e Funzionalità Principali

1. **Passaggio 1 · Trigger & Classificazione**:
   - Avvio manuale tramite **`Cerca Novità`** o **`Avvia Pipeline Completa`**.
   - Estrae estremi dell’atto, autorità emittente, ambito soggettivo (art. 2 c. 2 CAD) e separa i precetti in **`DEVE`**, **`DOVREBBE`** e **`PUÒ`**.
2. **Passaggio 2 · Valutazione d’Impatto Multi-Cliente + Checkpoint Umano**:
   - Incrocia l’atto classificato con il **Portafoglio Clienti Configurabile** (precaricato con *Comune di Borgoalto* e *Agenzia regionale per il sostegno alle famiglie*, modificabile o espandibile con profili *Fornitore IT per la PA* e *Impresa Privata*).
   - Qualifica ruoli e rischi AI Act (es. Allegato III) / GDPR e risponde esplicitamente a **«Cosa cambia lunedì mattina?»**.
   - Include il box **Intervento del Professionista (Human-in-the-Loop)** per inserire rettifiche e rieseguire il Passaggio 2 o il Passaggio 3.
3. **Passaggio 3 · Deliverable Differenziati**:
   - **1 Nota Tecnica Interna** (per colleghi avvocati, con riferimenti normativi e piano d’azione operativo).
   - **Alert Clienti distinti** (1 per ogni cliente attivo, in linguaggio chiaro privo di gergo giuridico), modificabili inline ed esportabili in `.md` o PDF (stampa).
4. **Strumenti di Consegna Hackathon**:
   - **Schema Flusso in 1 Pagina** con diagramma vettoriale SVG interattivo ed esportabile (`.svg` / PDF).
   - **Checklist di Autovalutazione Traccia 2** ed **Export Dossier Completo (`.md` / PDF)**.
5. **Multi-modello via OpenRouter (6 LLM)**:
   - `anthropic/claude-sonnet-5.5` (Anthropic · Claude Sonnet 5.5)
   - `openai/gpt-6.1-terra` (OpenAI · GPT-6.1 Terra)
   - `google/gemini-4-hydrogen` (Google · Gemini 4 Hydrogen)
   - `deepseek/deepseek-v4-pro` (DeepSeek · DeepSeek V4 Pro)
   - `mistralai/mistral-large-4-0` (Mistral AI · Mistral Large 4.0)
   - `meta-llama/llama-4-maverick` (Meta · Llama 4 Maverick)

---

## Guida all’Installazione e Avvio su Windows (10 / 11)

### 1. Prerequisiti su Windows
1. Scarica e installa **Node.js LTS (versione 20 o 22)** dal sito ufficiale: [https://nodejs.org](https://nodejs.org) (l’installer include automaticamente `npm`).
2. Apri il **Prompt dei Comandi (`cmd`)** oppure **PowerShell** e verifica che Node.js e npm siano installati:
   ```cmd
   node -v
   npm -v
   ```

> **Nota per PowerShell su Windows:** se all’esecuzione di `npm` compare l’errore *"l’esecuzione di script è disabilitata nel sistema"*, utilizza il **Prompt dei Comandi (`cmd.exe`)** oppure esegui una sola volta in PowerShell:
> ```powershell
> Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
> ```

---

### 2. Configurazione del file `.env` (API Key OpenRouter)
Nella cartella principale del progetto è presente il file **`.env`** (già escluso da Git tramite `.gitignore` per proteggere le tue chiavi).

1. Apri il file `.env` con il Blocco Note, Notepad++ o Visual Studio Code.
2. Ottieni una chiave API su [https://openrouter.ai/keys](https://openrouter.ai/keys).
3. Sostituisci il segnaposto in `.env` con la tua chiave reale:

```env
OPENROUTER_API_KEY="sk-or-v1-LA_TUA_CHIAVE_OPENROUTER"
GEMINI_API_KEY=""
APP_URL="http://localhost:3000"
```

4. Salva il file `.env` (assicurati che non diventi `.env.txt` se usi il Blocco Note di Windows: in *Salva con nome* imposta *Salva come: Tutti i file (`*.*`)*).

*(Se il file `.env` non fosse presente, puoi crearlo da terminale copiando `.env.example`:)*
```cmd
copy .env.example .env
```

---

### 3. Installazione delle dipendenze e avvio locale
Spostati nella cartella del progetto dal terminale (es. `cd C:\percorso\lexpulse`) ed esegui:

```cmd
npm install
npm run dev
```

Quando compare nel terminale il messaggio:
```text
LexPulse server active at http://0.0.0.0:3000
```
apri il browser (Chrome, Edge o Firefox) all’indirizzo:
**[http://localhost:3000](http://localhost:3000)**

---

### 4. Altri comandi utili

| Comando | Descrizione |
| :--- | :--- |
| `npm run dev` | Avvia server Express + frontend Vite in locale sulla porta `3000` |
| `npm run lint` | Esegue il controllo statico dei tipi TypeScript (`tsc --noEmit`) |
| `npm run build` | Compila il bundle di produzione in `dist/` |
| `NODE_ENV=production npm start` | Avvia il server in modalità produzione (consigliato Node.js 22+) |

*(Su Windows in modalità produzione, usa `set NODE_ENV=production&& npm run dev` in `cmd` oppure imposta la variabile con `$env:NODE_ENV="production"` in PowerShell.)*

---

## Sicurezza e Note Operative
- **Chiavi API solo lato server**: il file `.env` viene letto esclusivamente dal backend Express (`server.ts`); nessuna chiave viene mai esposta nel browser o nell’interfaccia utente.
- **Non condividere il file `.env`** una volta inserita la tua chiave OpenRouter reale.
- I dati dei clienti precaricati sono **dati di fantasia a scopo dimostrativo** e tutti i deliverable generati richiedono la revisione del professionista prima dell’invio esterno.
