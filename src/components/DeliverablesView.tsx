import { useState } from 'react';
import { Copy, Check, Download, Printer, ArrowLeft, Pencil } from 'lucide-react';
import { DeliverablesPackage } from '../types/legal';
import {
  copyTextWithFallback,
  downloadTextFile,
  formatAlertClienteMarkdown,
  formatNotaInternaMarkdown,
} from '../utils/exportDeliverables';

interface DeliverablesViewProps {
  deliverables: DeliverablesPackage | null;
  onUpdateDeliverables: (updated: DeliverablesPackage) => void;
  onBackToPipeline: () => void;
}

type DeliverableTab = 'split' | 'nota' | string;

export function DeliverablesView({
  deliverables,
  onUpdateDeliverables,
  onBackToPipeline,
}: DeliverablesViewProps) {
  const [activeTab, setActiveTab] = useState<DeliverableTab>('split');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editingNota, setEditingNota] = useState(false);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);

  if (!deliverables) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16 text-center space-y-4">
        <p className="font-mono text-xs uppercase tracking-wider text-[#57534E]">
          Passaggio 03 · Nessun deliverable generato
        </p>
        <h1 className="font-serif text-3xl font-semibold text-[#1C1917]">
          Esegui prima la pipeline da «Cerca Novità»
        </h1>
        <p className="text-sm text-[#57534E] leading-relaxed">
          Una volta completati i tre passaggi, troverai qui la Nota Tecnica
          Interna per i colleghi dello studio e gli Alert dedicati per ciascun
          cliente assistito.
        </p>
        <button
          type="button"
          onClick={onBackToPipeline}
          className="inline-flex items-center gap-2 rounded-md bg-[#1E3A8A] px-4 py-2 text-sm font-medium text-white hover:bg-[#172E6E] cursor-pointer"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
          <span>Torna a Scenario & Pipeline</span>
        </button>
      </div>
    );
  }

  const { notaTecnicaInterna: nota, alertClienti } = deliverables;

  const copyContent = async (key: string, text: string) => {
    const ok = await copyTextWithFallback(text);
    if (ok) {
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    }
  };

  const updateNotaField = (
    field: 'sintesiEsecutiva' | 'inquadramentoNormativo' | 'cosaCambiaLunediMattinaStudio',
    value: string
  ) => {
    onUpdateDeliverables({
      ...deliverables,
      notaTecnicaInterna: {
        ...nota,
        [field]: value,
      },
    });
  };

  const updateAlertField = (
    clientId: string,
    field:
      | 'oggettoEmail'
      | 'aperturaChiara'
      | 'cosaSuccedeSenzaTecnicismi'
      | 'cosaCambiaLunediMattina'
      | 'propostaSupportoStudio',
    value: string
  ) => {
    onUpdateDeliverables({
      ...deliverables,
      alertClienti: alertClienti.map((a) =>
        a.clientId === clientId ? { ...a, [field]: value } : a
      ),
    });
  };

  const renderNota = () => (
    <article className="rounded-lg border border-[#E5E0D5] bg-white p-7 sm:p-9 space-y-6 print-only-full">
      <header className="border-b border-[#E5E0D5] pb-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs uppercase tracking-wider text-[#57534E]">
            Uso Interno Studio · Nota Tecnica Giuridica
          </p>
          <div className="no-print flex items-center gap-2">
            <button
              type="button"
              onClick={() => setEditingNota((v) => !v)}
              className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-medium cursor-pointer ${
                editingNota
                  ? 'border-[#1E3A8A] bg-[#1E3A8A]/5 text-[#1E3A8A]'
                  : 'border-[#E5E0D5] text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
              <span>{editingNota ? 'Fine modifica' : 'Modifica'}</span>
            </button>
            <button
              type="button"
              onClick={() =>
                copyContent('nota', formatNotaInternaMarkdown(deliverables))
              }
              className="inline-flex items-center gap-1 rounded border border-[#E5E0D5] px-2.5 py-1 text-xs font-medium text-[#57534E] hover:text-[#1C1917] cursor-pointer"
            >
              {copiedKey === 'nota' ? (
                <Check className="h-3.5 w-3.5 text-[#15803D]" aria-hidden="true" />
              ) : (
                <Copy className="h-3.5 w-3.5" aria-hidden="true" />
              )}
              <span>{copiedKey === 'nota' ? 'Copiato' : 'Copia'}</span>
            </button>
            <button
              type="button"
              onClick={() =>
                downloadTextFile(
                  'nota-tecnica-interna.md',
                  formatNotaInternaMarkdown(deliverables)
                )
              }
              className="inline-flex items-center gap-1 rounded border border-[#E5E0D5] px-2.5 py-1 text-xs font-medium text-[#57534E] hover:text-[#1C1917] cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" aria-hidden="true" />
              <span>.md</span>
            </button>
          </div>
        </div>

        <h2 className="mt-3 font-serif text-2xl sm:text-3xl font-semibold text-[#1C1917]">
          {nota.intestazione}
        </h2>
        <p className="mt-2 font-mono text-xs text-[#57534E] tabular-nums">
          {nota.data} · Oggetto: {nota.oggetto}
          {deliverables.modelUsed ? ` · Modello: ${deliverables.modelUsed}` : ''}
        </p>
      </header>

      <div className="space-y-5 max-w-[75ch] text-sm leading-relaxed text-[#1C1917]">
        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
            Sintesi Esecutiva
          </h3>
          {editingNota ? (
            <textarea
              rows={3}
              value={nota.sintesiEsecutiva}
              onChange={(e) =>
                updateNotaField('sintesiEsecutiva', e.target.value)
              }
              className="mt-1.5 w-full rounded border border-[#D6CEBE] bg-[#FBF9F5] p-2.5 text-sm leading-relaxed text-[#1C1917] focus:border-[#1E3A8A] focus:outline-none"
            />
          ) : (
            <p className="mt-1.5">{nota.sintesiEsecutiva}</p>
          )}
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
            Inquadramento Normativo
          </h3>
          {editingNota ? (
            <textarea
              rows={5}
              value={nota.inquadramentoNormativo}
              onChange={(e) =>
                updateNotaField('inquadramentoNormativo', e.target.value)
              }
              className="mt-1.5 w-full rounded border border-[#D6CEBE] bg-[#FBF9F5] p-2.5 text-sm leading-relaxed text-[#1C1917] focus:border-[#1E3A8A] focus:outline-none"
            />
          ) : (
            <p className="mt-1.5 whitespace-pre-line">
              {nota.inquadramentoNormativo}
            </p>
          )}
        </section>

        <section className="space-y-4">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
            Analisi Tecnica per Fascicolo Cliente
          </h3>
          <div className="divide-y divide-[#E5E0D5] rounded-md border border-[#E5E0D5]">
            {nota.analisiDettagliataPerCliente.map((item, idx) => (
              <div key={idx} className="p-4 space-y-2">
                <h4 className="font-serif text-base font-semibold text-[#1C1917]">
                  {item.nomeCliente}
                </h4>
                <p className="text-xs leading-relaxed text-[#44403C]">
                  <span className="font-semibold text-[#1C1917]">
                    Qualificazione giuridica:
                  </span>{' '}
                  {item.qualificazioneGiuridica}
                </p>
                <p className="text-xs leading-relaxed text-[#44403C]">
                  <span className="font-semibold text-[#1C1917]">
                    Profili di rischio:
                  </span>{' '}
                  {item.profiliDiRischio}
                </p>
                <p className="text-xs leading-relaxed text-[#44403C]">
                  <span className="font-semibold text-[#1C1917]">
                    Adempimenti e decorrenze:
                  </span>{' '}
                  {item.adempimentiEDecorrenze}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-[#D6CEBE] bg-[#F3EFE6]/75 p-4 space-y-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1E3A8A]">
            Cosa cambia lunedì mattina per lo Studio?
          </h3>
          {editingNota ? (
            <textarea
              rows={3}
              value={nota.cosaCambiaLunediMattinaStudio}
              onChange={(e) =>
                updateNotaField('cosaCambiaLunediMattinaStudio', e.target.value)
              }
              className="w-full rounded border border-[#D6CEBE] bg-white p-2.5 text-sm leading-relaxed text-[#1C1917] focus:border-[#1E3A8A] focus:outline-none"
            />
          ) : (
            <p className="text-sm leading-relaxed text-[#1C1917]">
              {nota.cosaCambiaLunediMattinaStudio}
            </p>
          )}
        </section>

        <section>
          <h3 className="text-xs font-semibold uppercase tracking-wider text-[#57534E] mb-2">
            Piano d’Azione Operativo di Studio
          </h3>
          <div className="overflow-x-auto rounded-md border border-[#E5E0D5]">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-[#F3EFE6] text-[#57534E]">
                <tr>
                  <th className="px-3 py-2 font-medium">Priorità</th>
                  <th className="px-3 py-2 font-medium">Cliente</th>
                  <th className="px-3 py-2 font-medium">Attività da avviare</th>
                  <th className="px-3 py-2 font-medium">Referente</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E0D5]">
                {nota.pianoAzioneStudioLunedi.map((row, idx) => (
                  <tr key={idx}>
                    <td
                      className={`px-3 py-2.5 font-mono font-semibold whitespace-nowrap align-top ${
                        row.priorita.includes('Immediata')
                          ? 'text-[#B91C1C]'
                          : row.priorita.includes('Breve')
                          ? 'text-[#B45309]'
                          : 'text-[#1E3A8A]'
                      }`}
                    >
                      {row.priorita}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-[#1C1917] align-top">
                      {row.clienteRiferimento}
                    </td>
                    <td className="px-3 py-2.5 text-[#44403C] leading-relaxed">
                      {row.azione}
                    </td>
                    <td className="px-3 py-2.5 text-[#57534E] align-top">
                      {row.responsabileConsigliato}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </article>
  );

  const renderAlert = (alert: (typeof alertClienti)[number], idx: number) => {
    const key = `alert-${alert.clientId}`;
    const isEditing = editingAlertId === alert.clientId;
    return (
      <article
        key={alert.clientId}
        className="rounded-lg border border-[#E5E0D5] bg-white p-7 sm:p-9 space-y-5 print-only-full print-break-inside-avoid"
      >
        <header className="border-b border-[#E5E0D5] pb-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="font-mono text-xs uppercase tracking-wider text-[#1E3A8A]">
              Alert Cliente 0{idx + 1} · Linguaggio Chiaro & Strategico
            </p>
            <div className="no-print flex items-center gap-2">
              <button
                type="button"
                onClick={() =>
                  setEditingAlertId(isEditing ? null : alert.clientId)
                }
                className={`inline-flex items-center gap-1 rounded border px-2.5 py-1 text-xs font-medium cursor-pointer ${
                  isEditing
                    ? 'border-[#1E3A8A] bg-[#1E3A8A]/5 text-[#1E3A8A]'
                    : 'border-[#E5E0D5] text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{isEditing ? 'Fine modifica' : 'Modifica'}</span>
              </button>
              <button
                type="button"
                onClick={() => copyContent(key, formatAlertClienteMarkdown(alert))}
                className="inline-flex items-center gap-1 rounded border border-[#E5E0D5] px-2.5 py-1 text-xs font-medium text-[#57534E] hover:text-[#1C1917] cursor-pointer"
              >
                {copiedKey === key ? (
                  <Check
                    className="h-3.5 w-3.5 text-[#15803D]"
                    aria-hidden="true"
                  />
                ) : (
                  <Copy className="h-3.5 w-3.5" aria-hidden="true" />
                )}
                <span>{copiedKey === key ? 'Copiato' : 'Copia'}</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  downloadTextFile(
                    `alert-${alert.clientId}.md`,
                    formatAlertClienteMarkdown(alert)
                  )
                }
                className="inline-flex items-center gap-1 rounded border border-[#E5E0D5] px-2.5 py-1 text-xs font-medium text-[#57534E] hover:text-[#1C1917] cursor-pointer"
              >
                <Download className="h-3.5 w-3.5" aria-hidden="true" />
                <span>.md</span>
              </button>
            </div>
          </div>

          <h2 className="mt-3 font-serif text-2xl font-semibold text-[#1C1917]">
            {alert.nomeCliente}
          </h2>
          {isEditing ? (
            <div className="mt-2 space-y-1">
              <label className="block text-xs font-medium text-[#57534E]">
                Oggetto email (a {alert.destinatario})
              </label>
              <input
                type="text"
                value={alert.oggettoEmail}
                onChange={(e) =>
                  updateAlertField(alert.clientId, 'oggettoEmail', e.target.value)
                }
                className="w-full rounded border border-[#D6CEBE] bg-[#FBF9F5] px-2.5 py-1.5 text-xs text-[#1C1917] focus:border-[#1E3A8A] focus:outline-none"
              />
            </div>
          ) : (
            <p className="mt-1.5 text-xs text-[#57534E]">
              A:{' '}
              <span className="font-medium text-[#1C1917]">
                {alert.destinatario}
              </span>{' '}
              · Oggetto:{' '}
              <span className="font-medium text-[#1C1917]">
                {alert.oggettoEmail}
              </span>
            </p>
          )}
        </header>

        <div className="space-y-4 max-w-[75ch] text-sm leading-relaxed text-[#1C1917]">
          {isEditing ? (
            <textarea
              rows={2}
              value={alert.aperturaChiara}
              onChange={(e) =>
                updateAlertField(alert.clientId, 'aperturaChiara', e.target.value)
              }
              className="w-full rounded border border-[#D6CEBE] bg-[#FBF9F5] p-2.5 text-sm font-medium text-[#1C1917] focus:border-[#1E3A8A] focus:outline-none"
            />
          ) : (
            <p className="font-medium">{alert.aperturaChiara}</p>
          )}

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
              Che cosa è successo
            </h3>
            {isEditing ? (
              <textarea
                rows={4}
                value={alert.cosaSuccedeSenzaTecnicismi}
                onChange={(e) =>
                  updateAlertField(
                    alert.clientId,
                    'cosaSuccedeSenzaTecnicismi',
                    e.target.value
                  )
                }
                className="mt-1.5 w-full rounded border border-[#D6CEBE] bg-[#FBF9F5] p-2.5 text-sm text-[#1C1917] focus:border-[#1E3A8A] focus:outline-none"
              />
            ) : (
              <p className="mt-1.5">{alert.cosaSuccedeSenzaTecnicismi}</p>
            )}
          </section>

          <section className="rounded-md border border-[#D6CEBE] bg-[#F3EFE6]/75 p-4 space-y-1.5">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#1E3A8A]">
              Cosa cambia lunedì mattina?
            </h3>
            {isEditing ? (
              <textarea
                rows={3}
                value={alert.cosaCambiaLunediMattina}
                onChange={(e) =>
                  updateAlertField(
                    alert.clientId,
                    'cosaCambiaLunediMattina',
                    e.target.value
                  )
                }
                className="w-full rounded border border-[#D6CEBE] bg-white p-2.5 text-sm text-[#1C1917] focus:border-[#1E3A8A] focus:outline-none"
              />
            ) : (
              <p className="text-sm leading-relaxed text-[#1C1917]">
                {alert.cosaCambiaLunediMattina}
              </p>
            )}
          </section>

          <section>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
              Cosa vi consigliamo di fare subito
            </h3>
            <ol className="mt-2 space-y-2 list-decimal pl-5 text-sm text-[#1C1917]">
              {alert.azioniConsigliatePassoPasso.map((step, i) => (
                <li key={i} className="leading-relaxed">
                  {step}
                </li>
              ))}
            </ol>
          </section>

          <section className="border-t border-[#E5E0D5] pt-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#57534E]">
              Come possiamo supportarvi
            </h3>
            {isEditing ? (
              <textarea
                rows={3}
                value={alert.propostaSupportoStudio}
                onChange={(e) =>
                  updateAlertField(
                    alert.clientId,
                    'propostaSupportoStudio',
                    e.target.value
                  )
                }
                className="mt-1.5 w-full rounded border border-[#D6CEBE] bg-[#FBF9F5] p-2.5 text-sm text-[#44403C] focus:border-[#1E3A8A] focus:outline-none"
              />
            ) : (
              <p className="mt-1.5 text-[#44403C]">{alert.propostaSupportoStudio}</p>
            )}
          </section>
        </div>
      </article>
    );
  };

  return (
    <div className="mx-auto max-w-[1380px] px-6 py-8 space-y-6">
      <div className="no-print flex flex-wrap items-center justify-between gap-4 border-b border-[#E5E0D5] pb-5">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-[#57534E]">
            Passaggio 03 · Consegna Differenziata (1 Nota + {alertClienti.length}{' '}
            Alert)
          </p>
          <h1 className="mt-1 font-serif text-3xl font-semibold text-[#1C1917]">
            Deliverable pronti per Studio e Clienti
          </h1>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex flex-wrap items-center gap-1 rounded-lg bg-[#F3EFE6] p-1">
            <button
              type="button"
              onClick={() => setActiveTab('split')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'split'
                  ? 'bg-white text-[#1E3A8A] shadow-xs'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              Vista Completa
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('nota')}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                activeTab === 'nota'
                  ? 'bg-white text-[#1E3A8A] shadow-xs'
                  : 'text-[#57534E] hover:text-[#1C1917]'
              }`}
            >
              Nota Tecnica Interna
            </button>
            {alertClienti.map((a) => (
              <button
                key={a.clientId}
                type="button"
                onClick={() => setActiveTab(a.clientId)}
                className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap cursor-pointer ${
                  activeTab === a.clientId
                    ? 'bg-white text-[#1E3A8A] shadow-xs'
                    : 'text-[#57534E] hover:text-[#1C1917]'
                }`}
              >
                Alert · {a.nomeCliente.split(' ').slice(0, 3).join(' ')}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#D6CEBE] bg-white px-3.5 py-2 text-xs font-semibold text-[#1C1917] hover:bg-[#F3EFE6] cursor-pointer whitespace-nowrap"
          >
            <Printer className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Stampa / Salva PDF</span>
          </button>
        </div>
      </div>

      {activeTab === 'split' && (
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
          <div className="xl:col-span-6">{renderNota()}</div>
          <div className="xl:col-span-6 space-y-6">
            {alertClienti.map((alert, idx) => renderAlert(alert, idx))}
          </div>
        </div>
      )}

      {activeTab === 'nota' && (
        <div className="mx-auto max-w-4xl">{renderNota()}</div>
      )}

      {activeTab !== 'split' && activeTab !== 'nota' && (
        <div className="mx-auto max-w-4xl">
          {alertClienti
            .filter((a) => a.clientId === activeTab)
            .map((a, idx) => renderAlert(a, idx))}
        </div>
      )}
    </div>
  );
}
