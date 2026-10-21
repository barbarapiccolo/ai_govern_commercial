"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Shield, Lock, Key, FolderOpen, Scale, MessageSquare, FileText,
  Mic, Kanban, Calendar as CalendarIcon, Users, BarChart3, Fingerprint,
  UserCheck, EyeOff, Upload, CheckCircle2, Download,
  Plus, Search, Sparkles, ChevronRight, ChevronLeft,
  Sliders, Copy, Sun, Moon, FileCheck,
  Camera, FileUp, Video, Share2, Briefcase,
  Menu, X, Trash2, Edit3, Eye, Send, AlertCircle, Check
} from 'lucide-react';

// ============================================================================
// TIPOS DE DATOS DEL SISTEMA JURÍDICO AI GOVERN
// ============================================================================

type ModuleId =
  | 'consultor_ia'
  | 'redactor_docs'
  | 'grabador'
  | 'planificador'
  | 'calendario'
  | 'crm'
  | 'kpi'
  | 'trazabilidad'
  | 'human_loop'
  | 'anonimizacion_pii'
  | 'configuracion_sistema';

interface ModelTemplateVariable {
  key: string;
  label: string;
  category: string;
  placeholder: string;
}

interface ModelTemplate {
  id: string;
  name: string;
  category: string;
  source: 'Carpeta Local' | 'Google Drive';
  updatedAt: string;
  variables: ModelTemplateVariable[];
  contentPreview: string;
}

interface RagLawDocument {
  id: string;
  title: string;
  type: 'Código / Ley' | 'Jurisprudencia / Doctrina' | 'Reglamento / Norma';
  chunks: number;
  status: 'Indexado' | 'Sincronizado';
  excerpt: string;
  fullText?: string;
}

interface ActionItem {
  id: string;
  text: string;
  dueDate: string;
  addedToPlanner: boolean;
  linkedTaskId?: string;
  linkedEventId?: string;
}

interface RecordingNote {
  id: string;
  title: string;
  date: string;
  duration: string;
  mode: 'Presencial (Sala / Despacho)' | 'Meeting Online (Zoom / Meet / Teams)';
  attendees: string;
  transcript: string;
  summaryPoints: string[];
  agreementsAndTasks: ActionItem[];
}

interface PlannerTask {
  id: string;
  title: string;
  client: string;
  dueDate: string;
  status: 'Pendiente' | 'En Curso' | 'Completado';
  priority: 'Alta' | 'Media' | 'Baja';
  origin: 'Planificador' | 'Grabador de Actas' | 'Plazo Procesal';
}

interface CalendarEventItem {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD
  type: 'Agenda General' | 'Plazo Procesal' | 'Tarea Planificador' | 'Reunión / Acta';
  client?: string;
  linkedTaskId?: string;
}

interface CrmClient {
  id: string;
  name: string;
  personType: 'Persona Jurídica (Empresa)' | 'Persona Física / Natural';
  taxId: string;
  legalRep: string;
  registryInfo: string;
  powerStatus: 'Vigente' | 'Por Renovar' | 'En Trámite';
  address: string;
  phone: string;
  email: string;
  activeMatters: string[];
  feeArrangement: string;
  confidentialNotes: string;
}

interface ApprovedDocumentRecord {
  id: string;
  timestamp: string;
  title: string;
  originModule: 'Redactor de Documentos' | 'Consultor de IA' | 'Minuta de Reunión';
  templateUsed: string;
  approvedBy: string;
  collegiateNumber: string;
  sha256: string;
  content: string;
}

interface PiiAuditEntry {
  id: string;
  timestamp: string;
  originModule: 'Consultor de IA' | 'Redactor de Documentos' | 'Grabador de Actas';
  contextSummary: string;
  tokensDetected: { token: string; type: string; maskedPreview: string }[];
  zeroRetentionVerified: boolean;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  module: string;
  action: string;
  llmUsed: string;
  piiCount: number;
  ragSource: string;
  sha256: string;
  humanVerified: boolean;
}

interface ConsultAttachment {
  id: string;
  name: string;
  kind: 'Imagen / Captura' | 'Documento (.DOC / .DOCX)' | 'Archivo .PDF' | 'Conversación de Cliente (WhatsApp / Email)';
  rawContent: string;
  sanitizedContent: string;
  piiProtectedCount: number;
  addedAt: string;
}

interface ConsultTurn {
  id: string;
  timestamp: string;
  lawyerQuestion: string;
  sanitizedSentToAi: string;
  dictamen: string;
  clientReadyReply: string;
  recommendedTemplateId: string;
  recommendedTemplateName: string;
  suggestedClauseText: string;
  citations: string[];
  attachmentsUsed: string[];
  tokensProtected: number;
  hash: string;
  auditLogId: string;
  approvedInHumanLoop: boolean;
}

interface ConsultChatSession {
  id: string;
  title: string;
  updatedAt: string;
  matterTag: string;
  turns: ConsultTurn[];
}

// ============================================================================
// CRIPTOGRAFÍA SHA-256 REAL (FIPS 180-4) Y MOTOR ZERO-TRUST PII EN RAM
// ============================================================================

const SHA256_K = [
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
];

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

function computeRealSha256(input: string): string {
  const utf8 = unescape(encodeURIComponent(input));
  const words: number[] = [];
  for (let i = 0; i < utf8.length; i++) {
    words[i >> 2] |= (utf8.charCodeAt(i) & 0xff) << (24 - (i % 4) * 8);
  }
  const bitLength = utf8.length * 8;
  words[bitLength >> 5] |= 0x80 << (24 - (bitLength % 32));
  words[(((bitLength + 64) >> 9) << 4) + 15] = bitLength;

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;

  const w = new Array<number>(64);
  for (let j = 0; j < words.length; j += 16) {
    for (let i = 0; i < 16; i++) w[i] = words[j + i] || 0;
    for (let i = 16; i < 64; i++) {
      const s0 = rightRotate(w[i - 15], 7) ^ rightRotate(w[i - 15], 18) ^ (w[i - 15] >>> 3);
      const s1 = rightRotate(w[i - 2], 17) ^ rightRotate(w[i - 2], 19) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) | 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rightRotate(e, 6) ^ rightRotate(e, 11) ^ rightRotate(e, 25);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + SHA256_K[i] + w[i]) | 0;
      const S0 = rightRotate(a, 2) ^ rightRotate(a, 13) ^ rightRotate(a, 22);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) | 0;
      h = g; g = f; f = e; e = (d + temp1) | 0;
      d = c; c = b; b = a; a = (temp1 + temp2) | 0;
    }
    h0 = (h0 + a) | 0; h1 = (h1 + b) | 0; h2 = (h2 + c) | 0; h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0; h5 = (h5 + f) | 0; h6 = (h6 + g) | 0; h7 = (h7 + h) | 0;
  }

  return [h0, h1, h2, h3, h4, h5, h6, h7]
    .map(v => (v >>> 0).toString(16).padStart(8, '0'))
    .join('');
}

function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function anonymizePiiText(
  rawText: string,
  extraNames: string[] = []
): {
  sanitized: string;
  tokens: { token: string; original: string; type: string }[];
} {
  let sanitized = rawText;
  const tokens: { token: string; original: string; type: string }[] = [];
  let counter = 1;

  const replaceMatch = (regex: RegExp, typeLabel: string) => {
    sanitized = sanitized.replace(regex, (match) => {
      if (match.startsWith('[') && match.endsWith(']')) return match;
      const token = `[${typeLabel}_${String(counter++).padStart(2, '0')}]`;
      tokens.push({ token, original: match, type: typeLabel });
      return token;
    });
  };

  const validExtraNames = extraNames
    .map(n => n.trim())
    .filter(n => n.length >= 3)
    .sort((a, b) => b.length - a.length);

  validExtraNames.forEach(nameStr => {
    const rx = new RegExp(`\\b${escapeRegExp(nameStr)}\\b`, 'gi');
    replaceMatch(rx, 'PARTE_CLIENTE');
  });

  replaceMatch(
    /\b(?:Inversiones|Corporaci[oó]n|Grupo\s+Industrial|Grupo|Comercializadora|Constructora|Administradora|Desarrollos|Consorcio|Importadora|Distribuidora)\s+[A-ZÁÉÍÓÚÑ][A-Za-záéíóúñÁÉÍÓÚÑ0-9\s.&,-]{1,35}?(?:,\s*(?:C\.A\.|S\.A\.|S\.R\.L\.|S\.L\.|L\.L\.C\.))?(?=\s*\(|\s*,|\s+por\b|\s+y\b|\s+con\b|\s+seg[uú]n\b|\.|\s*$)/gi,
    'ENTIDAD_MERCANTIL'
  );
  replaceMatch(
    /\b[A-ZÁÉÍÓÚÑ][A-Za-záéíóúñÁÉÍÓÚÑ0-9\s.&-]{2,40}?,\s*(?:C\.A\.|S\.A\.|S\.R\.L\.|S\.A\.S\.|S\.L\.|L\.L\.C\.|INC\.)/g,
    'ENTIDAD_MERCANTIL'
  );
  replaceMatch(
    /\b(?:[VJGEP][-\s.]?\d{1,3}(?:[.\s]\d{3}){1,2}(?:[-\s]?\d)?|[VJGEP][-\s]?\d{7,9}(?:[-\s]?\d)?|\d{8}[A-Z]|[A-HJ-NP-SUVW]\d{7}[0-9A-J]|\d{2}-\d{8}-\d)\b/gi,
    'ID_FISCAL_DOC'
  );
  replaceMatch(
    /\b(?:[A-Z]{2}\d{2}[A-Z0-9]{12,30}|\d{4}[-\s]\d{4}[-\s]\d{2}[-\s]\d{10}|\d{20})\b/g,
    'CUENTA_BANCARIA'
  );
  replaceMatch(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    'EMAIL_CLIENTE'
  );
  replaceMatch(
    /(?:\+\d{1,3}[-\s.]?)?\(?\d{3,4}\)?[-\s.]?\d{3}[-\s.]?\d{4}\b/g,
    'TELEFONO_PRIVADO'
  );
  replaceMatch(
    /(?:(?:\b(?:USD|EUR|Bs\.?)|US\$|\$|€)\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\b|\b\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?\s?(?:USD|EUR|Bs\.?|dólares|euros|bolívares)\b)/gi,
    'MONTO_OPERACION'
  );

  return { sanitized, tokens };
}

function deAnonymizeText(
  text: string,
  tokens: { token: string; original: string; type: string }[]
): string {
  let restored = text;
  tokens.forEach(t => {
    restored = restored.split(t.token).join(t.original);
  });
  return restored;
}

function detectVariablesInTemplateText(rawText: string): ModelTemplateVariable[] {
  const matches = Array.from(rawText.matchAll(/\{\{([A-Za-z0-9_ÁÉÍÓÚÑáéíóúñ]+)\}\}/g)).map(m => m[1].toUpperCase());
  const uniqueKeys = Array.from(new Set(matches));
  if (uniqueKeys.length === 0) {
    return [
      { key: 'PARTE_A', label: 'Identificación de la Primera Parte / Otorgante', category: 'Partes', placeholder: 'Guía: Nombre completo, nacionalidad, estado civil, C.I. / RIF y domicilio' },
      { key: 'PARTE_B', label: 'Identificación de la Segunda Parte / Contraparte', category: 'Partes', placeholder: 'Guía: Nombre o Razón Social, RIF, datos de registro y representante' },
      { key: 'OBJETO_CONTRATO', label: 'Objeto y Descripción del Bien o Servicio', category: 'Objeto', placeholder: 'Guía: Descripción detallada del bien, medidas, linderos o prestación' },
      { key: 'PRECIO_CONDICIONES', label: 'Monto, Moneda y Forma de Pago', category: 'Económico', placeholder: 'Guía: Cantidad en letras y números, moneda y medio de pago' },
      { key: 'JURISDICCION', label: 'Domicilio Especial y Jurisdicción', category: 'Jurisdicción', placeholder: 'Guía: Ciudad y Tribunales competentes elegidos por las partes' }
    ];
  }
  return uniqueKeys.map(k => ({
    key: k,
    label: k.replace(/_/g, ' '),
    category: 'Campo del Modelo',
    placeholder: `Guía: Ingresa los datos correspondientes a {{${k}}}`
  }));
}

function exportWordDoc(filename: string, title: string, subtitle: string, bodyText: string) {
  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head><meta charset='utf-8'><title>${title}</title>
  <style>
    body { font-family: 'Georgia', 'Times New Roman', serif; font-size: 12pt; line-height: 1.65; color: #0F172A; margin: 2.5cm; }
    h1 { font-size: 14pt; text-transform: uppercase; text-align: center; margin-bottom: 6pt; }
    .meta { font-family: 'Courier New', monospace; font-size: 9pt; text-align: center; color: #475569; border-bottom: 1px solid #CBD5E1; padding-bottom: 10pt; margin-bottom: 18pt; }
    p { text-align: justify; margin-bottom: 10pt; white-space: pre-wrap; }
  </style></head>
  <body>
    <h1>${title}</h1>
    <div class="meta">${subtitle}</div>
    <p>${bodyText.replace(/\n/g, '<br/>')}</p>
  </body></html>`;

  const blob = new Blob(['\ufeff', html], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.doc') ? filename : `${filename}.doc`;
  a.click();
  URL.revokeObjectURL(url);
}

const PROVIDER_DEFAULT_MODELS: Record<'openai' | 'anthropic' | 'gemini' | 'groq' | 'ollama', string[]> = {
  openai: ['gpt-4o', 'gpt-4o-mini', 'o3-mini'],
  anthropic: ['claude-3-5-sonnet-latest', 'claude-3-5-haiku-latest'],
  gemini: ['gemini-2.5-pro', 'gemini-2.5-flash'],
  groq: ['llama-3.3-70b-versatile', 'mixtral-8x7b-32768'],
  ollama: ['llama3.1:8b', 'mistral-nemo:12b', 'qwen2.5:14b']
};

const DEFAULT_NON_WORKING_DATES: string[] = [
  '2026-01-01', '2026-02-16', '2026-02-17', '2026-04-02', '2026-04-03',
  '2026-04-19', '2026-05-01', '2026-06-24', '2026-07-05', '2026-07-24',
  '2026-10-12', '2026-12-24', '2026-12-25', '2026-12-31'
];

function isJudicialRecessDate(dateStr: string): boolean {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return false;
  const [, m, d] = parts;
  if ((m === 8 && d >= 15) || (m === 9 && d <= 15)) return true;
  if ((m === 12 && d >= 24) || (m === 1 && d <= 6)) return true;
  return false;
}

const STORAGE_KEY = 'ai_govern_legal_workspace_prod_v1';

// ============================================================================
// LLAMADA UNIVERSAL EN VIVO A LA API DEL ABOGADO (OPENAI / GEMINI / GROQ / ANTHROPIC / OLLAMA)
// ============================================================================

async function callConfiguredLlmApi(params: {
  provider: 'openai' | 'anthropic' | 'gemini' | 'groq' | 'ollama';
  model: string;
  apiKey: string;
  ollamaUrl: string;
  systemPrompt: string;
  userPrompt: string;
}): Promise<string> {
  const { provider, model, apiKey, ollamaUrl, systemPrompt, userPrompt } = params;
  const cleanKey = apiKey.trim();

  if (provider === 'openai' || provider === 'groq') {
    if (!cleanKey) throw new Error('Ingresa tu API Key en Configuración (Módulo 11).');
    const endpoint =
      provider === 'groq'
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

    const bodyPayload: Record<string, unknown> = {
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.15
    };
    if (provider === 'openai') bodyPayload.store = false;

    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${cleanKey}`
      },
      body: JSON.stringify(bodyPayload)
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Error de API (${resp.status}): ${errText.slice(0, 180)}`);
    }
    const data = await resp.json();
    return data?.choices?.[0]?.message?.content || '';
  }

  if (provider === 'gemini') {
    if (!cleanKey) throw new Error('Ingresa tu API Key de Google Gemini en Configuración (Módulo 11).');
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(cleanKey)}`;
    const resp = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
        generationConfig: { temperature: 0.15 }
      })
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Error de API Gemini (${resp.status}): ${errText.slice(0, 180)}`);
    }
    const data = await resp.json();
    return data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
  }

  if (provider === 'anthropic') {
    if (!cleanKey) throw new Error('Ingresa tu API Key de Anthropic en Configuración (Módulo 11).');
    const resp = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': cleanKey,
        'anthropic-version': '2023-06-01',
        'anthropic-dangerous-direct-browser-access': 'true'
      },
      body: JSON.stringify({
        model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: 'user', content: userPrompt }],
        temperature: 0.15
      })
    });
    if (!resp.ok) {
      const errText = await resp.text();
      throw new Error(`Error de API Anthropic (${resp.status}): ${errText.slice(0, 180)}`);
    }
    const data = await resp.json();
    return data?.content?.[0]?.text || '';
  }

  if (provider === 'ollama') {
    const base = (ollamaUrl || 'http://localhost:11434').replace(/\/$/, '');
    const ollamaEndpoint = `${base}/api/chat`;
    const resp = await fetch(ollamaEndpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        stream: false,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      })
    });
    if (!resp.ok) {
      throw new Error(`No se pudo conectar con Ollama en ${base} (${resp.status}).`);
    }
    const data = await resp.json();
    return data?.message?.content || '';
  }

  return '';
}

// ============================================================================
// COMPONENTE PRINCIPAL DEL SISTEMA OPERATIVO DEL ABOGADO
// ============================================================================

export default function AiGovernLegalSystem() {
  const [activeTab, setActiveTab] = useState<ModuleId>('consultor_ia');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [isMainSidebarOpen, setIsMainSidebarOpen] = useState<boolean>(true);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState<boolean>(false);
  const [isHistorySidebarOpen, setIsHistorySidebarOpen] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4200);
  };

  // ==========================================================================
  // PALETA DETERMINÍSTICA MODO CLARO / MODO OSCURO (SIN CONFLICTOS DE TAILWIND)
  // ==========================================================================
  const theme = useMemo(() => {
    if (darkMode) {
      return {
        pageBg: '#090D16',
        pageText: '#F8FAFC',
        cardBg: '#111827',
        cardBorder: '#1E293B',
        subBg: '#1E293B',
        subBorder: '#334155',
        inputBg: '#090D16',
        inputBorder: '#334155',
        inputText: '#F8FAFC',
        mutedText: '#94A3B8',
        accentText: '#FBBF24',
        emeraldText: '#34D399',
        primaryBtnBg: '#F59E0B',
        primaryBtnText: '#090D16',
        secondaryBtnBg: '#1E293B',
        secondaryBtnText: '#F8FAFC',
        secondaryBtnBorder: '#334155'
      };
    }
    return {
      pageBg: '#F6F5F2',
      pageText: '#0F172A',
      cardBg: '#FFFFFF',
      cardBorder: '#E2E8F0',
      subBg: '#F8FAFC',
      subBorder: '#E2E8F0',
      inputBg: '#FFFFFF',
      inputBorder: '#CBD5E1',
      inputText: '#0F172A',
      mutedText: '#64748B',
      accentText: '#B45309',
      emeraldText: '#047857',
      primaryBtnBg: '#0F172A',
      primaryBtnText: '#FFFFFF',
      secondaryBtnBg: '#FFFFFF',
      secondaryBtnText: '#0F172A',
      secondaryBtnBorder: '#CBD5E1'
    };
  }, [darkMode]);

  const cardStyle: React.CSSProperties = {
    backgroundColor: theme.cardBg,
    borderColor: theme.cardBorder,
    color: theme.pageText
  };

  const subCardStyle: React.CSSProperties = {
    backgroundColor: theme.subBg,
    borderColor: theme.subBorder,
    color: theme.pageText
  };

  const inputStyle: React.CSSProperties = {
    backgroundColor: theme.inputBg,
    borderColor: theme.inputBorder,
    color: theme.inputText
  };

  const secondaryBtnStyle: React.CSSProperties = {
    backgroundColor: theme.secondaryBtnBg,
    borderColor: theme.secondaryBtnBorder,
    color: theme.secondaryBtnText
  };

  // ==========================================================================
  // ESTADO DE CONFIGURACIÓN GENERAL (SIN DATOS FICTICIOS, LISTO PARA PRODUCCIÓN)
  // ==========================================================================
  const [llmProvider, setLlmProvider] = useState<'openai' | 'anthropic' | 'gemini' | 'groq' | 'ollama'>('openai');
  const [llmModel, setLlmModel] = useState<string>('gpt-4o');
  const [apiKeyInput, setApiKeyInput] = useState<string>('');
  const [ollamaBaseUrl, setOllamaBaseUrl] = useState<string>('http://localhost:11434');
  const [monthlyBudgetUsd, setMonthlyBudgetUsd] = useState<number>(50);
  const [currentSpendUsd, setCurrentSpendUsd] = useState<number>(0);
  const [savedHoursCount, setSavedHoursCount] = useState<number>(0);
  const [firmName, setFirmName] = useState<string>('');
  const [lawyerSignerName, setLawyerSignerName] = useState<string>('');
  const [lawyerCollegiateId, setLawyerCollegiateId] = useState<string>('');
  const [customPracticeArea, setCustomPracticeArea] = useState<string>('');

  const [librarySourceMode, setLibrarySourceMode] = useState<'Carpeta Local' | 'Google Drive'>('Google Drive');
  const [localFolderPath, setLocalFolderPath] = useState<string>('');
  const [driveFolderUrl, setDriveFolderUrl] = useState<string>('');

  // Biblioteca de Modelos (almacenamiento real con opción de agregar, editar y eliminar)
  const [templates, setTemplates] = useState<ModelTemplate[]>([]);
  const [newTplNameInput, setNewTplNameInput] = useState<string>('');
  const [newTplCategoryInput, setNewTplCategoryInput] = useState<string>('Civil / Mercantil');
  const [newTplContentInput, setNewTplContentInput] = useState<string>('');
  const [showAddTemplateModal, setShowAddTemplateModal] = useState<boolean>(false);

  // Repositorio RAG de Leyes y Normativa (almacenamiento real con opción de agregar, ver y eliminar)
  const [ragDocs, setRagDocs] = useState<RagLawDocument[]>([]);
  const [newRagTitleInput, setNewRagTitleInput] = useState<string>('');
  const [newRagTypeInput, setNewRagTypeInput] = useState<'Código / Ley' | 'Jurisprudencia / Doctrina' | 'Reglamento / Norma'>('Código / Ley');
  const [newRagContentInput, setNewRagContentInput] = useState<string>('');
  const [showAddRagModal, setShowAddRagModal] = useState<boolean>(false);
  const [viewingRagDoc, setViewingRagDoc] = useState<RagLawDocument | null>(null);

  // Bitácoras y Registros Reales (Inician en 0, se alimentan de las operaciones reales del abogado)
  const [approvedDocsRegistry, setApprovedDocsRegistry] = useState<ApprovedDocumentRecord[]>([]);
  const [piiAuditRegistry, setPiiAuditRegistry] = useState<PiiAuditEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // CRM de Clientes (Inicia limpio, 100% funcional con alta, edición, expedientes y eliminación)
  const [crmClients, setCrmClients] = useState<CrmClient[]>([]);
  const [selectedClientId, setSelectedClientId] = useState<string>('');
  const [crmSearch, setCrmSearch] = useState<string>('');
  const [showNewClientForm, setShowNewClientForm] = useState<boolean>(false);
  const [isEditingClient, setIsEditingClient] = useState<boolean>(false);
  const [newMatterInput, setNewMatterInput] = useState<string>('');
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    personType: 'Persona Jurídica (Empresa)' as 'Persona Jurídica (Empresa)' | 'Persona Física / Natural',
    taxId: '',
    legalRep: '',
    registryInfo: '',
    address: '',
    phone: '',
    email: '',
    feeArrangement: '',
    confidentialNotes: ''
  });

  const selectedClient = useMemo(
    () => crmClients.find(c => c.id === selectedClientId) || crmClients[0] || null,
    [crmClients, selectedClientId]
  );

  const crmProtectedNames = useMemo(() => {
    const names: string[] = [];
    crmClients.forEach(c => {
      if (c.name) names.push(c.name);
      const repClean = c.legalRep.split('(')[0]?.replace(/^(?:Dr\.|Dra\.|Ing\.|Lic\.|Abg\.)\s*/i, '').trim();
      if (repClean && repClean.length > 3) names.push(repClean);
    });
    return names;
  }, [crmClients]);

  // ==========================================================================
  // MÓDULO 1: CONSULTOR DE IA (100% FUNCIONAL, CONECTADO A API, RAG Y MODELOS)
  // ==========================================================================
  const [consultQuery, setConsultQuery] = useState<string>('');
  const [consultSelectedLawId, setConsultSelectedLawId] = useState<string>('auto');
  const [consultSelectedTemplateId, setConsultSelectedTemplateId] = useState<string>('auto');
  const [customMaskInput, setCustomMaskInput] = useState<string>('');
  const [customMaskedTerms, setCustomMaskedTerms] = useState<string[]>([]);
  const [consultShowSanitizedPayload, setConsultShowSanitizedPayload] = useState<boolean>(false);
  const [isConsultLoading, setIsConsultLoading] = useState<boolean>(false);
  const [historySearchQuery, setHistorySearchQuery] = useState<string>('');

  const [consultAttachments, setConsultAttachments] = useState<ConsultAttachment[]>([]);
  const [showConversationPasteBox, setShowConversationPasteBox] = useState<boolean>(false);
  const [conversationTitleInput, setConversationTitleInput] = useState<string>('');
  const [conversationTextInput, setConversationTextInput] = useState<string>('');
  const [followUpQuestionInput, setFollowUpQuestionInput] = useState<string>('');

  const [consultSessions, setConsultSessions] = useState<ConsultChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string>('');

  const activeSession = useMemo(
    () => consultSessions.find(s => s.id === activeSessionId) || null,
    [consultSessions, activeSessionId]
  );

  const consultThread = useMemo(
    () => activeSession?.turns || [],
    [activeSession]
  );

  const [consultResponse, setConsultResponse] = useState<ConsultTurn | null>(null);

  const allProtectedNames = useMemo(
    () => [...crmProtectedNames, ...customMaskedTerms],
    [crmProtectedNames, customMaskedTerms]
  );

  const combinedConsultRawInput = useMemo(() => {
    const baseText = consultQuery || followUpQuestionInput || '';
    const attText = consultAttachments
      .map(a => `[RECAUDO ADJUNTO - ${a.kind}: "${a.name}"]: ${a.rawContent}`)
      .join('\n');
    return attText ? `${baseText}\n\n${attText}` : baseText;
  }, [consultQuery, followUpQuestionInput, consultAttachments]);

  const liveSanitizedPreview = useMemo(
    () => anonymizePiiText(combinedConsultRawInput, allProtectedNames),
    [combinedConsultRawInput, allProtectedNames]
  );

  const handleStartNewConsultSession = () => {
    const newId = `sess-${Date.now().toString().slice(-5)}`;
    const blankSession: ConsultChatSession = {
      id: newId,
      title: 'Nueva Consulta Jurídica',
      updatedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      matterTag: 'Expediente Activo',
      turns: []
    };
    setConsultSessions(prev => [blankSession, ...prev]);
    setActiveSessionId(newId);
    setConsultQuery('');
    setConsultAttachments([]);
    setConsultResponse(null);
  };

  const handleSelectConsultSession = (sess: ConsultChatSession) => {
    setActiveSessionId(sess.id);
    const latestTurn = sess.turns[sess.turns.length - 1] || null;
    setConsultResponse(latestTurn);
  };

  const handleDeleteConsultSession = (sessId: string) => {
    const remaining = consultSessions.filter(s => s.id !== sessId);
    setConsultSessions(remaining);
    if (activeSessionId === sessId) {
      if (remaining.length > 0) {
        setActiveSessionId(remaining[0].id);
        setConsultResponse(remaining[0].turns[remaining[0].turns.length - 1] || null);
      } else {
        setActiveSessionId('');
        setConsultResponse(null);
      }
    }
    showToast('Conversación eliminada del historial.');
  };

  const handleAddCustomMaskTerm = () => {
    const term = customMaskInput.trim();
    if (!term) return;
    if (!customMaskedTerms.includes(term)) {
      setCustomMaskedTerms(prev => [...prev, term]);
    }
    setCustomMaskInput('');
    showToast(`Término "${term}" agregado al filtro de anonimización en RAM.`);
  };

  const handleAddConsultFileAttachment = (
    file: File,
    kind: 'Imagen / Captura' | 'Documento (.DOC / .DOCX)' | 'Archivo .PDF'
  ) => {
    const registerAttachment = (rawExtracted: string) => {
      const { sanitized, tokens } = anonymizePiiText(rawExtracted, allProtectedNames);
      const newAtt: ConsultAttachment = {
        id: `att-${Date.now().toString().slice(-5)}`,
        name: file.name,
        kind,
        rawContent: rawExtracted,
        sanitizedContent: sanitized,
        piiProtectedCount: tokens.length,
        addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setConsultAttachments(prev => [...prev, newAtt]);
      showToast(`"${file.name}" adjuntado (${tokens.length} datos PII protegidos en RAM).`);
    };

    if (typeof FileReader !== 'undefined' && kind !== 'Imagen / Captura') {
      const reader = new FileReader();
      reader.onload = () => {
        const rawText = String(reader.result || '');
        const printable = rawText.match(/[A-Za-záéíóúñÁÉÍÓÚÑ0-9.,;:()¿?¡!$€%@#/_\\\-\s]{10,}/g);
        const extracted = /\.(txt|md|csv|json|html)$/i.test(file.name)
          ? rawText.slice(0, 8000).trim()
          : printable
          ? printable.join(' ').replace(/\s+/g, ' ').slice(0, 6000).trim()
          : '';
        registerAttachment(
          extracted.length > 20
            ? extracted
            : `[Archivo adjunto: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]`
        );
      };
      reader.onerror = () => registerAttachment(`[Archivo adjunto: ${file.name}]`);
      reader.readAsText(file);
    } else {
      registerAttachment(`[Imagen / documento adjunto: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]`);
    }
  };

  const handleAddConversationAttachment = () => {
    if (!conversationTextInput.trim()) return;
    const raw = conversationTextInput.trim();
    const { sanitized, tokens } = anonymizePiiText(raw, allProtectedNames);
    const newAtt: ConsultAttachment = {
      id: `att-${Date.now().toString().slice(-5)}`,
      name: conversationTitleInput.trim() || 'Comunicación del Cliente',
      kind: 'Conversación de Cliente (WhatsApp / Email)',
      rawContent: raw,
      sanitizedContent: sanitized,
      piiProtectedCount: tokens.length,
      addedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setConsultAttachments(prev => [...prev, newAtt]);
    setConversationTextInput('');
    setConversationTitleInput('');
    setShowConversationPasteBox(false);
    showToast(`Comunicación adjuntada (${tokens.length} datos PII ocultados en RAM).`);
  };

  const handleRemoveConsultAttachment = (attId: string) => {
    setConsultAttachments(prev => prev.filter(a => a.id !== attId));
  };

  // Análisis forense estructurado en las 4 fases exigidas cuando no hay API externa o como respaldo determinístico basado en el RAG real cargado
  const buildStructuredForensicFallback = (
    questionText: string,
    activeLaws: RagLawDocument[],
    selectedTpl: ModelTemplate | undefined,
    attachments: ConsultAttachment[]
  ): string => {
    const lawsBlock =
      activeLaws.length > 0
        ? activeLaws
            .map(
              (l, idx) =>
                `${idx + 1}. ${l.title} (${l.type}):\n   • Contenido / Articulado en RAG: "${(l.fullText || l.excerpt).slice(0, 600)}${(l.fullText || l.excerpt).length > 600 ? '...' : ''}"\n   • Subsunción al caso: Los hechos planteados («${questionText.slice(0, 140)}») deben contrastarse directamente con los supuestos normativos contenidos en este cuerpo legal.`
            )
            .join('\n\n')
        : '• Aún no has cargado textos legales en el módulo 11 (Configuración -> Tus Leyes y Normativa RAG). Carga tus códigos o leyes en formato .PDF/.TXT o pega su articulado para que el análisis cite tus textos exactos.';

    const tplBlock = selectedTpl
      ? `Instrumento de referencia en tu Biblioteca: «${selectedTpl.name}» (Variables detectadas: ${selectedTpl.variables.map(v => `{{${v.key}}}`).join(', ')}).\n\nTexto base del modelo para estructurar la actuación:\n"${selectedTpl.contentPreview.slice(0, 500)}${selectedTpl.contentPreview.length > 500 ? '...' : ''}"`
      : 'No hay modelos cargados aún en tu Biblioteca. Puedes agregar tus propios contratos o escritos en la pestaña 11 (Configuración -> Tu Biblioteca de Modelos).';

    const attBlock =
      attachments.length > 0
        ? `RECAUDOS EXAMINADOS EN ESTA CONSULTA (${attachments.length}):\n` +
          attachments.map((a, i) => `${i + 1}) [${a.kind}] ${a.name}: ${a.rawContent.slice(0, 220)}`).join('\n') +
          '\n\n'
        : '';

    return `${attBlock}I. BASE LEGAL Y ANÁLISIS DE LOS ARTÍCULOS INVOLUCRADOS POR CADA LEY (RAG):

