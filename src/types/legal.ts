export type LlmModelId =
  | 'anthropic/claude-sonnet-5.5'
  | 'openai/gpt-6.1-terra'
  | 'google/gemini-4-hydrogen'
  | 'deepseek/deepseek-v4-pro'
  | 'mistralai/mistral-large-4-0'
  | 'meta-llama/llama-4-maverick';

export interface LlmModelOption {
  id: LlmModelId;
  provider: string;
  label: string;
  ruoloConsigliato: string;
}

export type NewsSourceMode =
  | 'web_search'
  | 'upload_pdf'
  | 'custom_text'
  | 'preset_example';

export interface NewsSourceInput {
  mode: NewsSourceMode;
  presetId?: string;
  titolo: string;
  testoEstratto: string;
  riferimentiIntegrali?: string;
  queryRicerca?: string;
  fileBase64?: string;
  fileName?: string;
  mimeType?: string;
}

export interface SampleScenarioPreset {
  id: string;
  materia: string;
  label: string;
  titolo: string;
  descrizioneBreve: string;
  testoEstratto: string;
  riferimentiIntegrali?: string;
}

export type ClientType =
  | 'Impresa / Società'
  | 'Ente Pubblico / PA'
  | 'Gruppo Industriale / Manifatturiero'
  | 'Banca / Intermediario / Fintech'
  | 'Ente Sanitario / Terzo Settore'
  | 'Professionista / Associazione';

export interface ClientEntity {
  id: string;
  nome: string;
  tipologia: ClientType;
  settoreEAttivita: string;
  strutturaOrganizzativa: string;
  processiEContestoRilevante: string;
  statoComplianceEPolicy: string;
  destinatarioAlert: string;
  attivo: boolean;
}

export interface PrecettoEstratto {
  paragrafo: string;
  livelloVincolativita: 'OBBLIGO' | 'INDIRIZZO' | 'FACOLTÀ';
  sintesi: string;
  destinatario: string;
}

export interface WebSourceRef {
  title: string;
  uri: string;
}

export interface ClassificationResult {
  titoloAtto: string;
  materiaPrincipale: string;
  autorita: string;
  estremiAdozione: string;
  tipoAtto: string;
  dataPubblicazione: string;
  entrataInVigore: string;
  ambitoSoggettivo: string;
  quadroPrecettivo: {
    obblighi: string;
    indirizzi: string;
    facolta: string;
  };
  precettiEstratti: PrecettoEstratto[];
  riferimentiNormativiCollegati: string[];
  sintesiOggettiva: string;
  fontiWeb: WebSourceRef[];
  modelUsed?: string;
}

export interface ClientImpactItem {
  clientId: string;
  nomeCliente: string;
  livelloUrgenza: 'Critico' | 'Alto' | 'Medio' | 'Informativo' | 'Non Applicabile';
  inquadramentoApplicabilita: string;
  ruoloGiuridico: string;
  gapPrincipali: string[];
  adempimentiObbligatori: string[];
  opzioniEScelteStrategiche: string[];
  cosaCambiaLunediCliente: string;
  azioniImmediate: string[];
}

export interface PortfolioImpactEvaluation {
  sintesiImpattoStudio: string;
  livelloComplessivoRischio: 'Critico' | 'Alto' | 'Medio' | 'Informativo';
  cosaCambiaLunediStudio: string[];
  impattiPerCliente: ClientImpactItem[];
  noteProfessionista: string;
  modelUsed?: string;
}

export interface StudioActionItem {
  azione: string;
  clienteRiferimento: string;
  priorita: 'Immediata (Lunedì)' | 'Breve termine (7 gg)' | 'Pianificata (30 gg)';
  responsabileConsigliato: string;
}

export interface NotaTecnicaInterna {
  intestazione: string;
  data: string;
  oggetto: string;
  sintesiEsecutiva: string;
  inquadramentoNormativo: string;
  analisiDettagliataPerCliente: {
    nomeCliente: string;
    qualificazioneGiuridica: string;
    profiliDiRischio: string;
    adempimentiEDecorrenze: string;
  }[];
  cosaCambiaLunediMattinaStudio: string;
  pianoAzioneStudioLunedi: StudioActionItem[];
}

export interface AlertCliente {
  clientId: string;
  nomeCliente: string;
  destinatario: string;
  oggettoEmail: string;
  aperturaChiara: string;
  cosaSuccedeSenzaTecnicismi: string;
  cosaCambiaLunediMattina: string;
  azioniConsigliatePassoPasso: string[];
  propostaSupportoStudio: string;
}

export interface DeliverablesPackage {
  notaTecnicaInterna: NotaTecnicaInterna;
  alertClienti: AlertCliente[];
  modelUsed?: string;
}

export type PipelineStage =
  | 'idle'
  | 'step1_running'
  | 'step1_done'
  | 'step2_running'
  | 'step2_done'
  | 'step3_running'
  | 'completed'
  | 'error';

export interface ChecklistItem {
  id: string;
  label: string;
  criterio: string;
  checked: boolean;
  autoVerified?: boolean;
}

export type AppView = 'pipeline' | 'deliverables' | 'schema' | 'checklist';
