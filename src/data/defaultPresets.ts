import {
  ChecklistItem,
  ClientEntity,
  LlmModelId,
  LlmModelOption,
  NewsSourceInput,
  SampleScenarioPreset,
} from '../types/legal';

export const DEFAULT_MODEL_ID: LlmModelId = 'anthropic/claude-sonnet-5.5';

export const LLM_MODELS: LlmModelOption[] = [
  {
    id: 'anthropic/claude-sonnet-5.5',
    provider: 'Anthropic',
    label: 'Claude Sonnet 5.5',
    ruoloConsigliato: 'Ragionamento giuridico e precisione normativa',
  },
  {
    id: 'openai/gpt-6.1-terra',
    provider: 'OpenAI',
    label: 'GPT-6.1 Terra',
    ruoloConsigliato: 'Sintesi strategica e struttura operativa',
  },
  {
    id: 'google/gemini-4-hydrogen',
    provider: 'Google',
    label: 'Gemini 4 Hydrogen',
    ruoloConsigliato: 'Contesto esteso e analisi documenti lunghi',
  },
  {
    id: 'deepseek/deepseek-v4-pro',
    provider: 'DeepSeek',
    label: 'DeepSeek V4 Pro',
    ruoloConsigliato: 'Analisi logica e qualificazione dei rischi',
  },
  {
    id: 'mistralai/mistral-large-4-0',
    provider: 'Mistral AI',
    label: 'Mistral Large 4.0',
    ruoloConsigliato: 'Modello europeo · Diritto UE e italiano',
  },
  {
    id: 'meta-llama/llama-4-maverick',
    provider: 'Meta',
    label: 'Llama 4 Maverick',
    ruoloConsigliato: 'Open-weight rapido per alerting multi-cliente',
  },
];

