import { useEffect, useState } from 'react';
import {
  AppView,
  ChecklistItem,
  ClassificationResult,
  ClientEntity,
  DeliverablesPackage,
  LlmModelId,
  NewsSourceInput,
  PipelineStage,
  PortfolioImpactEvaluation,
} from './types/legal';
import {
  DEFAULT_CLIENTS,
  DEFAULT_MODEL_ID,
  DEFAULT_NEWS_INPUT,
  INITIAL_CHECKLIST,
  LLM_MODELS,
  SAMPLE_SCENARIO_PRESETS,
} from './data/defaultPresets';
import { TopBar } from './components/TopBar';
import { PipelineWorkspace } from './components/PipelineWorkspace';
import { DeliverablesView } from './components/DeliverablesView';
import { WorkflowSchemaView } from './components/WorkflowSchemaView';
import { ChecklistExportView } from './components/ChecklistExportView';

const STORAGE_KEYS = {
  clients: 'lexpulse_clients_v2',
  newsInput: 'lexpulse_news_v2',
  classification: 'lexpulse_classification_v2',
  impact: 'lexpulse_impact_v2',
  deliverables: 'lexpulse_deliverables_v2',
  note: 'lexpulse_note_prof_v2',
  checklist: 'lexpulse_checklist_v2',
  modelId: 'lexpulse_model_v2',
} as const;

function readStorage<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      (data as { error?: string }).error ||
        `Errore HTTP ${res.status} durante la chiamata al servizio.`
    );
  }
  return data as T;
}