${lawsBlock}

II. OPCIONES JURÍDICAS DISPONIBLES:

• Opción Primera (Vía Sustantiva / Contractual): Exigir el cumplimiento estricto o la adecuación de las estipulaciones conforme a la normativa indexada en el RAG y a las cláusulas del modelo aplicable.
• Opción Segunda (Vía Prejudicial / Intimatoria): Practicar requerimiento o notificación formal dejando constancia fehaciente de la pretensión y agotando la fase previa o constitutiva de mora.
• Opción Tercera (Vía Jurisdiccional y Cautelar): Interponer la acción correspondiente ante los Tribunales competentes solicitando medidas preventivas para asegurar el resultado práctico del fallo.

III. ANÁLISIS DE ESCENARIOS Y CONSECUENCIAS DE CADA ESCENARIO:

• Escenario A (Ejecución Prejudicial Documentada):
  - Presupuesto: Existencia de recaudos suficientes y posibilidad de avenimiento o constitución inmediata en mora.
  - Consecuencias: Preconstituye prueba plena para un eventual litigio, reduce tiempos y evita defensas dilatorias de la contraparte.
• Escenario B (Contencioso con Solicitud de Medida Cautelar):
  - Presupuesto: Negativa de cumplimiento o riesgo de enajenación/insolvencia de la contraparte.
  - Consecuencias: Asegura el patrimonio objeto del litigio desde la admisión de la demanda e impone condena en costas procesales en caso de vencimiento total.

IV. DECISIÓN DE EJECUCIÓN, MODO DE ACCIONAR Y REDACCIÓN FORENSE:

• Secuencia de Ejecución:
  1) Auditar la suficiencia probatoria de los documentos e instrumentos del cliente.
  2) Formalizar la actuación utilizando la matriz correspondiente de la Biblioteca del Despacho.
  3) Proceder al otorgamiento, notificación o consignación dentro de los lapsos de ley.

• Vinculación con tu Biblioteca de Modelos:
${tplBlock}

[Nota del Sistema: Para que este dictamen sea redactado en vivo por tu motor de IA (${llmProvider.toUpperCase()} - ${llmModel}), ingresa tu API Key activa en el módulo 11. Configuración.]`;
  };

  const executeConsultationTurn = async (questionToAsk: string, isFollowUp: boolean = false) => {
    const cleanQ = questionToAsk.trim();
    if (!cleanQ) return;
    setIsConsultLoading(true);

    const fullRawForTurn = [
      cleanQ,
      ...consultAttachments.map(a => `[Recaudo Adjunto (${a.kind}) - ${a.name}]:\n${a.rawContent}`)
    ].join('\n\n');

    const { sanitized, tokens } = anonymizePiiText(fullRawForTurn, allProtectedNames);

    const activeLaws =
      consultSelectedLawId !== 'auto'
        ? ragDocs.filter(d => d.id === consultSelectedLawId)
        : ragDocs;

    const chosenTemplate =
      consultSelectedTemplateId !== 'auto'
        ? templates.find(t => t.id === consultSelectedTemplateId) || templates[0]
        : templates[0];

    let finalDictamenText = '';
    const hasConfiguredApi =
      llmProvider === 'ollama' || (apiKeyInput.trim().length > 8 && !apiKeyInput.includes('•'));

    if (hasConfiguredApi) {
      try {
        const ragContextStr =
          activeLaws.length > 0
            ? activeLaws
                .map(d => `=== LEY / NORMA EN RAG: ${d.title} (${d.type}) ===\n${d.fullText || d.excerpt}`)
                .join('\n\n')
            : 'El usuario aún no ha cargado documentos en el RAG. Responde conforme al Derecho positivo vigente aplicable e indícale qué leyes puede subir al RAG.';

        const tplContextStr =
          templates.length > 0
            ? templates
                .map(
                  t =>
                    `=== MODELO DE BIBLIOTECA: ${t.name} (${t.category}) ===\nVariables: ${t.variables.map(v => `{{${v.key}}}`).join(', ')}\nContenido:\n${t.contentPreview}`
                )
                .join('\n\n')
            : 'El usuario aún no ha cargado modelos en su Biblioteca.';

        const historyStr = consultThread
          .slice(-4)
          .map(t => `Consulta previa del Abogado:\n${t.sanitizedSentToAi}\n\nDictamen previo:\n${t.dictamen}`)
          .join('\n\n---\n\n');

        const sysPrompt = `Eres un Abogado Senior en Ejercicio y Jurisconsulto Forense del despacho "${firmName || 'Despacho Jurídico'}", asistiendo a ${lawyerSignerName || 'Abogado Titular'} (${lawyerCollegiateId || 'Colegiado'}).
REGLAS ESTRICTAS DE RIGOR Y CERO ALUCINACIÓN:
1) Prohibido usar emojis, tono coloquial o frases de asistente genérico. Habla estrictamente como un abogado especialista en ejercicio.
2) Fundamenta tu dictamen en las LEYES CARGADAS EN EL RAG DEL DESPACHO y en los MODELOS DE LA BIBLIOTECA DEL DESPACHO suministrados abajo. No inventes artículos ni jurisprudencia inexistente.
3) ESTRUCTURA OBLIGATORIAMENTE TU RESPUESTA EN ESTAS CUATRO (04) FASES FORENSES:
   I. BASE LEGAL Y ANÁLISIS DE LOS ARTÍCULOS INVOLUCRADOS POR CADA LEY (RAG): Analiza ley por ley y artículo por artículo los preceptos aplicables al caso y su subsunción jurídica.
   II. OPCIONES JURÍDICAS DISPONIBLES: Determina con precisión técnica las vías o acciones que asisten al cliente.
   III. ANÁLISIS DE ESCENARIOS Y CONSECUENCIAS DE CADA ESCENARIO: Evalúa cada escenario posible (Escenario A, Escenario B, etc.), su carga probatoria y sus consecuencias jurídicas, procesales y patrimoniales.
   IV. DECISIÓN DE EJECUCIÓN, MODO DE ACCIONAR Y REDACCIÓN FORENSE: Define la decisión técnica de ejecución, el paso a paso concreto para lograr el resultado y entrega la redacción forense del instrumento, cláusula o escrito adaptada a los modelos de la biblioteca del despacho.

LEYES Y NORMATIVA EN EL RAG DEL DESPACHO:
${ragContextStr}

MODELOS DE LA BIBLIOTECA DEL DESPACHO:
${tplContextStr}

