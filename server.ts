import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type {
  ClassificationResult,
  ClientEntity,
  DeliverablesPackage,
  LlmModelId,
  NewsSourceInput,
  PortfolioImpactEvaluation,
  WebSourceRef,
} from './src/types/legal';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

const DEFAULT_MODEL_ID: LlmModelId = 'anthropic/claude-sonnet-5.5';

const ALLOWED_MODELS = new Set<LlmModelId>([
  'anthropic/claude-sonnet-5.5',
  'openai/gpt-6.1-terra',
  'google/gemini-4-hydrogen',
  'deepseek/deepseek-v4-pro',
  'mistralai/mistral-large-4-0',
  'meta-llama/llama-4-maverick',
]);

function resolveModelId(input?: string): LlmModelId {
  if (input && ALLOWED_MODELS.has(input as LlmModelId)) {
    return input as LlmModelId;
  }
  return DEFAULT_MODEL_ID;
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function parseJsonSafely<T>(rawText: string | undefined, fallbackMsg: string): T {
  if (!rawText) {
    throw new Error(fallbackMsg);
  }
  const stripped = rawText
    .trim()
    .replace(/^```json\s*/i, '')
    .replace(/^```\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim();

  try {
    return JSON.parse(stripped) as T;
  } catch {
    const firstBrace = stripped.indexOf('{');
    const lastBrace = stripped.lastIndexOf('}');
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return JSON.parse(stripped.slice(firstBrace, lastBrace + 1)) as T;
    }
    throw new Error(fallbackMsg);
  }
}

function formatProviderError(error: unknown): { status: number; message: string } {
  const msg = error instanceof Error ? error.message : String(error);
  if (msg.includes('401') || msg.includes('Invalid API') || msg.includes('OPENROUTER_API_KEY')) {
    return {
      status: 401,
      message: msg,
    };
  }
  if (msg.includes('403') || msg.includes('PERMISSION_DENIED')) {
    return {
      status: 403,
      message:
        'Accesso negato dal provider AI. Verifica la chiave API OPENROUTER_API_KEY configurata in Settings > Secrets.',
    };
  }
  if (msg.includes('429') || msg.includes('RESOURCE_EXHAUSTED')) {
    return {
      status: 429,
      message:
        'Limite di richieste temporaneamente raggiunto sul provider selezionato. Attendi qualche secondo o seleziona un altro modello.',
    };
  }
  return {
    status: 500,
    message: msg || 'Errore imprevisto durante l’elaborazione della pipeline.',
  };
}

interface OpenRouterAnnotation {
  type?: string;
  url_citation?: {
    url?: string;
    title?: string;
  };
}

interface OpenRouterResponse {
  choices?: {
    message?: {
      content?: string | { type?: string; text?: string }[];
      annotations?: OpenRouterAnnotation[];
    };
  }[];
  error?: {
    message?: string;
    code?: number;
  };
}

async function callOpenRouter(params: {
  modelId: LlmModelId;
  systemInstruction: string;
  userContent: string | unknown[];
  expectJson?: boolean;
  plugins?: Record<string, unknown>[];
}): Promise<{ text: string; citations: WebSourceRef[] }> {
  const openRouterKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!openRouterKey) {
    throw new Error(
      'Chiave OPENROUTER_API_KEY non configurata nei Secrets del server. Inseriscila nel pannello Settings > Secrets per utilizzare i 6 modelli OpenRouter.'
    );
  }

  const body: Record<string, unknown> = {
    model: params.modelId,
    messages: [
      { role: 'system', content: params.systemInstruction },
      { role: 'user', content: params.userContent },
    ],
    temperature: 0.2,
  };

  if (params.expectJson) {
    body.response_format = { type: 'json_object' };
  }

  if (params.plugins && params.plugins.length > 0) {
    body.plugins = params.plugins;
  }

  const resp = await fetch(OPENROUTER_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${openRouterKey}`,
      'HTTP-Referer': process.env.APP_URL || 'http://localhost:3000',
      'X-Title': 'LexPulse Legal Intelligence Agent',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const payload = (await resp.json().catch(() => ({}))) as OpenRouterResponse;

  if (!resp.ok || payload.error) {
    const errMsg =
      payload.error?.message ||
      `Errore OpenRouter HTTP ${resp.status} per il modello ${params.modelId}.`;
    throw new Error(errMsg);
  }

  const msg = payload.choices?.[0]?.message;
  let text = '';
  if (typeof msg?.content === 'string') {
    text = msg.content;
  } else if (Array.isArray(msg?.content)) {
    text = msg.content
      .map((part) => (typeof part?.text === 'string' ? part.text : ''))
      .join('\n');
  }

  const citations: WebSourceRef[] = (msg?.annotations ?? [])
    .filter((a) => a.type === 'url_citation' && a.url_citation?.url)
    .map((a) => ({
      title: a.url_citation?.title || a.url_citation?.url || 'Fonte web',
      uri: a.url_citation!.url!,
    }));

  return { text, citations };
}

const classificationSchema = {
  type: Type.OBJECT,
  properties: {
    titoloAtto: { type: Type.STRING },
    materiaPrincipale: { type: Type.STRING },
    autorita: { type: Type.STRING },
    estremiAdozione: { type: Type.STRING },
    tipoAtto: { type: Type.STRING },
    dataPubblicazione: { type: Type.STRING },
    entrataInVigore: { type: Type.STRING },
    ambitoSoggettivo: { type: Type.STRING },
    quadroPrecettivo: {
      type: Type.OBJECT,
      properties: {
        obblighi: { type: Type.STRING },
        indirizzi: { type: Type.STRING },
        facolta: { type: Type.STRING },
      },
      required: ['obblighi', 'indirizzi', 'facolta'],
    },
    precettiEstratti: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          paragrafo: { type: Type.STRING },
          livelloVincolativita: { type: Type.STRING },
          sintesi: { type: Type.STRING },
          destinatario: { type: Type.STRING },
        },
        required: ['paragrafo', 'livelloVincolativita', 'sintesi', 'destinatario'],
      },
    },
    riferimentiNormativiCollegati: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    sintesiOggettiva: { type: Type.STRING },
  },
  required: [
    'titoloAtto',
    'materiaPrincipale',
    'autorita',
    'estremiAdozione',
    'tipoAtto',
    'dataPubblicazione',
    'entrataInVigore',
    'ambitoSoggettivo',
    'quadroPrecettivo',
    'precettiEstratti',
    'riferimentiNormativiCollegati',
    'sintesiOggettiva',
  ],
};

const impactSchema = {
  type: Type.OBJECT,
  properties: {
    sintesiImpattoStudio: { type: Type.STRING },
    livelloComplessivoRischio: { type: Type.STRING },
    cosaCambiaLunediStudio: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
    },
    impattiPerCliente: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          clientId: { type: Type.STRING },
          nomeCliente: { type: Type.STRING },
          livelloUrgenza: { type: Type.STRING },
          inquadramentoApplicabilita: { type: Type.STRING },
          ruoloGiuridico: { type: Type.STRING },
          gapPrincipali: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          adempimentiObbligatori: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          opzioniEScelteStrategiche: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          cosaCambiaLunediCliente: { type: Type.STRING },
          azioniImmediate: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
        },
        required: [
          'clientId',
          'nomeCliente',
          'livelloUrgenza',
          'inquadramentoApplicabilita',
          'ruoloGiuridico',
          'gapPrincipali',
          'adempimentiObbligatori',
          'opzioniEScelteStrategiche',
          'cosaCambiaLunediCliente',
          'azioniImmediate',
        ],
      },
    },
  },
  required: [
    'sintesiImpattoStudio',
    'livelloComplessivoRischio',
    'cosaCambiaLunediStudio',
    'impattiPerCliente',
  ],
};

const deliverablesSchema = {
  type: Type.OBJECT,
  properties: {
    notaTecnicaInterna: {
      type: Type.OBJECT,
      properties: {
        intestazione: { type: Type.STRING },
        data: { type: Type.STRING },
        oggetto: { type: Type.STRING },
        sintesiEsecutiva: { type: Type.STRING },
        inquadramentoNormativo: { type: Type.STRING },
        analisiDettagliataPerCliente: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              nomeCliente: { type: Type.STRING },
              qualificazioneGiuridica: { type: Type.STRING },
              profiliDiRischio: { type: Type.STRING },
              adempimentiEDecorrenze: { type: Type.STRING },
            },
            required: [
              'nomeCliente',
              'qualificazioneGiuridica',
              'profiliDiRischio',
              'adempimentiEDecorrenze',
            ],
          },
        },
        cosaCambiaLunediMattinaStudio: { type: Type.STRING },
        pianoAzioneStudioLunedi: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              azione: { type: Type.STRING },
              clienteRiferimento: { type: Type.STRING },
              priorita: { type: Type.STRING },
              responsabileConsigliato: { type: Type.STRING },
            },
            required: [
              'azione',
              'clienteRiferimento',
              'priorita',
              'responsabileConsigliato',
            ],
          },
        },
      },
      required: [
        'intestazione',
        'data',
        'oggetto',
        'sintesiEsecutiva',
        'inquadramentoNormativo',
        'analisiDettagliataPerCliente',
        'cosaCambiaLunediMattinaStudio',
        'pianoAzioneStudioLunedi',
      ],
    },
    alertClienti: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          clientId: { type: Type.STRING },
          nomeCliente: { type: Type.STRING },
          destinatario: { type: Type.STRING },
          oggettoEmail: { type: Type.STRING },
          aperturaChiara: { type: Type.STRING },
          cosaSuccedeSenzaTecnicismi: { type: Type.STRING },
          cosaCambiaLunediMattina: { type: Type.STRING },
          azioniConsigliatePassoPasso: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
          },
          propostaSupportoStudio: { type: Type.STRING },
        },
        required: [
          'clientId',
          'nomeCliente',
          'destinatario',
          'oggettoEmail',
          'aperturaChiara',
          'cosaSuccedeSenzaTecnicismi',
          'cosaCambiaLunediMattina',
          'azioniConsigliatePassoPasso',
          'propostaSupportoStudio',
        ],
      },
    },
  },
  required: ['notaTecnicaInterna', 'alertClienti'],
};

const CLASSIFICATION_JSON_CONTRACT = `Restituisci ESCLUSIVAMENTE un oggetto JSON valido (nessun markdown o testo esterno) con questa struttura esatta:
{
  "titoloAtto": "string",
  "materiaPrincipale": "string (es. Diritto del Lavoro, Diritto Tributario, Contratti Pubblici, Ambiente & ESG, Diritto Societario, Diritto Civile, Privacy, Bancario, Penale 231, ecc.)",
  "autorita": "string",
  "estremiAdozione": "string",
  "tipoAtto": "string (es. Decreto Legislativo, Regolamento UE, Sentenza Cassazione, Circolare, Provvedimento, Contratto Collettivo, ecc.)",
  "dataPubblicazione": "string",
  "entrataInVigore": "string",
  "ambitoSoggettivo": "string",
  "quadroPrecettivo": {
    "obblighi": "string (sintesi dei vincoli cogenti e divieti introdotti)",
    "indirizzi": "string (sintesi di raccomandazioni, criteri interpretativi o buone prassi)",
    "facolta": "string (sintesi di opzioni, deroghe, incentivi o scelte discrezionali)"
  },
  "precettiEstratti": [
    { "paragrafo": "string", "livelloVincolativita": "OBBLIGO" | "INDIRIZZO" | "FACOLTÀ", "sintesi": "string", "destinatario": "string" }
  ],
  "riferimentiNormativiCollegati": ["string"],
  "sintesiOggettiva": "string"
}`;

const IMPACT_JSON_CONTRACT = `Restituisci ESCLUSIVAMENTE un oggetto JSON valido (nessun markdown o testo esterno) con questa struttura esatta:
{
  "sintesiImpattoStudio": "string",
  "livelloComplessivoRischio": "Critico" | "Alto" | "Medio" | "Informativo",
  "cosaCambiaLunediStudio": ["string"],
  "impattiPerCliente": [
    {
      "clientId": "string",
      "nomeCliente": "string",
      "livelloUrgenza": "Critico" | "Alto" | "Medio" | "Informativo" | "Non Applicabile",
      "inquadramentoApplicabilita": "string (verifica puntuale se e perché la novità si applica direttamente, indirettamente o non si applica al cliente)",
      "ruoloGiuridico": "string (qualificazione pertinente alla materia dell'atto, es. Datore di lavoro, Contribuente, Stazione Appaltante, Appaltatore, Produttore, Soggetto non interessato)",
      "gapPrincipali": ["string"],
      "adempimentiObbligatori": ["string"],
      "opzioniEScelteStrategiche": ["string"],
      "cosaCambiaLunediCliente": "string",
      "azioniImmediate": ["string"]
    }
  ]
}`;

const DELIVERABLES_JSON_CONTRACT = `Restituisci ESCLUSIVAMENTE un oggetto JSON valido (nessun markdown o testo esterno) con questa struttura esatta:
{
  "notaTecnicaInterna": {
    "intestazione": "string",
    "data": "string",
    "oggetto": "string",
    "sintesiEsecutiva": "string",
    "inquadramentoNormativo": "string",
    "analisiDettagliataPerCliente": [
      {
        "nomeCliente": "string",
        "qualificazioneGiuridica": "string",
        "profiliDiRischio": "string",
        "adempimentiEDecorrenze": "string"
      }
    ],
    "cosaCambiaLunediMattinaStudio": "string",
    "pianoAzioneStudioLunedi": [
      {
        "azione": "string",
        "clienteRiferimento": "string",
        "priorita": "Immediata (Lunedì)" | "Breve termine (7 gg)" | "Pianificata (30 gg)",
        "responsabileConsigliato": "string"
      }
    ]
  },
  "alertClienti": [
    {
      "clientId": "string",
      "nomeCliente": "string",
      "destinatario": "string",
      "oggettoEmail": "string",
      "aperturaChiara": "string",
      "cosaSuccedeSenzaTecnicismi": "string",
      "cosaCambiaLunediMattina": "string",
      "azioniConsigliatePassoPasso": ["string"],
      "propostaSupportoStudio": "string"
    }
  ]
}`;

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '25mb' }));

  app.get('/api/health', (_req, res) => {
    res.json({
      ok: true,
      service: 'lexpulse-legal-intelligence',
      providers: {
        openrouter: Boolean(process.env.OPENROUTER_API_KEY?.trim()),
        geminiFallback: Boolean(process.env.GEMINI_API_KEY?.trim()),
      },
    });
  });

  // PASSAGGIO 1: TRIGGER & CLASSIFICAZIONE (AGNOSTICO PER MATERIA)
  app.post('/api/pipeline/trigger', async (req, res) => {
    try {
      const body = req.body as NewsSourceInput & { modelId?: string };
      const source = body;
      if (!source || !source.mode) {
        res.status(400).json({ error: 'Sorgente normativa mancante.' });
        return;
      }

      const modelId = resolveModelId(body.modelId);
      const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY?.trim());
      const geminiFallback =
        !hasOpenRouter && modelId === 'google/gemini-4-hydrogen'
          ? getGeminiClient()
          : null;

      let rawResearchText = '';
      let fontiWeb: WebSourceRef[] = [];

      if (source.mode === 'web_search') {
        const query =
          source.queryRicerca?.trim() ||
          'Ultime novità normative italiane ed europee Gazzetta Ufficiale decreti legge giurisprudenza rilevante imprese e PA';

        if (geminiFallback) {
          const searchResponse = await geminiFallback.models.generateContent({
            model: 'gemini-4-hydrogen',
            contents: `Cerca le novità normative, regolamentari, fiscali, giuslavoristiche o giurisprudenziali ufficiali più recenti e pertinenti rispetto a questa richiesta di monitoraggio legale: "${query}".
Riporta con precisione: materia giuridica, titolo esatto dell'atto o della pronuncia, autorità o organo emittente, estremi (numero decreto/legge/sentenza/circolare), data di pubblicazione e decorrenza/entrata in vigore, soggetti destinatari, obblighi vincolanti vs facoltà o indirizzi, e riferimenti normativi collegati.`,
            config: {
              tools: [{ googleSearch: {} }],
              systemInstruction:
                'Sei un analista multidisciplinare di monitoraggio legislativo e giurisprudenziale italiano ed europeo per uno studio legale. Tratti qualsiasi materia giuridica e riporti solo fatti verificati dalle fonti trovate.',
            },
          });

          rawResearchText = searchResponse.text ?? '';
          const chunks =
            searchResponse.candidates?.[0]?.groundingMetadata?.groundingChunks ?? [];
          fontiWeb = chunks
            .filter((c) => c.web?.uri)
            .map((c) => ({
              title: c.web?.title || c.web?.uri || 'Fonte istituzionale',
              uri: c.web!.uri!,
            }));
        } else {
          const webRes = await callOpenRouter({
            modelId,
            systemInstruction:
              'Sei un analista multidisciplinare di monitoraggio legislativo e giurisprudenziale italiano ed europeo per uno studio legale. Tratti qualsiasi materia giuridica e riporti solo fatti verificati dalle fonti web trovate.',
            userContent: `Cerca le novità normative, regolamentari, fiscali, giuslavoristiche o giurisprudenziali ufficiali più recenti e pertinenti rispetto a questa richiesta di monitoraggio legale: "${query}".
Riporta con precisione: materia giuridica, titolo esatto dell'atto o della pronuncia, autorità o organo emittente, estremi (numero decreto/legge/sentenza/circolare), data di pubblicazione e decorrenza/entrata in vigore, soggetti destinatari, obblighi vincolanti vs facoltà o indirizzi, e riferimenti normativi collegati.`,
            plugins: [{ id: 'web', max_results: 5 }],
          });
          rawResearchText = webRes.text;
          fontiWeb = webRes.citations;
        }
      }

      const systemInstructionStep1 = `Sei l'Agente 1 (Trigger e Classificatore Multidisciplinare) di una pipeline di Legal Intelligence per uno studio legale.
Tratti QUALSIASI materia giuridica, normativa, fiscale, giuslavoristica, societaria, ambientale, amministrativa, contrattuale o giurisprudenziale in modo del tutto agnostico rispetto al tema.
Il tuo UNICO compito in questo passaggio è intercettare e classificare in modo rigoroso e oggettivo la novità ricevuta, SENZA ancora valutare clienti specifici e SENZA redigere email o note finali.
Regole:
- Identifica la materia principale, il tipo di atto (Legge, D.Lgs., Regolamento UE, Direttiva, Circolare, Provvedimento di Autorità, Sentenza, CCNL, ecc.), l'autorità/organo emittente, gli estremi, la data di pubblicazione, la decorrenza/entrata in vigore e l'ambito soggettivo.
- Distingui con precisione tra precetti obbligatori o divieti ("OBBLIGO"), orientamenti/raccomandazioni/criteri ("INDIRIZZO") e opzioni/deroghe/agevolazioni ("FACOLTÀ").
- In precettiEstratti, livelloVincolativita deve essere esattamente uno tra: "OBBLIGO", "INDIRIZZO", "FACOLTÀ".
- Non introdurre mai riferimenti normativi non pertinenti al testo analizzato.
- Rispondi esclusivamente in italiano.
${CLASSIFICATION_JSON_CONTRACT}`;

      let parsed: Omit<ClassificationResult, 'fontiWeb' | 'modelUsed'>;

      if (geminiFallback) {
        let contents: unknown;
        if (source.mode === 'upload_pdf' && source.fileBase64) {
          contents = {
            parts: [
              {
                inlineData: {
                  mimeType: source.mimeType || 'application/pdf',
                  data: source.fileBase64,
                },
              },
              {
                text: `Classifica questo documento giuridico/normativo/giurisprudenziale (${source.fileName || 'documento caricato'}). Titolo indicativo: ${source.titolo || 'N/D'}. Individua materia, estremi, ambito soggettivo, quadro precettivo e tutti i precetti principali distinti per OBBLIGO, INDIRIZZO e FACOLTÀ.`,
              },
            ],
          };
        } else if (source.mode === 'web_search') {
          contents = `Classifica la seguente novità giuridica o normativa intercettata dalla ricerca web:\n\n${rawResearchText}`;
        } else {
          contents = `Classifica la seguente novità giuridica, normativa o giurisprudenziale:\n\nTITOLO: ${source.titolo}\n\nTESTO:\n${source.testoEstratto}\n\n${
            source.riferimentiIntegrali
              ? `RIFERIMENTI INTEGRALI DI CONTESTO:\n${source.riferimentiIntegrali}`
              : ''
          }`;
        }

        const structuredResp = await geminiFallback.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: contents as Parameters<typeof geminiFallback.models.generateContent>[0]['contents'],
          config: {
            systemInstruction: systemInstructionStep1,
            responseMimeType: 'application/json',
            responseSchema: classificationSchema,
          },
        });

        parsed = parseJsonSafely<Omit<ClassificationResult, 'fontiWeb' | 'modelUsed'>>(
          structuredResp.text,
          'Risposta vuota dal classificatore normativo (Passaggio 1).'
        );
      } else {
        let userContent: string | unknown[];
        let plugins: Record<string, unknown>[] | undefined;

        if (source.mode === 'upload_pdf' && source.fileBase64) {
          const isTxt =
            source.mimeType === 'text/plain' ||
            (source.fileName || '').toLowerCase().endsWith('.txt');

          if (isTxt) {
            const decoded = Buffer.from(source.fileBase64, 'base64').toString('utf-8');
            userContent = `Classifica questo documento giuridico/normativo (${source.fileName || 'documento.txt'}). Titolo indicativo: ${source.titolo || 'N/D'}.\n\nTESTO:\n${decoded}`;
          } else {
            userContent = [
              {
                type: 'text',
                text: `Classifica questo documento giuridico/normativo/giurisprudenziale (${source.fileName || 'documento.pdf'}). Titolo indicativo: ${source.titolo || 'N/D'}. Individua materia, estremi, ambito soggettivo, quadro precettivo e tutti i precetti principali distinti per OBBLIGO, INDIRIZZO e FACOLTÀ.`,
              },
              {
                type: 'file',
                file: {
                  filename: source.fileName || 'documento.pdf',
                  file_data: `data:${source.mimeType || 'application/pdf'};base64,${source.fileBase64}`,
                },
              },
            ];
            plugins = [{ id: 'file-parser', pdf: { engine: 'pdf-text' } }];
          }
        } else if (source.mode === 'web_search') {
          userContent = `Classifica la seguente novità giuridica o normativa intercettata dalla ricerca web:\n\n${rawResearchText}`;
        } else {
          userContent = `Classifica la seguente novità giuridica, normativa o giurisprudenziale:\n\nTITOLO: ${source.titolo}\n\nTESTO:\n${source.testoEstratto}\n\n${
            source.riferimentiIntegrali
              ? `RIFERIMENTI INTEGRALI DI CONTESTO:\n${source.riferimentiIntegrali}`
              : ''
          }`;
        }

        const orResp = await callOpenRouter({
          modelId,
          systemInstruction: systemInstructionStep1,
          userContent,
          expectJson: true,
          plugins,
        });

        parsed = parseJsonSafely<Omit<ClassificationResult, 'fontiWeb' | 'modelUsed'>>(
          orResp.text,
          'Risposta vuota dal classificatore normativo (Passaggio 1).'
        );
      }

      const result: ClassificationResult = {
        ...parsed,
        fontiWeb,
        modelUsed: modelId,
      };

      res.json(result);
    } catch (error) {
      const { status, message } = formatProviderError(error);
      res.status(status).json({ error: message });
    }
  });

  // PASSAGGIO 2: VALUTAZIONE D'IMPATTO PER CIASCUN CLIENTE (AGNOSTICO PER MATERIA)
  app.post('/api/pipeline/evaluate', async (req, res) => {
    try {
      const { classification, clients, noteProfessionista, modelId: rawModelId } =
        req.body as {
          classification: ClassificationResult;
          clients: ClientEntity[];
          noteProfessionista?: string;
          modelId?: string;
        };

      if (!classification || !clients || clients.length === 0) {
        res.status(400).json({
          error: 'Classificazione o lista clienti attivi mancante per la valutazione d’impatto.',
        });
        return;
      }

      const activeClients = clients.filter((c) => c.attivo);
      if (activeClients.length === 0) {
        res.status(400).json({ error: 'Seleziona almeno un cliente attivo da valutare.' });
        return;
      }

      const modelId = resolveModelId(rawModelId);
      const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY?.trim());
      const geminiFallback =
        !hasOpenRouter && modelId === 'google/gemini-4-hydrogen'
          ? getGeminiClient()
          : null;

      const prompt = `Valuta l'impatto giuridico e operativo della novità classificata nel Passaggio 1 su CIASCUNO dei clienti attivi assistiti dallo studio.

NOVITÀ CLASSIFICATA (OUTPUT PASSAGGIO 1):
${JSON.stringify(classification, null, 2)}

CLIENTI ASSISTITI DALLO STUDIO (PORTAFOGLIO):
${JSON.stringify(activeClients, null, 2)}

${
  noteProfessionista
    ? `INDICAZIONI AGGIUNTIVE DEL PROFESSIONISTA:\n${noteProfessionista}\n`
    : ''
}

ISTRUZIONI ANALITICHE OBBLIGATORIE:
1. Per ciascun cliente, mantieni esattamente il suo "clientId" e "nomeCliente".
2. Opera in modo strettamente pertinente alla materia dell'atto (${classification.materiaPrincipale || 'materia rilevata'}) e alle caratteristiche reali del cliente (settore, struttura organizzativa, processi, contratti, compliance attuale). NON forzare temi estranei all'atto analizzato (es. non citare normative su IA, privacy o PA se l'atto tratta altro e non le coinvolge).
3. Verifica con onestà giuridica se il cliente rientra nell'ambito applicativo diretto, indiretto (es. filiera/fornitori/contratti) oppure se la novità NON è applicabile a quel profilo (in tal caso usa livelloUrgenza = "Non Applicabile" o "Informativo" e spiega chiaramente perché non impatta).
4. Identifica con rigore giuridico:
   - "livelloUrgenza": esattamente uno tra "Critico", "Alto", "Medio", "Informativo", "Non Applicabile".
   - "livelloComplessivoRischio": esattamente uno tra "Critico", "Alto", "Medio", "Informativo".
   - "ruoloGiuridico": la qualificazione specifica rispetto a questo atto (es. "Datore di lavoro", "Stazione Appaltante", "Appaltatore / Operatore economico", "Contribuente / Sostituto d'imposta", "Produttore / Distributore", "Soggetto non rientrante").
   - "inquadramentoApplicabilita": valutazione precisa di applicabilità, soglie dimensionali/settoriali, esenzioni e decorrenze.
   - Distingui esplicitamente "adempimentiObbligatori" da "opzioniEScelteStrategiche" (e "gapPrincipali").
   - Rispondi esplicitamente a «Cosa cambia lunedì mattina?» sia per lo studio ("cosaCambiaLunediStudio") sia per ciascun cliente ("cosaCambiaLunediCliente").`;

      const systemInstructionStep2 = `Sei l’Agente 2 (Valutatore d’Impatto Giuridico Multidisciplinare) di una pipeline di Legal Intelligence.
Svolgi un’analisi giuridica rigorosa che regga davanti a un avvocato collega in qualsiasi area del diritto (lavoro, tributario, societario, contratti, appalti pubblici, ambientale/ESG, privacy, bancario, civile, penale 231, amministrativo, ecc.), basata esclusivamente sul testo della novità e sulle norme pertinenti a quella materia, senza mai inventare norme inesistenti né introdurre profili estranei.
${IMPACT_JSON_CONTRACT}`;

      let parsed: Omit<PortfolioImpactEvaluation, 'noteProfessionista' | 'modelUsed'>;

      if (geminiFallback) {
        const response = await geminiFallback.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
            systemInstruction: systemInstructionStep2,
            responseMimeType: 'application/json',
            responseSchema: impactSchema,
          },
        });
        parsed = parseJsonSafely<
          Omit<PortfolioImpactEvaluation, 'noteProfessionista' | 'modelUsed'>
        >(
          response.text,
          'Risposta vuota dalla valutazione d’impatto (Passaggio 2).'
        );
      } else {
        const orResp = await callOpenRouter({
          modelId,
          systemInstruction: systemInstructionStep2,
          userContent: prompt,
          expectJson: true,
        });
        parsed = parseJsonSafely<
          Omit<PortfolioImpactEvaluation, 'noteProfessionista' | 'modelUsed'>
        >(
          orResp.text,
          'Risposta vuota dalla valutazione d’impatto (Passaggio 2).'
        );
      }

      const evaluation: PortfolioImpactEvaluation = {
        ...parsed,
        noteProfessionista: noteProfessionista || '',
        modelUsed: modelId,
      };

      res.json(evaluation);
    } catch (error) {
      const { status, message } = formatProviderError(error);
      res.status(status).json({ error: message });
    }
  });

  // PASSAGGIO 3: DELIVERABLE DIFFERENZIATI (1 NOTA TECNICA + N ALERT CLIENTI)
  app.post('/api/pipeline/deliverables', async (req, res) => {
    try {
      const {
        classification,
        impactEvaluation,
        clients,
        modelId: rawModelId,
      } = req.body as {
        classification: ClassificationResult;
        impactEvaluation: PortfolioImpactEvaluation;
        clients: ClientEntity[];
        modelId?: string;
      };

      if (!classification || !impactEvaluation || !clients) {
        res.status(400).json({
          error: 'Dati di classificazione o valutazione mancanti per generare i deliverable.',
        });
        return;
      }

      const activeClients = clients.filter((c) => c.attivo);
      const modelId = resolveModelId(rawModelId);
      const hasOpenRouter = Boolean(process.env.OPENROUTER_API_KEY?.trim());
      const geminiFallback =
        !hasOpenRouter && modelId === 'google/gemini-4-hydrogen'
          ? getGeminiClient()
          : null;

      const prompt = `Genera il pacchetto completo di deliverable differenziati a partire dai passaggi precedenti validati dal giurista.

OUTPUT PASSAGGIO 1 (CLASSIFICAZIONE NOVITÀ):
${JSON.stringify(classification, null, 2)}

OUTPUT PASSAGGIO 2 (VALUTAZIONE D'IMPATTO VALIDATA DAL PROFESSIONISTA):
${JSON.stringify(impactEvaluation, null, 2)}

DESTINATARI CLIENTI ATTIVI:
${JSON.stringify(
  activeClients.map((c) => ({
    clientId: c.id,
    nomeCliente: c.nome,
    destinatarioAlert: c.destinatarioAlert,
    tipologia: c.tipologia,
  })),
  null,
  2
)}

REQUISITI RIGOROSI PER I DUE TIPI DI USCITA:
A) NOTA TECNICA INTERNA ("notaTecnicaInterna"):
- Scritta per colleghi avvocati, praticanti e collaboratori dello studio.
- Completa di riferimenti normativi o giurisprudenziali puntuali strettamente attinenti all'atto classificato e alla sua materia (${classification.materiaPrincipale || 'rilevata'}), con decorrenze, soglie e regime sanzionatorio/rimediale effettivamente pertinenti.
- Deve contenere una sezione tecnica dedicata per CIASCUNO dei clienti attivi in "analisiDettagliataPerCliente".
- Deve rispondere in modo esplicito e operativo a «Cosa cambia lunedì mattina per lo studio?» con un piano d'azione concreto ("pianoAzioneStudioLunedi", dove "priorita" è uno tra "Immediata (Lunedì)", "Breve termine (7 gg)", "Pianificata (30 gg)").

B) ALERT PER CIASCUN CLIENTE ("alertClienti"):
- Deve contenere UN OGGETTO SEPARATO per OGNI cliente attivo, mantenendo esattamente "clientId", "nomeCliente" e "destinatario".
- Tono professionale, rassicurante, chiaro e autorevole, rigorosamente PRIVO DI GERGO GIURIDICO ("si legge senza conoscere il diritto": evita formule burocratesi o elenchi criptici di articoli; traduci sempre le regole in conseguenze pratiche comprensibili a un imprenditore, HR, direttore o amministratore).
- Se per un cliente la novità non è applicabile, chiarisci subito in apertura che si tratta di un aggiornamento informativo rassicurante spiegando perché non impatta la sua operatività.
- Deve spiegare chiaramente: 1) Che cosa è successo; 2) Perché riguarda (o non riguarda) proprio quella specifica realtà; 3) «Cosa cambia lunedì mattina?» in azioni pratiche concrete; 4) Come lo studio legale può affiancare il cliente.`;

      const systemInstructionStep3 = `Sei l’Agente 3 (Redattore Differenziato) di uno studio legale multidisciplinare. Tratti qualsiasi area del diritto e produci due registri comunicativi nettamente distinti: massimo rigore tecnico-giuridico nella Nota Interna per avvocati; massima chiarezza divulgativa, commerciale e orientata alle decisioni negli Alert per i clienti.
${DELIVERABLES_JSON_CONTRACT}`;

      let parsed: Omit<DeliverablesPackage, 'modelUsed'>;

      if (geminiFallback) {
        const response = await geminiFallback.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: prompt,
          config: {
            thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH },
            systemInstruction: systemInstructionStep3,
            responseMimeType: 'application/json',
            responseSchema: deliverablesSchema,
          },
        });
        parsed = parseJsonSafely<Omit<DeliverablesPackage, 'modelUsed'>>(
          response.text,
          'Risposta vuota nella generazione dei deliverable (Passaggio 3).'
        );
      } else {
        const orResp = await callOpenRouter({
          modelId,
          systemInstruction: systemInstructionStep3,
          userContent: prompt,
          expectJson: true,
        });
        parsed = parseJsonSafely<Omit<DeliverablesPackage, 'modelUsed'>>(
          orResp.text,
          'Risposta vuota nella generazione dei deliverable (Passaggio 3).'
        );
      }

      const deliverables: DeliverablesPackage = {
        ...parsed,
        modelUsed: modelId,
      };

      res.json(deliverables);
    } catch (error) {
      const { status, message } = formatProviderError(error);
      res.status(status).json({ error: message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LexPulse server active at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