export default function App() {
  const [activeView, setActiveView] = useState<AppView>('pipeline');
  const [clients, setClients] = useState<ClientEntity[]>(() =>
    readStorage(STORAGE_KEYS.clients, DEFAULT_CLIENTS)
  );
  const [newsInput, setNewsInput] = useState<NewsSourceInput>(() =>
    readStorage(STORAGE_KEYS.newsInput, DEFAULT_NEWS_INPUT)
  );
  const [classification, setClassification] =
    useState<ClassificationResult | null>(() =>
      readStorage(STORAGE_KEYS.classification, null)
    );
  const [impactEvaluation, setImpactEvaluation] =
    useState<PortfolioImpactEvaluation | null>(() =>
      readStorage(STORAGE_KEYS.impact, null)
    );
  const [deliverables, setDeliverables] = useState<DeliverablesPackage | null>(
    () => readStorage(STORAGE_KEYS.deliverables, null)
  );
  const [noteProfessionista, setNoteProfessionista] = useState<string>(() =>
    readStorage(STORAGE_KEYS.note, '')
  );
  const [checklist, setChecklist] = useState<ChecklistItem[]>(() =>
    readStorage(STORAGE_KEYS.checklist, INITIAL_CHECKLIST)
  );
  const [selectedModelId, setSelectedModelId] = useState<LlmModelId>(() => {
    const saved = readStorage<string>(STORAGE_KEYS.modelId, DEFAULT_MODEL_ID);
    return LLM_MODELS.some((m) => m.id === saved)
      ? (saved as LlmModelId)
      : DEFAULT_MODEL_ID;
  });

  const [stage, setStage] = useState<PipelineStage>(() => {
    if (readStorage(STORAGE_KEYS.deliverables, null)) return 'completed';
    if (readStorage(STORAGE_KEYS.impact, null)) return 'step2_done';
    if (readStorage(STORAGE_KEYS.classification, null)) return 'step1_done';
    return 'idle';
  });
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [profileDirty, setProfileDirty] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.clients, JSON.stringify(clients));
    } catch {
      // Ignore storage quota errors
    }
  }, [clients]);

  useEffect(() => {
    try {
      const storable: NewsSourceInput = {
        ...newsInput,
        fileBase64: undefined,
      };
      localStorage.setItem(STORAGE_KEYS.newsInput, JSON.stringify(storable));
    } catch {
      // Ignore storage quota errors
    }
  }, [newsInput]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.classification,
        JSON.stringify(classification)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [classification]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.impact,
        JSON.stringify(impactEvaluation)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [impactEvaluation]);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEYS.deliverables,
        JSON.stringify(deliverables)
      );
    } catch {
      // Ignore storage quota errors
    }
  }, [deliverables]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.note, JSON.stringify(noteProfessionista));
    } catch {
      // Ignore storage quota errors
    }
  }, [noteProfessionista]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.checklist, JSON.stringify(checklist));
    } catch {
      // Ignore storage quota errors
    }
  }, [checklist]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.modelId, JSON.stringify(selectedModelId));
    } catch {
      // Ignore storage quota errors
    }
  }, [selectedModelId]);

  const syncChecklistFromOutputs = (
    cls: ClassificationResult | null,
    imp: PortfolioImpactEvaluation | null,
    del: DeliverablesPackage | null
  ) => {
    setChecklist((prev) =>
      prev.map((item) => {
        if (item.id === 'chk-1' && cls) return { ...item, checked: true };
        if (item.id === 'chk-2' && imp && imp.impattiPerCliente.length > 0) {
          return { ...item, checked: true };
        }
        if (
          item.id === 'chk-3' &&
          imp?.cosaCambiaLunediStudio?.length &&
          del?.notaTecnicaInterna?.cosaCambiaLunediMattinaStudio
        ) {
          return { ...item, checked: true };
        }
        if (item.id === 'chk-4' && del?.notaTecnicaInterna) {
          return { ...item, checked: true };
        }
        if (item.id === 'chk-5' && del?.alertClienti?.length) {
          return { ...item, checked: true };
        }
        return item;
      })
    );
  };

  const handleChangeClients = (updated: ClientEntity[]) => {
    setClients(updated);
    if (impactEvaluation) {
      setProfileDirty(true);
    }
  };

  const handleResetClients = () => {
    setClients(DEFAULT_CLIENTS);
    if (impactEvaluation) {
      setProfileDirty(true);
    }
  };

  const isRunning =
    stage === 'step1_running' ||
    stage === 'step2_running' ||
    stage === 'step3_running';

  const preparePayloadForRun = (): NewsSourceInput | null => {
    const active = clients.filter((c) => c.attivo);
    if (active.length === 0) {
      setErrorMsg(
        'Attiva almeno un cliente nel portafoglio prima di avviare la pipeline.'
      );
      return null;
    }

    if (newsInput.mode === 'upload_pdf' && !newsInput.fileBase64) {
      setErrorMsg(
        'Seleziona un file PDF o TXT normativo prima di avviare la pipeline.'
      );
      return null;
    }

    if (
      newsInput.mode === 'custom_text' &&
      !newsInput.testoEstratto.trim()
    ) {
      setErrorMsg(
        'Inserisci il testo della norma, circolare, contratto o sentenza in «Testo Libero».'
      );
      return null;
    }

    if (newsInput.mode === 'preset_example') {
      const selectedPreset =
        SAMPLE_SCENARIO_PRESETS.find((p) => p.id === newsInput.presetId) ||
        SAMPLE_SCENARIO_PRESETS[0];
      return {
        ...newsInput,
        titolo: newsInput.titolo.trim() || selectedPreset.titolo,
        testoEstratto:
          newsInput.testoEstratto.trim() || selectedPreset.testoEstratto,
        riferimentiIntegrali:
          newsInput.riferimentiIntegrali || selectedPreset.riferimentiIntegrali,
      };
    }

    return newsInput;
  };

  const handleRunFullPipeline = async () => {
    if (isRunning) return;
    if (activeView !== 'pipeline') {
      setActiveView('pipeline');
    }
    setErrorMsg(null);
    const payloadInput = preparePayloadForRun();
    if (!payloadInput) return;

    try {
      // PASSAGGIO 1: Trigger & Classificazione
      setStage('step1_running');
      const cls = await postJson<ClassificationResult>(
        '/api/pipeline/trigger',
        {
          ...payloadInput,
          modelId: selectedModelId,
        }
      );
      setClassification(cls);
      setStage('step1_done');
      syncChecklistFromOutputs(cls, impactEvaluation, deliverables);

      // PASSAGGIO 2: Valutazione d'Impatto
      setStage('step2_running');
      const imp = await postJson<PortfolioImpactEvaluation>(
        '/api/pipeline/evaluate',
        {
          classification: cls,
          clients,
          noteProfessionista,
          modelId: selectedModelId,
        }
      );
      setImpactEvaluation(imp);
      setProfileDirty(false);
      setStage('step2_done');
      syncChecklistFromOutputs(cls, imp, deliverables);

      // PASSAGGIO 3: Deliverable Differenziati (1 Nota + N Alert)
      setStage('step3_running');
      const del = await postJson<DeliverablesPackage>(
        '/api/pipeline/deliverables',
        {
          classification: cls,
          impactEvaluation: imp,
          clients,
          modelId: selectedModelId,
        }
      );
      setDeliverables(del);
      setStage('completed');
      syncChecklistFromOutputs(cls, imp, del);
    } catch (err) {
      setStage('error');
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Errore inatteso durante l’esecuzione della pipeline.'
      );
    }
  };

  const handleReEvaluateStep2 = async () => {
    if (isRunning || !classification) return;
    const active = clients.filter((c) => c.attivo);
    if (active.length === 0) {
      setErrorMsg('Attiva almeno un cliente prima di rivalutare l’impatto.');
      return;
    }
    setErrorMsg(null);
    try {
      setStage('step2_running');
      const imp = await postJson<PortfolioImpactEvaluation>(
        '/api/pipeline/evaluate',
        {
          classification,
          clients,
          noteProfessionista,
          modelId: selectedModelId,
        }
      );
      setImpactEvaluation(imp);
      setProfileDirty(false);
      setStage('step2_done');

      setStage('step3_running');
      const del = await postJson<DeliverablesPackage>(
        '/api/pipeline/deliverables',
        {
          classification,
          impactEvaluation: imp,
          clients,
          modelId: selectedModelId,
        }
      );
      setDeliverables(del);
      setStage('completed');
      syncChecklistFromOutputs(classification, imp, del);
    } catch (err) {
      setStage('error');
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Errore durante la rivalutazione dell’impatto.'
      );
    }
  };

  const handleRegenerateStep3 = async () => {
    if (isRunning || !classification || !impactEvaluation) return;
    setErrorMsg(null);
    try {
      setStage('step3_running');
      const updatedImpact: PortfolioImpactEvaluation = {
        ...impactEvaluation,
        noteProfessionista,
      };
      setImpactEvaluation(updatedImpact);

      const del = await postJson<DeliverablesPackage>(
        '/api/pipeline/deliverables',
        {
          classification,
          impactEvaluation: updatedImpact,
          clients,
          modelId: selectedModelId,
        }
      );
      setDeliverables(del);
      setStage('completed');
      syncChecklistFromOutputs(classification, updatedImpact, del);
    } catch (err) {
      setStage('error');
      setErrorMsg(
        err instanceof Error
          ? err.message
          : 'Errore durante la rigenerazione dei deliverable.'
      );
    }
  };

  const handleToggleChecklist = (id: string) => {
    setChecklist((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, checked: !item.checked } : item
      )
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-[#FBF9F5] text-[#1C1917]">
      <TopBar
        activeView={activeView}
        onSelectView={setActiveView}
        onTriggerCercaNovita={handleRunFullPipeline}
        isRunning={isRunning}
        hasDeliverables={Boolean(deliverables)}
      />

      <main className="flex-1">
        {activeView === 'pipeline' && (
          <PipelineWorkspace
            newsInput={newsInput}
            onChangeNewsInput={setNewsInput}
            clients={clients}
            onChangeClients={handleChangeClients}
            onResetClients={handleResetClients}
            stage={stage}
            errorMsg={errorMsg}
            classification={classification}
            impactEvaluation={impactEvaluation}
            noteProfessionista={noteProfessionista}
            onChangeNoteProfessionista={setNoteProfessionista}
            profileDirty={profileDirty}
            selectedModelId={selectedModelId}
            onChangeModelId={setSelectedModelId}
            onRunFullPipeline={handleRunFullPipeline}
            onReEvaluateStep2={handleReEvaluateStep2}
            onRegenerateStep3={handleRegenerateStep3}
            onOpenDeliverables={() => setActiveView('deliverables')}
            hasDeliverables={Boolean(deliverables)}
          />
        )}

        {activeView === 'deliverables' && (
          <DeliverablesView
            deliverables={deliverables}
            onUpdateDeliverables={setDeliverables}
            onBackToPipeline={() => setActiveView('pipeline')}
          />
        )}

        {activeView === 'schema' && (
          <WorkflowSchemaView
            clients={clients}
            classification={classification}
            impactEvaluation={impactEvaluation}
            deliverables={deliverables}
          />
        )}

        {activeView === 'checklist' && (
          <ChecklistExportView
            checklist={checklist}
            onToggleItem={handleToggleChecklist}
            classification={classification}
            impactEvaluation={impactEvaluation}
            deliverables={deliverables}
          />
        )}
      </main>

      <footer className="no-print border-t border-[#E5E0D5] bg-[#FBF9F5] py-5 px-6">
        <div className="mx-auto max-w-[1380px] flex flex-wrap items-center justify-between gap-3 text-xs text-[#57534E]">
          <span>
            LexPulse · Legal Intelligence Agent · Sistema Multidisciplinare
          </span>
          <span>
            Supervisione del professionista richiesta prima dell’invio ai clienti
          </span>
        </div>
      </footer>
    </div>
  );
}
