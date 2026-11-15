import { useRef, useState } from 'react';
import {
  Check,
  Copy,
  Download,
  Printer,
  Scale,
  Send,
  UserCheck,
} from 'lucide-react';
import {
  copyTextWithFallback,
  downloadTextFile,
} from '../utils/exportDeliverables';
import {
  ClassificationResult,
  ClientEntity,
  DeliverablesPackage,
  PortfolioImpactEvaluation,
} from '../types/legal';
import agentPromptsImg from '../assets/images/agent_prompts_architecture_v2_1794671352962.jpg';

interface WorkflowSchemaViewProps {
  clients: ClientEntity[];
  classification: ClassificationResult | null;
  impactEvaluation: PortfolioImpactEvaluation | null;
  deliverables: DeliverablesPackage | null;
}

type FlowNodeId =
  | 'doc1'
  | 'doc2'
  | 'step1'
  | 'step2'
  | 'human'
  | 'step3'
  | 'nota'
  | 'alerts';

function truncateLabel(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen - 1)}…`;
}

export function WorkflowSchemaView({
  clients,
  classification,
  impactEvaluation,
  deliverables,
}: WorkflowSchemaViewProps) {
  const [selectedNode, setSelectedNode] = useState<FlowNodeId>('human');
  const [svgStatus, setSvgStatus] = useState<'idle' | 'downloaded' | 'copied'>('idle');
  const [lastSvgMarkup, setLastSvgMarkup] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement | null>(null);

  const activeClients = clients.filter((c) => c.attivo);

  const buildStandaloneSvg = (): string | null => {
    if (!svgRef.current) return null;
    const clone = svgRef.current.cloneNode(true) as SVGSVGElement;
    clone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
    clone.setAttribute('width', '1160');
    clone.setAttribute('height', '610');
    clone.setAttribute('style', 'background-color:#FBF9F5;');
    const serializer = new XMLSerializer();
    return `<?xml version="1.0" encoding="UTF-8"?>\n${serializer.serializeToString(clone)}`;
  };

  const handleDownloadSvg = async () => {
    const raw = buildStandaloneSvg();
    if (!raw) return;
    setLastSvgMarkup(raw);
    downloadTextFile(
      'lexpulse-schema-flusso.svg',
      raw,
      'image/svg+xml;charset=utf-8'
    );
    setSvgStatus('downloaded');
    setTimeout(() => {
      setSvgStatus((prev) => (prev === 'downloaded' ? 'idle' : prev));
    }, 3000);
  };

  const handleCopySvgFallback = async () => {
    const raw = lastSvgMarkup || buildStandaloneSvg();
    if (!raw) return;
    const ok = await copyTextWithFallback(raw);
    if (ok) {
      setSvgStatus('copied');
      setTimeout(() => setSvgStatus('idle'), 2500);
    }
  };

  const nodeDetails: Record<
    FlowNodeId,
    { titolo: string; ruolo: string; input: string; output: string; statoLive: string }
  > = {
    doc1: {
      titolo: 'Ingresso 1 · Sorgente Normativa / Giurisprudenziale',
      ruolo: 'Monitoraggio agnostico su qualsiasi area del diritto',
      input:
        'Ricerca Web con fonti verificate, file PDF/TXT caricato, testo libero o esempi multisettoriali (lavoro, appalti, ambiente, fisco, societario).',
      output: 'Testo o documento multimodale passato all’Agente 1.',
      statoLive: classification
        ? `Atto elaborato: ${classification.titoloAtto} (${classification.materiaPrincipale})`
        : 'Pronto a ricevere qualsiasi tema o documento giuridico.',
    },
    doc2: {
      titolo: 'Ingresso 2 · Portafoglio Clienti Configurabile',
      ruolo: 'Profili operativi e contrattuali assistiti dallo studio',
      input:
        'Dati modificabili di imprese, enti pubblici, banche, strutture sanitarie o profili personalizzati.',
      output: `${activeClients.length} profili attivi passati esclusivamente all’Agente 2.`,
      statoLive:
        activeClients.map((c) => c.nome).join(' · ') || 'Nessun cliente attivo',
    },
    step1: {
      titolo: 'Passaggio 01 · Agente 1 (Trigger & Classificatore)',
      ruolo: 'Classifica la novità in modo oggettivo senza conoscere i clienti',
      input: 'Esclusivamente la sorgente in ingresso + comando «Cerca Novità».',
      output:
        'Scheda JSON con materia giuridica, estremi, decorrenza, ambito soggettivo e precetti distinti in OBBLIGO / INDIRIZZO / FACOLTÀ.',
      statoLive: classification
        ? `Completato · ${classification.materiaPrincipale} (${
            classification.precettiEstratti.length
          } precetti${classification.modelUsed ? ` · ${classification.modelUsed}` : ''})`
        : 'In attesa di avvio pipeline.',
    },
    step2: {
      titolo: 'Passaggio 02 · Agente 2 (Valutatore d’Impatto)',
      ruolo: 'Incrocia novità e portafoglio clienti per pesare applicabilità e rischi',
      input: 'Output JSON Passaggio 1 + Portafoglio Clienti + note del giurista.',
      output:
        'Applicabilità diretta/indiretta/non applicabile, ruolo giuridico, gap analysis e risposta a «Cosa cambia lunedì mattina?».',
      statoLive: impactEvaluation
        ? `Completato · Rischio complessivo: ${impactEvaluation.livelloComplessivoRischio} (${impactEvaluation.impattiPerCliente.length} clienti)`
        : 'In attesa del Passaggio 1.',
    },
    human: {
      titolo: 'Checkpoint Professionista (Human-in-the-Loop)',
      ruolo: 'Supervisione e responsabilità dell’avvocato prima dei deliverable',
      input:
        'Valutazione d’impatto generata dall’Agente 2 e profili cliente modificabili.',
      output:
        'Direttiva al loop di rivalutazione (Step 2) oppure approvazione verso la redazione finale (Step 3).',
      statoLive:
        impactEvaluation?.noteProfessionista?.trim()
          ? `Nota attiva del giurista: "${impactEvaluation.noteProfessionista}"`
          : 'Attivo: il giurista può inserire rettifiche e rigenerare Step 2 o Step 3.',
    },
    step3: {
      titolo: 'Passaggio 03 · Agente 3 (Redattore Differenziato)',
      ruolo: 'Sdoppia tono e profondità tra uso interno e comunicazione esterna',
      input: 'Classificazione + Valutazione d’Impatto validata dal professionista.',
      output: `1 Nota Tecnica Interna + ${activeClients.length} Alert Clienti distinti.`,
      statoLive: deliverables
        ? `Generati: 1 Nota Interna + ${deliverables.alertClienti.length} Alert Clienti`
        : 'In attesa del Passaggio 2.',
    },
    nota: {
      titolo: 'Deliverable 3A · Nota Tecnica Interna (Studio Legale)',
      ruolo: 'Memorandum operativo per colleghi avvocati e collaboratori',
      input: 'Output validati Step 1 e Step 2.',
      output:
        'Riferimenti normativi/giurisprudenziali puntuali, analisi per fascicolo, piano d’azione lunedì mattina editabile ed esportabile.',
      statoLive: deliverables?.notaTecnicaInterna
        ? `Pronta: "${deliverables.notaTecnicaInterna.oggetto}"`
        : 'Non ancora generata.',
    },
    alerts: {
      titolo: 'Deliverable 3B · Alert Clienti in Linguaggio Chiaro',
      ruolo: 'Comunicazioni mirate leggibili da imprenditori, dirigenti e amministratori senza gergo',
      input: 'Impatto specifico per ciascun cliente attivo.',
      output:
        '1 alert separato per cliente con spiegazione semplice, azioni passo-passo e proposta di supporto dello studio.',
      statoLive: deliverables?.alertClienti?.length
        ? `${deliverables.alertClienti.length} alert pronti per: ${deliverables.alertClienti
            .map((a) => a.nomeCliente)
            .join(', ')}`
        : 'Non ancora generati.',
    },
  };

  const activeDetail = nodeDetails[selectedNode];

  const strokeFor = (id: FlowNodeId, done?: boolean) => {
    if (selectedNode === id) return '#1E3A8A';
    if (done) return '#15803D';
    return '#D6CEBE';
  };

  const strokeWidthFor = (id: FlowNodeId) => (selectedNode === id ? 2.2 : 1.4);

  return (
    <div className="mx-auto max-w-[1380px] px-6 py-8 space-y-6">
      <div className="no-print flex flex-wrap items-end justify-between gap-4 border-b border-[#E5E0D5] pb-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-[#57534E]">
            Architettura della Pipeline · Sistema Multidisciplinare
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-[#1C1917]">
            Rappresentazione Grafica del Flusso (1 Pagina)
          </h1>
          <p className="mt-1.5 text-sm text-[#57534E]">
            Diagramma interattivo end-to-end: fonti agnostiche, analisi AI in
            passaggi separati, checkpoint del giurista e deliverable differenziati.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadSvg}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#D6CEBE] bg-white px-3.5 py-2 text-xs font-medium text-[#1C1917] hover:bg-[#F3EFE6] cursor-pointer whitespace-nowrap"
          >
            {svgStatus === 'downloaded' ? (
              <Check className="h-3.5 w-3.5 text-[#15803D]" aria-hidden="true" />
            ) : (
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>
              {svgStatus === 'downloaded'
                ? 'SVG Scaricato'
                : 'Scarica Grafico (.svg)'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-2 rounded-md bg-[#1E3A8A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#172E6E] cursor-pointer whitespace-nowrap"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Stampa Schema (1 Pagina)</span>
          </button>
        </div>
      </div>

      {lastSvgMarkup && (
        <div className="no-print flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#E5E0D5] bg-[#F3EFE6]/75 px-4 py-2.5 text-xs text-[#44403C]">
          <span>
            File SVG generato. Se il browser blocca i download automatici
            nell’anteprima incorporata, puoi copiare direttamente il codice SVG.
          </span>
          <button
            type="button"
            onClick={handleCopySvgFallback}
            className="inline-flex items-center gap-1.5 rounded border border-[#D6CEBE] bg-white px-2.5 py-1 text-xs font-medium text-[#1C1917] hover:bg-[#FBF9F5] cursor-pointer"
          >
            {svgStatus === 'copied' ? (
              <Check className="h-3.5 w-3.5 text-[#15803D]" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>
              {svgStatus === 'copied' ? 'Codice SVG Copiato' : 'Copia codice SVG'}
            </span>
          </button>
        </div>
      )}

      {/* Printable 1-Page Architectural Canvas */}
      <article className="rounded-lg border border-[#E5E0D5] bg-white p-6 sm:p-8 space-y-6 print-only-full">
        <header className="border-b border-[#E5E0D5] pb-4 flex flex-wrap items-baseline justify-between gap-2">
          <div>
            <h2 className="font-serif text-2xl font-semibold text-[#1C1917]">
              LexPulse · Diagramma di Flusso Legal Intelligence (Agnostico)
            </h2>
            <p className="mt-1 text-xs text-[#57534E]">
              Clicca su qualsiasi nodo del grafico per ispezionare input, output e
              stato nella sessione corrente.
            </p>
          </div>
          <span className="font-mono text-xs text-[#57534E] tabular-nums">
            3 Passaggi AI · 1 Gate Giurista · 1+{activeClients.length} Deliverable
          </span>
        </header>

        {/* VECTOR FLOWCHART DIAGRAM */}
        <div className="overflow-x-auto rounded-md border border-[#E5E0D5] bg-[#FBF9F5] p-3 print-break-inside-avoid">
          <svg
            ref={svgRef}
            viewBox="0 0 1160 610"
            className="w-full min-w-[820px] h-auto select-none"
            role="img"
            aria-label="Diagramma di flusso dell'agente di Legal Intelligence in tre passaggi con controllo umano"
          >
            <defs>
              <marker
                id="arrow-lapis"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#1E3A8A" />
              </marker>
              <marker
                id="arrow-muted"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#57534E" />
              </marker>
              <marker
                id="arrow-amber"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#B45309" />
              </marker>
              <marker
                id="arrow-green"
                viewBox="0 0 10 10"
                refX="8"
                refY="5"
                markerWidth="7"
                markerHeight="7"
                orient="auto-start-reverse"
              >
                <path d="M 0 1 L 10 5 L 0 9 z" fill="#15803D" />
              </marker>
            </defs>

            {/* Background Column Swimlanes */}
            <rect
              x="16"
              y="16"
              width="248"
              height="578"
              rx="8"
              fill="#F3EFE6"
              fillOpacity="0.65"
              stroke="#E5E0D5"
            />
            <text
              x="30"
              y="38"
              fill="#57534E"
              fontSize="10"
              fontWeight="600"
              fontFamily="JetBrains Mono, monospace"
            >
              00 · FONTI IN INGRESSO
            </text>

            <rect
              x="284"
              y="16"
              width="284"
              height="578"
              rx="8"
              fill="#FFFFFF"
              fillOpacity="0.7"
              stroke="#E5E0D5"
            />
            <text
              x="298"
              y="38"
              fill="#57534E"
              fontSize="10"
              fontWeight="600"
              fontFamily="JetBrains Mono, monospace"
            >
              01–02 · ANALISI AI SEPARATA
            </text>

            <rect
              x="588"
              y="16"
              width="268"
              height="578"
              rx="8"
              fill="#F3EFE6"
              fillOpacity="0.55"
              stroke="#E5E0D5"
            />
            <text
              x="602"
              y="38"
              fill="#1E3A8A"
              fontSize="10"
              fontWeight="600"
              fontFamily="JetBrains Mono, monospace"
            >
              CHECKPOINT GIURISTA
            </text>

            <rect
              x="876"
              y="16"
              width="268"
              height="578"
              rx="8"
              fill="#FFFFFF"
              fillOpacity="0.7"
              stroke="#E5E0D5"
            />
            <text
              x="890"
              y="38"
              fill="#57534E"
              fontSize="10"
              fontWeight="600"
              fontFamily="JetBrains Mono, monospace"
            >
              03 · DELIVERABLE DIFFERENZIATI
            </text>

            {/* CONNECTOR ARROWS */}
            <path
              d="M 250 116 L 298 116"
              fill="none"
              stroke="#1E3A8A"
              strokeWidth="1.8"
              markerEnd="url(#arrow-lapis)"
            />
            <text
              x="274"
              y="108"
              textAnchor="middle"
              fill="#57534E"
              fontSize="9.5"
              fontFamily="JetBrains Mono, monospace"
            >
              Trigger
            </text>

            <path
              d="M 426 196 L 426 242"
              fill="none"
              stroke="#1E3A8A"
              strokeWidth="1.8"
              markerEnd="url(#arrow-lapis)"
            />
            <text
              x="436"
              y="223"
              fill="#57534E"
              fontSize="9.5"
              fontFamily="JetBrains Mono, monospace"
            >
              JSON Step 1
            </text>

            <path
              d="M 250 322 L 298 322"
              fill="none"
              stroke="#1E3A8A"
              strokeWidth="1.8"
              markerEnd="url(#arrow-lapis)"
            />
            <text
              x="274"
              y="314"
              textAnchor="middle"
              fill="#57534E"
              fontSize="9.5"
              fontFamily="JetBrains Mono, monospace"
            >
              Clienti
            </text>

            <path
              d="M 552 322 L 602 322"
              fill="none"
              stroke="#1E3A8A"
              strokeWidth="1.8"
              markerEnd="url(#arrow-lapis)"
            />
            <text
              x="577"
              y="314"
              textAnchor="middle"
              fill="#57534E"
              fontSize="9.5"
              fontFamily="JetBrains Mono, monospace"
            >
              Impatto
            </text>

            <path
              d="M 722 404 L 722 448 L 426 448 L 426 404"
              fill="none"
              stroke="#B45309"
              strokeWidth="1.6"
              strokeDasharray="5 4"
              markerEnd="url(#arrow-amber)"
            />
            <rect
              x="490"
              y="436"
              width="178"
              height="22"
              rx="4"
              fill="#FBF9F5"
              stroke="#E5E0D5"
            />
            <text
              x="579"
              y="451"
              textAnchor="middle"
              fill="#B45309"
              fontSize="9.5"
              fontWeight="600"
              fontFamily="JetBrains Mono, monospace"
            >
              Rettifica / Note → Riesegui
            </text>

            <path
              d="M 842 322 L 888 322"
              fill="none"
              stroke="#15803D"
              strokeWidth="2"
              markerEnd="url(#arrow-green)"
            />
            <text
              x="865"
              y="314"
              textAnchor="middle"
              fill="#15803D"
              fontSize="9.5"
              fontWeight="600"
              fontFamily="JetBrains Mono, monospace"
            >
              Approva
            </text>

            <path
              d="M 1010 250 L 1010 198"
              fill="none"
              stroke="#1E3A8A"
              strokeWidth="1.8"
              markerEnd="url(#arrow-lapis)"
            />
            <text
              x="1020"
              y="228"
              fill="#57534E"
              fontSize="9.5"
              fontFamily="JetBrains Mono, monospace"
            >
              Registro tecnico
            </text>

            <path
              d="M 1010 394 L 1010 442"
              fill="none"
              stroke="#1E3A8A"
              strokeWidth="1.8"
              markerEnd="url(#arrow-lapis)"
            />
            <text
              x="1020"
              y="422"
              fill="#57534E"
              fontSize="9.5"
              fontFamily="JetBrains Mono, monospace"
            >
              Linguaggio chiaro
            </text>

            {/* NODE: Sorgente 1 */}
            <g
              onClick={() => setSelectedNode('doc1')}
              className="cursor-pointer"
            >
              <rect
                x="30"
                y="56"
                width="220"
                height="136"
                rx="6"
                fill="#FFFFFF"
                stroke={strokeFor('doc1', true)}
                strokeWidth={strokeWidthFor('doc1')}
              />
              <text
                x="44"
                y="78"
                fill="#1E3A8A"
                fontSize="10"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
              >
                SORGENTE 01
              </text>
              <text
                x="44"
                y="99"
                fill="#1C1917"
                fontSize="14"
                fontWeight="700"
                fontFamily="Playfair Display, serif"
              >
                Novità Giuridica
              </text>
              <text
                x="44"
                y="122"
                fill="#44403C"
                fontSize="11"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                • Qualsiasi materia del diritto
              </text>
              <text
                x="44"
                y="140"
                fill="#44403C"
                fontSize="11"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                • Ricerca Web · PDF · Testo · Esempi
              </text>
              <line x1="44" y1="156" x2="236" y2="156" stroke="#E5E0D5" />
              <text
                x="44"
                y="175"
                fill="#1E3A8A"
                fontSize="10.5"
                fontWeight="600"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                Avvio: Click «Cerca Novità»
              </text>
            </g>

            {/* NODE: Portafoglio Clienti */}
            <g
              onClick={() => setSelectedNode('doc2')}
              className="cursor-pointer"
            >
              <rect
                x="30"
                y="246"
                width="220"
                height="164"
                rx="6"
                fill="#FFFFFF"
                stroke={strokeFor('doc2', activeClients.length > 0)}
                strokeWidth={strokeWidthFor('doc2')}
              />
              <text
                x="44"
                y="268"
                fill="#1E3A8A"
                fontSize="10"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
              >
                PORTAFOGLIO
              </text>
              <text
                x="44"
                y="289"
                fill="#1C1917"
                fontSize="14"
                fontWeight="700"
                fontFamily="Playfair Display, serif"
              >
                Profili Clienti
              </text>
              <text
                x="44"
                y="310"
                fill="#57534E"
                fontSize="10.5"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                {activeClients.length}{' '}
                {activeClients.length === 1 ? 'cliente attivo' : 'clienti attivi'}:
              </text>
              {activeClients.slice(0, 3).map((client, idx) => (
                <text
                  key={client.id}
                  x="44"
                  y={332 + idx * 18}
                  fill="#1C1917"
                  fontSize="11"
                  fontWeight="500"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  • {truncateLabel(client.nome, 26)}
                </text>
              ))}
              {activeClients.length > 3 && (
                <text
                  x="44"
                  y={386}
                  fill="#57534E"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  + altri {activeClients.length - 3} clienti
                </text>
              )}
              <line x1="44" y1="392" x2="236" y2="392" stroke="#E5E0D5" />
              <text
                x="44"
                y="404"
                fill="#57534E"
                fontSize="9.5"
                fontFamily="JetBrains Mono, monospace"
              >
                Configurabile · Multisettore
              </text>
            </g>

            {/* OpenRouter Info Box */}
            <rect
              x="30"
              y="446"
              width="220"
              height="128"
              rx="6"
              fill="#FBF9F5"
              stroke="#E5E0D5"
            />
            <text
              x="44"
              y="468"
              fill="#57534E"
              fontSize="10"
              fontWeight="700"
              fontFamily="JetBrains Mono, monospace"
            >
              MOTORE AI · OPENROUTER
            </text>
            <text
              x="44"
              y="490"
              fill="#1C1917"
              fontSize="11.5"
              fontWeight="600"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              Scelta tra 6 modelli LLM:
            </text>
            <text
              x="44"
              y="510"
              fill="#44403C"
              fontSize="10.5"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              Claude 5.5 · GPT-6.1 · Gemini 4
            </text>
            <text
              x="44"
              y="527"
              fill="#44403C"
              fontSize="10.5"
              fontFamily="Plus Jakarta Sans, sans-serif"
            >
              DeepSeek V4 · Mistral 4 · Llama 4
            </text>
            <text
              x="44"
              y="554"
              fill="#1E3A8A"
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
            >
              {classification?.modelUsed
                ? truncateLabel(classification.modelUsed, 28)
                : 'Routing server-side /api/*'}
            </text>

            {/* NODE: Passaggio 1 */}
            <g
              onClick={() => setSelectedNode('step1')}
              className="cursor-pointer"
            >
              <rect
                x="302"
                y="56"
                width="248"
                height="136"
                rx="6"
                fill="#FFFFFF"
                stroke={strokeFor('step1', Boolean(classification))}
                strokeWidth={strokeWidthFor('step1')}
              />
              <text
                x="316"
                y="78"
                fill="#1E3A8A"
                fontSize="10"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
              >
                PASSAGGIO 01
              </text>
              <text
                x="536"
                y="78"
                textAnchor="end"
                fill={classification ? '#15803D' : '#57534E'}
                fontSize="10"
                fontWeight="600"
                fontFamily="JetBrains Mono, monospace"
              >
                {classification ? 'Completato' : 'Pronto'}
              </text>
              <text
                x="316"
                y="99"
                fill="#1C1917"
                fontSize="14"
                fontWeight="700"
                fontFamily="Playfair Display, serif"
              >
                Agente 1 · Classificatore
              </text>
              <text
                x="316"
                y="122"
                fill="#44403C"
                fontSize="11"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                • Materia, autorità, estremi atto
              </text>
              <text
                x="316"
                y="140"
                fill="#44403C"
                fontSize="11"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                • Obblighi / Indirizzi / Facoltà
              </text>
              <line x1="316" y1="156" x2="536" y2="156" stroke="#E5E0D5" />
              <text
                x="316"
                y="175"
                fill="#57534E"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
              >
                {classification
                  ? `${classification.precettiEstratti.length} precetti estratti`
                  : 'Output: JSON classificazione'}
              </text>
            </g>

            {/* NODE: Passaggio 2 */}
            <g
              onClick={() => setSelectedNode('step2')}
              className="cursor-pointer"
            >
              <rect
                x="302"
                y="246"
                width="248"
                height="154"
                rx="6"
                fill="#FFFFFF"
                stroke={strokeFor('step2', Boolean(impactEvaluation))}
                strokeWidth={strokeWidthFor('step2')}
              />
              <text
                x="316"
                y="268"
                fill="#1E3A8A"
                fontSize="10"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
              >
                PASSAGGIO 02
              </text>
              <text
                x="536"
                y="268"
                textAnchor="end"
                fill={impactEvaluation ? '#15803D' : '#57534E'}
                fontSize="10"
                fontWeight="600"
                fontFamily="JetBrains Mono, monospace"
              >
                {impactEvaluation ? 'Completato' : 'In attesa'}
              </text>
              <text
                x="316"
                y="289"
                fill="#1C1917"
                fontSize="14"
                fontWeight="700"
                fontFamily="Playfair Display, serif"
              >
                Agente 2 · Valutatore Impatto
              </text>
              <text
                x="316"
                y="312"
                fill="#44403C"
                fontSize="11"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                • Verifica applicabilità per materia
              </text>
              <text
                x="316"
                y="330"
                fill="#44403C"
                fontSize="11"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                • Ruoli, gap e scadenze per cliente
              </text>
              <text
                x="316"
                y="348"
                fill="#44403C"
                fontSize="11"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                • Risposta a «Cosa cambia lunedì?»
              </text>
              <line x1="316" y1="364" x2="536" y2="364" stroke="#E5E0D5" />
              <text
                x="316"
                y="383"
                fill="#57534E"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
              >
                {impactEvaluation
                  ? `Rischio: ${impactEvaluation.livelloComplessivoRischio}`
                  : 'Output: JSON impatto multi-cliente'}
              </text>
            </g>

            {/* NODE: Human-in-the-Loop Gate */}
            <g
              onClick={() => setSelectedNode('human')}
              className="cursor-pointer"
            >
              <polygon
                points="626,242 818,242 842,322 818,402 626,402 602,322"
                fill="#FFFFFF"
                stroke={
                  selectedNode === 'human'
                    ? '#1E3A8A'
                    : impactEvaluation
                    ? '#1E3A8A'
                    : '#D6CEBE'
                }
                strokeWidth={selectedNode === 'human' ? 2.4 : 1.8}
              />
              <text
                x="722"
                y="268"
                textAnchor="middle"
                fill="#1E3A8A"
                fontSize="10"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
              >
                CONTROLLO UMANO
              </text>
              <text
                x="722"
                y="292"
                textAnchor="middle"
                fill="#1C1917"
                fontSize="15"
                fontWeight="700"
                fontFamily="Playfair Display, serif"
              >
                Revisione Giurista
              </text>
              <text
                x="722"
                y="316"
                textAnchor="middle"
                fill="#44403C"
                fontSize="11"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                1. Verifica rischi e norme
              </text>
              <text
                x="722"
                y="335"
                textAnchor="middle"
                fill="#44403C"
                fontSize="11"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                2. Inserisce note o rettifiche
              </text>
              <text
                x="722"
                y="354"
                textAnchor="middle"
                fill="#44403C"
                fontSize="11"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                3. Approva o riesegue Step 2
              </text>
              <line x1="636" y1="368" x2="808" y2="368" stroke="#E5E0D5" />
              <text
                x="722"
                y="386"
                textAnchor="middle"
                fill="#15803D"
                fontSize="10"
                fontWeight="600"
                fontFamily="JetBrains Mono, monospace"
              >
                Gate obbligatorio pre-invio
              </text>
            </g>

            {/* NODE: Passaggio 3 */}
            <g
              onClick={() => setSelectedNode('step3')}
              className="cursor-pointer"
            >
              <rect
                x="892"
                y="250"
                width="236"
                height="144"
                rx="6"
                fill="#FFFFFF"
                stroke={strokeFor('step3', Boolean(deliverables))}
                strokeWidth={strokeWidthFor('step3')}
              />
              <text
                x="906"
                y="272"
                fill="#1E3A8A"
                fontSize="10"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
              >
                PASSAGGIO 03
              </text>
              <text
                x="1114"
                y="272"
                textAnchor="end"
                fill={deliverables ? '#15803D' : '#57534E'}
                fontSize="10"
                fontWeight="600"
                fontFamily="JetBrains Mono, monospace"
              >
                {deliverables ? 'Pronto' : 'In attesa'}
              </text>
              <text
                x="906"
                y="294"
                fill="#1C1917"
                fontSize="14"
                fontWeight="700"
                fontFamily="Playfair Display, serif"
              >
                Agente 3 · Redattore
              </text>
              <text
                x="906"
                y="318"
                fill="#44403C"
                fontSize="11"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                • Sdoppiamento registri di scrittura
              </text>
              <text
                x="906"
                y="336"
                fill="#44403C"
                fontSize="11"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                • 1 Nota tecnica + {activeClients.length} Alert chiari
              </text>
              <line x1="906" y1="354" x2="1114" y2="354" stroke="#E5E0D5" />
              <text
                x="906"
                y="374"
                fill="#57534E"
                fontSize="10"
                fontFamily="JetBrains Mono, monospace"
              >
                Modifica inline + Export .md / PDF
              </text>
            </g>

            {/* NODE: Deliverable 3A */}
            <g
              onClick={() => setSelectedNode('nota')}
              className="cursor-pointer"
            >
              <rect
                x="892"
                y="56"
                width="236"
                height="136"
                rx="6"
                fill="#FBF9F5"
                stroke={strokeFor('nota', Boolean(deliverables?.notaTecnicaInterna))}
                strokeWidth={strokeWidthFor('nota')}
              />
              <text
                x="906"
                y="78"
                fill="#57534E"
                fontSize="10"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
              >
                DELIVERABLE 3A · STUDIO
              </text>
              <text
                x="906"
                y="99"
                fill="#1C1917"
                fontSize="14"
                fontWeight="700"
                fontFamily="Playfair Display, serif"
              >
                Nota Tecnica Interna
              </text>
              <text
                x="906"
                y="122"
                fill="#44403C"
                fontSize="11"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                • Fonti normative e giurisprudenza
              </text>
              <text
                x="906"
                y="140"
                fill="#44403C"
                fontSize="11"
                fontFamily="Plus Jakarta Sans, sans-serif"
              >
                • Piano operativo «Lunedì mattina»
              </text>
              <line x1="906" y1="156" x2="1114" y2="156" stroke="#E5E0D5" />
              <text
                x="906"
                y="175"
                fill="#1E3A8A"
                fontSize="10"
                fontWeight="600"
                fontFamily="JetBrains Mono, monospace"
              >
                Destinatari: Colleghi dello Studio
              </text>
            </g>

            {/* NODE: Deliverable 3B */}
            <g
              onClick={() => setSelectedNode('alerts')}
              className="cursor-pointer"
            >
              <rect
                x="892"
                y="446"
                width="236"
                height="134"
                rx="6"
                fill="#FBF9F5"
                stroke={strokeFor(
                  'alerts',
                  Boolean(deliverables?.alertClienti?.length)
                )}
                strokeWidth={strokeWidthFor('alerts')}
              />
              <text
                x="906"
                y="468"
                fill="#1E3A8A"
                fontSize="10"
                fontWeight="700"
                fontFamily="JetBrains Mono, monospace"
              >
                DELIVERABLE 3B · {activeClients.length} ALERT
              </text>
              <text
                x="906"
                y="489"
                fill="#1C1917"
                fontSize="14"
                fontWeight="700"
                fontFamily="Playfair Display, serif"
              >
                Alert Clienti Chiari
              </text>
              {activeClients.slice(0, 2).map((client, idx) => (
                <text
                  key={client.id}
                  x="906"
                  y={512 + idx * 17}
                  fill="#44403C"
                  fontSize="11"
                  fontFamily="Plus Jakarta Sans, sans-serif"
                >
                  • {truncateLabel(client.nome, 28)}
                </text>
              ))}
              {activeClients.length > 2 && (
                <text
                  x="906"
                  y={546}
                  fill="#57534E"
                  fontSize="10"
                  fontFamily="JetBrains Mono, monospace"
                >
                  + altri {activeClients.length - 2} alert dedicati
                </text>
              )}
              <line x1="906" y1="552" x2="1114" y2="552" stroke="#E5E0D5" />
              <text
                x="906"
                y="568"
                fill="#15803D"
                fontSize="10"
                fontWeight="600"
                fontFamily="JetBrains Mono, monospace"
              >
                Senza gergo · Pronti lunedì mattina
              </text>
            </g>
          </svg>
        </div>

        {/* Interactive Node Inspector Strip */}
        <section
          aria-label="Dettaglio nodo selezionato"
          className="no-print rounded-md border border-[#D6CEBE] bg-[#F3EFE6]/70 p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-start"
        >
          <div className="md:col-span-4 space-y-1">
            <p className="font-mono text-xs uppercase tracking-wider text-[#1E3A8A]">
              Nodo Selezionato nel Grafico
            </p>
            <h3 className="font-serif text-lg font-semibold text-[#1C1917]">
              {activeDetail.titolo}
            </h3>
            <p className="text-xs text-[#57534E]">{activeDetail.ruolo}</p>
          </div>
          <div className="md:col-span-5 space-y-1.5 text-xs text-[#44403C]">
            <p>
              <span className="font-semibold text-[#1C1917]">Input:</span>{' '}
              {activeDetail.input}
            </p>
            <p>
              <span className="font-semibold text-[#1C1917]">Output:</span>{' '}
              {activeDetail.output}
            </p>
          </div>
          <div className="md:col-span-3 rounded border border-[#E5E0D5] bg-white p-3 text-xs">
            <p className="font-mono text-[11px] uppercase tracking-wider text-[#57534E]">
              Stato Sessione
            </p>
            <p className="mt-1 font-medium text-[#1C1917] leading-relaxed">
              {activeDetail.statoLive}
            </p>
          </div>
        </section>

        {/* Compact Responsibility Matrix (Chi fa cosa) */}
        <section className="space-y-2 pt-1 print-break-inside-avoid">
          <p className="font-mono text-xs uppercase tracking-wider text-[#57534E]">
            Sintesi Operativa · Chi fa cosa, con quali fonti e dove interviene l’uomo
          </p>
          <div className="overflow-x-auto rounded-md border border-[#E5E0D5]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F3EFE6] text-[#57534E]">
                <tr>
                  <th className="px-3.5 py-2 font-medium">Modulo</th>
                  <th className="px-3.5 py-2 font-medium">Fonti utilizzate</th>
                  <th className="px-3.5 py-2 font-medium">Compito eseguito</th>
                  <th className="px-3.5 py-2 font-medium">
                    Intervento del Professionista
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D5]">
                <tr>
                  <td className="px-3.5 py-2 font-semibold text-[#1C1917] align-top">
                    <span className="inline-flex items-center gap-1.5">
                      <Scale className="h-3.5 w-3.5 text-[#1E3A8A]" aria-hidden="true" />
                      <span>Agente 1 · Trigger</span>
                    </span>
                  </td>
                  <td className="px-3.5 py-2 text-[#44403C] align-top">
                    Sorgente 1 (Web / PDF / Testo / Esempi)
                  </td>
                  <td className="px-3.5 py-2 text-[#44403C] align-top">
                    Materia, estremi atto e precetti Obbligo / Indirizzo / Facoltà
                  </td>
                  <td className="px-3.5 py-2 text-[#44403C] align-top">
                    Sceglie argomento, fonte e modello LLM; avvia «Cerca Novità»
                  </td>
                </tr>
                <tr>
                  <td className="px-3.5 py-2 font-semibold text-[#1C1917] align-top">
                    <span className="inline-flex items-center gap-1.5">
                      <UserCheck className="h-3.5 w-3.5 text-[#1E3A8A]" aria-hidden="true" />
                      <span>Agente 2 · Impatto</span>
                    </span>
                  </td>
                  <td className="px-3.5 py-2 text-[#44403C] align-top">
                    Output Step 1 + Portafoglio Clienti
                  </td>
                  <td className="px-3.5 py-2 text-[#44403C] align-top">
                    Applicabilità per materia, ruoli e azioni «Cosa cambia lunedì?»
                  </td>
                  <td className="px-3.5 py-2 font-medium text-[#1E3A8A] align-top">
                    Modifica profili cliente o inserisce note nel checkpoint
                  </td>
                </tr>
                <tr>
                  <td className="px-3.5 py-2 font-semibold text-[#1C1917] align-top">
                    <span className="inline-flex items-center gap-1.5">
                      <Send className="h-3.5 w-3.5 text-[#1E3A8A]" aria-hidden="true" />
                      <span>Agente 3 · Deliverable</span>
                    </span>
                  </td>
                  <td className="px-3.5 py-2 text-[#44403C] align-top">
                    Output Step 1 + Step 2 validato
                  </td>
                  <td className="px-3.5 py-2 text-[#44403C] align-top">
                    1 Nota Tecnica Interna + {activeClients.length} Alert in linguaggio chiaro
                  </td>
                  <td className="px-3.5 py-2 font-medium text-[#1E3A8A] align-top">
                    Revisiona/edita il testo, approva ed esporta per l’invio
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </article>

      {/* Generated Infographic: Agent Prompts & Activities in server.ts */}
      <section className="rounded-lg border border-[#E5E0D5] bg-white p-6 sm:p-8 space-y-4 print-break-inside-avoid">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E5E0D5] pb-4">
          <div>
            <p className="font-mono text-xs uppercase tracking-wider text-[#57534E]">
              Mappa dei Prompt & Contratti JSON · server.ts
            </p>
            <h2 className="mt-1 font-serif text-xl font-semibold text-[#1C1917]">
              Infografica Attività e Prompt degli Agenti
            </h2>
          </div>
          <a
            href={agentPromptsImg}
            download="lexpulse-agent-prompts-server.jpg"
            className="no-print inline-flex items-center gap-1.5 rounded-md border border-[#D6CEBE] bg-[#FBF9F5] px-3.5 py-2 text-xs font-medium text-[#1C1917] hover:bg-[#F3EFE6] transition-colors whitespace-nowrap"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Scarica Infografica (.jpg)</span>
          </a>
        </div>

        <div className="overflow-hidden rounded-md border border-[#E5E0D5] bg-[#FBF9F5]">
          <img
            src={agentPromptsImg}
            alt="Infografica dell'architettura dei prompt e delle attività dei tre agenti in server.ts: Agente 1 Classificatore, Agente 2 Valutatore Impatto, Checkpoint Giurista e Agente 3 Redattore"
            referrerPolicy="no-referrer"
            className="w-full h-auto block"
          />
        </div>
      </section>
    </div>
  );
}
