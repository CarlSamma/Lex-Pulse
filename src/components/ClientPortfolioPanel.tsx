import { useState } from 'react';
import { Pencil, Plus, RotateCcw, Trash2, Check, X } from 'lucide-react';
import { CLIENT_PRESET_TEMPLATES } from '../data/defaultPresets';
import { ClientEntity, ClientType } from '../types/legal';

interface ClientPortfolioPanelProps {
  clients: ClientEntity[];
  onChangeClients: (clients: ClientEntity[]) => void;
  onResetDefaults: () => void;
  profileDirty: boolean;
  onReEvaluate?: () => void;
  isRunning: boolean;
}

const CLIENT_TYPES: ClientType[] = [
  'Impresa / Società',
  'Ente Pubblico / PA',
  'Gruppo Industriale / Manifatturiero',
  'Banca / Intermediario / Fintech',
  'Ente Sanitario / Terzo Settore',
  'Professionista / Associazione',
];

export function ClientPortfolioPanel({
  clients,
  onChangeClients,
  onResetDefaults,
  profileDirty,
  onReEvaluate,
  isRunning,
}: ClientPortfolioPanelProps) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState<ClientEntity | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const startEdit = (client: ClientEntity) => {
    setEditingId(client.id);
    setDraft({ ...client });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft(null);
  };

  const saveEdit = () => {
    if (!draft) return;
    onChangeClients(clients.map((c) => (c.id === draft.id ? draft : c)));
    setEditingId(null);
    setDraft(null);
  };

  const toggleActive = (id: string) => {
    onChangeClients(
      clients.map((c) => (c.id === id ? { ...c, attivo: !c.attivo } : c))
    );
  };

  const removeClient = (id: string) => {
    onChangeClients(clients.filter((c) => c.id !== id));
  };

  const addTemplate = (tpl: (typeof CLIENT_PRESET_TEMPLATES)[number]) => {
    const newClient: ClientEntity = {
      ...tpl,
      id: `client-${Date.now()}`,
      attivo: true,
    };
    onChangeClients([...clients, newClient]);
    setShowAddMenu(false);
  };

  const addBlankCustom = () => {
    const newClient: ClientEntity = {
      id: `custom-${Date.now()}`,
      nome: 'Nuovo Cliente Configurabile',
      tipologia: 'Impresa / Società',
      settoreEAttivita: 'Settore di attività e dimensione (es. 50 dipendenti)',
      strutturaOrganizzativa: 'Organi sociali, funzioni interne o referenti legali',
      processiEContestoRilevante:
        'Contratti attivi, rapporti di lavoro, forniture o aree operative esposte',
      statoComplianceEPolicy:
        'Stato regolamenti interni, adempimenti e scadenze in corso',
      destinatarioAlert: 'Direzione Generale e Referente Legale',
      attivo: true,
    };
    onChangeClients([...clients, newClient]);
    setShowAddMenu(false);
    startEdit(newClient);
  };

  const activeCount = clients.filter((c) => c.attivo).length;

  return (
    <section
      aria-label="Portafoglio Clienti Configurabile"
      className="rounded-lg border border-[#E5E0D5] bg-[#F3EFE6]/70 p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4 pb-4 border-b border-[#E5E0D5]">
        <div>
          <p className="font-mono text-xs uppercase tracking-wider text-[#57534E]">
            Portafoglio Clienti · Profili configurabili
          </p>
          <h2 className="mt-1 font-serif text-xl font-semibold text-[#1C1917]">
            Clienti assistiti dallo Studio
          </h2>
          <p className="mt-1 text-xs text-[#57534E] tabular-nums">
            {activeCount} {activeCount === 1 ? 'cliente attivo' : 'clienti attivi'} su{' '}
            {clients.length} in portafoglio
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAddMenu((v) => !v)}
            className="inline-flex items-center gap-1.5 rounded-md border border-[#D6CEBE] bg-white px-3 py-1.5 text-xs font-medium text-[#1C1917] hover:bg-[#FBF9F5] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Aggiungi profilo</span>
          </button>
          <button
            type="button"
            onClick={onResetDefaults}
            title="Ripristina i profili cliente predefiniti"
            className="inline-flex items-center gap-1.5 rounded-md border border-[#D6CEBE] bg-white px-3 py-1.5 text-xs font-medium text-[#57534E] hover:text-[#1C1917] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Ripristina Profili</span>
          </button>
        </div>
      </div>

      {showAddMenu && (
        <div className="mt-4 rounded-md border border-[#D6CEBE] bg-white p-3.5 space-y-2">
          <p className="text-xs font-semibold text-[#1C1917]">
            Seleziona un modello settoriale o crea un profilo personalizzato:
          </p>
          <div className="flex flex-wrap gap-2">
            {CLIENT_PRESET_TEMPLATES.map((tpl) => (
              <button
                key={tpl.nome}
                type="button"
                onClick={() => addTemplate(tpl)}
                className="rounded-md border border-[#E5E0D5] bg-[#FBF9F5] px-3 py-1.5 text-xs font-medium text-[#1C1917] hover:border-[#1E3A8A] hover:text-[#1E3A8A] transition-colors cursor-pointer"
              >
                + {tpl.nome}
              </button>
            ))}
            <button
              type="button"
              onClick={addBlankCustom}
              className="rounded-md border border-[#1E3A8A]/30 bg-[#1E3A8A]/5 px-3 py-1.5 text-xs font-medium text-[#1E3A8A] hover:bg-[#1E3A8A]/10 transition-colors cursor-pointer"
            >
              + Profilo vuoto personalizzato
            </button>
          </div>
        </div>
      )}

      {profileDirty && onReEvaluate && (
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-md border border-[#B45309]/40 bg-[#FEF3C7]/45 px-4 py-2.5">
          <p className="text-xs font-medium text-[#92400E]">
            Profilo clienti modificato rispetto all’ultima valutazione d’impatto.
          </p>
          <button
            type="button"
            onClick={onReEvaluate}
            disabled={isRunning}
            className="rounded-md bg-[#B45309] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#92400E] disabled:opacity-60 whitespace-nowrap shrink-0 cursor-pointer"
          >
            Rivaluta Impatto
          </button>
        </div>
      )}

      <div className="mt-4 divide-y divide-[#E5E0D5] rounded-md border border-[#E5E0D5] bg-white">
        {clients.map((client) => {
          const isEditing = editingId === client.id && draft;

          if (isEditing && draft) {
            return (
              <div key={client.id} className="p-4 space-y-3 bg-[#FBF9F5]">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-[#57534E] mb-1">
                      Nome organizzazione
                    </label>
                    <input
                      type="text"
                      value={draft.nome}
                      onChange={(e) => setDraft({ ...draft, nome: e.target.value })}
                      className="w-full rounded-md border border-[#D6CEBE] bg-white px-3 py-1.5 text-sm text-[#1C1917] focus:border-[#1E3A8A] focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-[#57534E] mb-1">
                      Tipologia soggetto
                    </label>
                    <select
                      value={draft.tipologia}
                      onChange={(e) =>
                        setDraft({ ...draft, tipologia: e.target.value as ClientType })
                      }
                      className="w-full rounded-md border border-[#D6CEBE] bg-white px-3 py-1.5 text-sm text-[#1C1917] focus:border-[#1E3A8A] focus:outline-none"
                    >
                      {CLIENT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#57534E] mb-1">
                    Destinatario Alert
                  </label>
                  <input
                    type="text"
                    value={draft.destinatarioAlert}
                    onChange={(e) =>
                      setDraft({ ...draft, destinatarioAlert: e.target.value })
                    }
                    className="w-full rounded-md border border-[#D6CEBE] bg-white px-3 py-1.5 text-sm text-[#1C1917] focus:border-[#1E3A8A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#57534E] mb-1">
                    Settore, attività e dimensione
                  </label>
                  <textarea
                    rows={2}
                    value={draft.settoreEAttivita}
                    onChange={(e) =>
                      setDraft({ ...draft, settoreEAttivita: e.target.value })
                    }
                    className="w-full rounded-md border border-[#D6CEBE] bg-white px-3 py-1.5 text-sm text-[#1C1917] focus:border-[#1E3A8A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#57534E] mb-1">
                    Struttura organizzativa e governance
                  </label>
                  <textarea
                    rows={2}
                    value={draft.strutturaOrganizzativa}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        strutturaOrganizzativa: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-[#D6CEBE] bg-white px-3 py-1.5 text-sm text-[#1C1917] focus:border-[#1E3A8A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#57534E] mb-1">
                    Processi operativi, contratti e aree esposte
                  </label>
                  <textarea
                    rows={2}
                    value={draft.processiEContestoRilevante}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        processiEContestoRilevante: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-[#D6CEBE] bg-white px-3 py-1.5 text-sm text-[#1C1917] focus:border-[#1E3A8A] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#57534E] mb-1">
                    Stato policy, adempimenti e regolamenti interni
                  </label>
                  <textarea
                    rows={2}
                    value={draft.statoComplianceEPolicy}
                    onChange={(e) =>
                      setDraft({
                        ...draft,
                        statoComplianceEPolicy: e.target.value,
                      })
                    }
                    className="w-full rounded-md border border-[#D6CEBE] bg-white px-3 py-1.5 text-sm text-[#1C1917] focus:border-[#1E3A8A] focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="inline-flex items-center gap-1 rounded-md border border-[#D6CEBE] bg-white px-3 py-1.5 text-xs font-medium text-[#57534E] hover:text-[#1C1917] cursor-pointer"
                  >
                    <X className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Annulla</span>
                  </button>
                  <button
                    type="button"
                    onClick={saveEdit}
                    className="inline-flex items-center gap-1 rounded-md bg-[#1E3A8A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#172E6E] cursor-pointer"
                  >
                    <Check className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Salva profilo</span>
                  </button>
                </div>
              </div>
            );
          }

          return (
            <div key={client.id} className="p-4 transition-colors hover:bg-[#FBF9F5]/60">
              <div className="flex items-start justify-between gap-3">
                <label className="flex items-start gap-3 cursor-pointer flex-1">
                  <input
                    type="checkbox"
                    checked={client.attivo}
                    onChange={() => toggleActive(client.id)}
                    className="mt-1 h-4 w-4 rounded border-[#D6CEBE] accent-[#1E3A8A]"
                  />
                  <div>
                    <div className="text-sm font-semibold text-[#1C1917]">
                      {client.nome}
                    </div>
                    <div className="mt-0.5 text-xs text-[#57534E]">
                      {client.tipologia} · Destinatario: {client.destinatarioAlert}
                    </div>
                  </div>
                </label>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => startEdit(client)}
                    aria-label={`Modifica ${client.nome}`}
                    className="rounded p-1.5 text-[#57534E] hover:bg-[#F3EFE6] hover:text-[#1C1917] cursor-pointer"
                  >
                    <Pencil className="h-3.5 w-3.5" aria-hidden="true" />
                  </button>
                  {clients.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeClient(client.id)}
                      aria-label={`Rimuovi ${client.nome}`}
                      className="rounded p-1.5 text-[#57534E] hover:bg-[#FEE2E2] hover:text-[#B91C1C] cursor-pointer"
                    >
                      <Trash2 className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-2.5 pl-7 space-y-1 text-xs leading-relaxed text-[#44403C]">
                <p>
                  <span className="font-medium text-[#1C1917]">Attività:</span>{' '}
                  {client.settoreEAttivita}
                </p>
                <p>
                  <span className="font-medium text-[#1C1917]">Governance:</span>{' '}
                  {client.strutturaOrganizzativa}
                </p>
                <p>
                  <span className="font-medium text-[#1C1917]">Contesto operativo:</span>{' '}
                  {client.processiEContestoRilevante}
                </p>
                <p>
                  <span className="font-medium text-[#1C1917]">Stato attuale:</span>{' '}
                  {client.statoComplianceEPolicy}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
