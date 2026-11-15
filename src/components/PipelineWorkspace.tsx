import { useState } from 'react';
import {
  FileText,
  Globe,
  Upload,
  AlignLeft,
  Play,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  ClassificationResult,
  ClientEntity,
  LlmModelId,
  NewsSourceInput,
  NewsSourceMode,
  PipelineStage,
  PortfolioImpactEvaluation,
} from '../types/legal';
import {
  LLM_MODELS,
  SAMPLE_SCENARIO_PRESETS,
} from '../data/defaultPresets';
import { ClientPortfolioPanel } from './ClientPortfolioPanel';

interface PipelineWorkspaceProps {
  newsInput: NewsSourceInput;
  onChangeNewsInput: (input: NewsSourceInput) => void;
  clients: ClientEntity[];
  onChangeClients: (clients: ClientEntity[]) => void;
  onResetClients: () => void;
  stage: PipelineStage;
  errorMsg: string | null;
  classification: ClassificationResult | null;
  impactEvaluation: PortfolioImpactEvaluation | null;
  noteProfessionista: string;
  onChangeNoteProfessionista: (note: string) => void;
  profileDirty: boolean;
  selectedModelId: LlmModelId;
  onChangeModelId: (id: LlmModelId) => void;
  onRunFullPipeline: () => void;
  onReEvaluateStep2: () => void;
  onRegenerateStep3: () => void;
  onOpenDeliverables: () => void;
  hasDeliverables: boolean;
}

const SOURCE_MODES: { id: NewsSourceMode; label: string; icon: typeof FileText }[] = [
  { id: 'web_search', label: 'Ricerca Web', icon: Globe },
  { id: 'upload_pdf', label: 'Carica PDF', icon: Upload },
  { id: 'custom_text', label: 'Testo Libero', icon: AlignLeft },
  { id: 'preset_example', label: 'Esempi Guidati', icon: FileText },
];

const QUICK_WEB_QUERIES = [
  'Decreto Legge fiscale scadenze imprese 2026',
  'Novità sicurezza lavoro patente a crediti cantieri',
  'Correttivo Codice Appalti D.Lgs. 209/2024 ANAC',
  'Cassazione lavoro licenziamento e controllo dipendenti',
];

function urgencyLabelColor(level: string): string {
  switch (level) {
    case 'Critico':
      return 'text-[#B91C1C]';
    case 'Alto':
      return 'text-[#B45309]';
    case 'Medio':
      return 'text-[#1E3A8A]';
    case 'Non Applicabile':
      return 'text-[#78716C]';
    default:
      return 'text-[#57534E]';
  }
}

