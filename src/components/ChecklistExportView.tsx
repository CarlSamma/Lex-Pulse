import { CheckSquare, Square, Download, Printer, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import {
  ChecklistItem,
  ClassificationResult,
  DeliverablesPackage,
  PortfolioImpactEvaluation,
} from '../types/legal';
import {
  copyTextWithFallback,
  downloadTextFile,
  formatAlertClienteMarkdown,
  formatFullDossierMarkdown,
  formatNotaInternaMarkdown,
} from '../utils/exportDeliverables';

interface ChecklistExportViewProps {
  checklist: ChecklistItem[];
  onToggleItem: (id: string) => void;
  classification: ClassificationResult | null;
  impactEvaluation: PortfolioImpactEvaluation | null;
  deliverables: DeliverablesPackage | null;
}

const QUALITY_CRITERIA = [
  {
    area: 'Pertinenza giuridica multidisciplinare',
    peso: 'Passaggio 01',
    dettaglio:
      'Individuazione corretta della materia, degli estremi dell’atto o della pronuncia, dell’ambito soggettivo e della distinzione tra obblighi, indirizzi e facoltà.',
  },
  {
    area: 'Valutazione d’impatto per portafoglio',
    peso: 'Passaggio 02',
    dettaglio:
      'Verifica concreta per ciascun cliente attivo (inclusa la motivata esclusione se non applicabile), senza forzare profili o normative estranee al tema.',
  },
  {
    area: 'Utilità operativa («Lunedì mattina»)',
    peso: 'Trasversale',
    dettaglio:
      'Scadenze, priorità e azioni immediate chiare sia per i colleghi dello Studio sia per i destinatari aziendali o istituzionali.',
  },
  {
    area: 'Registri differenziati & supervisione umana',
    peso: 'Passaggio 03',
    dettaglio:
      'Nota Tecnica Interna rigorosa per i giuristi e Alert separati privi di gergo per i clienti, sempre revisionabili prima dell’invio.',
  },
];

export function ChecklistExportView({
  checklist,
  onToggleItem,
  classification,
  impactEvaluation,
  deliverables,
}: ChecklistExportViewProps) {
  const [copiedDossier, setCopiedDossier] = useState(false);

  const fullMarkdown = formatFullDossierMarkdown({
    classification,
    impact: impactEvaluation,
    deliverables,
    checklist,
  });

  const completedCount = checklist.filter((c) => c.checked).length;

  const handleCopyFull = async () => {
    const ok = await copyTextWithFallback(fullMarkdown);
    if (ok) {
      setCopiedDossier(true);
      setTimeout(() => setCopiedDossier(false), 2000);
    }
  };

  return (
    <div className="mx-auto max-w-[1380px] px-6 py-8 space-y-8">
      <div className="no-print flex flex-wrap items-end justify-between gap-4 border-b border-[#E5E0D5] pb-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-[#57534E]">
            Verifica Finale · Controllo Qualità & Consegna
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-[#1C1917]">
            Checklist di Revisione ed Export Dossier
          </h1>
          <p className="mt-1.5 text-sm text-[#57534E] tabular-nums">
            {completedCount} su {checklist.length} verifiche completate prima della
            consegna o dell’invio ai clienti.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyFull}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#D6CEBE] bg-white px-3.5 py-2 text-xs font-medium text-[#1C1917] hover:bg-[#F3EFE6] cursor-pointer"
          >
            {copiedDossier ? (
              <Check className="h-3.5 w-3.5 text-[#15803D]" aria-hidden="true" />
            ) : (
              <Copy className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{copiedDossier ? 'Dossier Copiato' : 'Copia Dossier (.md)'}</span>
          </button>

          <button
            type="button"
            onClick={() =>
              downloadTextFile('dossier-lexpulse.md', fullMarkdown)
            }
            className="inline-flex items-center gap-1.5 rounded-md bg-[#1E3A8A] px-4 py-2 text-xs font-semibold text-white hover:bg-[#172E6E] cursor-pointer"
          >
            <Download className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Scarica Dossier Completo (.md)</span>
          </button>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#D6CEBE] bg-white px-3.5 py-2 text-xs font-medium text-[#1C1917] hover:bg-[#F3EFE6] cursor-pointer"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Stampa / PDF</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left 7 cols: Interactive Checklist */}
        <section className="lg:col-span-7 rounded-lg border border-[#E5E0D5] bg-white p-6 space-y-4 print-only-full">
          <div className="border-b border-[#E5E0D5] pb-3 flex items-baseline justify-between gap-2">
            <div>
              <p className="font-mono text-xs uppercase tracking-wider text-[#57534E]">
                Autovalutazione Professionale
              </p>
              <h2 className="mt-1 font-serif text-xl font-semibold text-[#1C1917]">
                Controllo di Qualità Prima dell’Invio
              </h2>
            </div>
            <span className="font-mono text-xs font-semibold text-[#1E3A8A] tabular-nums">
              {completedCount}/{checklist.length}
            </span>
          </div>

          <div className="divide-y divide-[#E5E0D5]">
            {checklist.map((item) => {
              const autoConditionMet =
                (item.id === 'chk-1' && Boolean(classification)) ||
                (item.id === 'chk-2' && Boolean(impactEvaluation)) ||
                (item.id === 'chk-3' &&
                  Boolean(
                    impactEvaluation?.cosaCambiaLunediStudio?.length &&
                      deliverables?.notaTecnicaInterna?.cosaCambiaLunediMattinaStudio
                  )) ||
                (item.id === 'chk-4' && Boolean(deliverables?.notaTecnicaInterna)) ||
                (item.id === 'chk-5' &&
                  Boolean(deliverables?.alertClienti?.length));

              return (
                <div key={item.id} className="py-3.5 flex items-start gap-3">
                  <button
                    type="button"
                    onClick={() => onToggleItem(item.id)}
                    aria-pressed={item.checked}
                    aria-label={item.label}
                    className="mt-0.5 text-[#1E3A8A] shrink-0 cursor-pointer"
                  >
                    {item.checked ? (
                      <CheckSquare className="h-5 w-5" aria-hidden="true" />
                    ) : (
                      <Square className="h-5 w-5 text-[#78716C]" aria-hidden="true" />
                    )}
                  </button>
                  <div className="flex-1 space-y-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-2">
                      <span
                        className={`text-sm font-semibold ${
                          item.checked ? 'text-[#1C1917]' : 'text-[#44403C]'
                        }`}
                      >
                        {item.label}
                      </span>
                      <span
                        className={`font-mono text-xs ${
                          autoConditionMet ? 'text-[#15803D]' : 'text-[#78716C]'
                        }`}
                      >
                        {autoConditionMet
                          ? 'Verificato nella sessione'
                          : 'In attesa di esecuzione'}
                      </span>
                    </div>
                    <p className="text-xs text-[#57534E] leading-relaxed">
                      {item.criterio}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Right 5 cols: Individual Exports + Quality Reference */}
        <div className="lg:col-span-5 space-y-6 no-print">
          <section className="rounded-lg border border-[#E5E0D5] bg-white p-6 space-y-4">
            <div className="border-b border-[#E5E0D5] pb-3">
              <p className="font-mono text-xs uppercase tracking-wider text-[#57534E]">
                Esportazione Singoli Documenti
              </p>
              <h2 className="mt-1 font-serif text-lg font-semibold text-[#1C1917]">
                File pronti per la consegna
              </h2>
            </div>

            {!deliverables ? (
              <p className="text-xs text-[#57534E] leading-relaxed">
                Esegui la pipeline da «Cerca Novità» per sbloccare il download
                individuale di Nota Tecnica Interna e Alert Clienti.
              </p>
            ) : (
              <div className="space-y-2">
                <button
                  type="button"
                  onClick={() =>
                    downloadTextFile(
                      'nota-tecnica-interna.md',
                      formatNotaInternaMarkdown(deliverables)
                    )
                  }
                  className="w-full flex items-center justify-between rounded-md border border-[#E5E0D5] bg-[#FBF9F5] px-3.5 py-2.5 text-left text-xs font-medium text-[#1C1917] hover:border-[#1E3A8A] cursor-pointer"
                >
                  <span>Nota Tecnica Interna (Studio Legale)</span>
                  <Download className="h-3.5 w-3.5 text-[#1E3A8A]" aria-hidden="true" />
                </button>

                {deliverables.alertClienti.map((alert) => (
                  <button
                    key={alert.clientId}
                    type="button"
                    onClick={() =>
                      downloadTextFile(
                        `alert-${alert.clientId}.md`,
                        formatAlertClienteMarkdown(alert)
                      )
                    }
                    className="w-full flex items-center justify-between rounded-md border border-[#E5E0D5] bg-[#FBF9F5] px-3.5 py-2.5 text-left text-xs font-medium text-[#1C1917] hover:border-[#1E3A8A] cursor-pointer"
                  >
                    <span>Alert · {alert.nomeCliente}</span>
                    <Download
                      className="h-3.5 w-3.5 text-[#1E3A8A]"
                      aria-hidden="true"
                    />
                  </button>
                ))}
              </div>
            )}
          </section>

          <section className="rounded-lg border border-[#E5E0D5] bg-[#F3EFE6]/70 p-6 space-y-3">
            <p className="font-mono text-xs uppercase tracking-wider text-[#57534E]">
              Criteri Metodologici dello Studio
            </p>
            <div className="divide-y divide-[#E5E0D5]">
              {QUALITY_CRITERIA.map((r) => (
                <div key={r.area} className="py-2.5 space-y-1">
                  <div className="flex items-baseline justify-between gap-2 text-xs">
                    <span className="font-semibold text-[#1C1917]">{r.area}</span>
                    <span className="font-mono text-[#1E3A8A] tabular-nums">
                      {r.peso}
                    </span>
                  </div>
                  <p className="text-xs text-[#57534E] leading-relaxed">
                    {r.dettaglio}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