${historyStr ? `HISTORIAL DE LA CONSULTA ACTUAL:\n${historyStr}` : ''}`;

        const rawAiOutput = await callConfiguredLlmApi({
          provider: llmProvider,
          model: llmModel,
          apiKey: apiKeyInput,
          ollamaUrl: ollamaBaseUrl,
          systemPrompt: sysPrompt,
          userPrompt: sanitized
        });

        if (rawAiOutput.trim()) {
          finalDictamenText = deAnonymizeText(rawAiOutput.trim(), tokens);
        }
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al conectar con la API.';
        showToast(msg);
        finalDictamenText =
          `[Aviso de Conexión API: ${msg}]\n\n` +
          buildStructuredForensicFallback(cleanQ, activeLaws, chosenTemplate, consultAttachments);
      }
    } else {
      finalDictamenText = buildStructuredForensicFallback(cleanQ, activeLaws, chosenTemplate, consultAttachments);
    }

    const primaryLawTitle = activeLaws[0]?.title || 'Repositorio RAG del Despacho';
    const hash = computeRealSha256(`${sanitized}|${primaryLawTitle}|${Date.now()}`);
    const newAuditLogId = `TRZ-${Date.now().toString().slice(-5)}`;
    const turnId = `TURN-${Date.now().toString().slice(-5)}`;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const newTurn: ConsultTurn = {
      id: turnId,
      timestamp: nowTime,
      lawyerQuestion: cleanQ,
      sanitizedSentToAi: sanitized,
      dictamen: finalDictamenText,
      clientReadyReply: '',
      recommendedTemplateId: chosenTemplate?.id || '',
      recommendedTemplateName: chosenTemplate?.name || 'Sin modelo seleccionado',
      suggestedClauseText: finalDictamenText,
      citations: activeLaws.map(d => d.title),
      attachmentsUsed: consultAttachments.map(a => `${a.name} (${a.kind})`),
      tokensProtected: tokens.length,
      hash,
      auditLogId: newAuditLogId,
      approvedInHumanLoop: false
    };

    const targetSessId = activeSessionId || `sess-${Date.now().toString().slice(-5)}`;
    if (!activeSessionId) setActiveSessionId(targetSessId);

    setConsultSessions(prev => {
      const exists = prev.some(s => s.id === targetSessId);
      if (!exists) {
        const created: ConsultChatSession = {
          id: targetSessId,
          title: cleanQ.slice(0, 48) + (cleanQ.length > 48 ? '...' : ''),
          updatedAt: nowTime,
          matterTag: activeLaws[0]?.type || 'Consulta Forense',
          turns: [newTurn]
        };
        return [created, ...prev];
      }
      return prev.map(s => {
        if (s.id !== targetSessId) return s;
        const nextTitle =
          s.turns.length === 0 || s.title === 'Nueva Consulta Jurídica'
            ? cleanQ.slice(0, 48) + (cleanQ.length > 48 ? '...' : '')
            : s.title;
        return {
          ...s,
          title: nextTitle,
          updatedAt: nowTime,
          turns: [...s.turns, newTurn]
        };
      });
    });

    setConsultResponse(newTurn);

    setPiiAuditRegistry(prev => [
      {
        id: `PII-${Date.now().toString().slice(-5)}`,
        timestamp: nowTime,
        originModule: 'Consultor de IA',
        contextSummary: `${isFollowUp ? 'Ampliación' : 'Consulta'}: ${cleanQ.slice(0, 70)}`,
        tokensDetected:
          tokens.length > 0
            ? tokens.map(t => ({
                token: t.token,
                type: t.type,
                maskedPreview: `${t.original.slice(0, 4)}••• (Ocultado en RAM)`
              }))
            : [{ token: '[SIN_PII]', type: 'VERIFICADO', maskedPreview: 'Sin datos personales detectados' }],
        zeroRetentionVerified: true
      },
      ...prev
    ]);

    setAuditLogs(prev => [
      {
        id: newAuditLogId,
        timestamp: nowTime,
        module: 'Consultor de IA',
        action: 'Dictamen Forense en 4 Etapas (RAG + Biblioteca)',
        llmUsed: `${llmProvider}/${llmModel}`,
        piiCount: tokens.length,
        ragSource: primaryLawTitle,
        sha256: hash,
        humanVerified: false
      },
      ...prev
    ]);

    setConsultQuery('');
    setFollowUpQuestionInput('');
    setConsultAttachments([]);
    setIsConsultLoading(false);
    setCurrentSpendUsd(prev => +(prev + 0.01).toFixed(2));
    setSavedHoursCount(prev => +(prev + 1.5).toFixed(1));
  };

  const handleRunConsultor = () => {
    const q = consultQuery.trim() || followUpQuestionInput.trim();
    if (!q) return;
    executeConsultationTurn(q, consultThread.length > 0);
  };

  const handleRunFollowUpQuestion = () => {
    const q = followUpQuestionInput.trim() || consultQuery.trim();
    if (!q) return;
    executeConsultationTurn(q, true);
  };

  const handleSendConsultToRedactor = (turnToUse?: ConsultTurn) => {
    const target = turnToUse || consultResponse;
    if (!target) return;
    if (target.recommendedTemplateId) {
      handleSelectTemplate(target.recommendedTemplateId);
    }
    setFreeTextToExtract(target.dictamen);
    setInputModeTab('escrito_manual');
    setExtractedSourceNote('Contenido trasladado desde el Consultor Jurídico.');
    setActiveTab('redactor_docs');
    setRedactorStep(3);
    showToast('Dictamen trasladado al Redactor de Documentos.');
  };

  const handleApproveConsultorDictamen = (turnToApprove?: ConsultTurn) => {
    const target = turnToApprove || consultResponse;
    if (!target) return;
    if (target.approvedInHumanLoop) {
      showToast('Este dictamen ya fue visado en Human-in-the-Loop.');
      return;
    }
    const signer = lawyerSignerName.trim() || 'Abogado Titular';
    const colegiado = lawyerCollegiateId.trim() || 'Colegiado Titular';
    const record: ApprovedDocumentRecord = {
      id: `HL-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }),
      title: `Dictamen Forense — ${(activeSession?.title || 'Consulta').slice(0, 42)}`,
      originModule: 'Consultor de IA',
      templateUsed: target.recommendedTemplateName || 'RAG del Despacho',
      approvedBy: signer,
      collegiateNumber: colegiado,
      sha256: target.hash,
      content: target.dictamen
    };
    setApprovedDocsRegistry(prev => [record, ...prev]);
    setConsultSessions(prev =>
      prev.map(s =>
        s.id !== activeSessionId
          ? s
          : {
              ...s,
              turns: s.turns.map(t => (t.hash === target.hash ? { ...t, approvedInHumanLoop: true } : t))
            }
      )
    );
    setAuditLogs(prev =>
      prev.map(log =>
        log.id === target.auditLogId || log.sha256 === target.hash
          ? { ...log, humanVerified: true }
          : log
      )
    );
    exportWordDoc(
      `Dictamen_Juridico_${Date.now().toString().slice(-4)}.doc`,
      'DICTAMEN JURÍDICO FORENSE',
      `Visado por: ${signer} (${colegiado}) • SHA-256: ${target.hash.slice(0, 24)}...`,
      target.dictamen
    );
    showToast('Dictamen visado y descargado en .DOC.');
  };

  // ==========================================================================
  // MÓDULO 2: REDACTOR DE DOCUMENTOS (100% FUNCIONAL SOBRE TUS MODELOS)
  // ==========================================================================
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const selectedTemplate = useMemo(
    () => templates.find(t => t.id === selectedTemplateId) || templates[0] || null,
    [templates, selectedTemplateId]
  );
  const [redactorStep, setRedactorStep] = useState<1 | 2 | 3>(1);
  const [inputModeTab, setInputModeTab] = useState<'foto_ocr' | 'pdf_doc' | 'escrito_manual'>('escrito_manual');
  const [extractedSourceNote, setExtractedSourceNote] = useState<string>('');
  const [freeTextToExtract, setFreeTextToExtract] = useState<string>('');
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});
  const [redactorApprovedStamp, setRedactorApprovedStamp] = useState<string | null>(null);
  const [isRedactorExtracting, setIsRedactorExtracting] = useState<boolean>(false);

  const handleSelectTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    setRedactorApprovedStamp(null);
    const found = templates.find(t => t.id === tplId);
    if (!found) return;
    const cleanMap: Record<string, string> = {};
    found.variables.forEach(v => {
      cleanMap[v.key] = templateValues[v.key] || '';
    });
    setTemplateValues(cleanMap);
    setRedactorStep(2);
  };

  const spousalConsentWarning = useMemo(() => {
    const allVals = Object.values(templateValues).join(' ').toLowerCase();
    const isMarried = /\bcasad[oa]\b/.test(allVals);
    const hasConsent =
      allVals.includes('cónyuge') ||
      allVals.includes('conyuge') ||
      allVals.includes('consentimiento') ||
      allVals.includes('bien propio') ||
      allVals.includes('168');
    return isMarried && !hasConsent;
  }, [templateValues]);

  const handleApplySpousalClause = (mode: 'consentimiento' | 'bien_propio') => {
    if (!selectedTemplate || selectedTemplate.variables.length === 0) return;
    const firstKey = selectedTemplate.variables[0].key;
    const current = templateValues[firstKey] || '';
    const addition =
      mode === 'consentimiento'
        ? ', con el consentimiento expreso de su cónyuge conforme al Artículo 168 del Código Civil'
        : ', declarando que el bien objeto de este acto constituye bien propio (Art. 151 y 168 del Código Civil)';
    setTemplateValues({
      ...templateValues,
      [firstKey]: current.replace(/\.$/, '') + addition
    });
    showToast('Mención del Artículo 168 del Código Civil incorporada.');
  };

  const parseTextIntoTemplateVariables = async (rawNotes: string, sourceLabel: string) => {
    if (!selectedTemplate) {
      showToast('Primero agrega o selecciona un modelo en tu Biblioteca.');
      return;
    }
    const nextVals = { ...templateValues };
    const lines = rawNotes.split('\n').map(l => l.trim()).filter(Boolean);

    lines.forEach(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) return;
      const prefix = line.slice(0, colonIdx).toLowerCase().trim();
      const val = line.slice(colonIdx + 1).trim();
      if (!val) return;

      selectedTemplate.variables.forEach(v => {
        const keyNorm = v.key.toLowerCase().replace(/_/g, ' ');
        const labelNorm = v.label.toLowerCase();
        if (prefix.includes(keyNorm) || keyNorm.includes(prefix) || labelNorm.includes(prefix)) {
          nextVals[v.key] = val;
        }
      });
    });

    // Si tiene API configurada, usa la IA para extraer con precisión cada variable {{KEY}} del texto o documento subido
    const hasApi = llmProvider === 'ollama' || (apiKeyInput.trim().length > 8 && !apiKeyInput.includes('•'));
    if (hasApi && rawNotes.trim().length > 15) {
      setIsRedactorExtracting(true);
      try {
        const varKeys = selectedTemplate.variables.map(v => v.key).join(', ');
        const sys = `Extrae del texto suministrado los valores para rellenar las variables de este modelo jurídico: [${varKeys}]. Devuelve ÚNICAMENTE un objeto JSON válido donde cada clave sea el nombre exacto de la variable y su valor sea el texto extraído.`;
        const { sanitized, tokens } = anonymizePiiText(rawNotes, allProtectedNames);
        const aiResp = await callConfiguredLlmApi({
          provider: llmProvider,
          model: llmModel,
          apiKey: apiKeyInput,
          ollamaUrl: ollamaBaseUrl,
          systemPrompt: sys,
          userPrompt: sanitized
        });
        const jsonMatch = aiResp.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          Object.keys(parsed).forEach(k => {
            if (parsed[k]) {
              nextVals[k] = deAnonymizeText(String(parsed[k]), tokens);
            }
          });
        }
      } catch {
        // Conserva la extracción local por etiquetas
      }
      setIsRedactorExtracting(false);
    }

    setTemplateValues(nextVals);
    setExtractedSourceNote(`${sourceLabel} procesado.`);
    setRedactorStep(3);
    showToast('Datos aplicados a las variables del modelo.');
  };

  const handleExtractFromPhotoOrPdf = (file: File, sourceType: 'Foto (OCR)' | 'Documento PDF') => {
    if (typeof FileReader !== 'undefined') {
      const reader = new FileReader();
      reader.onload = () => {
        const raw = String(reader.result || '');
        const printable = raw.match(/[A-Za-záéíóúñÁÉÍÓÚÑ0-9.,;:()¿?¡!$€%@#/_\\\-\s]{8,}/g);
        const textContent = /\.(txt|md|csv|json)$/i.test(file.name)
          ? raw
          : printable
          ? printable.join('\n')
          : '';
        if (textContent.trim()) {
          setFreeTextToExtract(textContent.slice(0, 4000));
          parseTextIntoTemplateVariables(textContent.slice(0, 4000), `${sourceType} ("${file.name}")`);
        } else {
          setExtractedSourceNote(`Archivo "${file.name}" cargado. Completa o verifica los campos abajo.`);
          setRedactorStep(3);
        }
      };
      reader.readAsText(file);
    }
  };

  const handleExtractFromWrittenNotes = () => {
    if (!freeTextToExtract.trim()) return;
    parseTextIntoTemplateVariables(freeTextToExtract, 'Texto libre');
  };

  const handleLoadClientIntoRedactor = (client: CrmClient) => {
    if (!selectedTemplate) {
      setActiveTab('redactor_docs');
      showToast('Selecciona o carga primero un modelo en el Redactor.');
      return;
    }
    const fullPartyDesc =
      client.personType === 'Persona Jurídica (Empresa)'
        ? `${client.name}, RIF ${client.taxId}, inscrita en ${client.registryInfo}, representada por ${client.legalRep}`
        : `${client.name}, documento de identidad Nº ${client.taxId}, domiciliado(a) en ${client.address}`;

    const nextVals = { ...templateValues };
    if (selectedTemplate.variables.length > 0) {
      nextVals[selectedTemplate.variables[0].key] = fullPartyDesc;
    }
    setTemplateValues(nextVals);
    setExtractedSourceNote(`Ficha legal de "${client.name}" importada desde el CRM.`);
    setActiveTab('redactor_docs');
    setRedactorStep(3);
    showToast(`Datos de "${client.name}" trasladados al Redactor.`);
  };

  const compiledDocument = useMemo(() => {
    if (!selectedTemplate) return '';
    let text = selectedTemplate.contentPreview;
    selectedTemplate.variables.forEach(v => {
      const val = templateValues[v.key]?.trim() || `[PENDIENTE: {{${v.key}}}]`;
      text = text.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'gi'), val);
    });
    return text;
  }, [selectedTemplate, templateValues]);

  const handleApproveAndExportRedactorDoc = () => {
    if (!selectedTemplate || !compiledDocument.trim()) return;
    const { tokens } = anonymizePiiText(compiledDocument, allProtectedNames);
    const signer = lawyerSignerName.trim() || 'Abogado Titular';
    const colegiado = lawyerCollegiateId.trim() || 'Colegiado Titular';
    const hash = computeRealSha256(`${compiledDocument}|${signer}|${Date.now()}`);
    const nowStr = new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });

    const newApproved: ApprovedDocumentRecord = {
      id: `HL-${Date.now().toString().slice(-5)}`,
      timestamp: nowStr,
      title: selectedTemplate.name,
      originModule: 'Redactor de Documentos',
      templateUsed: `${selectedTemplate.name} (${selectedTemplate.source})`,
      approvedBy: signer,
      collegiateNumber: colegiado,
      sha256: hash,
      content: compiledDocument
    };
    setApprovedDocsRegistry(prev => [newApproved, ...prev]);

    setPiiAuditRegistry(prev => [
      {
        id: `PII-${Date.now().toString().slice(-5)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        originModule: 'Redactor de Documentos',
        contextSummary: `Redacción y visado: ${selectedTemplate.name}`,
        tokensDetected:
          tokens.length > 0
            ? tokens.map(t => ({
                token: t.token,
                type: t.type,
                maskedPreview: `${t.original.slice(0, 5)}••• (Protegido localmente)`
              }))
            : [{ token: '[LOCAL]', type: 'DOCUMENTO', maskedPreview: 'Procesado en memoria local' }],
        zeroRetentionVerified: true
      },
      ...prev
    ]);

    setAuditLogs(prev => [
      {
        id: `TRZ-${Date.now().toString().slice(-5)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        module: 'Redactor de Documentos',
        action: `Visado y exportación .DOC: ${selectedTemplate.name}`,
        llmUsed: `${llmProvider}/${llmModel}`,
        piiCount: tokens.length,
        ragSource: selectedTemplate.source,
        sha256: hash,
        humanVerified: true
      },
      ...prev
    ]);

    setRedactorApprovedStamp(hash);
    setSavedHoursCount(prev => +(prev + 2.0).toFixed(1));
    exportWordDoc(
      `${selectedTemplate.name.replace(/\s+/g, '_')}_Visado.doc`,
      selectedTemplate.name.toUpperCase(),
      `Visado por: ${signer} (${colegiado}) • Fecha: ${nowStr} • SHA-256: ${hash.slice(0, 20)}...`,
      `${compiledDocument}\n\n____________________________________________________\nVISADO POR: ${signer}\n${colegiado}\nSello SHA-256: ${hash}`
    );
    showToast('Documento visado y descargado en formato .DOC.');
  };

  // ==========================================================================
  // MÓDULO 3: GRABADOR DE ACTAS (CON DICTADO EN VIVO / TRANSCRIPCIÓN Y TAREAS)
  // ==========================================================================
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordingMode, setRecordingMode] = useState<'Presencial (Sala / Despacho)' | 'Meeting Online (Zoom / Meet / Teams)'>('Presencial (Sala / Despacho)');
  const [meetingTitleInput, setMeetingTitleInput] = useState<string>('');
  const [meetingAttendeesInput, setMeetingAttendeesInput] = useState<string>('');
  const [liveTranscriptInput, setLiveTranscriptInput] = useState<string>('');
  const [newAgreementInput, setNewAgreementInput] = useState<string>('');
  const [newAgreementDateInput, setNewAgreementDateInput] = useState<string>(new Date().toISOString().slice(0, 10));
  const [draftAgreements, setDraftAgreements] = useState<{ text: string; dueDate: string }[]>([]);
  const [showMinutaModal, setShowMinutaModal] = useState<RecordingNote | null>(null);
  const [recordings, setRecordings] = useState<RecordingNote[]>([]);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const speechRecRef = useRef<any>(null);

  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
      // Activa reconocimiento de voz nativo del navegador si está disponible
      try {
        const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
        if (SpeechRecognition) {
          const recognition = new SpeechRecognition();
          recognition.lang = 'es-VE';
          recognition.continuous = true;
          recognition.interimResults = false;
          recognition.onresult = (event: any) => {
            let chunk = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
              if (event.results[i].isFinal) {
                chunk += event.results[i][0].transcript + ' ';
              }
            }
            if (chunk.trim()) {
              setLiveTranscriptInput(prev => (prev ? `${prev}\n${chunk.trim()}` : chunk.trim()));
            }
          };
          recognition.start();
          speechRecRef.current = recognition;
        }
      } catch {
        // Si el navegador no soporta Web Speech API, permite transcripción/notas en vivo
      }
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (speechRecRef.current) {
        try {
          speechRecRef.current.stop();
        } catch {
          // ignorar
        }
        speechRecRef.current = null;
      }
      setRecordingSeconds(0);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  const handleAddDraftAgreement = () => {
    if (!newAgreementInput.trim()) return;
    setDraftAgreements(prev => [
      ...prev,
      { text: newAgreementInput.trim(), dueDate: newAgreementDateInput || new Date().toISOString().slice(0, 10) }
    ]);
    setNewAgreementInput('');
  };

  const handleFinishRecordingSimulation = () => {
    setIsRecording(false);
    const title = meetingTitleInput.trim() || 'Acta de Reunión Jurídica';
    const attendees = meetingAttendeesInput.trim() || lawyerSignerName || 'Participantes de la sesión';
    const todayIso = new Date().toISOString().slice(0, 10);
    const mins = String(Math.floor(recordingSeconds / 60)).padStart(2, '0');
    const secs = String(recordingSeconds % 60).padStart(2, '0');
    const formattedDuration = `${mins}:${secs}`;
    const transcriptText = liveTranscriptInput.trim() || 'Sesión registrada sin transcripción textual adicional.';

    const { tokens } = anonymizePiiText(transcriptText, allProtectedNames);
    const hash = computeRealSha256(`${title}|${transcriptText}|${Date.now()}`);

    const summaryLines = transcriptText
      .split(/\n|\./)
      .map(s => s.trim())
      .filter(s => s.length > 15)
      .slice(0, 4);

    const newRec: RecordingNote = {
      id: `rec-${Date.now().toString().slice(-4)}`,
      title,
      date: todayIso,
      duration: formattedDuration,
      mode: recordingMode,
      attendees,
      summaryPoints:
        summaryLines.length > 0
          ? summaryLines
          : [`Sesión (${recordingMode}) celebrada con ${attendees}.`],
      agreementsAndTasks: draftAgreements.map((da, idx) => ({
        id: `act-${Date.now()}-${idx}`,
        text: da.text,
        dueDate: da.dueDate,
        addedToPlanner: false
      })),
      transcript: transcriptText
    };

    setRecordings(prev => [newRec, ...prev]);
    setMeetingTitleInput('');
    setMeetingAttendeesInput('');
    setLiveTranscriptInput('');
    setDraftAgreements([]);

    setPiiAuditRegistry(prev => [
      {
        id: `PII-${Date.now().toString().slice(-5)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        originModule: 'Grabador de Actas',
        contextSummary: `Acta generada: ${title}`,
        tokensDetected:
          tokens.length > 0
            ? tokens.map(t => ({
                token: t.token,
                type: t.type,
                maskedPreview: `${t.original.slice(0, 4)}••• (Protegido en RAM)`
              }))
            : [{ token: '[ACTA_LOCAL]', type: 'SALA', maskedPreview: 'Procesada localmente' }],
        zeroRetentionVerified: true
      },
      ...prev
    ]);

    setAuditLogs(prev => [
      {
        id: `TRZ-${Date.now().toString().slice(-5)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        module: 'Grabador de Actas',
        action: `Acta registrada: ${title}`,
        llmUsed: `${llmProvider}/${llmModel}`,
        piiCount: tokens.length,
        ragSource: 'Audio / Transcripción Local',
        sha256: hash,
        humanVerified: false
      },
      ...prev
    ]);

    setSavedHoursCount(prev => +(prev + 1.0).toFixed(1));
    showToast('Acta guardada correctamente.');
  };

  const handleDeleteRecording = (recId: string) => {
    setRecordings(prev => prev.filter(r => r.id !== recId));
    showToast('Acta eliminada.');
  };

  // ==========================================================================
  // MÓDULO 4 Y 5: PLANIFICADOR Y CALENDARIO MENSUAL REAL
  // ==========================================================================
  const [tasks, setTasks] = useState<PlannerTask[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([]);

  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskClient, setNewTaskClient] = useState<string>('');
  const [newTaskDate, setNewTaskDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [newTaskPriority, setNewTaskPriority] = useState<'Alta' | 'Media' | 'Baja'>('Alta');

  const handleToggleRecordingTaskCheck = (recId: string, actionId: string) => {
    const targetRec = recordings.find(r => r.id === recId);
    const targetItem = targetRec?.agreementsAndTasks.find(a => a.id === actionId);
    if (!targetRec || !targetItem) return;

    const nextState = !targetItem.addedToPlanner;
    if (nextState) {
      const newTaskId = `tsk-${Date.now()}`;
      const newEventId = `ev-${Date.now()}`;
      setTasks(tPrev => [
        {
          id: newTaskId,
          title: targetItem.text,
          client: targetRec.attendees,
          dueDate: targetItem.dueDate,
          status: 'Pendiente',
          priority: 'Alta',
          origin: 'Grabador de Actas'
        },
        ...tPrev
      ]);
      setCalendarEvents(cPrev => [
        ...cPrev,
        {
          id: newEventId,
          title: targetItem.text,
          date: targetItem.dueDate,
          type: 'Reunión / Acta',
          client: targetRec.title,
          linkedTaskId: newTaskId
        }
      ]);
      setRecordings(prev =>
        prev.map(rec =>
          rec.id !== recId
            ? rec
            : {
                ...rec,
                agreementsAndTasks: rec.agreementsAndTasks.map(item =>
                  item.id !== actionId
                    ? item
                    : { ...item, addedToPlanner: true, linkedTaskId: newTaskId, linkedEventId: newEventId }
                )
              }
        )
      );
      showToast(`Acuerdo enviado al Planificador y Calendario (${targetItem.dueDate}).`);
    } else {
      setTasks(tPrev => tPrev.filter(tk => tk.id !== targetItem.linkedTaskId));
      setCalendarEvents(cPrev => cPrev.filter(ev => ev.id !== targetItem.linkedEventId));
      setRecordings(prev =>
        prev.map(rec =>
          rec.id !== recId
            ? rec
            : {
                ...rec,
                agreementsAndTasks: rec.agreementsAndTasks.map(item =>
                  item.id !== actionId
                    ? item
                    : { ...item, addedToPlanner: false, linkedTaskId: undefined, linkedEventId: undefined }
                )
              }
        )
      );
      showToast('Acuerdo removido del Planificador y Calendario.');
    }
  };

  const handleAddPlannerTask = () => {
    if (!newTaskTitle.trim() || !newTaskDate) return;
    const taskId = `tsk-${Date.now().toString().slice(-4)}`;
    const createdTask: PlannerTask = {
      id: taskId,
      title: newTaskTitle.trim(),
      client: newTaskClient.trim() || 'Despacho',
      dueDate: newTaskDate,
      status: 'Pendiente',
      priority: newTaskPriority,
      origin: 'Planificador'
    };
    setTasks(prev => [createdTask, ...prev]);
    setCalendarEvents(prev => [
      ...prev,
      {
        id: `ev-${Date.now().toString().slice(-4)}`,
        title: createdTask.title,
        date: createdTask.dueDate,
        type: 'Tarea Planificador',
        client: createdTask.client,
        linkedTaskId: taskId
      }
    ]);
    setNewTaskTitle('');
    setNewTaskClient('');
    showToast(`Tarea agendada para el ${newTaskDate}.`);
  };

  const handleDeletePlannerTask = (taskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setCalendarEvents(prev => prev.filter(ev => ev.linkedTaskId !== taskId && ev.title !== target?.title));
    showToast('Tarea eliminada.');
  };

  // ==========================================================================
  // ESTADO DEL CALENDARIO MENSUAL Y CÓMPUTO PROCESAL
  // ==========================================================================
  const nowDate = new Date();
  const [calendarYear, setCalendarYear] = useState<number>(nowDate.getFullYear());
  const [calendarMonth, setCalendarMonth] = useState<number>(nowDate.getMonth());
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>(nowDate.toISOString().slice(0, 10));
  const [calendarLawyerMode, setCalendarLawyerMode] = useState<'ambos' | 'agenda_general' | 'computo_procesal'>('ambos');

  const [newCalEventTitle, setNewCalEventTitle] = useState<string>('');
  const [newCalEventType, setNewCalEventType] = useState<'Agenda General' | 'Plazo Procesal'>('Agenda General');

  const [procNotificationDate, setProcNotificationDate] = useState<string>(nowDate.toISOString().slice(0, 10));
  const [procDaysCount, setProcDaysCount] = useState<number>(5);
  const [procDayMode, setProcDayMode] = useState<'habiles' | 'continuos'>('habiles');
  const [procExcludeHolidaysAndRecess, setProcExcludeHolidaysAndRecess] = useState<boolean>(true);
  const [nonWorkingDates, setNonWorkingDates] = useState<string[]>(DEFAULT_NON_WORKING_DATES);
  const [procTitleInput, setProcTitleInput] = useState<string>('');

  const monthNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const calendarMonthCells = useMemo(() => {
    const firstDayOfMonth = new Date(calendarYear, calendarMonth, 1);
    const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
    const startOffset = (firstDayOfMonth.getDay() + 6) % 7;
    const cells: { day: number | null; dateStr: string | null; isWeekend: boolean; isNonWorking: boolean }[] = [];

    for (let i = 0; i < startOffset; i++) {
      cells.push({ day: null, dateStr: null, isWeekend: false, isNonWorking: false });
    }
    for (let d = 1; d <= daysInMonth; d++) {
      const mStr = String(calendarMonth + 1).padStart(2, '0');
      const dStr = String(d).padStart(2, '0');
      const dateStr = `${calendarYear}-${mStr}-${dStr}`;
      const dow = new Date(calendarYear, calendarMonth, d).getDay();
      const isHolidayOrNoCourt = nonWorkingDates.includes(dateStr) || isJudicialRecessDate(dateStr);
      cells.push({
        day: d,
        dateStr,
        isWeekend: dow === 0 || dow === 6,
        isNonWorking: isHolidayOrNoCourt
      });
    }
    return cells;
  }, [calendarYear, calendarMonth, nonWorkingDates]);

  const handleToggleNoDispatchDay = (dateStr: string) => {
    if (nonWorkingDates.includes(dateStr)) {
      setNonWorkingDates(prev => prev.filter(d => d !== dateStr));
      showToast(`Día ${dateStr} habilitado como día con despacho.`);
    } else {
      setNonWorkingDates(prev => [...prev, dateStr]);
      showToast(`Día ${dateStr} marcado como día sin despacho / feriado.`);
    }
  };

  const handleAddDirectCalendarEvent = () => {
    if (!newCalEventTitle.trim() || !selectedCalendarDate) return;
    setCalendarEvents(prev => [
      ...prev,
      {
        id: `ev-${Date.now().toString().slice(-4)}`,
        title: newCalEventTitle.trim(),
        date: selectedCalendarDate,
        type: newCalEventType,
        client: 'Agenda del Despacho'
      }
    ]);
    setNewCalEventTitle('');
    showToast(`Evento agendado para el ${selectedCalendarDate}.`);
  };

  const handleDeleteCalendarEvent = (evId: string) => {
    setCalendarEvents(prev => prev.filter(e => e.id !== evId));
    showToast('Evento eliminado del calendario.');
  };

  const handleCalculateAndAddProceduralDeadline = () => {
    const title = procTitleInput.trim() || 'Vencimiento de Lapso Procesal';
    const start = new Date(`${procNotificationDate}T12:00:00`);
    let remaining = Math.max(1, procDaysCount);
    const cur = new Date(start);
    let skippedHolidays = 0;

    while (remaining > 0) {
      cur.setDate(cur.getDate() + 1);
      const yyyy = cur.getFullYear();
      const mm = String(cur.getMonth() + 1).padStart(2, '0');
      const dd = String(cur.getDate()).padStart(2, '0');
      const curStr = `${yyyy}-${mm}-${dd}`;
      const dow = cur.getDay();

      if (procDayMode === 'continuos') {
        remaining--;
      } else {
        const isWeekend = dow === 0 || dow === 6;
        const isHolidayOrRecess =
          procExcludeHolidaysAndRecess &&
          (nonWorkingDates.includes(curStr) || isJudicialRecessDate(curStr));
        if (!isWeekend && !isHolidayOrRecess) {
          remaining--;
        } else if (!isWeekend && isHolidayOrRecess) {
          skippedHolidays++;
        }
      }
    }

    const yyyy = cur.getFullYear();
    const mm = String(cur.getMonth() + 1).padStart(2, '0');
    const dd = String(cur.getDate()).padStart(2, '0');
    const finalDateStr = `${yyyy}-${mm}-${dd}`;
    const newTaskId = `tsk-${Date.now().toString().slice(-4)}`;

    setCalendarEvents(prev => [
      ...prev,
      {
        id: `ev-${Date.now().toString().slice(-4)}`,
        title: `${title} (${procDaysCount} días ${procDayMode === 'habiles' ? 'de despacho' : 'continuos'})`,
        date: finalDateStr,
        type: 'Plazo Procesal',
        client: 'Cómputo Procesal',
        linkedTaskId: newTaskId
      }
    ]);
    setTasks(prev => [
      {
        id: newTaskId,
        title,
        client: 'Cómputo Procesal',
        dueDate: finalDateStr,
        status: 'Pendiente',
        priority: 'Alta',
        origin: 'Plazo Procesal'
      },
      ...prev
    ]);
    setProcTitleInput('');
    setCalendarYear(yyyy);
    setCalendarMonth(cur.getMonth());
    setSelectedCalendarDate(finalDateStr);
    showToast(
      `Vencimiento calculado: ${finalDateStr}${skippedHolidays > 0 ? ` (${skippedHolidays} día(s) inhábiles descontados)` : ''}.`
    );
  };

  // ==========================================================================
  // FUNCIONES CRUD DEL CRM DE CLIENTES
  // ==========================================================================
  const handleCreateCrmClient = () => {
    if (!newClientForm.name.trim()) return;
    const created: CrmClient = {
      id: `cli-${Date.now().toString().slice(-4)}`,
      name: newClientForm.name.trim(),
      personType: newClientForm.personType,
      taxId: newClientForm.taxId.trim() || 'Por registrar',
      legalRep: newClientForm.legalRep.trim() || 'Actúa por propio derecho',
      registryInfo: newClientForm.registryInfo.trim() || 'Sin datos registrales',
      powerStatus: 'Vigente',
      address: newClientForm.address.trim() || 'Sin domicilio registrado',
      phone: newClientForm.phone.trim() || 'Sin teléfono',
      email: newClientForm.email.trim() || 'Sin correo',
      activeMatters: [],
      feeArrangement: newClientForm.feeArrangement.trim() || 'Por definir',
      confidentialNotes: newClientForm.confidentialNotes.trim() || ''
    };
    setCrmClients(prev => [created, ...prev]);
    setSelectedClientId(created.id);
    setShowNewClientForm(false);
    setNewClientForm({
      name: '', personType: 'Persona Jurídica (Empresa)', taxId: '', legalRep: '',
      registryInfo: '', address: '', phone: '', email: '', feeArrangement: '', confidentialNotes: ''
    });
    showToast(`Cliente "${created.name}" registrado en el CRM.`);
  };

  const handleDeleteCrmClient = (cliId: string) => {
    const next = crmClients.filter(c => c.id !== cliId);
    setCrmClients(next);
    if (selectedClientId === cliId) {
      setSelectedClientId(next[0]?.id || '');
    }
    showToast('Ficha de cliente eliminada.');
  };

  const handleUpdateSelectedClientField = <K extends keyof CrmClient>(field: K, value: CrmClient[K]) => {
    if (!selectedClient) return;
    setCrmClients(prev =>
      prev.map(c => (c.id === selectedClient.id ? { ...c, [field]: value } : c))
    );
  };

  const handleAddMatterToSelectedClient = () => {
    if (!selectedClient || !newMatterInput.trim()) return;
    handleUpdateSelectedClientField('activeMatters', [
      ...selectedClient.activeMatters,
      newMatterInput.trim()
    ]);
    setNewMatterInput('');
    showToast('Expediente agregado a la ficha del cliente.');
  };

  // ==========================================================================
  // FUNCIONES CRUD DE MODELOS Y LEYES RAG (MÓDULO 11 CONFIGURACIÓN)
  // ==========================================================================
  const handleCreateTemplateManual = () => {
    if (!newTplNameInput.trim() || !newTplContentInput.trim()) {
      showToast('Ingresa el nombre del modelo y su contenido con variables {{VARIABLE}}.');
      return;
    }
    const vars = detectVariablesInTemplateText(newTplContentInput.trim());
    const created: ModelTemplate = {
      id: `tpl-${Date.now().toString().slice(-5)}`,
      name: newTplNameInput.trim(),
      category: newTplCategoryInput.trim() || 'General',
      source: librarySourceMode,
      updatedAt: new Date().toLocaleDateString('es-ES'),
      variables: vars,
      contentPreview: newTplContentInput.trim()
    };
    setTemplates(prev => [created, ...prev]);
    setSelectedTemplateId(created.id);
    setNewTplNameInput('');
    setNewTplContentInput('');
    setShowAddTemplateModal(false);
    showToast(`Modelo "${created.name}" guardado con ${vars.length} variable(s) detectada(s).`);
  };

  const handleDeleteTemplate = (tplId: string) => {
    const remaining = templates.filter(t => t.id !== tplId);
    setTemplates(remaining);
    if (selectedTemplateId === tplId) {
      setSelectedTemplateId(remaining[0]?.id || '');
    }
    showToast('Modelo eliminado de tu Biblioteca.');
  };

  const handleCreateRagManual = () => {
    if (!newRagTitleInput.trim() || !newRagContentInput.trim()) {
      showToast('Ingresa el título de la ley/documento y pega su texto o articulado.');
      return;
    }
    const cleanText = newRagContentInput.trim();
    const estimatedChunks = Math.max(1, Math.ceil(cleanText.length / 400));
    const created: RagLawDocument = {
      id: `rag-${Date.now().toString().slice(-5)}`,
      title: newRagTitleInput.trim(),
      type: newRagTypeInput,
      chunks: estimatedChunks,
      status: 'Indexado',
      excerpt: cleanText.slice(0, 260) + (cleanText.length > 260 ? '...' : ''),
      fullText: cleanText
    };
    setRagDocs(prev => [created, ...prev]);
    setNewRagTitleInput('');
    setNewRagContentInput('');
    setShowAddRagModal(false);
    showToast(`"${created.title}" indexado y almacenado en el RAG (${estimatedChunks} fragmentos).`);
  };

  const handleDeleteRagDoc = (ragId: string) => {
    setRagDocs(prev => prev.filter(d => d.id !== ragId));
    if (viewingRagDoc?.id === ragId) setViewingRagDoc(null);
    showToast('Documento eliminado del repositorio RAG.');
  };

  // ==========================================================================
  // PERSISTENCIA AUTOMÁTICA EN LOCALSTORAGE
  // ==========================================================================
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (typeof saved.darkMode === 'boolean') setDarkMode(saved.darkMode);
      if (saved.firmName !== undefined) setFirmName(saved.firmName);
      if (saved.lawyerSignerName !== undefined) setLawyerSignerName(saved.lawyerSignerName);
      if (saved.lawyerCollegiateId !== undefined) setLawyerCollegiateId(saved.lawyerCollegiateId);
      if (saved.customPracticeArea !== undefined) setCustomPracticeArea(saved.customPracticeArea);
      if (saved.llmProvider) setLlmProvider(saved.llmProvider);
      if (saved.llmModel) setLlmModel(saved.llmModel);
      if (saved.apiKeyInput !== undefined) setApiKeyInput(saved.apiKeyInput);
      if (saved.ollamaBaseUrl !== undefined) setOllamaBaseUrl(saved.ollamaBaseUrl);
      if (typeof saved.monthlyBudgetUsd === 'number') setMonthlyBudgetUsd(saved.monthlyBudgetUsd);
      if (typeof saved.currentSpendUsd === 'number') setCurrentSpendUsd(saved.currentSpendUsd);
      if (typeof saved.savedHoursCount === 'number') setSavedHoursCount(saved.savedHoursCount);
      if (Array.isArray(saved.templates)) {
        setTemplates(saved.templates);
        if (saved.templates[0]) setSelectedTemplateId(saved.templates[0].id);
      }
      if (Array.isArray(saved.ragDocs)) setRagDocs(saved.ragDocs);
      if (Array.isArray(saved.tasks)) setTasks(saved.tasks);
      if (Array.isArray(saved.calendarEvents)) setCalendarEvents(saved.calendarEvents);
      if (Array.isArray(saved.crmClients)) {
        setCrmClients(saved.crmClients);
        if (saved.crmClients[0]) setSelectedClientId(saved.crmClients[0].id);
      }
      if (Array.isArray(saved.recordings)) setRecordings(saved.recordings);
      if (Array.isArray(saved.approvedDocsRegistry)) setApprovedDocsRegistry(saved.approvedDocsRegistry);
      if (Array.isArray(saved.piiAuditRegistry)) setPiiAuditRegistry(saved.piiAuditRegistry);
      if (Array.isArray(saved.auditLogs)) setAuditLogs(saved.auditLogs);
      if (Array.isArray(saved.consultSessions)) {
        setConsultSessions(saved.consultSessions);
        if (saved.consultSessions[0]) {
          setActiveSessionId(saved.consultSessions[0].id);
          const lastT = saved.consultSessions[0].turns[saved.consultSessions[0].turns.length - 1] || null;
          setConsultResponse(lastT);
        }
      }
    } catch {
      // Ignorar si localStorage está restringido
    }
  }, []);

  useEffect(() => {
    try {
      const payload = {
        darkMode,
        firmName,
        lawyerSignerName,
        lawyerCollegiateId,
        customPracticeArea,
        llmProvider,
        llmModel,
        apiKeyInput,
        ollamaBaseUrl,
        monthlyBudgetUsd,
        currentSpendUsd,
        savedHoursCount,
        templates,
        ragDocs,
        tasks,
        calendarEvents,
        crmClients,
        recordings,
        approvedDocsRegistry,
        piiAuditRegistry,
        auditLogs,
        consultSessions
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignorar si localStorage está restringido
    }
  }, [
    darkMode, firmName, lawyerSignerName, lawyerCollegiateId, customPracticeArea,
    llmProvider, llmModel, apiKeyInput, ollamaBaseUrl, monthlyBudgetUsd,
    currentSpendUsd, savedHoursCount, templates, ragDocs, tasks,
    calendarEvents, crmClients, recordings, approvedDocsRegistry,
    piiAuditRegistry, auditLogs, consultSessions
  ]);

  // ==========================================================================
  // NAVEGACIÓN MINIMALISTA DE MÓDULOS
  // ==========================================================================
  const navItems: { id: ModuleId; label: string; badge: string; icon: React.ReactNode }[] = [
    { id: 'consultor_ia', label: '1. Consultor de IA', badge: `${consultSessions.length}`, icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'redactor_docs', label: '2. Redactor de Documentos', badge: `${templates.length}`, icon: <FileText className="w-4 h-4" /> },
    { id: 'grabador', label: '3. Grabador de Actas', badge: `${recordings.length}`, icon: <Mic className="w-4 h-4" /> },
    { id: 'planificador', label: '4. Planificador', badge: `${tasks.length}`, icon: <Kanban className="w-4 h-4" /> },
    { id: 'calendario', label: '5. Calendario', badge: `${calendarEvents.length}`, icon: <CalendarIcon className="w-4 h-4" /> },
    { id: 'crm', label: '6. CRM Clientes', badge: `${crmClients.length}`, icon: <Users className="w-4 h-4" /> },
    { id: 'kpi', label: '7. KPI & Presupuesto', badge: `$${currentSpendUsd.toFixed(2)}`, icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'trazabilidad', label: '8. Trazabilidad', badge: `${auditLogs.length}`, icon: <Fingerprint className="w-4 h-4" /> },
    { id: 'human_loop', label: '9. Human-in-the-Loop', badge: `${approvedDocsRegistry.length}`, icon: <UserCheck className="w-4 h-4" /> },
    { id: 'anonimizacion_pii', label: '10. Anonimización PII', badge: `${piiAuditRegistry.length}`, icon: <EyeOff className="w-4 h-4" /> },
    { id: 'configuracion_sistema', label: '11. Configuración', badge: `${ragDocs.length} RAG`, icon: <Sliders className="w-4 h-4" /> }
  ];

  const activeModuleTitle = useMemo(
    () => navItems.find(n => n.id === activeTab)?.label || 'AI GOVERN',
    [activeTab, consultSessions.length, templates.length, recordings.length, tasks.length, calendarEvents.length, crmClients.length, currentSpendUsd, auditLogs.length, approvedDocsRegistry.length, piiAuditRegistry.length, ragDocs.length]
  );

  return (
    <div
      style={{ backgroundColor: theme.pageBg, color: theme.pageText }}
      className="min-h-screen font-sans transition-colors duration-150"
    >
      {/* Notificación flotante minimalista */}
      {toastMessage && (
        <div
          style={{ backgroundColor: '#0F172A', color: '#F8FAFC', borderColor: '#334155' }}
          className="fixed bottom-4 right-4 left-4 sm:left-auto z-50 max-w-md border px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="font-medium">{toastMessage}</span>
        </div>
      )}

      {/* DRAWER LATERAL DESLIZABLE PARA CELULAR Y TABLET (< lg) */}
      {isMobileDrawerOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-xs"
            onClick={() => setIsMobileDrawerOpen(false)}
          />
          <div
            style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder, color: theme.pageText }}
            className="relative z-10 w-72 max-w-[85vw] h-full border-r p-4 flex flex-col justify-between overflow-y-auto shadow-2xl"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b" style={{ borderColor: theme.cardBorder }}>
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-lg bg-[#0F172A] text-amber-400 flex items-center justify-center font-serif font-bold text-sm border border-amber-500/30">
                    AG
                  </div>
                  <div>
                    <div className="font-serif font-bold text-sm">AI GOVERN</div>
                    <div style={{ color: theme.mutedText }} className="text-[10px] font-mono">
                      {firmName || 'Workspace Jurídico'}
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsMobileDrawerOpen(false)}
                  style={secondaryBtnStyle}
                  className="p-2 rounded-lg border cursor-pointer"
                  aria-label="Cerrar menú"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="space-y-1">
                {navItems.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={`drawer-${item.id}`}
                      type="button"
                      onClick={() => {
                        setActiveTab(item.id);
                        setIsMobileDrawerOpen(false);
                      }}
                      style={
                        isActive
                          ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#F59E0B' }
                          : { backgroundColor: 'transparent', color: theme.pageText, borderColor: 'transparent' }
                      }
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium border transition cursor-pointer"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className={isActive ? 'text-amber-400' : 'text-amber-600'}>{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      <span
                        style={
                          isActive
                            ? { backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#FCD34D' }
                            : { backgroundColor: theme.subBg, color: theme.mutedText }
                        }
                        className="text-[10px] font-mono px-2 py-0.5 rounded"
                      >
                        {item.badge}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={subCardStyle} className="p-3 rounded-xl border text-[11px] space-y-1 mt-4">
              <div className="font-mono text-[10px] uppercase font-bold flex items-center gap-1.5" style={{ color: theme.emeraldText }}>
                <Shield className="w-3.5 h-3.5" /> Zero-Trust Activo
              </div>
              <p style={{ color: theme.mutedText }}>
                Motor: {llmProvider.toUpperCase()} ({llmModel}) • {ragDocs.length} leyes en RAG.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* CABECERA PRINCIPAL MINIMALISTA CON ICONO UNIVERSAL DE HAMBURGUESA */}
      <header
        style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
        className="sticky top-0 z-30 border-b px-3 sm:px-6 py-2.5"
      >
        <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {/* Botón Hamburguesa Universal (Abre Drawer en móvil / Colapsa barra en escritorio) */}
            <button
              type="button"
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setIsMobileDrawerOpen(true);
                } else {
                  setIsMainSidebarOpen(!isMainSidebarOpen);
                }
              }}
              style={secondaryBtnStyle}
              className="p-2 rounded-xl border hover:opacity-80 transition cursor-pointer shrink-0"
              title="Menú de módulos"
              aria-label="Menú"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-[#0F172A] text-amber-400 flex items-center justify-center font-serif font-bold text-sm sm:text-base border border-amber-500/30 shrink-0">
              AG
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-sm sm:text-lg tracking-tight truncate">
                  {firmName || 'AI GOVERN'}
                </span>
                <span
                  style={{ backgroundColor: theme.subBg, borderColor: theme.subBorder, color: theme.mutedText }}
                  className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded border"
                >
                  {activeModuleTitle}
                </span>
              </div>
              <p style={{ color: theme.mutedText }} className="text-[10px] sm:text-[11px] font-mono truncate">
                {lawyerSignerName ? `${lawyerSignerName} (${lawyerCollegiateId || 'Abogado'})` : 'Configura los datos de tu despacho en el Módulo 11'}
              </p>
            </div>
          </div>

          {/* Indicadores de estado rápidos y controles de tema/ajustes */}
          <div className="flex items-center gap-2 shrink-0">
            <div
              style={{ backgroundColor: theme.subBg, borderColor: theme.subBorder, color: theme.mutedText }}
              className="hidden md:flex items-center gap-3 px-3 py-1.5 rounded-xl border text-[11px] font-mono"
            >
              <span>
                <Key className="w-3 h-3 inline mr-1 text-amber-500" />
                {llmProvider.toUpperCase()} ({llmModel})
              </span>
              <span>•</span>
              <span>{templates.length} Modelos</span>
              <span>•</span>
              <span>{ragDocs.length} Leyes RAG</span>
            </div>

            <button
              type="button"
              onClick={() => setActiveTab('configuracion_sistema')}
              style={secondaryBtnStyle}
              className="px-3 py-2 rounded-xl text-xs font-semibold border hover:opacity-90 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-500 shrink-0" />
              <span className="hidden sm:inline">Configurar API, Modelos y Leyes</span>
            </button>

            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              style={secondaryBtnStyle}
              className="p-2 rounded-xl border hover:opacity-90 transition cursor-pointer"
              title={darkMode ? 'Cambiar a Modo Claro' : 'Cambiar a Modo Oscuro'}
              aria-label="Tema"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </header>

      {/* CONTENEDOR PRINCIPAL: BARRA LATERAL EN ESCRITORIO + ÁREA DE TRABAJO */}
      <div className="max-w-[1440px] mx-auto px-3 sm:px-6 py-4 sm:py-6 grid grid-cols-1 lg:grid-cols-12 gap-5">
        {isMainSidebarOpen && (
          <aside className="hidden lg:block lg:col-span-3 space-y-4">
            <div style={cardStyle} className="rounded-2xl p-2.5 border shadow-xs space-y-1">
              {navItems.map((item) => {
                const isActive = activeTab === item.id;
                const isConfig = item.id === 'configuracion_sistema';
                return (
                  <React.Fragment key={item.id}>
                    {isConfig && (
                      <div style={{ borderColor: theme.cardBorder }} className="pt-2 mt-2 border-t" />
                    )}
                    <button
                      type="button"
                      onClick={() => setActiveTab(item.id)}
                      style={
                        isActive
                          ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#F59E0B' }
                          : { backgroundColor: 'transparent', color: theme.pageText, borderColor: 'transparent' }
                      }
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium border transition cursor-pointer hover:opacity-90"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className={isActive ? 'text-amber-400' : 'text-amber-600'}>{item.icon}</span>
                        <span className="truncate">{item.label}</span>
                      </div>
                      <span
                        style={
                          isActive
                            ? { backgroundColor: 'rgba(245, 158, 11, 0.2)', color: '#FCD34D' }
                            : { backgroundColor: theme.subBg, color: theme.mutedText }
                        }
                        className="text-[10px] font-mono px-1.5 py-0.5 rounded"
                      >
                        {item.badge}
                      </span>
                    </button>
                  </React.Fragment>
                );
              })}
            </div>

            <div style={cardStyle} className="rounded-2xl p-4 border shadow-xs space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span style={{ color: theme.emeraldText }} className="font-mono text-[10px] uppercase font-bold flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5" /> Secreto Profesional
                </span>
                <span style={{ color: theme.mutedText }} className="text-[10px] font-mono">
                  Zero-Training
                </span>
              </div>
              <p style={{ color: theme.mutedText }} className="text-[11px] leading-relaxed">
                Anonimización PII en memoria RAM local antes de consultar tu API.
              </p>
            </div>
          </aside>
        )}

        <main className={isMainSidebarOpen ? 'lg:col-span-9 min-w-0' : 'lg:col-span-12 min-w-0'}>

          {/* =================================================================
              1. CONSULTOR DE IA (ESTILO MINIMALISTA, 4 ETAPAS FORENSES, CONECTADO A TU API Y RAG)
          ================================================================== */}
          {activeTab === 'consultor_ia' && (
            <div style={cardStyle} className="rounded-2xl border shadow-xs overflow-hidden">
              <div className="grid grid-cols-1 lg:grid-cols-12 min-h-[680px]">

                {/* Panel de Historial de Consultas (Ocultable) */}
                {isHistorySidebarOpen && (
                  <div
                    style={{ backgroundColor: theme.subBg, borderColor: theme.cardBorder }}
                    className="lg:col-span-3 border-b lg:border-b-0 lg:border-r p-3.5 flex flex-col justify-between gap-4"
                  >
                    <div className="space-y-3">
                      <button
                        type="button"
                        onClick={handleStartNewConsultSession}
                        className="w-full py-2.5 px-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer transition"
                      >
                        <Plus className="w-4 h-4 text-amber-400" />
                        <span>Nueva Consulta / Caso</span>
                      </button>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={historySearchQuery}
                          onChange={(e) => setHistorySearchQuery(e.target.value)}
                          placeholder="Buscar en el historial..."
                          style={inputStyle}
                          className="w-full pl-8 pr-3 py-1.5 rounded-xl border text-xs"
                        />
                      </div>

                      <div className="space-y-1.5 max-h-[200px] lg:max-h-[470px] overflow-y-auto pr-1">
                        {consultSessions.length === 0 ? (
                          <p style={{ color: theme.mutedText }} className="text-[11px] px-2 py-6 text-center">
                            Sin consultas previas. Tus sesiones quedarán guardadas aquí automáticamente.
                          </p>
                        ) : (
                          consultSessions
                            .filter(s => s.title.toLowerCase().includes(historySearchQuery.toLowerCase()))
                            .map((sess) => {
                              const isCurrent = sess.id === activeSessionId;
                              return (
                                <div
                                  key={sess.id}
                                  style={
                                    isCurrent
                                      ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#F59E0B' }
                                      : cardStyle
                                  }
                                  className="rounded-xl border p-2.5 text-xs transition"
                                >
                                  <div className="flex items-start justify-between gap-1.5">
                                    <button
                                      type="button"
                                      onClick={() => handleSelectConsultSession(sess)}
                                      className="text-left flex-1 min-w-0 cursor-pointer"
                                    >
                                      <div className="font-semibold truncate">{sess.title}</div>
                                      <div
                                        style={{ color: isCurrent ? '#FCD34D' : theme.mutedText }}
                                        className="text-[10px] font-mono mt-0.5"
                                      >
                                        {sess.updatedAt} • {sess.turns.length} análisis
                                      </div>
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleDeleteConsultSession(sess.id)}
                                      title="Eliminar consulta"
                                      className="text-slate-400 hover:text-rose-500 p-0.5 cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                              );
                            })
                        )}
                      </div>
                    </div>

                    <div style={cardStyle} className="p-3 rounded-xl border text-[11px] space-y-1">
                      <div className="font-mono text-[10px] uppercase font-bold" style={{ color: theme.accentText }}>
                        Estructura de Análisis
                      </div>
                      <p style={{ color: theme.mutedText }} className="leading-snug">
                        I. Base Legal y Artículos • II. Opciones • III. Escenarios y Consecuencias • IV. Ejecución.
                      </p>
                    </div>
                  </div>
                )}

                {/* Área Central de Consulta y Dictamen */}
                <div className={`${isHistorySidebarOpen ? 'lg:col-span-9' : 'lg:col-span-12'} flex flex-col justify-between p-4 sm:p-6 min-w-0`}>

                  {/* Barra Superior Minimalista del Consultor */}
                  <div style={{ borderColor: theme.cardBorder }} className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => setIsHistorySidebarOpen(!isHistorySidebarOpen)}
                        style={secondaryBtnStyle}
                        className="p-2 rounded-xl border cursor-pointer hover:opacity-80"
                        title={isHistorySidebarOpen ? 'Ocultar historial' : 'Mostrar historial'}
                      >
                        <FolderOpen className="w-4 h-4 text-amber-500" />
                      </button>
                      <div className="min-w-0">
                        <h2 className="font-serif font-bold text-base sm:text-lg truncate">
                          {activeSession?.title || 'Consultor Jurídico'}
                        </h2>
                        <p style={{ color: theme.mutedText }} className="text-[11px] font-mono truncate">
                          {ragDocs.length} leyes en RAG • {templates.length} modelos en Biblioteca
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setConsultShowSanitizedPayload(!consultShowSanitizedPayload)}
                      style={secondaryBtnStyle}
                      className="px-3 py-1.5 rounded-xl border font-mono text-[11px] font-semibold cursor-pointer flex items-center gap-1.5"
                    >
                      <Shield className="w-3.5 h-3.5 text-emerald-500" />
                      <span>{consultShowSanitizedPayload ? 'Ocultar filtro en vivo' : 'Ver qué recibe la IA'}</span>
                    </button>
                  </div>

                  {/* Inspector opcional del filtro PII en RAM */}
                  {consultShowSanitizedPayload && (
                    <div
                      style={{ backgroundColor: '#0F172A', color: '#F8FAFC', borderColor: '#10B981' }}
                      className="my-3 p-3.5 rounded-xl font-mono text-xs space-y-2 border"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-[10px] uppercase text-emerald-400 font-bold">
                          Payload Sanitizado en RAM ({liveSanitizedPreview.tokens.length} datos protegidos):
                        </span>
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={customMaskInput}
                            onChange={(e) => setCustomMaskInput(e.target.value)}
                            placeholder="Guía: Nombre o razón social a ocultar..."
                            style={{ backgroundColor: '#1E293B', color: '#F8FAFC', borderColor: '#334155' }}
                            className="px-2.5 py-1 rounded-lg border text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={handleAddCustomMaskTerm}
                            className="px-2.5 py-1 rounded-lg bg-amber-500 text-slate-950 text-[11px] font-bold cursor-pointer"
                          >
                            + Enmascarar
                          </button>
                        </div>
                      </div>
                      <p className="text-slate-300 leading-relaxed whitespace-pre-wrap text-[11px]">
                        {liveSanitizedPreview.sanitized || 'Escribe tu consulta abajo para previsualizar el filtrado de datos privados en tiempo real.'}
                      </p>
                    </div>
                  )}

                  {/* Área de Mensajes / Dictámenes */}
                  <div className="flex-1 py-4 space-y-5 max-h-[500px] overflow-y-auto pr-1">
                    {consultThread.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0F172A] text-amber-400 flex items-center justify-center font-serif font-bold text-sm border border-amber-500/30">
                          <Scale className="w-5 h-5" />
                        </div>
                        <div className="max-w-lg space-y-1.5">
                          <h3 className="font-serif text-base sm:text-lg font-bold">
                            Consultoría Jurídica Conectada a tu RAG y Biblioteca
                          </h3>
                          <p style={{ color: theme.mutedText }} className="text-xs leading-relaxed">
                            Plantea el caso abajo o adjunta documentos (`.DOC`, `.PDF`, imágenes o comunicaciones del cliente). El sistema analizará: <strong>I. Base Legal y Artículos Involucrados</strong>, <strong>II. Opciones Jurídicas</strong>, <strong>III. Escenarios y Consecuencias</strong> y <strong>IV. Decisión de Ejecución y Redacción</strong>.
                          </p>
                        </div>

                        {(ragDocs.length === 0 || !apiKeyInput.trim()) && (
                          <div
                            style={subCardStyle}
                            className="max-w-lg w-full p-3.5 rounded-xl border text-left text-xs flex items-start justify-between gap-3 mt-2"
                          >
                            <div className="space-y-1">
                              <div className="font-semibold flex items-center gap-1.5" style={{ color: theme.accentText }}>
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                Guía de Configuración Inicial
                              </div>
                              <p style={{ color: theme.mutedText }} className="text-[11px] leading-relaxed">
                                Para conectar tu motor de IA y cargar tus leyes en el RAG o tus plantillas en la Biblioteca, ingresa a <strong>11. Configuración</strong>.
                              </p>
                            </div>
                            <button
                              type="button"
                              onClick={() => setActiveTab('configuracion_sistema')}
                              className="shrink-0 px-3 py-1.5 rounded-lg bg-[#0F172A] text-white text-[11px] font-semibold cursor-pointer"
                            >
                              Ir a Configuración
                            </button>
                          </div>
                        )}
                      </div>
                    ) : (
                      consultThread.map((turn) => (
                        <div key={turn.id} className="space-y-3">
                          <div className="flex justify-end">
                            <div
                              style={{ backgroundColor: '#0F172A', color: '#F8FAFC' }}
                              className="max-w-2xl rounded-2xl rounded-tr-xs px-4 py-3 text-xs sm:text-sm space-y-2 shadow-xs"
                            >
                              <p className="leading-relaxed whitespace-pre-wrap">{turn.lawyerQuestion}</p>
                              {turn.attachmentsUsed && turn.attachmentsUsed.length > 0 && (
                                <div className="flex flex-wrap gap-1.5 pt-1.5 border-t border-slate-700">
                                  {turn.attachmentsUsed.map((attName, i) => (
                                    <span key={i} className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/20 text-amber-300">
                                      {attName}
                                    </span>
                                  ))}
                                </div>
                              )}
                              <div className="text-[10px] font-mono text-slate-400 text-right">
                                {turn.timestamp} • {turn.tokensProtected} PII protegidos
                              </div>
                            </div>
                          </div>

                          <div className="flex items-start gap-3">
                            <div className="hidden sm:flex w-8 h-8 rounded-lg bg-[#0F172A] text-amber-400 items-center justify-center font-serif font-bold text-xs shrink-0 mt-0.5 border border-amber-500/30">
                              AG
                            </div>
                            <div style={subCardStyle} className="flex-1 min-w-0 rounded-2xl rounded-tl-xs border p-4 sm:p-5 space-y-3.5 text-xs sm:text-sm">
                              <div style={{ borderColor: theme.subBorder }} className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b text-[10px] font-mono">
                                <div className="flex flex-wrap gap-1.5">
                                  {turn.citations.map((cit, i) => (
                                    <span
                                      key={i}
                                      style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder }}
                                      className="px-2 py-0.5 rounded border font-semibold"
                                    >
                                      RAG: {cit}
                                    </span>
                                  ))}
                                  {turn.recommendedTemplateName && (
                                    <span
                                      style={{ backgroundColor: theme.cardBg, borderColor: theme.cardBorder, color: theme.accentText }}
                                      className="px-2 py-0.5 rounded border font-semibold"
                                    >
                                      Modelo: {turn.recommendedTemplateName}
                                    </span>
                                  )}
                                </div>
                                <span style={{ color: theme.mutedText }}>SHA-256: {turn.hash.slice(0, 14)}...</span>
                              </div>

                              <div
                                style={cardStyle}
                                className="p-4 rounded-xl border font-serif text-xs sm:text-sm leading-relaxed whitespace-pre-wrap"
                              >
                                {turn.dictamen}
                              </div>

                              <div style={{ borderColor: theme.subBorder }} className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t text-xs">
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (navigator.clipboard?.writeText) {
                                      navigator.clipboard.writeText(turn.dictamen);
                                    }
                                    showToast('Dictamen copiado al portapapeles.');
                                  }}
                                  style={secondaryBtnStyle}
                                  className="px-3 py-1.5 rounded-xl border font-semibold flex items-center gap-1.5 cursor-pointer"
                                >
                                  <Copy className="w-3.5 h-3.5" /> Copiar Dictamen
                                </button>

                                <div className="flex flex-wrap gap-2">
                                  <button
                                    type="button"
                                    onClick={handleSendConsultToRedactor.bind(null, turn)}
                                    className="px-3.5 py-1.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <FileText className="w-3.5 h-3.5 text-amber-400" />
                                    <span>Abrir Modelo Recomendado en el Redactor</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={handleApproveConsultorDictamen.bind(null, turn)}
                                    className="px-3.5 py-1.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold flex items-center gap-1.5 cursor-pointer"
                                  >
                                    <UserCheck className="w-3.5 h-3.5" />
                                    <span>Dar Visto Bueno y Exportar (.DOC)</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Barra Inferior de Entrada y Adjuntos */}
                  <div style={{ borderColor: theme.cardBorder }} className="pt-3 border-t space-y-2">
                    {showConversationPasteBox && (
                      <div style={subCardStyle} className="p-3.5 rounded-xl border space-y-2 text-xs">
                        <div className="font-mono text-[11px] uppercase font-bold" style={{ color: theme.accentText }}>
                          Pegar Comunicación del Cliente o Cláusula a Evaluar
                        </div>
                        <input
                          type="text"
                          value={conversationTitleInput}
                          onChange={(e) => setConversationTitleInput(e.target.value)}
                          placeholder="Guía: Referencia del texto (Ej: Mensaje de WhatsApp del cliente / Cláusula tercera)..."
                          style={inputStyle}
                          className="w-full px-3 py-1.5 rounded-lg border text-xs"
                        />
                        <textarea
                          rows={3}
                          value={conversationTextInput}
                          onChange={(e) => setConversationTextInput(e.target.value)}
                          placeholder="Guía: Pega aquí la conversación de WhatsApp, correo electrónico o texto que deseas incorporar a la consulta..."
                          style={inputStyle}
                          className="w-full p-2.5 rounded-lg border text-xs"
                        />
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setShowConversationPasteBox(false)}
                            style={secondaryBtnStyle}
                            className="px-3 py-1 rounded-lg border cursor-pointer"
                          >
                            Cancelar
                          </button>
                          <button
                            type="button"
                            onClick={handleAddConversationAttachment}
                            className="px-3.5 py-1 rounded-lg bg-emerald-700 text-white font-semibold cursor-pointer"
                          >
                            Adjuntar Conversación al Mensaje
                          </button>
                        </div>
                      </div>
                    )}

                    {consultAttachments.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {consultAttachments.map((att) => (
                          <div
                            key={att.id}
                            style={subCardStyle}
                            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-lg border text-[11px]"
                          >
                            <span className="font-mono font-semibold" style={{ color: theme.accentText }}>{att.kind}:</span>
                            <span className="truncate max-w-[160px]">{att.name}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveConsultAttachment(att.id)}
                              className="text-rose-500 font-bold cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    <div style={subCardStyle} className="rounded-2xl border p-3 space-y-2.5">
                      <textarea
                        rows={2}
                        value={consultQuery}
                        onChange={(e) => {
                          setConsultQuery(e.target.value);
                          setFollowUpQuestionInput(e.target.value);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleRunConsultor();
                          }
                        }}
                        style={inputStyle}
                        className="w-full px-3 py-2 rounded-xl border text-xs sm:text-sm resize-none"
                        placeholder="Guía: Expón los hechos del caso, la consulta de tu cliente o los artículos que deseas analizar..."
                      />

                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
                          <label style={secondaryBtnStyle} className="px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 cursor-pointer">
                            <Camera className="w-3.5 h-3.5 text-amber-500" />
                            <span>Imagen</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleAddConsultFileAttachment(f, 'Imagen / Captura');
                              }}
                            />
                          </label>

                          <label style={secondaryBtnStyle} className="px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 cursor-pointer">
                            <FileText className="w-3.5 h-3.5 text-indigo-500" />
                            <span>.DOC</span>
                            <input
                              type="file"
                              accept=".doc,.docx,.txt,.md,.rtf"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleAddConsultFileAttachment(f, 'Documento (.DOC / .DOCX)');
                              }}
                            />
                          </label>

                          <label style={secondaryBtnStyle} className="px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 cursor-pointer">
                            <FileUp className="w-3.5 h-3.5 text-emerald-500" />
                            <span>.PDF</span>
                            <input
                              type="file"
                              accept=".pdf"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleAddConsultFileAttachment(f, 'Archivo .PDF');
                              }}
                            />
                          </label>

                          <button
                            type="button"
                            onClick={() => setShowConversationPasteBox(!showConversationPasteBox)}
                            style={secondaryBtnStyle}
                            className="px-2.5 py-1.5 rounded-lg border font-medium flex items-center gap-1.5 cursor-pointer"
                          >
                            <MessageSquare className="w-3.5 h-3.5 text-amber-500" />
                            <span>Conversación</span>
                          </button>

                          <select
                            value={consultSelectedLawId}
                            onChange={(e) => setConsultSelectedLawId(e.target.value)}
                            style={inputStyle}
                            className="px-2.5 py-1.5 rounded-lg border text-[11px] max-w-[160px]"
                          >
                            <option value="auto">RAG: Todas las Leyes ({ragDocs.length})</option>
                            {ragDocs.map(doc => (
                              <option key={doc.id} value={doc.id}>{doc.title}</option>
                            ))}
                          </select>

                          <select
                            value={consultSelectedTemplateId}
                            onChange={(e) => setConsultSelectedTemplateId(e.target.value)}
                            style={inputStyle}
                            className="px-2.5 py-1.5 rounded-xl border text-[11px] max-w-[160px]"
                          >
                            <option value="auto">Modelo: Automático ({templates.length})</option>
                            {templates.map(tpl => (
                              <option key={tpl.id} value={tpl.id}>{tpl.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="flex items-center gap-1.5 w-full sm:w-auto justify-end">
                          {consultThread.length > 0 && (
                            <button
                              type="button"
                              onClick={handleRunFollowUpQuestion}
                              style={secondaryBtnStyle}
                              className="px-3 py-2 rounded-xl border font-semibold text-xs cursor-pointer"
                            >
                              Repreguntar al Consultor →
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={handleRunConsultor}
                            disabled={isConsultLoading}
                            className="w-full sm:w-auto justify-center px-4 py-2 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer transition"
                          >
                            <Send className="w-3.5 h-3.5 text-amber-400" />
                            <span>Analizar Caso con Privacidad Blindada</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              2. REDACTOR DE DOCUMENTOS (CONECTADO A TU BIBLIOTECA, SIN DATOS DE MAQUETA)
          ================================================================== */}
          {activeTab === 'redactor_docs' && (
            <div style={cardStyle} className="rounded-2xl p-4 sm:p-6 border shadow-xs space-y-6">
              <div style={{ borderColor: theme.cardBorder }} className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold">
                    Redactor de Documentos Jurídicos
                  </h2>
                  <p style={{ color: theme.mutedText }} className="text-xs">
                    Selecciona una plantilla de tu biblioteca, incorpora los datos por archivo o texto y exporta el instrumento visado en .DOC.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('configuracion_sistema');
                    setShowAddTemplateModal(true);
                  }}
                  style={secondaryBtnStyle}
                  className="px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 text-amber-500" />
                  <span>Agregar Modelo a la Biblioteca</span>
                </button>
              </div>

              {templates.length === 0 ? (
                <div style={subCardStyle} className="p-8 rounded-2xl border text-center space-y-3">
                  <FileText className="w-8 h-8 text-amber-500 mx-auto" />
                  <h3 className="font-serif font-bold text-base">Tu Biblioteca de Modelos está vacía</h3>
                  <p style={{ color: theme.mutedText }} className="text-xs max-w-md mx-auto leading-relaxed">
                    Guarda tus contratos, poderes o escritos en el módulo <strong>11. Configuración</strong> colocando entre llaves dobles los datos variables (ejemplo: <code>{`{{VENDEDOR}}`}</code>, <code>{`{{COMPRADOR}}`}</code>, <code>{`{{PRECIO}}`}</code>) o subiendo tus archivos <code>.DOCX</code> / <code>.TXT</code>.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab('configuracion_sistema');
                      setShowAddTemplateModal(true);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-semibold cursor-pointer"
                  >
                    Cargar Primer Modelo Ahora
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div className="lg:col-span-5 space-y-4">
                    <div style={subCardStyle} className="p-4 rounded-xl border space-y-3">
                      <label className="block text-xs font-semibold">
                        Modelo de tu Biblioteca ({templates.length})
                      </label>
                      <select
                        value={selectedTemplate?.id || ''}
                        onChange={(e) => handleSelectTemplate(e.target.value)}
                        style={inputStyle}
                        className="w-full px-3 py-2 rounded-xl border text-xs font-semibold"
                      >
                        {templates.map(tpl => (
                          <option key={tpl.id} value={tpl.id}>
                            {tpl.name} ({tpl.category})
                          </option>
                        ))}
                      </select>

                      {crmClients.length > 0 && (
                        <select
                          defaultValue=""
                          onChange={(e) => {
                            const cli = crmClients.find(c => c.id === e.target.value);
                            if (cli) handleLoadClientIntoRedactor(cli);
                          }}
                          style={inputStyle}
                          className="w-full px-3 py-2 rounded-xl border text-xs"
                        >
                          <option value="">Guía: Opcionalmente importa datos de un cliente de tu CRM...</option>
                          {crmClients.map(c => (
                            <option key={c.id} value={c.id}>{c.name} ({c.taxId})</option>
                          ))}
                        </select>
                      )}
                    </div>

                    <div style={subCardStyle} className="p-4 rounded-xl border space-y-3">
                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          type="button"
                          onClick={() => setInputModeTab('escrito_manual')}
                          style={inputModeTab === 'escrito_manual' ? { backgroundColor: '#0F172A', color: '#FFFFFF' } : secondaryBtnStyle}
                          className="py-2 px-2 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FileText className="w-3.5 h-3.5 text-amber-400" /> Por Escrito
                        </button>
                        <button
                          type="button"
                          onClick={() => setInputModeTab('foto_ocr')}
                          style={inputModeTab === 'foto_ocr' ? { backgroundColor: '#0F172A', color: '#FFFFFF' } : secondaryBtnStyle}
                          className="py-2 px-2 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Camera className="w-3.5 h-3.5 text-amber-400" /> Foto / Cédula
                        </button>
                        <button
                          type="button"
                          onClick={() => setInputModeTab('pdf_doc')}
                          style={inputModeTab === 'pdf_doc' ? { backgroundColor: '#0F172A', color: '#FFFFFF' } : secondaryBtnStyle}
                          className="py-2 px-2 rounded-lg text-[11px] font-semibold border flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <FileUp className="w-3.5 h-3.5 text-emerald-400" /> Archivo PDF/TXT
                        </button>
                      </div>

                      {inputModeTab === 'foto_ocr' && (
                        <div style={cardStyle} className="p-4 rounded-xl border border-dashed text-center space-y-2">
                          <p className="text-xs font-semibold">Subir imagen de documento de identidad o RIF</p>
                          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold cursor-pointer">
                            <Upload className="w-3.5 h-3.5 text-amber-400" />
                            <span>Seleccionar Imagen</span>
                            <input
                              type="file"
                              accept="image/*"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleExtractFromPhotoOrPdf(f, 'Foto (OCR)');
                              }}
                            />
                          </label>
                        </div>
                      )}

                      {inputModeTab === 'pdf_doc' && (
                        <div style={cardStyle} className="p-4 rounded-xl border border-dashed text-center space-y-2">
                          <p className="text-xs font-semibold">Subir documento antecedente (.PDF / .DOCX / .TXT)</p>
                          <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold cursor-pointer">
                            <Upload className="w-3.5 h-3.5" />
                            <span>Seleccionar Documento</span>
                            <input
                              type="file"
                              accept=".pdf,.doc,.docx,.txt"
                              className="hidden"
                              onChange={(e) => {
                                const f = e.target.files?.[0];
                                if (f) handleExtractFromPhotoOrPdf(f, 'Documento PDF');
                              }}
                            />
                          </label>
                        </div>
                      )}

                      {inputModeTab === 'escrito_manual' && (
                        <div className="space-y-2">
                          <textarea
                            rows={3}
                            value={freeTextToExtract}
                            onChange={(e) => setFreeTextToExtract(e.target.value)}
                            style={inputStyle}
                            className="w-full p-2.5 rounded-xl border text-xs"
                            placeholder="Guía: Pega aquí los datos de la operación (Ej: Vendedor: Nombre y C.I. / Comprador: Nombre y C.I. / Precio: Monto...) para rellenar los campos automáticamente..."
                          />
                          <button
                            type="button"
                            onClick={handleExtractFromWrittenNotes}
                            disabled={isRedactorExtracting}
                            className="w-full py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold cursor-pointer"
                          >
                            {isRedactorExtracting ? 'Extrayendo con IA...' : 'Extraer Datos del Escrito y Rellenar Modelo'}
                          </button>
                        </div>
                      )}
                    </div>

                    {spousalConsentWarning && (
                      <div style={subCardStyle} className="p-3.5 rounded-xl border border-amber-500/40 text-xs space-y-2">
                        <div className="font-mono font-bold" style={{ color: theme.accentText }}>
                          Observación Registral Preventiva (Art. 168 Código Civil)
                        </div>
                        <p style={{ color: theme.mutedText }} className="text-[11px]">
                          Se detectó estado civil casado sin mención de autorización conyugal ni declaración de bien propio.
                        </p>
                        <div className="flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => handleApplySpousalClause('consentimiento')}
                            className="px-3 py-1 rounded-lg bg-[#0F172A] text-white text-[11px] font-semibold cursor-pointer"
                          >
                            + Incluir Consentimiento Conyugal
                          </button>
                          <button
                            type="button"
                            onClick={() => handleApplySpousalClause('bien_propio')}
                            style={secondaryBtnStyle}
                            className="px-3 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer"
                          >
                            + Declarar Bien Propio (Art. 151 CC)
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Variables dinámicas del modelo */}
                    {selectedTemplate && (
                      <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                        {selectedTemplate.variables.map((v) => (
                          <div key={v.key} className="space-y-1">
                            <label className="block text-[11px] font-semibold">
                              <span style={{ color: theme.accentText }} className="font-mono">{`{{${v.key}}}`}</span> — {v.label}
                            </label>
                            <input
                              type="text"
                              value={templateValues[v.key] || ''}
                              onChange={(e) => setTemplateValues({ ...templateValues, [v.key]: e.target.value })}
                              placeholder={v.placeholder}
                              style={inputStyle}
                              className="w-full px-3 py-2 rounded-xl border text-xs"
                            />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Vista Previa del Documento Ensamblado */}
                  <div style={subCardStyle} className="lg:col-span-7 flex flex-col justify-between p-5 rounded-2xl border space-y-4">
                    <div className="space-y-3">
                      <div style={{ borderColor: theme.subBorder }} className="flex items-center justify-between border-b pb-3">
                        <h3 className="font-serif font-bold text-base">
                          {selectedTemplate?.name || 'Vista Previa del Instrumento'}
                        </h3>
                        <span style={{ color: theme.emeraldText }} className="text-[11px] font-mono font-semibold">
                          Sustitución en tiempo real
                        </span>
                      </div>

                      <div style={cardStyle} className="p-5 rounded-xl border min-h-[380px]">
                        <pre className="whitespace-pre-wrap font-serif text-xs sm:text-sm leading-relaxed">
                          {compiledDocument}
                        </pre>
                      </div>
                    </div>

                    <div style={cardStyle} className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3">
                      <div className="text-xs">
                        <strong className="block">Visado Profesional (Human-in-the-Loop)</strong>
                        <span style={{ color: theme.mutedText }} className="text-[11px]">
                          Estampa tu sello SHA-256 y descarga el archivo en formato .DOC.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleApproveAndExportRedactorDoc}
                        className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer transition"
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>Dar Visto Bueno y Exportar a .DOC</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              3. GRABADOR DE ACTAS (CON DICTADO / TRANSCRIPCIÓN Y ACUERDOS REALES)
          ================================================================== */}
          {activeTab === 'grabador' && (
            <div style={cardStyle} className="rounded-2xl p-4 sm:p-6 border shadow-xs space-y-6">
              <div style={{ borderColor: theme.cardBorder }} className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold">
                    Grabador de Reuniones y Generador de Actas
                  </h2>
                  <p style={{ color: theme.mutedText }} className="text-xs">
                    Captura audio presencial o de videollamada, transcribe la sesión y envía los compromisos directamente al Planificador y Calendario.
                  </p>
                </div>
                {isRecording && (
                  <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-mono text-xs font-bold animate-pulse">
                    ● GRABANDO ({String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')})
                  </span>
                )}
              </div>

              <div style={subCardStyle} className="p-4 sm:p-5 rounded-2xl border space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRecordingMode('Presencial (Sala / Despacho)')}
                    style={recordingMode === 'Presencial (Sala / Despacho)' ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#F59E0B' } : cardStyle}
                    className="p-3 rounded-xl border text-left flex items-center gap-3 cursor-pointer"
                  >
                    <Mic className="w-4 h-4 text-amber-500 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Reunión Presencial (Despacho / Sala)</div>
                      <div style={{ color: recordingMode === 'Presencial (Sala / Despacho)' ? '#CBD5E1' : theme.mutedText }} className="text-[11px]">
                        Captura por micrófono del dispositivo
                      </div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecordingMode('Meeting Online (Zoom / Meet / Teams)')}
                    style={recordingMode === 'Meeting Online (Zoom / Meet / Teams)' ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#F59E0B' } : cardStyle}
                    className="p-3 rounded-xl border text-left flex items-center gap-3 cursor-pointer"
                  >
                    <Video className="w-4 h-4 text-emerald-500 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Meeting Online (Zoom / Meet / Teams)</div>
                      <div style={{ color: recordingMode === 'Meeting Online (Zoom / Meet / Teams)' ? '#CBD5E1' : theme.mutedText }} className="text-[11px]">
                        Registro de sesión remota con clientes
                      </div>
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold mb-1">Título de la Reunión o Audiencia</label>
                    <input
                      type="text"
                      value={meetingTitleInput}
                      onChange={(e) => setMeetingTitleInput(e.target.value)}
                      placeholder="Guía: Ej. Reunión de negociación de contrato / Junta Directiva..."
                      style={inputStyle}
                      className="w-full px-3 py-2 rounded-xl border text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold mb-1">Asistentes / Partes Intervinientes</label>
                    <input
                      type="text"
                      value={meetingAttendeesInput}
                      onChange={(e) => setMeetingAttendeesInput(e.target.value)}
                      placeholder="Guía: Ej. Abogado titular, representante del cliente y contraparte..."
                      style={inputStyle}
                      className="w-full px-3 py-2 rounded-xl border text-xs"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold mb-1">
                    Transcripción en Vivo / Notas de la Sesión (Se completa al hablar con el micrófono activo o al escribir)
                  </label>
                  <textarea
                    rows={3}
                    value={liveTranscriptInput}
                    onChange={(e) => setLiveTranscriptInput(e.target.value)}
                    placeholder="Guía: Pulsa 'Iniciar Grabación' para dictar por micrófono o escribe/pega aquí el desarrollo de la reunión..."
                    style={inputStyle}
                    className="w-full p-3 rounded-xl border text-xs"
                  />
                </div>

                {/* Agregar acuerdos puntuales antes de cerrar el acta */}
                <div className="space-y-2">
                  <label className="block text-[11px] font-semibold">
                    Acuerdos y Compromisos Derivados de la Reunión ({draftAgreements.length})
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={newAgreementInput}
                      onChange={(e) => setNewAgreementInput(e.target.value)}
                      placeholder="Guía: Ej. Solicitar solvencia municipal / Redactar addendum..."
                      style={inputStyle}
                      className="flex-1 px-3 py-2 rounded-xl border text-xs"
                    />
                    <input
                      type="date"
                      value={newAgreementDateInput}
                      onChange={(e) => setNewAgreementDateInput(e.target.value)}
                      style={inputStyle}
                      className="px-3 py-2 rounded-xl border text-xs font-mono"
                    />
                    <button
                      type="button"
                      onClick={handleAddDraftAgreement}
                      style={secondaryBtnStyle}
                      className="px-3.5 py-2 rounded-xl border text-xs font-semibold cursor-pointer"
                    >
                      + Agregar Acuerdo
                    </button>
                  </div>
                  {draftAgreements.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {draftAgreements.map((da, i) => (
                        <span key={i} style={cardStyle} className="text-[11px] px-2.5 py-1 rounded-lg border">
                          • {da.text} ({da.dueDate})
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-end">
                  {!isRecording ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setIsRecording(true);
                          showToast(`Grabación iniciada (${recordingMode}).`);
                        }}
                        className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                      >
                        <Mic className="w-4 h-4" /> Iniciar Grabación
                      </button>
                      {(meetingTitleInput.trim() || liveTranscriptInput.trim()) && (
                        <button
                          type="button"
                          onClick={handleFinishRecordingSimulation}
                          className="py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Finalizar y Generar Acta
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleFinishRecordingSimulation}
                      className="py-2.5 px-5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer animate-pulse"
                    >
                      <CheckCircle2 className="w-4 h-4" /> Finalizar y Generar Acta
                    </button>
                  )}
                </div>
              </div>

              {recordings.length === 0 ? (
                <p style={{ color: theme.mutedText }} className="text-xs text-center py-6">
                  No hay actas registradas aún. Inicia una grabación o registra las notas de tu reunión arriba.
                </p>
              ) : (
                <div className="space-y-4">
                  {recordings.map((rec) => (
                    <div key={rec.id} style={subCardStyle} className="p-5 rounded-2xl border space-y-4">
                      <div style={{ borderColor: theme.subBorder }} className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                        <div>
                          <span style={{ color: theme.accentText }} className="text-[10px] font-mono font-bold">
                            {rec.mode} • {rec.date} • Duración: {rec.duration}
                          </span>
                          <h3 className="font-serif font-bold text-base mt-0.5">{rec.title}</h3>
                          <p style={{ color: theme.mutedText }} className="text-xs">Asistentes: {rec.attendees}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setShowMinutaModal(rec)}
                            className="px-3.5 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                          >
                            <Share2 className="w-3.5 h-3.5 text-amber-400" />
                            <span>Minuta</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteRecording(rec.id)}
                            style={secondaryBtnStyle}
                            className="p-2 rounded-xl border text-rose-500 cursor-pointer"
                            title="Eliminar acta"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>

                      {rec.agreementsAndTasks.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="text-xs font-mono uppercase font-bold" style={{ color: theme.emeraldText }}>
                            Acuerdos y Tareas (Marca ✓ para agendar en Planificador y Calendario)
                          </h4>
                          <div className="space-y-1.5">
                            {rec.agreementsAndTasks.map((act) => (
                              <label
                                key={act.id}
                                style={cardStyle}
                                className="flex items-center justify-between gap-3 p-3 rounded-xl border text-xs cursor-pointer"
                              >
                                <div className="flex items-center gap-2.5">
                                  <input
                                    type="checkbox"
                                    checked={act.addedToPlanner}
                                    onChange={() => handleToggleRecordingTaskCheck(rec.id, act.id)}
                                    className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                                  />
                                  <span className="font-medium">{act.text}</span>
                                </div>
                                <span style={{ color: theme.mutedText }} className="font-mono text-[11px] shrink-0">
                                  {act.dueDate}
                                </span>
                              </label>
                            ))}
                          </div>
                        </div>
                      )}

                      <div style={cardStyle} className="p-3.5 rounded-xl border font-mono text-xs whitespace-pre-wrap">
                        {rec.transcript}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {showMinutaModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
                  <div style={cardStyle} className="max-w-xl w-full rounded-2xl p-6 border shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b pb-3" style={{ borderColor: theme.cardBorder }}>
                      <h3 className="font-serif font-bold text-base">{showMinutaModal.title}</h3>
                      <button
                        type="button"
                        onClick={() => setShowMinutaModal(null)}
                        style={secondaryBtnStyle}
                        className="px-2.5 py-1 rounded-lg border text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                    <div style={subCardStyle} className="p-4 rounded-xl border text-xs space-y-2 font-serif max-h-80 overflow-y-auto">
                      <p><strong>Fecha:</strong> {showMinutaModal.date} | <strong>Modalidad:</strong> {showMinutaModal.mode}</p>
                      <p><strong>Asistentes:</strong> {showMinutaModal.attendees}</p>
                      <p><strong>Transcripción / Síntesis:</strong></p>
                      <p className="whitespace-pre-wrap">{showMinutaModal.transcript}</p>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          exportWordDoc(`Minuta_${showMinutaModal.date}.doc`, showMinutaModal.title, `Asistentes: ${showMinutaModal.attendees}`, showMinutaModal.transcript);
                          showToast('Minuta descargada en .DOC.');
                        }}
                        className="px-4 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-400" /> Descargar (.DOC)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              4. PLANIFICADOR KANBAN SINCRONIZADO CON CALENDARIO
          ================================================================== */}
          {activeTab === 'planificador' && (
            <div style={cardStyle} className="rounded-2xl p-4 sm:p-6 border shadow-xs space-y-6">
              <div style={{ borderColor: theme.cardBorder }} className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold">
                    Planificador de Tareas y Expedientes
                  </h2>
                  <p style={{ color: theme.mutedText }} className="text-xs">
                    Cada actividad planificada se agenda automáticamente en el Calendario Mensual.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('calendario')}
                  style={secondaryBtnStyle}
                  className="px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-500" /> Ir al Calendario →
                </button>
              </div>

              <div style={subCardStyle} className="p-4 rounded-xl border grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-semibold mb-1">Actividad o Actuación</label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Guía: Ej. Consignar escrito de pruebas / Redactar acta..."
                    style={inputStyle}
                    className="w-full px-3 py-2 rounded-xl border text-xs"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-semibold mb-1">Cliente / Expediente</label>
                  <input
                    type="text"
                    value={newTaskClient}
                    onChange={(e) => setNewTaskClient(e.target.value)}
                    placeholder="Guía: Nombre del cliente o Nº expediente..."
                    style={inputStyle}
                    className="w-full px-3 py-2 rounded-xl border text-xs"
                  />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-semibold mb-1">Fecha</label>
                  <input
                    type="date"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    style={inputStyle}
                    className="w-full px-2.5 py-2 rounded-xl border text-xs font-mono"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[11px] font-semibold mb-1">Prioridad</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as 'Alta' | 'Media' | 'Baja')}
                    style={inputStyle}
                    className="w-full px-2 py-2 rounded-xl border text-xs"
                  >
                    <option value="Alta">Alta</option>
                    <option value="Media">Media</option>
                    <option value="Baja">Baja</option>
                  </select>
                </div>
                <div className="md:col-span-2">
                  <button
                    type="button"
                    onClick={handleAddPlannerTask}
                    className="w-full py-2.5 px-3 rounded-xl bg-[#0F172A] text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate">Planificar y Agendar en Calendario</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['Pendiente', 'En Curso', 'Completado'] as const).map((col) => (
                  <div key={col} style={subCardStyle} className="p-4 rounded-xl border space-y-3">
                    <div style={{ borderColor: theme.subBorder }} className="flex items-center justify-between border-b pb-2">
                      <span className="font-serif font-bold text-sm">{col}</span>
                      <span style={{ color: theme.accentText }} className="text-xs font-mono font-bold">
                        {tasks.filter(t => t.status === col).length}
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {tasks.filter(t => t.status === col).map(task => (
                        <div key={task.id} style={cardStyle} className="p-3.5 rounded-xl border space-y-2 text-xs">
                          <div className="flex items-center justify-between">
                            <span style={{ color: theme.accentText }} className="text-[10px] font-mono font-bold">
                              {task.dueDate}
                            </span>
                            <span style={{ color: theme.mutedText }} className="text-[10px] font-mono">
                              {task.priority}
                            </span>
                          </div>
                          <p className="font-semibold">{task.title}</p>
                          <p style={{ color: theme.mutedText }} className="text-[11px]">{task.client}</p>
                          <div style={{ borderColor: theme.cardBorder }} className="flex items-center justify-between gap-1.5 pt-2 border-t">
                            <input
                              type="date"
                              value={task.dueDate}
                              onChange={(e) => {
                                const newD = e.target.value;
                                setTasks(prev => prev.map(tk => tk.id === task.id ? { ...tk, dueDate: newD } : tk));
                                setCalendarEvents(prev =>
                                  prev.map(ev => (ev.linkedTaskId === task.id ? { ...ev, date: newD } : ev))
                                );
                              }}
                              style={inputStyle}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded border"
                            />
                            <div className="flex items-center gap-1">
                              <select
                                value={task.status}
                                onChange={(e) => {
                                  const next = e.target.value as PlannerTask['status'];
                                  setTasks(prev => prev.map(tk => tk.id === task.id ? { ...tk, status: next } : tk));
                                }}
                                style={inputStyle}
                                className="text-[10px] font-mono px-2 py-0.5 rounded border"
                              >
                                <option value="Pendiente">Pendiente</option>
                                <option value="En Curso">En Curso</option>
                                <option value="Completado">Completado</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => handleDeletePlannerTask(task.id)}
                                className="p-1 text-rose-500 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =================================================================
              5. CALENDARIO MENSUAL REAL Y CALCULADORA DE PLAZOS PROCESALES
          ================================================================== */}
          {activeTab === 'calendario' && (
            <div style={cardStyle} className="rounded-2xl p-4 sm:p-6 border shadow-xs space-y-6">
              <div style={{ borderColor: theme.cardBorder }} className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold">
                    Calendario del Despacho ({monthNames[calendarMonth]} {calendarYear})
                  </h2>
                  <p style={{ color: theme.mutedText }} className="text-xs">
                    Agenda general y cómputo de lapsos procesales por días hábiles de despacho o continuos.
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5 text-xs">
                  {(['ambos', 'agenda_general', 'computo_procesal'] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setCalendarLawyerMode(m)}
                      style={calendarLawyerMode === m ? { backgroundColor: '#0F172A', color: '#FFFFFF' } : secondaryBtnStyle}
                      className="px-3 py-1.5 rounded-xl border font-semibold cursor-pointer"
                    >
                      {m === 'ambos' ? 'Vista Completa' : m === 'agenda_general' ? 'Solo Agenda' : 'Cómputo Procesal'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-3">
                  <div className="flex items-center justify-between bg-[#0F172A] text-white px-4 py-2.5 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        if (calendarMonth === 0) {
                          setCalendarMonth(11);
                          setCalendarYear(y => y - 1);
                        } else {
                          setCalendarMonth(m => m - 1);
                        }
                      }}
                      className="p-1 rounded-lg hover:bg-slate-800 cursor-pointer flex items-center gap-1 text-xs"
                    >
                      <ChevronLeft className="w-4 h-4" /> Anterior
                    </button>
                    <span className="font-serif font-bold text-sm sm:text-base text-amber-300">
                      {monthNames[calendarMonth]} {calendarYear}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (calendarMonth === 11) {
                          setCalendarMonth(0);
                          setCalendarYear(y => y + 1);
                        } else {
                          setCalendarMonth(m => m + 1);
                        }
                      }}
                      className="p-1 rounded-lg hover:bg-slate-800 cursor-pointer flex items-center gap-1 text-xs"
                    >
                      Siguiente <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div style={{ color: theme.mutedText }} className="grid grid-cols-7 gap-1 text-center text-[10px] font-mono uppercase font-bold">
                    <div>Lun</div><div>Mar</div><div>Mié</div><div>Jue</div><div>Vie</div>
                    <div className="text-rose-500">Sáb</div><div className="text-rose-500">Dom</div>
                  </div>

                  <div className="grid grid-cols-7 gap-1">
                    {calendarMonthCells.map((cell, idx) => {
                      if (!cell.day || !cell.dateStr) {
                        return <div key={idx} className="h-20 sm:h-24 rounded-xl opacity-20" />;
                      }
                      const dayEvents = calendarEvents.filter(ev => {
                        if (ev.date !== cell.dateStr) return false;
                        if (calendarLawyerMode === 'agenda_general') return ev.type !== 'Plazo Procesal';
                        return true;
                      });
                      const isSelected = selectedCalendarDate === cell.dateStr;

                      return (
                        <button
                          key={cell.dateStr}
                          type="button"
                          onClick={() => setSelectedCalendarDate(cell.dateStr!)}
                          style={
                            isSelected
                              ? { backgroundColor: theme.subBg, borderColor: '#F59E0B', color: theme.pageText }
                              : cell.isWeekend || cell.isNonWorking
                              ? subCardStyle
                              : cardStyle
                          }
                          className={`h-20 sm:h-24 p-1.5 sm:p-2 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer overflow-hidden ${
                            isSelected ? 'border-2' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className={`text-xs font-mono font-bold ${cell.isWeekend || cell.isNonWorking ? 'text-rose-500' : ''}`}>
                              {cell.day}
                            </span>
                            {dayEvents.length > 0 && (
                              <span className="text-[9px] font-mono px-1.5 rounded-full bg-[#0F172A] text-amber-300 font-bold">
                                {dayEvents.length}
                              </span>
                            )}
                          </div>
                          <div className="space-y-0.5 w-full overflow-hidden">
                            {dayEvents.slice(0, 2).map(ev => (
                              <div
                                key={ev.id}
                                className={`text-[9px] px-1 py-0.5 rounded truncate font-medium ${
                                  ev.type === 'Plazo Procesal'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-amber-500/20 text-amber-500'
                                }`}
                              >
                                {ev.title}
                              </div>
                            ))}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <div style={subCardStyle} className="p-4 rounded-xl border space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-mono font-bold" style={{ color: theme.accentText }}>
                        Fecha: {selectedCalendarDate}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleToggleNoDispatchDay(selectedCalendarDate)}
                        style={secondaryBtnStyle}
                        className="text-[10px] font-mono px-2 py-1 rounded-lg border cursor-pointer"
                      >
                        {nonWorkingDates.includes(selectedCalendarDate) ? '✓ Día Sin Despacho' : 'Marcar Sin Despacho'}
                      </button>
                    </div>

                    <div className="space-y-2">
                      {calendarEvents.filter(e => e.date === selectedCalendarDate).length === 0 ? (
                        <p style={{ color: theme.mutedText }} className="text-xs">Sin eventos en esta fecha.</p>
                      ) : (
                        calendarEvents
                          .filter(e => e.date === selectedCalendarDate)
                          .map(ev => (
                            <div key={ev.id} style={cardStyle} className="p-2.5 rounded-xl border text-xs flex items-start justify-between gap-2">
                              <div>
                                <span style={{ color: theme.accentText }} className="text-[10px] font-mono font-bold block">
                                  {ev.type}
                                </span>
                                <p className="font-semibold">{ev.title}</p>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteCalendarEvent(ev.id)}
                                className="text-rose-500 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ))
                      )}
                    </div>

                    <div style={{ borderColor: theme.subBorder }} className="pt-3 border-t space-y-2">
                      <input
                        type="text"
                        value={newCalEventTitle}
                        onChange={(e) => setNewCalEventTitle(e.target.value)}
                        placeholder="Guía: Título de audiencia, firma o evento..."
                        style={inputStyle}
                        className="w-full px-3 py-2 rounded-xl border text-xs"
                      />
                      <select
                        value={newCalEventType}
                        onChange={(e) => setNewCalEventType(e.target.value as 'Agenda General' | 'Plazo Procesal')}
                        style={inputStyle}
                        className="w-full px-3 py-2 rounded-xl border text-xs"
                      >
                        <option value="Agenda General">Agenda General</option>
                        <option value="Plazo Procesal">Plazo Procesal</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleAddDirectCalendarEvent}
                        className="w-full py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold cursor-pointer"
                      >
                        + Agendar en este Día
                      </button>
                    </div>
                  </div>

                  {calendarLawyerMode !== 'agenda_general' && (
                    <div style={subCardStyle} className="p-4 rounded-xl border space-y-2.5">
                      <div className="text-xs font-mono uppercase text-rose-500 font-bold">
                        Calculadora de Lapsos Procesales
                      </div>
                      <input
                        type="text"
                        value={procTitleInput}
                        onChange={(e) => setProcTitleInput(e.target.value)}
                        placeholder="Guía: Ej. Contestación de demanda / Apelación..."
                        style={inputStyle}
                        className="w-full px-3 py-2 rounded-xl border text-xs"
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label style={{ color: theme.mutedText }} className="block text-[10px] font-mono">Inicio / Citación</label>
                          <input
                            type="date"
                            value={procNotificationDate}
                            onChange={(e) => setProcNotificationDate(e.target.value)}
                            style={inputStyle}
                            className="w-full px-2 py-1.5 rounded-xl border text-xs"
                          />
                        </div>
                        <div>
                          <label style={{ color: theme.mutedText }} className="block text-[10px] font-mono">Días de Lapso</label>
                          <input
                            type="number"
                            min={1}
                            max={180}
                            value={procDaysCount}
                            onChange={(e) => setProcDaysCount(Number(e.target.value))}
                            style={inputStyle}
                            className="w-full px-2 py-1.5 rounded-xl border text-xs"
                          />
                        </div>
                      </div>
                      <select
                        value={procDayMode}
                        onChange={(e) => setProcDayMode(e.target.value as 'habiles' | 'continuos')}
                        style={inputStyle}
                        className="w-full px-3 py-2 rounded-xl border text-xs"
                      >
                        <option value="habiles">Días de Despacho (Excluye Sáb/Dom/Inhábiles)</option>
                        <option value="continuos">Días Continuos</option>
                      </select>
                      <button
                        type="button"
                        onClick={handleCalculateAndAddProceduralDeadline}
                        className="w-full py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer"
                      >
                        Calcular Vencimiento y Marcar en el Mes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              6. CRM JURÍDICO DE CLIENTES (ALTA, EDICIÓN, EXPEDIENTES Y ELIMINACIÓN)
          ================================================================== */}
          {activeTab === 'crm' && (
            <div style={cardStyle} className="rounded-2xl p-4 sm:p-6 border shadow-xs space-y-6">
              <div style={{ borderColor: theme.cardBorder }} className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold">
                    Directorio y Ficha Legal de Clientes (CRM)
                  </h2>
                  <p style={{ color: theme.mutedText }} className="text-xs">
                    Almacena los datos fiscales, registrales, poderes y expedientes de tus clientes.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(!showNewClientForm)}
                  className="px-4 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>{showNewClientForm ? 'Cerrar Formulario' : 'Nuevo Cliente'}</span>
                </button>
              </div>

              {showNewClientForm && (
                <div style={subCardStyle} className="p-4 rounded-xl border space-y-3 text-xs">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Guía: Nombre completo o Razón Social *"
                      value={newClientForm.name}
                      onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
                      style={inputStyle}
                      className="px-3 py-2 rounded-xl border"
                    />
                    <input
                      type="text"
                      placeholder="Guía: C.I. / RIF / NIF"
                      value={newClientForm.taxId}
                      onChange={(e) => setNewClientForm({ ...newClientForm, taxId: e.target.value })}
                      style={inputStyle}
                      className="px-3 py-2 rounded-xl border"
                    />
                    <input
                      type="text"
                      placeholder="Guía: Representante Legal y Cargo"
                      value={newClientForm.legalRep}
                      onChange={(e) => setNewClientForm({ ...newClientForm, legalRep: e.target.value })}
                      style={inputStyle}
                      className="px-3 py-2 rounded-xl border"
                    />
                    <input
                      type="text"
                      placeholder="Guía: Datos de Registro Mercantil y Poder"
                      value={newClientForm.registryInfo}
                      onChange={(e) => setNewClientForm({ ...newClientForm, registryInfo: e.target.value })}
                      style={inputStyle}
                      className="px-3 py-2 rounded-xl border"
                    />
                    <input
                      type="text"
                      placeholder="Guía: Teléfono / WhatsApp"
                      value={newClientForm.phone}
                      onChange={(e) => setNewClientForm({ ...newClientForm, phone: e.target.value })}
                      style={inputStyle}
                      className="px-3 py-2 rounded-xl border"
                    />
                    <input
                      type="email"
                      placeholder="Guía: Correo Electrónico"
                      value={newClientForm.email}
                      onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                      style={inputStyle}
                      className="px-3 py-2 rounded-xl border"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Guía: Domicilio Fiscal y Procesal"
                      value={newClientForm.address}
                      onChange={(e) => setNewClientForm({ ...newClientForm, address: e.target.value })}
                      style={inputStyle}
                      className="px-3 py-2 rounded-xl border"
                    />
                    <input
                      type="text"
                      placeholder="Guía: Esquema de Honorarios o Iguala"
                      value={newClientForm.feeArrangement}
                      onChange={(e) => setNewClientForm({ ...newClientForm, feeArrangement: e.target.value })}
                      style={inputStyle}
                      className="px-3 py-2 rounded-xl border"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateCrmClient}
                    className="px-5 py-2 rounded-xl bg-emerald-700 text-white font-semibold cursor-pointer"
                  >
                    Guardar Ficha Legal del Cliente
                  </button>
                </div>
              )}

              {crmClients.length === 0 ? (
                <p style={{ color: theme.mutedText }} className="text-xs text-center py-8">
                  No hay clientes registrados. Pulsa "Nuevo Cliente" arriba para crear la primera ficha legal.
                </p>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                  <div style={subCardStyle} className="lg:col-span-4 p-4 rounded-xl border space-y-3">
                    <div className="relative">
                      <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={crmSearch}
                        onChange={(e) => setCrmSearch(e.target.value)}
                        placeholder="Buscar cliente..."
                        style={inputStyle}
                        className="w-full pl-8 pr-3 py-2 rounded-xl border text-xs"
                      />
                    </div>
                    <div className="space-y-1.5">
                      {crmClients
                        .filter(c => c.name.toLowerCase().includes(crmSearch.toLowerCase()))
                        .map((client) => {
                          const isSelected = selectedClient?.id === client.id;
                          return (
                            <div
                              key={client.id}
                              style={isSelected ? { backgroundColor: '#0F172A', color: '#FFFFFF' } : cardStyle}
                              className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold flex items-center justify-between"
                            >
                              <button
                                type="button"
                                onClick={() => {
                                  setSelectedClientId(client.id);
                                  setIsEditingClient(false);
                                }}
                                className="truncate flex-1 text-left cursor-pointer"
                              >
                                {client.name}
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteCrmClient(client.id)}
                                className="text-rose-400 hover:text-rose-500 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                    </div>
                  </div>

                  {selectedClient && (
                    <div style={subCardStyle} className="lg:col-span-8 p-5 rounded-xl border space-y-4">
                      <div style={{ borderColor: theme.subBorder }} className="flex flex-wrap items-start justify-between gap-3 border-b pb-3">
                        <div>
                          <span style={{ color: theme.accentText }} className="text-[10px] font-mono uppercase font-bold">
                            {selectedClient.personType}
                          </span>
                          <h3 className="font-serif text-lg sm:text-xl font-bold">{selectedClient.name}</h3>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setIsEditingClient(!isEditingClient)}
                            style={secondaryBtnStyle}
                            className="px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer"
                          >
                            {isEditingClient ? 'Guardar' : 'Editar'}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleLoadClientIntoRedactor(selectedClient)}
                            className="px-3 py-1.5 rounded-xl bg-[#0F172A] text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                          >
                            <FileText className="w-3.5 h-3.5 text-amber-400" />
                            <span>Usar en Redactor</span>
                          </button>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                        <div style={cardStyle} className="p-3.5 rounded-xl border space-y-1">
                          <span style={{ color: theme.mutedText }} className="text-[10px] font-mono uppercase block">C.I. / RIF / NIF</span>
                          {isEditingClient ? (
                            <input
                              type="text"
                              value={selectedClient.taxId}
                              onChange={(e) => handleUpdateSelectedClientField('taxId', e.target.value)}
                              style={inputStyle}
                              className="w-full px-2 py-1 rounded border font-mono text-xs"
                            />
                          ) : (
                            <strong className="font-mono">{selectedClient.taxId}</strong>
                          )}
                        </div>
                        <div style={cardStyle} className="p-3.5 rounded-xl border space-y-1">
                          <span style={{ color: theme.mutedText }} className="text-[10px] font-mono uppercase block">Representante Legal</span>
                          {isEditingClient ? (
                            <input
                              type="text"
                              value={selectedClient.legalRep}
                              onChange={(e) => handleUpdateSelectedClientField('legalRep', e.target.value)}
                              style={inputStyle}
                              className="w-full px-2 py-1 rounded border text-xs"
                            />
                          ) : (
                            <strong>{selectedClient.legalRep}</strong>
                          )}
                        </div>
                        <div style={cardStyle} className="p-3.5 rounded-xl border space-y-1 md:col-span-2">
                          <span style={{ color: theme.mutedText }} className="text-[10px] font-mono uppercase block">Registro Mercantil y Poderes</span>
                          {isEditingClient ? (
                            <input
                              type="text"
                              value={selectedClient.registryInfo}
                              onChange={(e) => handleUpdateSelectedClientField('registryInfo', e.target.value)}
                              style={inputStyle}
                              className="w-full px-2 py-1 rounded border text-xs"
                            />
                          ) : (
                            <p>{selectedClient.registryInfo}</p>
                          )}
                        </div>
                      </div>

                      <div style={cardStyle} className="p-3.5 rounded-xl border space-y-2 text-xs">
                        <span style={{ color: theme.accentText }} className="text-[10px] font-mono uppercase font-bold block">
                          Expedientes Vinculados ({selectedClient.activeMatters.length})
                        </span>
                        <ul className="space-y-1">
                          {selectedClient.activeMatters.map((m, i) => (
                            <li key={i} className="font-mono text-xs flex items-center gap-2">
                              <Briefcase className="w-3.5 h-3.5 text-amber-500 shrink-0" /> {m}
                            </li>
                          ))}
                        </ul>
                        <div className="flex gap-2 pt-2">
                          <input
                            type="text"
                            value={newMatterInput}
                            onChange={(e) => setNewMatterInput(e.target.value)}
                            placeholder="Guía: Nº y carátula del expediente..."
                            style={inputStyle}
                            className="w-full px-3 py-1.5 rounded-lg border text-xs"
                          />
                          <button
                            type="button"
                            onClick={handleAddMatterToSelectedClient}
                            className="shrink-0 px-3 py-1.5 rounded-lg bg-[#0F172A] text-white text-xs font-semibold cursor-pointer"
                          >
                            + Agregar Expediente
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              7. KPI & PRESUPUESTO
          ================================================================== */}
          {activeTab === 'kpi' && (
            <div style={cardStyle} className="rounded-2xl p-4 sm:p-6 border shadow-xs space-y-6">
              <div style={{ borderColor: theme.cardBorder }} className="border-b pb-4">
                <h2 className="font-serif text-lg sm:text-xl font-bold">
                  Métricas de Uso y Presupuesto de API
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div style={subCardStyle} className="p-5 rounded-xl border">
                  <span style={{ color: theme.mutedText }} className="text-[10px] font-mono uppercase">Consumo API Actual</span>
                  <div style={{ color: theme.emeraldText }} className="text-2xl font-serif font-bold mt-1">${currentSpendUsd.toFixed(2)} USD</div>
                  <span style={{ color: theme.mutedText }} className="text-[11px]">Límite: ${monthlyBudgetUsd} USD</span>
                </div>
                <div style={subCardStyle} className="p-5 rounded-xl border">
                  <span style={{ color: theme.mutedText }} className="text-[10px] font-mono uppercase">Documentos Visados</span>
                  <div className="text-2xl font-serif font-bold mt-1">{approvedDocsRegistry.length}</div>
                  <span style={{ color: theme.mutedText }} className="text-[11px]">En Human-in-the-Loop</span>
                </div>
                <div style={subCardStyle} className="p-5 rounded-xl border">
                  <span style={{ color: theme.mutedText }} className="text-[10px] font-mono uppercase">Horas Ahorradas</span>
                  <div style={{ color: theme.accentText }} className="text-2xl font-serif font-bold mt-1">{savedHoursCount} h</div>
                  <span style={{ color: theme.mutedText }} className="text-[11px]">En consultas y redacción</span>
                </div>
                <div style={subCardStyle} className="p-5 rounded-xl border">
                  <span style={{ color: theme.mutedText }} className="text-[10px] font-mono uppercase">Operaciones Protegidas</span>
                  <div style={{ color: theme.emeraldText }} className="text-2xl font-serif font-bold mt-1">{piiAuditRegistry.length}</div>
                  <span style={{ color: theme.mutedText }} className="text-[11px]">Anonimizadas en RAM</span>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              8. TRAZABILIDAD SHA-256
          ================================================================== */}
          {activeTab === 'trazabilidad' && (
            <div style={cardStyle} className="rounded-2xl p-4 sm:p-6 border shadow-xs space-y-6">
              <div style={{ borderColor: theme.cardBorder }} className="flex items-center justify-between border-b pb-4">
                <h2 className="font-serif text-lg sm:text-xl font-bold">
                  Bitácora Criptográfica SHA-256 ({auditLogs.length})
                </h2>
                {auditLogs.length > 0 && (
                  <button
                    type="button"
                    onClick={() => setAuditLogs([])}
                    style={secondaryBtnStyle}
                    className="px-3 py-1.5 rounded-lg border text-xs cursor-pointer"
                  >
                    Limpiar Bitácora
                  </button>
                )}
              </div>

              {auditLogs.length === 0 ? (
                <p style={{ color: theme.mutedText }} className="text-xs text-center py-8">
                  Aún no hay operaciones registradas. Cada dictamen o documento visado generará su sello SHA-256 aquí.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#0F172A] text-white font-mono text-[10px] uppercase">
                        <th className="p-3">Hora</th>
                        <th className="p-3">Módulo</th>
                        <th className="p-3">Operación</th>
                        <th className="p-3">PII</th>
                        <th className="p-3">Hash SHA-256</th>
                      </tr>
                    </thead>
                    <tbody>
                      {auditLogs.map(log => (
                        <tr key={log.id} style={{ borderColor: theme.cardBorder }} className="border-b">
                          <td className="p-3 font-mono">{log.timestamp}</td>
                          <td className="p-3 font-semibold">{log.module}</td>
                          <td className="p-3">{log.action}</td>
                          <td className="p-3 font-mono" style={{ color: theme.emeraldText }}>{log.piiCount}</td>
                          <td className="p-3 font-mono text-[10px]" style={{ color: theme.mutedText }}>{log.sha256.slice(0, 24)}...</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              9. HUMAN-IN-THE-LOOP
          ================================================================== */}
          {activeTab === 'human_loop' && (
            <div style={cardStyle} className="rounded-2xl p-4 sm:p-6 border shadow-xs space-y-6">
              <div style={{ borderColor: theme.cardBorder }} className="border-b pb-4">
                <h2 className="font-serif text-lg sm:text-xl font-bold">
                  Registro de Documentos Visados (Human-in-the-Loop)
                </h2>
              </div>

              {approvedDocsRegistry.length === 0 ? (
                <p style={{ color: theme.mutedText }} className="text-xs text-center py-8">
                  No hay documentos visados todavía. Cuando apruebes un dictamen o contrato aparecerá aquí.
                </p>
              ) : (
                <div className="space-y-3">
                  {approvedDocsRegistry.map((rec) => (
                    <div key={rec.id} style={subCardStyle} className="p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                      <div className="space-y-1 text-xs">
                        <div className="flex items-center gap-2 font-mono text-[10px]">
                          <span style={{ color: theme.emeraldText }} className="font-bold">✓ VISADO ({rec.id})</span>
                          <span style={{ color: theme.mutedText }}>{rec.timestamp} • {rec.originModule}</span>
                        </div>
                        <h3 className="font-serif font-bold text-sm">{rec.title}</h3>
                        <p style={{ color: theme.mutedText }} className="text-[11px]">
                          {rec.approvedBy} ({rec.collegiateNumber}) • SHA-256: {rec.sha256.slice(0, 20)}...
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => exportWordDoc(`${rec.title.replace(/\s+/g, '_')}.doc`, rec.title, `Visado por ${rec.approvedBy}`, rec.content)}
                        className="shrink-0 px-3.5 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-400" /> Descargar (.DOC)
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              10. ANONIMIZACIÓN PII
          ================================================================== */}
          {activeTab === 'anonimizacion_pii' && (
            <div style={cardStyle} className="rounded-2xl p-4 sm:p-6 border shadow-xs space-y-6">
              <div style={{ borderColor: theme.cardBorder }} className="border-b pb-4">
                <h2 className="font-serif text-lg sm:text-xl font-bold">
                  Bitácora de Anonimización PII en Memoria RAM
                </h2>
              </div>

              {piiAuditRegistry.length === 0 ? (
                <p style={{ color: theme.mutedText }} className="text-xs text-center py-8">
                  Aún no se han ejecutado operaciones de anonimización en esta sesión.
                </p>
              ) : (
                <div className="space-y-3">
                  {piiAuditRegistry.map((entry) => (
                    <div key={entry.id} style={subCardStyle} className="p-4 rounded-xl border space-y-2 text-xs">
                      <div className="flex items-center justify-between font-mono text-[10px]">
                        <span style={{ color: theme.accentText }} className="font-bold">{entry.id} • {entry.originModule}</span>
                        <span style={{ color: theme.mutedText }}>{entry.timestamp}</span>
                      </div>
                      <p className="font-medium">{entry.contextSummary}</p>
                      <div className="flex flex-wrap gap-1.5">
                        {entry.tokensDetected.map((tok, i) => (
                          <span key={i} style={cardStyle} className="px-2 py-1 rounded border font-mono text-[10px]">
                            <strong style={{ color: theme.emeraldText }}>{tok.token}</strong> → {tok.maskedPreview}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              11. CONFIGURACIÓN FUNCIONAL DEL DESPACHO (API, BIBLIOTECA CRUD Y RAG CRUD)
          ================================================================== */}
          {activeTab === 'configuracion_sistema' && (
            <div style={cardStyle} className="rounded-2xl p-4 sm:p-6 border shadow-xs space-y-6">
              <div style={{ borderColor: theme.cardBorder }} className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold">
                    Configuración de API, Biblioteca de Modelos y Repositorio RAG
                  </h2>
                  <p style={{ color: theme.mutedText }} className="text-xs">
                    Conecta tu API Key privada, administra tus modelos de contratos y agrega o elimina las leyes de tu RAG. Todo queda almacenado en tu equipo.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    try {
                      window.localStorage.removeItem(STORAGE_KEY);
                    } catch {
                      // ignorar
                    }
                    showToast('Almacenamiento local restablecido.');
                  }}
                  style={secondaryBtnStyle}
                  className="px-3 py-1.5 rounded-xl border text-xs font-semibold cursor-pointer"
                >
                  Restablecer Memoria Local
                </button>
              </div>

              {/* 1. Datos del Despacho y Abogado Titular */}
              <div style={subCardStyle} className="p-4 sm:p-5 rounded-xl border space-y-3">
                <h3 className="font-serif font-bold text-sm">1. Identificación del Despacho y Abogado Titular</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label style={{ color: theme.mutedText }} className="block font-mono text-[10px] uppercase mb-1">Nombre del Despacho</label>
                    <input
                      type="text"
                      value={firmName}
                      onChange={(e) => setFirmName(e.target.value)}
                      placeholder="Guía: Ej. Escritorio Jurídico Piccolo"
                      style={inputStyle}
                      className="w-full px-3 py-2 rounded-xl border"
                    />
                  </div>
                  <div>
                    <label style={{ color: theme.mutedText }} className="block font-mono text-[10px] uppercase mb-1">Abogado Titular (Para Visados)</label>
                    <input
                      type="text"
                      value={lawyerSignerName}
                      onChange={(e) => setLawyerSignerName(e.target.value)}
                      placeholder="Guía: Ej. Dra. Bárbara Piccolo"
                      style={inputStyle}
                      className="w-full px-3 py-2 rounded-xl border"
                    />
                  </div>
                  <div>
                    <label style={{ color: theme.mutedText }} className="block font-mono text-[10px] uppercase mb-1">Nº Colegiado / Inpreabogado</label>
                    <input
                      type="text"
                      value={lawyerCollegiateId}
                      onChange={(e) => setLawyerCollegiateId(e.target.value)}
                      placeholder="Guía: Ej. Inpreabogado Nº 104.892"
                      style={inputStyle}
                      className="w-full px-3 py-2 rounded-xl border"
                    />
                  </div>
                  <div>
                    <label style={{ color: theme.mutedText }} className="block font-mono text-[10px] uppercase mb-1">Especialidad Principal</label>
                    <input
                      type="text"
                      value={customPracticeArea}
                      onChange={(e) => setCustomPracticeArea(e.target.value)}
                      placeholder="Guía: Ej. Derecho Corporativo y Civil"
                      style={inputStyle}
                      className="w-full px-3 py-2 rounded-xl border"
                    />
                  </div>
                </div>
              </div>

              {/* 2. Conexión de API de IA */}
              <div style={subCardStyle} className="p-4 sm:p-5 rounded-xl border space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-serif font-bold text-sm flex items-center gap-2">
                    <Key className="w-4 h-4 text-amber-500" /> 2. Conexión de tu Motor de IA (API Key)
                  </h3>
                  <span style={{ color: apiKeyInput.trim() ? theme.emeraldText : theme.mutedText }} className="text-[11px] font-mono font-semibold">
                    {apiKeyInput.trim() || llmProvider === 'ollama' ? '✓ API Configurada' : 'Pendiente de API Key'}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label style={{ color: theme.mutedText }} className="block font-mono text-[10px] uppercase mb-1">Proveedor</label>
                    <select
                      value={llmProvider}
                      onChange={(e) => {
                        const nextProv = e.target.value as 'openai' | 'anthropic' | 'gemini' | 'groq' | 'ollama';
                        setLlmProvider(nextProv);
                        setLlmModel(PROVIDER_DEFAULT_MODELS[nextProv][0]);
                      }}
                      style={inputStyle}
                      className="w-full px-3 py-2 rounded-xl border"
                    >
                      <option value="openai">OpenAI (GPT-4o)</option>
                      <option value="gemini">Google Gemini (2.5 Pro / Flash)</option>
                      <option value="groq">Groq (Llama 3.3 70B)</option>
                      <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                      <option value="ollama">Ollama (Modelo Local sin Internet)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ color: theme.mutedText }} className="block font-mono text-[10px] uppercase mb-1">Modelo</label>
                    <select
                      value={llmModel}
                      onChange={(e) => setLlmModel(e.target.value)}
                      style={inputStyle}
                      className="w-full px-3 py-2 rounded-xl border font-mono"
                    >
                      {PROVIDER_DEFAULT_MODELS[llmProvider].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  {llmProvider === 'ollama' ? (
                    <div>
                      <label style={{ color: theme.mutedText }} className="block font-mono text-[10px] uppercase mb-1">URL Local de Ollama</label>
                      <input
                        type="text"
                        value={ollamaBaseUrl}
                        onChange={(e) => setOllamaBaseUrl(e.target.value)}
                        placeholder="Guía: http://localhost:11434"
                        style={inputStyle}
                        className="w-full px-3 py-2 rounded-xl border font-mono"
                      />
                    </div>
                  ) : (
                    <div>
                      <label style={{ color: theme.mutedText }} className="block font-mono text-[10px] uppercase mb-1">Tu API Key Privada</label>
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        placeholder={
                          llmProvider === 'openai'
                            ? 'Guía: Pega tu llave sk-proj-...'
                            : llmProvider === 'gemini'
                            ? 'Guía: Pega tu llave AIzaSy...'
                            : llmProvider === 'groq'
                            ? 'Guía: Pega tu llave gsk_...'
                            : 'Guía: Pega tu llave sk-ant-...'
                        }
                        style={inputStyle}
                        className="w-full px-3 py-2 rounded-xl border font-mono"
                      />
                    </div>
                  )}

                  <div>
                    <label style={{ color: theme.mutedText }} className="block font-mono text-[10px] uppercase mb-1">
                      Tope Mensual: ${monthlyBudgetUsd} USD
                    </label>
                    <input
                      type="range"
                      min={5}
                      max={200}
                      value={monthlyBudgetUsd}
                      onChange={(e) => setMonthlyBudgetUsd(Number(e.target.value))}
                      className="w-full accent-amber-500 mt-2"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Gestión Funcional de Biblioteca de Modelos y Leyes RAG (Agregar, Ver y Eliminar) */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* BIBLIOTECA DE MODELOS (CRUD COMPLETO) */}
                <div style={subCardStyle} className="p-4 sm:p-5 rounded-xl border space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-serif font-bold text-sm flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-emerald-500" /> 3. Biblioteca de Modelos ({templates.length})
                      </h3>
                      <p style={{ color: theme.mutedText }} className="text-[11px]">
                        Guarda tus plantillas con variables <code>{`{{VARIABLE}}`}</code> para usarlas en el Consultor y Redactor.
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowAddTemplateModal(!showAddTemplateModal)}
                        className="px-3 py-1.5 rounded-lg bg-[#0F172A] text-white text-xs font-semibold cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-400" /> Crear / Pegar Modelo
                      </button>
                      <label className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Agregar Nuevo Modelo (.DOCX / .TXT)</span>
                        <input
                          type="file"
                          accept=".doc,.docx,.txt,.md"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              const raw = String(reader.result || '');
                              const printable = raw.match(/[A-Za-záéíóúñÁÉÍÓÚÑ0-9.,;:()¿?¡!$€%@#/_\\\-\{\}\s]{10,}/g);
                              const cleanText = /\.(txt|md)$/i.test(f.name)
                                ? raw.trim()
                                : printable
                                ? printable.join(' ').trim()
                                : '';
                              const finalBody =
                                cleanText.length > 20
                                  ? cleanText
                                  : `ENTRE: {{PARTE_A}}, por una parte; y por la otra {{PARTE_B}}, se ha convenido en celebrar el presente contrato:\n\nPRIMERA (OBJETO): {{OBJETO_CONTRATO}}.\n\nSEGUNDA (PRECIO): {{PRECIO_CONDICIONES}}.\n\nTERCERA (JURISDICCIÓN): {{JURISDICCION}}.`;
                              const detectedVars = detectVariablesInTemplateText(finalBody);
                              const newTpl: ModelTemplate = {
                                id: `tpl-${Date.now().toString().slice(-5)}`,
                                name: f.name.replace(/\.[^/.]+$/, ''),
                                category: 'Biblioteca del Despacho',
                                source: librarySourceMode,
                                updatedAt: new Date().toLocaleDateString('es-ES'),
                                variables: detectedVars,
                                contentPreview: finalBody
                              };
                              setTemplates(prev => [newTpl, ...prev]);
                              setSelectedTemplateId(newTpl.id);
                              showToast(`Modelo "${newTpl.name}" almacenado (${detectedVars.length} variables).`);
                            };
                            reader.readAsText(f);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {showAddTemplateModal && (
                    <div style={cardStyle} className="p-3.5 rounded-xl border space-y-2.5 text-xs">
                      <input
                        type="text"
                        value={newTplNameInput}
                        onChange={(e) => setNewTplNameInput(e.target.value)}
                        placeholder="Guía: Nombre del modelo (Ej. Contrato de Compraventa / Poder Especial)..."
                        style={inputStyle}
                        className="w-full px-3 py-1.5 rounded-lg border"
                      />
                      <input
                        type="text"
                        value={newTplCategoryInput}
                        onChange={(e) => setNewTplCategoryInput(e.target.value)}
                        placeholder="Guía: Categoría (Ej. Civil / Mercantil / Laboral)..."
                        style={inputStyle}
                        className="w-full px-3 py-1.5 rounded-lg border"
                      />
                      <textarea
                        rows={5}
                        value={newTplContentInput}
                        onChange={(e) => setNewTplContentInput(e.target.value)}
                        placeholder="Guía: Pega aquí el texto completo de tu modelo y coloca entre dobles llaves los datos a sustituir, por ejemplo: Yo, {{OTORGANTE}}, confiero poder especial a {{APODERADOS}} para {{FACULTADES}}..."
                        style={inputStyle}
                        className="w-full p-2.5 rounded-lg border font-serif text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddTemplateModal(false)}
                          style={secondaryBtnStyle}
                          className="px-3 py-1 rounded-lg border cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateTemplateManual}
                          className="px-4 py-1 rounded-lg bg-emerald-700 text-white font-semibold cursor-pointer"
                        >
                          Guardar Modelo en Biblioteca
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {templates.length === 0 ? (
                      <p style={{ color: theme.mutedText }} className="text-xs py-4 text-center">
                        No hay modelos cargados. Agrega tus plantillas arriba para almacenarlas.
                      </p>
                    ) : (
                      templates.map(tpl => (
                        <div key={tpl.id} style={cardStyle} className="p-3 rounded-xl border flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{tpl.name}</div>
                            <div style={{ color: theme.mutedText }} className="text-[10px] font-mono">
                              {tpl.category} • {tpl.variables.length} variables ({tpl.variables.map(v => `{{${v.key}}}`).slice(0, 3).join(', ')})
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => {
                                handleSelectTemplate(tpl.id);
                                setActiveTab('redactor_docs');
                              }}
                              style={secondaryBtnStyle}
                              className="px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer"
                            >
                              Abrir
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteTemplate(tpl.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                              title="Eliminar modelo"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* REPOSITORIO RAG DE LEYES Y NORMATIVA (CRUD COMPLETO: AGREGAR, VER Y ELIMINAR) */}
                <div style={subCardStyle} className="p-4 sm:p-5 rounded-xl border space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-serif font-bold text-sm flex items-center gap-2">
                        <Scale className="w-4 h-4 text-indigo-500" /> 4. Leyes y Normativa en RAG ({ragDocs.length})
                      </h3>
                      <p style={{ color: theme.mutedText }} className="text-[11px]">
                        Sube o pega tus leyes, códigos y sentencias. Puedes consultarlos o eliminarlos cuando quieras.
                      </p>
                    </div>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setShowAddRagModal(!showAddRagModal)}
                        className="px-3 py-1.5 rounded-lg bg-[#0F172A] text-white text-xs font-semibold cursor-pointer flex items-center gap-1"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-400" /> Pegar Ley / Artículos
                      </button>
                      <label className="px-3 py-1.5 rounded-lg bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Cargar Ley, Código o Sentencia (.PDF)</span>
                        <input
                          type="file"
                          accept=".pdf,.txt,.doc,.docx,.md"
                          className="hidden"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const reader = new FileReader();
                            reader.onload = () => {
                              const raw = String(reader.result || '');
                              const printable = raw.match(/[A-Za-záéíóúñÁÉÍÓÚÑ0-9.,;:()¿?¡!$€%@#/_\\\-\s]{12,}/g);
                              const cleanText = /\.(txt|md)$/i.test(f.name)
                                ? raw.trim()
                                : printable
                                ? printable.join(' ').replace(/\s+/g, ' ').trim()
                                : '';
                              const storedText =
                                cleanText.length > 30
                                  ? cleanText.slice(0, 25000)
                                  : `Cuerpo normativo indexado desde el archivo "${f.name}" (${(f.size / 1024).toFixed(1)} KB).`;
                              const chunksCount = Math.max(1, Math.ceil(storedText.length / 400));
                              const newDoc: RagLawDocument = {
                                id: `rag-${Date.now().toString().slice(-5)}`,
                                title: f.name.replace(/\.[^/.]+$/, ''),
                                type: 'Código / Ley',
                                chunks: chunksCount,
                                status: 'Indexado',
                                excerpt: storedText.slice(0, 260) + (storedText.length > 260 ? '...' : ''),
                                fullText: storedText
                              };
                              setRagDocs(prev => [newDoc, ...prev]);
                              showToast(`"${newDoc.title}" almacenado en el RAG (${chunksCount} fragmentos).`);
                            };
                            reader.readAsText(f);
                          }}
                        />
                      </label>
                    </div>
                  </div>

                  {showAddRagModal && (
                    <div style={cardStyle} className="p-3.5 rounded-xl border space-y-2.5 text-xs">
                      <input
                        type="text"
                        value={newRagTitleInput}
                        onChange={(e) => setNewRagTitleInput(e.target.value)}
                        placeholder="Guía: Título de la Ley o Sentencia (Ej. Código Civil / Código de Comercio)..."
                        style={inputStyle}
                        className="w-full px-3 py-1.5 rounded-lg border"
                      />
                      <select
                        value={newRagTypeInput}
                        onChange={(e) => setNewRagTypeInput(e.target.value as RagLawDocument['type'])}
                        style={inputStyle}
                        className="w-full px-3 py-1.5 rounded-lg border"
                      >
                        <option value="Código / Ley">Código / Ley</option>
                        <option value="Jurisprudencia / Doctrina">Jurisprudencia / Doctrina</option>
                        <option value="Reglamento / Norma">Reglamento / Norma</option>
                      </select>
                      <textarea
                        rows={5}
                        value={newRagContentInput}
                        onChange={(e) => setNewRagContentInput(e.target.value)}
                        placeholder="Guía: Pega aquí los artículos, capítulos o el texto íntegro de la ley o sentencia que deseas almacenar en el RAG para que el Consultor responda con base en ella..."
                        style={inputStyle}
                        className="w-full p-2.5 rounded-lg border text-xs"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setShowAddRagModal(false)}
                          style={secondaryBtnStyle}
                          className="px-3 py-1 rounded-lg border cursor-pointer"
                        >
                          Cancelar
                        </button>
                        <button
                          type="button"
                          onClick={handleCreateRagManual}
                          className="px-4 py-1 rounded-lg bg-emerald-700 text-white font-semibold cursor-pointer"
                        >
                          Almacenar en el RAG
                        </button>
                      </div>
                    </div>
                  )}

                  {viewingRagDoc && (
                    <div style={cardStyle} className="p-3.5 rounded-xl border space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <strong className="font-serif">{viewingRagDoc.title}</strong>
                        <button
                          type="button"
                          onClick={() => setViewingRagDoc(null)}
                          style={secondaryBtnStyle}
                          className="px-2 py-0.5 rounded border text-[10px] cursor-pointer"
                        >
                          Cerrar vista
                        </button>
                      </div>
                      <pre style={{ color: theme.mutedText }} className="whitespace-pre-wrap font-mono text-[11px] max-h-40 overflow-y-auto">
                        {viewingRagDoc.fullText || viewingRagDoc.excerpt}
                      </pre>
                    </div>
                  )}

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {ragDocs.length === 0 ? (
                      <p style={{ color: theme.mutedText }} className="text-xs py-4 text-center">
                        No hay leyes almacenadas en el RAG. Sube un archivo o pega los artículos arriba.
                      </p>
                    ) : (
                      ragDocs.map(doc => (
                        <div key={doc.id} style={cardStyle} className="p-3 rounded-xl border flex items-center justify-between gap-2 text-xs">
                          <div className="min-w-0">
                            <div className="font-semibold truncate">{doc.title}</div>
                            <div style={{ color: theme.mutedText }} className="text-[10px] font-mono">
                              {doc.type} • {doc.chunks} fragmentos indexados
                            </div>
                          </div>
                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              type="button"
                              onClick={() => setViewingRagDoc(doc)}
                              style={secondaryBtnStyle}
                              className="p-1.5 rounded-lg border cursor-pointer"
                              title="Ver contenido indexado"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleDeleteRagDoc(doc.id)}
                              className="p-1.5 text-rose-500 hover:bg-rose-500/10 rounded-lg cursor-pointer"
                              title="Eliminar del RAG"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