export const SAMPLE_SCENARIO_PRESETS: SampleScenarioPreset[] = [
  {
    id: 'lavoro-trasparenza-retributiva',
    materia: 'Diritto del Lavoro',
    label: 'Lavoro · Trasparenza retributiva',
    titolo: 'Direttiva (UE) 2023/970 e Decreto di recepimento sulla Trasparenza Retributiva',
    descrizioneBreve:
      'Obblighi pre-assuntivi, diritto di informazione dei lavoratori, divieto di clausole di segretezza salariale e reporting sul divario retributivo.',
    testoEstratto: `DISPOSIZIONI IN MATERIA DI PARITÀ E TRASPARENZA RETRIBUTIVA (Recepimento Direttiva UE 2023/970)

AMBITO DI APPLICAZIONE
Si applica a tutti i datori di lavoro del settore pubblico e privato, con obblighi graduati in base alla soglia dimensionale (sotto 100, tra 100 e 249, pari o superiori a 250 dipendenti).

PRINCIPALI PRECETTI
- Art. 5 (Trasparenza pre-assuntiva): I datori di lavoro DEVONO indicare negli annunci di lavoro o prima del colloquio il livello retributivo iniziale o la relativa fascia, basati su criteri oggettivi e neutri sotto il profilo del genere. NON POSSONO chiedere ai candidati informazioni sulle retribuzioni percepite nei precedenti rapporti di lavoro.
- Art. 7 (Diritto di informazione e divieto di riservatezza salariale): I lavoratori HANNO DIRITTO di richiedere per iscritto informazioni sul proprio livello retributivo individuale e sui livelli medi per categorie che svolgono lavoro di pari valore. È VIETATO inserire nei contratti individuali clausole che impediscano ai dipendenti di divulgare la propria retribuzione ai fini dell'attuazione del principio di parità.
- Art. 9 (Obblighi di rendicontazione / Reporting): I datori di lavoro con almeno 100 dipendenti DEVONO trasmettere periodicamente all'autorità nazionale i dati sul divario retributivo di genere (gender pay gap), con cadenza annuale oltre i 250 dipendenti e triennale tra 100 e 249 dipendenti.
- Art. 10 (Valutazione congiunta): Se dal reporting emerge una differenza retributiva media superiore al 5% non giustificata da criteri oggettivi e non corretta entro 6 mesi, il datore di lavoro DEVE condurre una valutazione congiunta con i rappresentanti dei lavoratori.
- Art. 18 e 23 (Onere della prova e sanzioni): In caso di inosservanza degli obblighi di trasparenza, spetta al datore di lavoro dimostrare l'assenza di discriminazione retributiva; sono previste sanzioni amministrative pecuniarie e risarcimento integrale senza massimali.`,
    riferimentiIntegrali: `Quadro normativo collegato:
- Direttiva (UE) 2023/970 del 10 maggio 2023 (termine di recepimento nazionale: 7 giugno 2026).
- D.Lgs. 11 aprile 2006, n. 198 (Codice delle pari opportunità tra uomo e donna).
- Art. 37 Costituzione e Statuto dei Lavoratori (L. 300/1970).`,
  },
  {
    id: 'appalti-correttivo-codice',
    materia: 'Contratti Pubblici & Appalti',
    label: 'Appalti · Correttivo D.Lgs. 209/2024',
    titolo: 'Correttivo al Codice dei Contratti Pubblici (D.Lgs. 209/2024 su D.Lgs. 36/2023)',
    descrizioneBreve:
      'Novità su revisione prezzi, equo compenso, tutele lavoristiche nei subappalti, qualificazione stazioni appaltanti ed esecuzione.',
    testoEstratto: `DISPOSIZIONI INTEGRATIVE E CORRETTIVE AL CODICE DEI CONTRATTI PUBBLICI (D.Lgs. 31 dicembre 2024, n. 209)

AMBITO SOGGETTIVO
Si applica alle stazioni appaltanti, agli enti concedenti e agli operatori economici (appaltatori, subappaltatori, progettisti) che partecipano a procedure di affidamento o eseguono contratti pubblici.

PRINCIPALI DISPOSIZIONI OPERATIVE
- Art. 60 e Allegato II.2-bis (Revisione prezzi): Nei bandi e negli avvisi di gara DEVE essere inserita la clausola di revisione prezzi con distinzione tra lavori (soglia di attivazione 3% con riconoscimento al 90% dell'eccedenza) e servizi/forniture (soglia 5% con riconoscimento all'80%).
- Art. 11 (Applicazione CCNL e tutele): Le stazioni appaltanti DEVONO indicare il CCNL applicabile nel bando; l'operatore economico che applica un diverso CCNL DEVE presentare dichiarazione di equivalenza delle tutele economiche e normative prima dell'aggiudicazione.
- Art. 119 (Subappalto e PMI): Nei contratti di subappalto, una quota pari almeno al 20% delle prestazioni subappaltabili DEVE essere riservata a piccole e medie imprese (PMI), salvo motivata impossibilità tecnica. Nei subappalti si applicano i medesimi meccanismi di revisione prezzi del contratto principale.
- Art. 41 c. 15-bis (Equo compenso servizi di ingegneria e architettura): Per i servizi tecnici sopra determinate soglie, la componente economica PUÒ essere oggetto di ribasso solo entro il limite del 35% sul 20% dell'importo complessivo a base di gara.
- Art. 126 (Premi e penali): Le penali giornaliere da ritardo DEVONO essere comprese tra lo 0,5 per mille e l'1,5 per mille dell'ammontare netto contrattuale; facoltà per le stazioni appaltanti di prevedere premi di accelerazione.`,
    riferimentiIntegrali: `Quadro normativo collegato:
- D.Lgs. 31 marzo 2023, n. 36 (Codice dei contratti pubblici) come modificato dal D.Lgs. 209/2024.
- L. 21 aprile 2023, n. 49 (Equo compenso).
- Delibere e bandi-tipo ANAC.`,
  },
  {
    id: 'ambiente-imballaggi-ppwr',
    materia: 'Ambiente, ESG & Supply Chain',
    label: 'Ambiente · Regolamento Imballaggi (PPWR)',
    titolo: 'Regolamento (UE) 2025/40 sugli imballaggi e i rifiuti di imballaggio (PPWR)',
    descrizioneBreve:
      'Nuovi requisiti di riciclabilità, riduzione degli imballaggi superflui, etichettatura armonizzata e obblighi per produttori, importatori e utilizzatori.',
    testoEstratto: `REGOLAMENTO (UE) 2025/40 SUGLI IMBALLAGGI E I RIFIUTI DI IMBALLAGGIO (PPWR)

AMBITO SOGGETTIVO
Si applica a tutti gli imballaggi immessi sul mercato UE e coinvolge fabbricanti, importatori, distributori, operatori di confezionamento e utilizzatori finali commerciali (inclusi e-commerce e Ho.Re.Ca.).

PRINCIPALI PRECETTI E SCADENZE
- Art. 5 e 6 (Sostanze e riciclabilità): Tutti gli imballaggi immessi sul mercato DEVONO essere progettati per il riciclo entro il 2030 secondo gradi di prestazione (A, B, C); restrizioni rigorose su PFAS negli imballaggi a contatto alimentare dal 12 agosto 2026.
- Art. 24 (Rapporto di spazio vuoto): Gli operatori che imballano prodotti per la vendita online o il trasporto DEVONO garantire che il rapporto di spazio vuoto negli imballaggi multipli o da trasporto non superi il 50%.
- Art. 12 (Etichettatura armonizzata UE): Gli imballaggi DOVRANNO recare un'etichetta armonizzata sulla composizione dei materiali per facilitare la raccolta differenziata, superando i soli regimi nazionali.
- Art. 14 e 15 (Dichiarazione di conformità e documentazione tecnica): Il fabbricante o l'importatore DEVE redigere la documentazione tecnica e la dichiarazione di conformità UE prima dell'immissione sul mercato.
- Art. 25 e Allegato V (Divieti su monouso): Divieti progressivi dal 2030 su specifici imballaggi monouso per frutta/verdura fresca sotto 1,5 kg, monoporzioni alberghiere e ristorazione in loco.`,
    riferimentiIntegrali: `Quadro normativo collegato:
- Regolamento (UE) 2025/40 del Parlamento europeo e del Consiglio (in vigore dall'11 febbraio 2025, applicazione generale dal 12 agosto 2026).
- D.Lgs. 3 aprile 2006, n. 152 (Testo Unico Ambientale) e linee guida CONAI.`,
  },
];