export function PipelineWorkspace({
  newsInput,
  onChangeNewsInput,
  clients,
  onChangeClients,
  onResetClients,
  stage,
  errorMsg,
  classification,
  impactEvaluation,
  noteProfessionista,
  onChangeNoteProfessionista,
  profileDirty,
  selectedModelId,
  onChangeModelId,
  onRunFullPipeline,
  onReEvaluateStep2,
  onRegenerateStep3,
  onOpenDeliverables,
  hasDeliverables,
}: PipelineWorkspaceProps) {
  const [showPresetPreview, setShowPresetPreview] = useState(false);

  const isRunning =
    stage === 'step1_running' ||
    stage === 'step2_running' ||
    stage === 'step3_running';

  const activePreset =
    SAMPLE_SCENARIO_PRESETS.find((p) => p.id === newsInput.presetId) ||
    SAMPLE_SCENARIO_PRESETS[0];

  const handleSelectPreset = (presetId: string) => {
    const found =
      SAMPLE_SCENARIO_PRESETS.find((p) => p.id === presetId) ||
      SAMPLE_SCENARIO_PRESETS[0];
    onChangeNewsInput({
      ...newsInput,
      mode: 'preset_example',
      presetId: found.id,
      titolo: found.titolo,
      testoEstratto: found.testoEstratto,
      riferimentiIntegrali: found.riferimentiIntegrali,
    });
  };

  const handleModeSwitch = (mode: NewsSourceMode) => {
    if (mode === 'preset_example') {
      const target =
        SAMPLE_SCENARIO_PRESETS.find((p) => p.id === newsInput.presetId) ||
        SAMPLE_SCENARIO_PRESETS[0];
      onChangeNewsInput({
        ...newsInput,
        mode: 'preset_example',
        presetId: target.id,
        titolo: newsInput.titolo || target.titolo,
        testoEstratto: newsInput.testoEstratto || target.testoEstratto,
        riferimentiIntegrali:
          newsInput.riferimentiIntegrali || target.riferimentiIntegrali,
      });
    } else {
      onChangeNewsInput({ ...newsInput, mode });
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const resultStr = typeof reader.result === 'string' ? reader.result : '';
      const base64 = resultStr.includes(',') ? resultStr.split(',')[1] : resultStr;
      onChangeNewsInput({
        ...newsInput,
        mode: 'upload_pdf',
        titolo: file.name.replace(/\.[^.]+$/, ''),
        fileName: file.name,
        mimeType: file.type || 'application/pdf',
        fileBase64: base64,
      });
    };
    reader.readAsDataURL(file);
  };

  const step1Status =
    stage === 'step1_running'
      ? 'running'
      : classification
      ? 'done'
      : 'pending';
  const step2Status =
    stage === 'step2_running'
      ? 'running'
      : impactEvaluation
      ? 'done'
      : 'pending';
  const step3Status =
    stage === 'step3_running'
      ? 'running'
      : hasDeliverables
      ? 'done'
      : 'pending';

  return (
    <div className="mx-auto max-w-[1380px] px-6 py-8 space-y-8">
      {/* Editorial Intro Header */}
      <div className="border-b border-[#E5E0D5] pb-6 flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="max-w-3xl">
          <p className="font-mono text-xs uppercase tracking-wider text-[#57534E]">
            Legal Intelligence Multidisciplinare · Monitoraggio & Alerting Strategico
          </p>
          <h1 className="mt-2 font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-[#1C1917]">
            Trasforma qualsiasi novità normativa o giurisprudenziale in azione.
          </h1>
          <p className="mt-3 text-base leading-relaxed text-[#44403C]">
            Pipeline agnostica in tre passaggi per qualunque area del diritto
            (lavoro, fisco, societario, appalti, ambiente, civile, bancario,
            amministrativo): classifica l’atto, valuta l’impatto reale sul
            portafoglio clienti e genera una Nota Tecnica Interna più Alert
            dedicati in linguaggio chiaro.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-end gap-3 shrink-0">
          <div className="min-w-[260px]">
            <label
              htmlFor="llm-model-select"
              className="block font-mono text-xs uppercase tracking-wider text-[#57534E] mb-1"
            >
              Modello LLM · OpenRouter (6 modelli)
            </label>
            <select
              id="llm-model-select"
              value={selectedModelId}
              disabled={isRunning}
              onChange={(e) => onChangeModelId(e.target.value as LlmModelId)}
              className="w-full rounded-md border border-[#D6CEBE] bg-white px-3 py-2 text-xs font-medium text-[#1C1917] focus:border-[#1E3A8A] focus:outline-none disabled:opacity-60 cursor-pointer"
            >
              {LLM_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.provider} · {m.label} — {m.ruoloConsigliato}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onRunFullPipeline}
              disabled={isRunning}
              className="inline-flex items-center gap-2 rounded-md bg-[#1E3A8A] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#172E6E] disabled:opacity-60 cursor-pointer whitespace-nowrap"
            >
              {isRunning ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                  <span>Pipeline in esecuzione</span>
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" aria-hidden="true" />
                  <span>Avvia Pipeline Completa</span>
                </>
              )}
            </button>

            {hasDeliverables && (
              <button
                type="button"
                onClick={onOpenDeliverables}
                className="inline-flex items-center gap-2 rounded-md border border-[#1E3A8A] bg-white px-4 py-2.5 text-sm font-semibold text-[#1E3A8A] hover:bg-[#1E3A8A]/5 transition-colors cursor-pointer whitespace-nowrap"
              >
                <span>Apri Deliverable</span>
                <ArrowRight className="h-4 w-4" aria-hidden="true" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 3-Step Pipeline Status Ribbon */}
      <div
        aria-label="Stato avanzamento pipeline"
        className="grid grid-cols-1 md:grid-cols-3 gap-4"
      >
        {[
          {
            idx: '01',
            title: 'Trigger & Classificazione',
            desc: 'Materia, autorità, estremi, ambito soggettivo, obblighi e facoltà',
            status: step1Status,
          },
          {
            idx: '02',
            title: 'Valutazione d’Impatto',
            desc: 'Applicabilità per cliente, qualificazione giuridica e «Cosa cambia lunedì?»',
            status: step2Status,
          },
          {
            idx: '03',
            title: 'Deliverable Differenziati',
            desc: '1 Nota Tecnica Interna + Alert in linguaggio chiaro per ogni cliente',
            status: step3Status,
          },
        ].map((step) => (
          <div
            key={step.idx}
            className={`rounded-lg border p-4 transition-colors ${
              step.status === 'running'
                ? 'border-[#1E3A8A] bg-white'
                : step.status === 'done'
                ? 'border-[#D6CEBE] bg-white'
                : 'border-[#E5E0D5] bg-[#F3EFE6]/50'
            }`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="font-mono text-xs font-medium text-[#57534E] tabular-nums">
                Passaggio {step.idx}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                  step.status === 'running'
                    ? 'text-[#1E3A8A]'
                    : step.status === 'done'
                    ? 'text-[#15803D]'
                    : 'text-[#57534E]'
                }`}
              >
                {step.status === 'running' && (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
                )}
                {step.status === 'done' && (
                  <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>
                  {step.status === 'running'
                    ? 'In elaborazione'
                    : step.status === 'done'
                    ? 'Completato'
                    : 'In attesa'}
                </span>
              </span>
            </div>
            <h3 className="mt-1.5 text-sm font-semibold text-[#1C1917]">
              {step.title}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[#57534E]">
              {step.desc}
            </p>
          </div>
        ))}
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="flex items-start gap-3 rounded-lg border border-[#B91C1C]/40 bg-[#FEF2F2] p-4 text-sm text-[#991B1B]"
        >
          <AlertTriangle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
          <div>
            <p className="font-semibold">Errore durante l’esecuzione della pipeline</p>
            <p className="mt-1 text-xs leading-relaxed">{errorMsg}</p>
          </div>
        </div>
      )}

      {/* Main 2-Column Workspace: Inputs (Left 5 cols) + Inspectable Pipeline Outputs (Right 7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* LEFT COLUMN: Sorgente + Portafoglio Clienti */}
        <div className="lg:col-span-5 space-y-6">
          <section
            aria-label="Sorgente normativa o giuridica"
            className="rounded-lg border border-[#E5E0D5] bg-white p-5 space-y-4"
          >
            <div className="border-b border-[#E5E0D5] pb-3">
              <p className="font-mono text-xs uppercase tracking-wider text-[#57534E]">
                Ingresso Dati · Qualsiasi materia o fonte
              </p>
              <h2 className="mt-1 font-serif text-xl font-semibold text-[#1C1917]">
                Sorgente da analizzare
              </h2>
            </div>

            {/* Segmented Mode Selector */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1 rounded-lg bg-[#F3EFE6] p-1">
              {SOURCE_MODES.map((m) => {
                const Icon = m.icon;
                const active = newsInput.mode === m.id;
                return (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleModeSwitch(m.id)}
                    className={`flex items-center justify-center gap-1.5 rounded-md px-2 py-2 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                      active
                        ? 'bg-white text-[#1E3A8A] shadow-xs'
                        : 'text-[#57534E] hover:text-[#1C1917]'
                    }`}
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="truncate">{m.label}</span>
                  </button>
                );
              })}
            </div>

            {newsInput.mode === 'web_search' && (
              <div className="space-y-3">
                <label className="block text-xs font-medium text-[#1C1917]">
                  Argomento, norma, autorità o pronuncia da cercare sul web
                </label>
                <input
                  type="text"
                  placeholder="Es. Decreto Milleproroghe fisco, Direttiva salari, sentenza Cassazione appalti..."
                  value={newsInput.queryRicerca || ''}
                  onChange={(e) =>
                    onChangeNewsInput({
                      ...newsInput,
                      queryRicerca: e.target.value,
                    })
                  }
                  className="w-full rounded-md border border-[#D6CEBE] bg-white px-3 py-2 text-sm text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1E3A8A] focus:outline-none"
                />
                <div className="space-y-1.5">
                  <p className="text-[11px] font-mono uppercase tracking-wider text-[#57534E]">
                    Spunti di ricerca rapida
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {QUICK_WEB_QUERIES.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() =>
                          onChangeNewsInput({
                            ...newsInput,
                            mode: 'web_search',
                            queryRicerca: q,
                          })
                        }
                        className="rounded border border-[#E5E0D5] bg-[#FBF9F5] px-2 py-1 text-[11px] text-[#44403C] hover:border-[#1E3A8A] hover:text-[#1E3A8A] transition-colors cursor-pointer text-left"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>
                <p className="text-xs text-[#57534E]">
                  L’agente interroga fonti web aggiornate, estrae gli URL verificati
                  e classifica l’atto prima di valutarlo sui clienti. Se lasci il
                  campo vuoto, cerca le principali novità normative recenti.
                </p>
              </div>
            )}

            {newsInput.mode === 'upload_pdf' && (
              <div className="space-y-3">
                <label className="flex flex-col items-center justify-center rounded-md border border-dashed border-[#D6CEBE] bg-[#FBF9F5] p-5 text-center cursor-pointer hover:border-[#1E3A8A] transition-colors">
                  <Upload className="h-5 w-5 text-[#1E3A8A]" aria-hidden="true" />
                  <span className="mt-2 text-xs font-semibold text-[#1C1917]">
                    {newsInput.fileName
                      ? `File pronto: ${newsInput.fileName}`
                      : 'Seleziona un documento PDF o TXT (legge, circolare, sentenza, contratto)'}
                  </span>
                  <span className="mt-1 text-xs text-[#57534E]">
                    Elaborazione diretta lato server su qualsiasi materia giuridica
                  </span>
                  <input
                    type="file"
                    accept=".pdf,.txt,application/pdf,text/plain"
                    onChange={handleFileUpload}
                    className="sr-only"
                  />
                </label>
              </div>
            )}

            {newsInput.mode === 'custom_text' && (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-medium text-[#57534E] mb-1">
                    Titolo provvedimento / sentenza / circolare
                  </label>
                  <input
                    type="text"
                    value={newsInput.titolo}
                    placeholder="Es. Circolare Agenzia Entrate n. ..., Sentenza Cass. Civ. ..., CCNL..."
                    onChange={(e) =>
                      onChangeNewsInput({ ...newsInput, titolo: e.target.value })
                    }
                    className="w-full rounded-md border border-[#D6CEBE] bg-white px-3 py-1.5 text-sm text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1E3A8A] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-[#57534E] mb-1">
                    Testo integrale o estratto da analizzare
                  </label>
                  <textarea
                    rows={6}
                    value={newsInput.testoEstratto}
                    onChange={(e) =>
                      onChangeNewsInput({
                        ...newsInput,
                        testoEstratto: e.target.value,
                      })
                    }
                    placeholder="Incolla qui il testo di una norma, decreto, circolare fiscale, provvedimento di autorità, clausola contrattuale o sentenza..."
                    className="w-full rounded-md border border-[#D6CEBE] bg-white p-3 text-xs leading-relaxed text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1E3A8A] focus:outline-none"
                  />
                </div>
              </div>
            )}

            {newsInput.mode === 'preset_example' && (
              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  {SAMPLE_SCENARIO_PRESETS.map((preset) => {
                    const selected = activePreset.id === preset.id;
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => handleSelectPreset(preset.id)}
                        className={`rounded-md border p-3 text-left transition-colors cursor-pointer ${
                          selected
                            ? 'border-[#1E3A8A] bg-[#FBF9F5]'
                            : 'border-[#E5E0D5] bg-white hover:border-[#D6CEBE]'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-[11px] uppercase tracking-wider text-[#1E3A8A]">
                            {preset.materia}
                          </span>
                          {selected && (
                            <span className="font-mono text-[11px] font-semibold text-[#15803D]">
                              Selezionato
                            </span>
                          )}
                        </div>
                        <p className="mt-1 text-xs font-semibold text-[#1C1917]">
                          {preset.titolo}
                        </p>
                        <p className="mt-1 text-xs text-[#57534E] leading-relaxed">
                          {preset.descrizioneBreve}
                        </p>
                      </button>
                    );
                  })}
                </div>

                <button
                  type="button"
                  onClick={() => setShowPresetPreview((v) => !v)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-[#1E3A8A] hover:underline cursor-pointer"
                >
                  {showPresetPreview ? (
                    <>
                      <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Nascondi testo dell’esempio</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                      <span>Mostra o modifica testo dell’esempio</span>
                    </>
                  )}
                </button>

                {showPresetPreview && (
                  <textarea
                    rows={7}
                    value={newsInput.testoEstratto || activePreset.testoEstratto}
                    onChange={(e) =>
                      onChangeNewsInput({
                        ...newsInput,
                        titolo: newsInput.titolo || activePreset.titolo,
                        testoEstratto: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-[#D6CEBE] bg-white p-3 font-mono text-xs leading-relaxed text-[#1C1917] focus:border-[#1E3A8A] focus:outline-none"
                  />
                )}
              </div>
            )}
          </section>

          {/* Portafoglio Clienti Configurabile */}
          <ClientPortfolioPanel
            clients={clients}
            onChangeClients={onChangeClients}
            onResetDefaults={onResetClients}
            profileDirty={profileDirty}
            onReEvaluate={impactEvaluation ? onReEvaluateStep2 : undefined}
            isRunning={isRunning}
          />
        </div>

        {/* RIGHT COLUMN: Inspectable Pipeline Outputs */}
        <div className="lg:col-span-7 space-y-6">
          {/* Empty / Zero-state before first run */}
          {stage === 'idle' && !classification && (
            <div className="rounded-lg border border-[#E5E0D5] bg-white p-8 space-y-6">
              <div>
                <p className="font-mono text-xs uppercase tracking-wider text-[#57534E]">
                  Pronto per l’esecuzione
                </p>
                <h2 className="mt-2 font-serif text-2xl font-semibold text-[#1C1917]">
                  Inserisci qualsiasi tema o documento e avvia «Cerca Novità»
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-[#44403C] max-w-[65ch]">
                  LexPulse è un motore agnostico per la Legal Intelligence: puoi
                  cercare online qualsiasi argomento giuridico, caricare un PDF o
                  incollare un provvedimento, oppure scegliere uno degli esempi
                  guidati multisettoriali. Il sistema eseguirà in sequenza i tre
                  passaggi con controllo umano prima della consegna.
                </p>
              </div>

              <div className="border-t border-[#E5E0D5] pt-5 grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="font-semibold text-[#1C1917]">1. Classifica</p>
                  <p className="mt-1 text-[#57534E] leading-relaxed">
                    Individua automaticamente materia, autorità, estremi,
                    decorrenza e separa obblighi, indirizzi e facoltà.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-[#1C1917]">2. Pesa l’impatto</p>
                  <p className="mt-1 text-[#57534E] leading-relaxed">
                    Verifica quali clienti attivi sono impattati (e quali non lo
                    sono), qualifica ruoli, gap e azioni di lunedì mattina.
                  </p>
                </div>
                <div>
                  <p className="font-semibold text-[#1C1917]">3. Produce 1 + N</p>
                  <p className="mt-1 text-[#57534E] leading-relaxed">
                    Redige 1 Nota Tecnica Interna per lo Studio e Alert in
                    linguaggio chiaro per ogni cliente attivo.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* STEP 1 OUTPUT PANEL */}
          {(stage === 'step1_running' || classification) && (
            <section
              aria-label="Output Passaggio 1 Classificazione"
              className="rounded-lg border border-[#E5E0D5] bg-white p-6 space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E0D5] pb-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-wider text-[#57534E]">
                    Passaggio 01 · Output Trigger & Classificazione
                  </p>
                  <h2 className="mt-1 font-serif text-xl font-semibold text-[#1C1917]">
                    {classification
                      ? classification.titoloAtto
                      : 'Classificazione dell’atto in corso...'}
                  </h2>
                </div>
                {classification && (
                  <span className="font-mono text-xs text-[#15803D] font-medium">
                    {classification.materiaPrincipale || 'Classificato'}
                  </span>
                )}
              </div>

              {stage === 'step1_running' && !classification ? (
                <div className="space-y-3 py-4">
                  <div className="h-4 w-3/4 rounded bg-[#F3EFE6] animate-pulse" />
                  <div className="h-4 w-full rounded bg-[#F3EFE6] animate-pulse" />
                  <div className="h-4 w-5/6 rounded bg-[#F3EFE6] animate-pulse" />
                </div>
              ) : (
                classification && (
                  <>
                    {/* Clean Unboxed Metadata Line */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[#57534E] font-mono tabular-nums">
                      <span className="font-medium text-[#1C1917]">
                        {classification.autorita}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{classification.tipoAtto}</span>
                      <span aria-hidden="true">·</span>
                      <span>{classification.estremiAdozione}</span>
                      <span aria-hidden="true">·</span>
                      <span>{classification.dataPubblicazione}</span>
                      {classification.modelUsed && (
                        <>
                          <span aria-hidden="true">·</span>
                          <span>{classification.modelUsed}</span>
                        </>
                      )}
                    </div>

                    <p className="text-sm leading-relaxed text-[#1C1917]">
                      {classification.sintesiOggettiva}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 rounded-md border border-[#E5E0D5] bg-[#FBF9F5] p-4 text-xs">
                      <div>
                        <p className="font-semibold text-[#1C1917]">
                          Ambito soggettivo (A chi si rivolge)
                        </p>
                        <p className="mt-1 text-[#44403C] leading-relaxed">
                          {classification.ambitoSoggettivo}
                        </p>
                      </div>
                      <div>
                        <p className="font-semibold text-[#1C1917]">
                          Decorrenza e quadro precettivo
                        </p>
                        <p className="mt-1 text-[#44403C] leading-relaxed">
                          {classification.entrataInVigore}. Obblighi:{' '}
                          {classification.quadroPrecettivo?.obblighi} · Facoltà:{' '}
                          {classification.quadroPrecettivo?.facolta}
                        </p>
                      </div>
                    </div>

                    {/* Precetti Table */}
                    <div>
                      <h3 className="text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-2">
                        Precetti estratti e grado di vincolatività
                      </h3>
                      <div className="overflow-x-auto rounded-md border border-[#E5E0D5]">
                        <table className="w-full text-left text-xs border-collapse">
                          <thead className="bg-[#F3EFE6] text-[#57534E]">
                            <tr>
                              <th className="px-3 py-2 font-medium whitespace-nowrap">
                                Rif.
                              </th>
                              <th className="px-3 py-2 font-medium whitespace-nowrap">
                                Natura
                              </th>
                              <th className="px-3 py-2 font-medium">
                                Contenuto del precetto
                              </th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#E5E0D5]">
                            {classification.precettiEstratti.map((p, idx) => (
                              <tr key={idx} className="hover:bg-[#FBF9F5]">
                                <td className="px-3 py-2.5 font-mono text-[#1C1917] whitespace-nowrap align-top tabular-nums">
                                  {p.paragrafo}
                                </td>
                                <td
                                  className={`px-3 py-2.5 font-mono font-semibold whitespace-nowrap align-top ${
                                    p.livelloVincolativita === 'OBBLIGO'
                                      ? 'text-[#B91C1C]'
                                      : p.livelloVincolativita === 'INDIRIZZO'
                                      ? 'text-[#B45309]'
                                      : 'text-[#1E3A8A]'
                                  }`}
                                >
                                  {p.livelloVincolativita}
                                </td>
                                <td className="px-3 py-2.5 text-[#1C1917] leading-relaxed">
                                  {p.sintesi}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {classification.fontiWeb &&
                      classification.fontiWeb.length > 0 && (
                        <div className="pt-2 border-t border-[#E5E0D5]">
                          <p className="text-xs font-semibold text-[#57534E] mb-1.5">
                            Fonti web verificate:
                          </p>
                          <ul className="space-y-1">
                            {classification.fontiWeb.map((f, i) => (
                              <li key={i} className="text-xs">
                                <a
                                  href={f.uri}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[#1E3A8A] hover:underline"
                                >
                                  <span>{f.title}</span>
                                  <ExternalLink
                                    className="h-3 w-3 shrink-0"
                                    aria-hidden="true"
                                  />
                                </a>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                  </>
                )
              )}
            </section>
          )}

          {/* STEP 2 OUTPUT PANEL + HUMAN-IN-THE-LOOP CHECKPOINT */}
          {(stage === 'step2_running' || impactEvaluation) && (
            <section
              aria-label="Output Passaggio 2 Valutazione d'Impatto"
              className="rounded-lg border border-[#E5E0D5] bg-white p-6 space-y-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E0D5] pb-4">
                <div>
                  <p className="font-mono text-xs uppercase tracking-wider text-[#57534E]">
                    Passaggio 02 · Valutazione d’Impatto & Checkpoint Umano
                  </p>
                  <h2 className="mt-1 font-serif text-xl font-semibold text-[#1C1917]">
                    Impatto per lo Studio e per ciascun Cliente
                  </h2>
                </div>
                {impactEvaluation && (
                  <span
                    className={`font-mono text-xs font-semibold ${urgencyLabelColor(
                      impactEvaluation.livelloComplessivoRischio
                    )}`}
                  >
                    Rischio Complessivo: {impactEvaluation.livelloComplessivoRischio}
                  </span>
                )}
              </div>

              {stage === 'step2_running' && !impactEvaluation ? (
                <div className="space-y-3 py-4">
                  <div className="h-4 w-2/3 rounded bg-[#F3EFE6] animate-pulse" />
                  <div className="h-20 w-full rounded bg-[#F3EFE6] animate-pulse" />
                </div>
              ) : (
                impactEvaluation && (
                  <>
                    <p className="text-sm leading-relaxed text-[#1C1917]">
                      {impactEvaluation.sintesiImpattoStudio}
                    </p>

                    {/* Studio Monday Morning Summary */}
                    <div className="rounded-md border border-[#D6CEBE] bg-[#F3EFE6]/70 p-4">
                      <p className="text-xs font-semibold uppercase tracking-wider text-[#1C1917]">
                        Cosa cambia lunedì mattina per lo Studio
                      </p>
                      <ul className="mt-2 space-y-1.5 text-xs leading-relaxed text-[#1C1917]">
                        {impactEvaluation.cosaCambiaLunediStudio.map((item, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="font-mono text-[#1E3A8A] tabular-nums">
                              0{i + 1}.
                            </span>
                            <span>{item}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* Per-Client Breakdown */}
                    <div className="divide-y divide-[#E5E0D5] border border-[#E5E0D5] rounded-md">
                      {impactEvaluation.impattiPerCliente.map((c) => (
                        <div key={c.clientId} className="p-4 space-y-3">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <h3 className="font-serif text-lg font-semibold text-[#1C1917]">
                              {c.nomeCliente}
                            </h3>
                            <span
                              className={`font-mono text-xs font-semibold ${urgencyLabelColor(
                                c.livelloUrgenza
                              )}`}
                            >
                              Urgenza: {c.livelloUrgenza} · {c.ruoloGiuridico}
                            </span>
                          </div>

                          <p className="text-xs text-[#57534E]">
                            <span className="font-semibold text-[#1C1917]">
                              Inquadramento e applicabilità:
                            </span>{' '}
                            {c.inquadramentoApplicabilita}
                          </p>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                            <div>
                              <p className="font-semibold text-[#B91C1C]">
                                Adempimenti obbligatori e gap
                              </p>
                              <ul className="mt-1.5 space-y-1 text-[#44403C] list-disc pl-4">
                                {c.adempimentiObbligatori.length > 0 ? (
                                  c.adempimentiObbligatori.map((d, idx) => (
                                    <li key={idx}>{d}</li>
                                  ))
                                ) : (
                                  <li>Nessun obbligo diretto rilevato</li>
                                )}
                              </ul>
                            </div>
                            <div>
                              <p className="font-semibold text-[#1E3A8A]">
                                Opzioni e scelte strategiche
                              </p>
                              <ul className="mt-1.5 space-y-1 text-[#44403C] list-disc pl-4">
                                {c.opzioniEScelteStrategiche.length > 0 ? (
                                  c.opzioniEScelteStrategiche.map((o, idx) => (
                                    <li key={idx}>{o}</li>
                                  ))
                                ) : (
                                  <li>Nessuna opzione aggiuntiva segnalata</li>
                                )}
                              </ul>
                            </div>
                          </div>

                          <div className="rounded bg-[#FBF9F5] border border-[#E5E0D5] p-3 text-xs">
                            <span className="font-semibold text-[#1C1917]">
                              Cosa cambia lunedì mattina per questo cliente:{' '}
                            </span>
                            <span className="text-[#44403C]">
                              {c.cosaCambiaLunediCliente}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Human-in-the-Loop Intervention Box */}
                    <div className="rounded-md border border-[#1E3A8A]/30 bg-[#FBF9F5] p-4 space-y-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div>
                          <p className="text-xs font-semibold text-[#1E3A8A]">
                            Intervento del Professionista (Human-in-the-Loop)
                          </p>
                          <p className="text-xs text-[#57534E]">
                            Aggiungi rettifiche giuridiche o indicazioni di tono prima di
                            rigenerare Nota Interna e Alert.
                          </p>
                        </div>
                      </div>
                      <textarea
                        rows={2}
                        value={noteProfessionista}
                        onChange={(e) =>
                          onChangeNoteProfessionista(e.target.value)
                        }
                        placeholder="Es. Sottolineare nell'alert al cliente la scadenza di adeguamento contrattuale; proporre una call operativa lunedì alle 10:00."
                        className="w-full rounded-md border border-[#D6CEBE] bg-white p-2.5 text-xs text-[#1C1917] placeholder:text-[#78716C] focus:border-[#1E3A8A] focus:outline-none"
                      />
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={onReEvaluateStep2}
                          disabled={isRunning}
                          className="inline-flex items-center gap-1.5 rounded-md border border-[#D6CEBE] bg-white px-3 py-1.5 text-xs font-medium text-[#1C1917] hover:bg-[#F3EFE6] disabled:opacity-60 cursor-pointer"
                        >
                          <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>Riesegui Impatto (Step 2)</span>
                        </button>
                        <button
                          type="button"
                          onClick={onRegenerateStep3}
                          disabled={isRunning}
                          className="inline-flex items-center gap-1.5 rounded-md bg-[#1E3A8A] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#172E6E] disabled:opacity-60 cursor-pointer"
                        >
                          {stage === 'step3_running' ? (
                            <Loader2
                              className="h-3.5 w-3.5 animate-spin"
                              aria-hidden="true"
                            />
                          ) : (
                            <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" />
                          )}
                          <span>Rigenera Deliverable (Step 3)</span>
                        </button>
                      </div>
                    </div>
                  </>
                )
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
