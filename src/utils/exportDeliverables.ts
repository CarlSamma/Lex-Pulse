import {
  ChecklistItem,
  ClassificationResult,
  DeliverablesPackage,
  PortfolioImpactEvaluation,
} from '../types/legal';

export function downloadTextFile(
  filename: string,
  content: string,
  mimeType = 'text/markdown;charset=utf-8'
) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => {
    URL.revokeObjectURL(url);
  }, 3000);
}

export async function copyTextWithFallback(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback below for sandboxed iframes
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.top = '-9999px';
    textarea.style.left = '-9999px';
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function formatNotaInternaMarkdown(deliverables: DeliverablesPackage): string {
  const n = deliverables.notaTecnicaInterna;
  const lines: string[] = [
    `# ${n.intestazione}`,
    `**Data:** ${n.data}`,
    `**Oggetto:** ${n.oggetto}`,
    '',
    '## Sintesi Esecutiva',
    n.sintesiEsecutiva,
    '',
    '## Inquadramento Normativo',
    n.inquadramentoNormativo,
    '',
    '## Analisi Tecnica per Cliente Assistito',
  ];

  for (const item of n.analisiDettagliataPerCliente) {
    lines.push(
      `### ${item.nomeCliente}`,
      `- **Qualificazione Giuridica:** ${item.qualificazioneGiuridica}`,
      `- **Profili di Rischio:** ${item.profiliDiRischio}`,
      `- **Adempimenti e Decorrenze:** ${item.adempimentiEDecorrenze}`,
      ''
    );
  }

  lines.push(
    '## Cosa cambia lunedì mattina per lo Studio?',
    n.cosaCambiaLunediMattinaStudio,
    '',
    '## Piano d’Azione Operativo',
    ...n.pianoAzioneStudioLunedi.map(
      (a) =>
        `- **[${a.priorita}]** (${a.clienteRiferimento} · ${a.responsabileConsigliato}): ${a.azione}`
    )
  );

  return lines.join('\n');
}

export function formatAlertClienteMarkdown(
  alert: DeliverablesPackage['alertClienti'][number]
): string {
  return [
    `# Alert Strategico · ${alert.nomeCliente}`,
    `**Destinatario:** ${alert.destinatario}`,
    `**Oggetto:** ${alert.oggettoEmail}`,
    '',
    alert.aperturaChiara,
    '',
    '## Che cosa è successo',
    alert.cosaSuccedeSenzaTecnicismi,
    '',
    '## Cosa cambia lunedì mattina',
    alert.cosaCambiaLunediMattina,
    '',
    '## Azioni consigliate passo per passo',
    ...alert.azioniConsigliatePassoPasso.map((s, idx) => `${idx + 1}. ${s}`),
    '',
    '## Come possiamo assistervi',
    alert.propostaSupportoStudio,
  ].join('\n');
}

export function formatFullDossierMarkdown(params: {
  classification: ClassificationResult | null;
  impact: PortfolioImpactEvaluation | null;
  deliverables: DeliverablesPackage | null;
  checklist: ChecklistItem[];
}): string {
  const sections: string[] = [
    '# Dossier di Analisi Normativa · LexPulse Legal Intelligence',
    '',
  ];

  if (params.classification) {
    sections.push(
      '---',
      '## Passaggio 1 · Classificazione della Novità',
      `- **Materia:** ${params.classification.materiaPrincipale}`,
      `- **Atto:** ${params.classification.titoloAtto}`,
      `- **Autorità:** ${params.classification.autorita}`,
      `- **Estremi:** ${params.classification.estremiAdozione}`,
      `- **Data / Decorrenza:** ${params.classification.dataPubblicazione} · ${params.classification.entrataInVigore}`,
      `- **Ambito Soggettivo:** ${params.classification.ambitoSoggettivo}`,
      '',
      params.classification.sintesiOggettiva,
      ''
    );
  }

  if (params.impact) {
    sections.push(
      '---',
      '## Passaggio 2 · Valutazione d’Impatto Multi-Cliente',
      params.impact.sintesiImpattoStudio,
      ''
    );
  }

  if (params.deliverables) {
    sections.push('---', formatNotaInternaMarkdown(params.deliverables), '');
    for (const alert of params.deliverables.alertClienti) {
      sections.push('---', formatAlertClienteMarkdown(alert), '');
    }
  }

  sections.push(
    '---',
    '## Checklist di Verifica Qualità',
    ...params.checklist.map(
      (c) => `- [${c.checked ? 'x' : ' '}] **${c.label}** — ${c.criterio}`
    )
  );

  return sections.join('\n');
}