export const DEFAULT_NEWS_INPUT: NewsSourceInput = {
  mode: 'web_search',
  presetId: SAMPLE_SCENARIO_PRESETS[0].id,
  titolo: '',
  testoEstratto: '',
  riferimentiIntegrali: '',
  queryRicerca: '',
};

export const DEFAULT_CLIENTS: ClientEntity[] = [
  {
    id: 'manifattura-valseriana',
    nome: 'Manifattura Valseriana S.p.A.',
    tipologia: 'Gruppo Industriale / Manifatturiero',
    settoreEAttivita:
      'Produzione componenti meccaniche e imballaggi industriali · 145 dipendenti · Vendita B2B in Italia e UE, fornitore anche per commesse pubbliche.',
    strutturaOrganizzativa:
      'Consiglio di Amministrazione, Collegio Sindacale, Organismo di Vigilanza 231, Direzione HR & Sicurezza (HSE) e Ufficio Acquisti/Contratti.',
    processiEContestoRilevante:
      'Gestione diretta di turni di fabbrica con CCNL Metalmeccanico, appalti di logistica esternalizzati, contratti di fornitura continuativa e spedizioni su pallet.',
    statoComplianceEPolicy:
      'Modello 231 aggiornato nel 2024; policy retributive e regolamenti interni HR non ancora revisionati alle nuove direttive UE; contratti fornitori con clausole standard.',
    destinatarioAlert: 'Amministratore Delegato e Direzione HR / Legal',
    attivo: true,
  },
  {
    id: 'comune-montefiore',
    nome: 'Comune di Montefiore',
    tipologia: 'Ente Pubblico / PA',
    settoreEAttivita:
      'Ente locale · 18.000 abitanti · Gestione servizi pubblici locali, manutenzioni stradali, gare d’appalto PNRR e personale dipendente (95 dipendenti).',
    strutturaOrganizzativa:
      'Segretario Generale, Responsabile Area Tecnica/Gare, Responsabile Ragioneria e Tributi, RSU interna.',
    processiEContestoRilevante:
      'Stazione appaltante attiva su bandi di lavori e servizi di refezione/trasporto scolastico; gestione concorsi pubblici e progressioni del personale.',
    statoComplianceEPolicy:
      'Regolamento contratti fermo al 2023; bandi-tipo in fase di aggiornamento; nessun audit recente su equivalenza CCNL negli appalti di servizi.',
    destinatarioAlert: 'Segretario Generale e Responsabile Ufficio Gare',
    attivo: true,
  },
];

export const CLIENT_PRESET_TEMPLATES: Omit<ClientEntity, 'id' | 'attivo'>[] = [
  {
    nome: 'Studio Medico San Marco S.r.l.',
    tipologia: 'Ente Sanitario / Terzo Settore',
    settoreEAttivita:
      'Poliambulatorio privato accreditato SSN · 48 dipendenti e collaboratori libero-professionisti.',
    strutturaOrganizzativa:
      'Amministratore Unico, Direttore Sanitario, DPO esterno, Responsabile Amministrativo.',
    processiEContestoRilevante:
      'Trattamento dati sanitari dei pazienti, contratti di collaborazione medica (P.IVA vs subordinazione), convenzioni assicurative e smaltimento rifiuti sanitari.',
    statoComplianceEPolicy:
      'Registro trattamenti GDPR aggiornato; protocolli sicurezza sul lavoro in revisione semestrale; contrattualistica medici datata.',
    destinatarioAlert: 'Direttore Sanitario e Amministratore Unico',
  },
  {
    nome: 'Nordic Retail & E-Commerce S.r.l.',
    tipologia: 'Impresa / Società',
    settoreEAttivita:
      'Commercio al dettaglio omnicanale e vendite online B2C/B2B · 85 dipendenti · Fatturato 24M€.',
    strutturaOrganizzativa:
      'Amministratore Delegato, Direzione Operations & Logistica, Marketing/E-commerce, Commercialista esterno.',
    processiEContestoRilevante:
      'Spedizioni giornaliere con imballaggi in cartone e plastica, campagne promozionali al consumo, resi e garanzie legali, gestione personale di magazzino e punti vendita.',
    statoComplianceEPolicy:
      'Condizioni generali di vendita aggiornate al Codice del Consumo 2023; nessuna verifica recente sui nuovi requisiti UE sugli imballaggi e claim ambientali.',
    destinatarioAlert: 'CEO e Responsabile Operations & Legal',
  },
  {
    nome: 'Banca Territoriale Cooperativa S.p.A.',
    tipologia: 'Banca / Intermediario / Fintech',
    settoreEAttivita:
      'Intermediario creditizio regionale · 310 dipendenti · Erogazione mutui, credito alle PMI e servizi di investimento.',
    strutturaOrganizzativa:
      'Direzione Generale, Funzione Compliance & AML, Risk Management, Ufficio Legale interno.',
    processiEContestoRilevante:
      'Contrattualistica bancaria trasparente, istruttoria fidi PMI, segnalazioni di vigilanza, esternalizzazione servizi IT e gestione contenzioso creditizio.',
    statoComplianceEPolicy:
      'Policy AML e trasparenza bancaria monitorate trimestralmente; comitato ESG attivo per la valutazione dei rischi di portafoglio.',
    destinatarioAlert: 'Direzione Generale e Chief Compliance Officer',
  },
];

export const INITIAL_CHECKLIST: ChecklistItem[] = [
  {
    id: 'chk-1',
    label: 'La pipeline intercetta la novità e ne individua materia ed estremi',
    criterio:
      'Passaggio 1 · Materia giuridica, autorità, decorrenza, ambito soggettivo e distinzione tra obblighi, indirizzi e facoltà',
    checked: false,
    autoVerified: true,
  },
  {
    id: 'chk-2',
    label: 'La valutazione d’impatto è pertinente rispetto a ciascun cliente attivo',
    criterio:
      'Passaggio 2 · Analisi distinta per profilo, applicabilità reale (o eventuale non applicabilità motivata) e gap concreti',
    checked: false,
    autoVerified: true,
  },
  {
    id: 'chk-3',
    label: 'La risposta chiarisce «Cosa cambia lunedì mattina?»',
    criterio:
      'Requisito operativo · Scadenze, priorità e azioni immediate per lo Studio e per ciascun cliente',
    checked: false,
    autoVerified: true,
  },
  {
    id: 'chk-4',
    label: 'La Nota Tecnica Interna è completa per i colleghi dello Studio',
    criterio:
      'Passaggio 3A · Riferimenti normativi/giurisprudenziali puntuali, analisi per fascicolo e piano d’azione interno',
    checked: false,
    autoVerified: true,
  },
  {
    id: 'chk-5',
    label: 'Gli Alert per i clienti sono in linguaggio chiaro e privi di gergo',
    criterio:
      'Passaggio 3B · Comunicazioni separate leggibili da imprenditori, dirigenti o amministratori senza tecnicismi inutili',
    checked: false,
    autoVerified: true,
  },
];
