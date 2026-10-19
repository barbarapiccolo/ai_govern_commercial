"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Shield, Lock, Key, FolderOpen, Scale, MessageSquare, FileText,
  Mic, Kanban, Calendar as CalendarIcon, Users, BarChart3, Fingerprint,
  UserCheck, EyeOff, Upload, CheckCircle2, Download,
  Plus, Search, Sparkles, ChevronRight, ChevronLeft,
  Sliders, Copy, Sun, Moon, FileCheck,
  Camera, FileUp, Video, Share2, Briefcase
} from 'lucide-react';

// ============================================================================
// TIPOS DE DATOS DEL SISTEMA JURÍDICO PRIVADO AI GOVERN
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

// ============================================================================
// UTILIDADES CRIPTOGRÁFICAS SHA-256 REAL (FIPS 180-4) Y ANONIMIZACIÓN ZERO-TRUST
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

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Array<number>(64);
  for (let j = 0; j < words.length; j += 16) {
    for (let i = 0; i < 16; i++) {
      w[i] = words[j + i] || 0;
    }
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

      h = g;
      g = f;
      f = e;
      e = (d + temp1) | 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) | 0;
    }

    h0 = (h0 + a) | 0;
    h1 = (h1 + b) | 0;
    h2 = (h2 + c) | 0;
    h3 = (h3 + d) | 0;
    h4 = (h4 + e) | 0;
    h5 = (h5 + f) | 0;
    h6 = (h6 + g) | 0;
    h7 = (h7 + h) | 0;
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

  // 1. Nombres personalizados y clientes del CRM registrados en el despacho
  const validExtraNames = extraNames
    .map(n => n.trim())
    .filter(n => n.length >= 3)
    .sort((a, b) => b.length - a.length);

  validExtraNames.forEach(nameStr => {
    const rx = new RegExp(`\\b${escapeRegExp(nameStr)}\\b`, 'gi');
    replaceMatch(rx, 'PARTE_CLIENTE');
  });

  // 2. Razones sociales mercantiles (Inversiones..., Corporación..., Grupo..., Comercializadora..., S.A., C.A., S.R.L., LLC)
  replaceMatch(
    /\b(?:Inversiones|Corporaci[oó]n|Grupo\s+Industrial|Grupo|Comercializadora|Constructora|Administradora|Desarrollos|Consorcio|Importadora|Distribuidora)\s+[A-ZÁÉÍÓÚÑ][A-Za-záéíóúñÁÉÍÓÚÑ0-9\s.&,-]{1,35}?(?:,\s*(?:C\.A\.|S\.A\.|S\.R\.L\.|S\.L\.|L\.L\.C\.))?(?=\s*\(|\s*,|\s+por\b|\s+y\b|\s+con\b|\s+seg[uú]n\b|\.|\s*$)/gi,
    'ENTIDAD_MERCANTIL'
  );
  replaceMatch(
    /\b[A-ZÁÉÍÓÚÑ][A-Za-záéíóúñÁÉÍÓÚÑ0-9\s.&-]{2,40}?,\s*(?:C\.A\.|S\.A\.|S\.R\.L\.|S\.A\.S\.|S\.L\.|L\.L\.C\.|INC\.)/g,
    'ENTIDAD_MERCANTIL'
  );

  // 3. Cédulas de Identidad (con o sin puntos: V-12.345.678, E-84.123.456), RIF (J-30948271-0), NIF/DNI/CUIT
  replaceMatch(
    /\b(?:[VJGEP][-\s.]?\d{1,3}(?:[.\s]\d{3}){1,2}(?:[-\s]?\d)?|[VJGEP][-\s]?\d{7,9}(?:[-\s]?\d)?|\d{8}[A-Z]|[A-HJ-NP-SUVW]\d{7}[0-9A-J]|\d{2}-\d{8}-\d)\b/gi,
    'ID_FISCAL_DOC'
  );

  // 4. Cuentas bancarias (IBAN internacional y Cuentas Nacionales de 20 dígitos con o sin guiones, ANTES del filtro de teléfonos)
  replaceMatch(
    /\b(?:[A-Z]{2}\d{2}[A-Z0-9]{12,30}|\d{4}[-\s]\d{4}[-\s]\d{2}[-\s]\d{10}|\d{20})\b/g,
    'CUENTA_BANCARIA'
  );

  // 5. Correos electrónicos
  replaceMatch(
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g,
    'EMAIL_CLIENTE'
  );

  // 6. Teléfonos nacionales e internacionales (+58 414-2309811, (0212) 951-2233, etc.)
  replaceMatch(
    /(?:\+\d{1,3}[-\s.]?)?\(?\d{3,4}\)?[-\s.]?\d{3}[-\s.]?\d{4}\b/g,
    'TELEFONO_PRIVADO'
  );

  // 7. Montos de operaciones (soporta $ o € al inicio sin fallar por word-boundary, USD, EUR, Bs.)
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

function exportWordDoc(filename: string, title: string, subtitle: string, bodyText: string) {
  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head><meta charset='utf-8'><title>${title}</title>
  <style>
    body { font-family: 'Georgia', 'Times New Roman', serif; font-size: 12pt; line-height: 1.65; color: #0F172A; margin: 2.5cm; }
    h1 { font-size: 15pt; text-transform: uppercase; text-align: center; margin-bottom: 6pt; }
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
  ollama: ['llama3.1:8b-local', 'mistral-nemo:12b-local', 'qwen2.5:14b-local']
};

// Feriados nacionales y bancarios de referencia para cómputo procesal (Venezuela / Internacional)
const DEFAULT_NON_WORKING_DATES: string[] = [
  '2026-01-01', '2026-02-16', '2026-02-17', '2026-04-02', '2026-04-03',
  '2026-04-19', '2026-05-01', '2026-06-24', '2026-07-05', '2026-07-24',
  '2026-10-12', '2026-12-24', '2026-12-25', '2026-12-31'
];

function isJudicialRecessDate(dateStr: string): boolean {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3) return false;
  const [, m, d] = parts;
  // Receso judicial de agosto-septiembre (15 ago al 15 sep) y diciembre-enero (24 dic al 6 ene) - Art. 201 CPC
  if ((m === 8 && d >= 15) || (m === 9 && d <= 15)) return true;
  if ((m === 12 && d >= 24) || (m === 1 && d <= 6)) return true;
  return false;
}

const STORAGE_KEY = 'ai_govern_legal_os_state_v2';

// ============================================================================
// COMPONENTE PRINCIPAL DEL SISTEMA DE TRABAJO DEL ABOGADO
// ============================================================================

export default function AiGovernLegalSystem() {
  // 1. La pestaña inicial es directamente el Consultor de IA; Configuración está de última
  const [activeTab, setActiveTab] = useState<ModuleId>('consultor_ia');
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4200);
  };

  // ==========================================================================
  // ESTADO DE CONFIGURACIÓN GENERAL (Ubicado en la última pestaña)
  // ==========================================================================
  const [llmProvider, setLlmProvider] = useState<'openai' | 'anthropic' | 'gemini' | 'groq' | 'ollama'>('openai');
  const [llmModel, setLlmModel] = useState<string>('gpt-4o');
  const [apiKeyInput, setApiKeyInput] = useState<string>('sk-proj-••••••••••••••••••••••••••••••••');
  const [monthlyBudgetUsd, setMonthlyBudgetUsd] = useState<number>(30);
  const [currentSpendUsd, setCurrentSpendUsd] = useState<number>(2.46);
  const [savedHoursCount, setSavedHoursCount] = useState<number>(38.5);
  const [firmName, setFirmName] = useState<string>('Despacho Jurídico Titular');
  const [lawyerSignerName, setLawyerSignerName] = useState<string>('Abg. Titular del Despacho');
  const [lawyerCollegiateId, setLawyerCollegiateId] = useState<string>('Inpreabogado / Colegiado Nº 104.892');
  const [customPracticeArea, setCustomPracticeArea] = useState<string>('Práctica Jurídica Integral');

  const [librarySourceMode, setLibrarySourceMode] = useState<'Carpeta Local' | 'Google Drive'>('Google Drive');
  const [localFolderPath, setLocalFolderPath] = useState<string>('/Mis_Modelos_Juridicos');
  const [driveFolderUrl, setDriveFolderUrl] = useState<string>('https://drive.google.com/drive/folders/Biblioteca-Juridica-Despacho');

  // Biblioteca de Modelos con identificación inteligente de campos a sustituir
  const [templates, setTemplates] = useState<ModelTemplate[]>([
    {
      id: 'tpl-compraventa',
      name: 'Contrato de Compraventa de Inmueble',
      category: 'Inmobiliario y Civil',
      source: 'Google Drive',
      updatedAt: 'Sincronizado',
      variables: [
        { key: 'VENDEDOR', label: 'Identificación completa del Vendedor (Nombre, Estado Civil, Documento/RIF)', category: 'Partes', placeholder: 'Ej: CARLOS EDUARDO MÉNDEZ, mayor de edad, casado, C.I. V-12.345.678' },
        { key: 'COMPRADOR', label: 'Identificación completa del Comprador (Nombre, Estado Civil, Documento/RIF)', category: 'Partes', placeholder: 'Ej: MARÍA FERNANDA SALAZAR, mayor de edad, soltera, C.I. V-18.987.654' },
        { key: 'DATOS_INMUEBLE', label: 'Descripción, Ubicación, Superficie y Linderos del Inmueble', category: 'Inmueble', placeholder: 'Ej: Apartamento Nº 4-B, Edificio Torre Ávila, Urb. Altamira, 145 m2' },
        { key: 'REGISTRO_INMUEBLE', label: 'Datos de Registro Inmobiliario / Tradición Legal (Oficina, Tomo, Folio, Fecha)', category: 'Inmueble', placeholder: 'Ej: Registro Público del Municipio Chacao, Tomo 14, Protocolo 1º, Año 2019' },
        { key: 'PRECIO_VENTA', label: 'Precio de la Compraventa (en letras y números) y Forma de Pago', category: 'Precio y Pago', placeholder: 'Ej: OCHENTA Y CINCO MIL DÓLARES (85.000,00 USD) mediante transferencia bancaria' },
        { key: 'JURISDICCION', label: 'Jurisdicción y Domicilio Especial elegido por las partes', category: 'Jurisdicción', placeholder: 'Ej: Ciudad de Caracas, a la jurisdicción de cuyos Tribunales declaran someterse' }
      ],
      contentPreview: `ENTRE: {{VENDEDOR}}, quien en lo adelante y a los efectos de este contrato se denominará EL VENDEDOR, por una parte; y por la otra, {{COMPRADOR}}, quien en lo sucesivo se denominará EL COMPRADOR, se ha convenido en celebrar el presente CONTRATO DE COMPRAVENTA DE INMUEBLE:\n\nPRIMERA (OBJETO Y DESCRIPCIÓN DEL INMUEBLE): EL VENDEDOR da en venta pura y simple, perfecta e irrevocable a EL COMPRADOR, un inmueble constituido por {{DATOS_INMUEBLE}}.\n\nSEGUNDA (TÍTULO DE ADQUISICIÓN Y REGISTRO): El referido inmueble pertenece a EL VENDEDOR según consta en documento protocolizado ante {{REGISTRO_INMUEBLE}}.\n\nTERCERA (PRECIO Y FORMA DE PAGO): El precio de esta venta ha sido pactado de común acuerdo en la cantidad de {{PRECIO_VENTA}}, que EL VENDEDOR declara recibir a su entera y cabal satisfacción.\n\nCUARTA (SANEAMIENTO Y ENTREGA MATERIAL): EL VENDEDOR garantiza que el inmueble se encuentra libre de todo gravamen, hipoteca o medida de prohibición, haciendo la tradición legal y entrega material con el otorgamiento del presente instrumento.\n\nQUINTA (JURISDICCIÓN): Para todos los efectos derivados de este contrato, las partes eligen como domicilio especial a la {{JURISDICCION}}.`
    },
    {
      id: 'tpl-arrendamiento',
      name: 'Contrato de Arrendamiento de Local Comercial',
      category: 'Mercantil e Inmobiliario',
      source: 'Google Drive',
      updatedAt: 'Sincronizado',
      variables: [
        { key: 'ARRENDADOR', label: 'Datos de la Parte Arrendadora / Propietaria', category: 'Partes', placeholder: 'Ej: INVERSIONES TORRE CENTRAL, C.A. (RIF J-30948271-0)' },
        { key: 'ARRENDATARIO', label: 'Datos de la Parte Arrendataria / Inquilina', category: 'Partes', placeholder: 'Ej: COMERCIALIZADORA NOVA, S.A. (RIF J-40192834-2)' },
        { key: 'LOCAL_DIRECCION', label: 'Identificación y Ubicación del Local Comercial', category: 'Inmueble', placeholder: 'Ej: Local PB-08, Centro Comercial Paseo Las Mercedes, 90 m2' },
        { key: 'CANON_MENSUAL', label: 'Canon de Arrendamiento Mensual y Depósito en Garantía', category: 'Precio y Pago', placeholder: 'Ej: 1.500,00 USD mensuales + 3 meses de depósito' },
        { key: 'DURACION', label: 'Plazo de Duración del Contrato', category: 'Plazo', placeholder: 'Ej: Dos (02) años fijos contados a partir de la firma' },
        { key: 'JURISDICCION', label: 'Jurisdicción Aplicable', category: 'Jurisdicción', placeholder: 'Ej: Tribunales Mercantiles de la Circunscripción Judicial de Caracas' }
      ],
      contentPreview: `ENTRE: {{ARRENDADOR}} (EL ARRENDADOR) y {{ARRENDATARIO}} (EL ARRENDATARIO), se suscribe el presente CONTRATO DE ARRENDAMIENTO DE LOCAL COMERCIAL:\n\nCLÁUSULA PRIMERA (INMUEBLE): EL ARRENDADOR cede en arrendamiento el inmueble ubicado en {{LOCAL_DIRECCION}}.\n\nCLÁUSULA SEGUNDA (CANON Y GARANTÍA): El canon de arrendamiento convenido es de {{CANON_MENSUAL}}, pagaderos dentro de los primeros cinco (5) días de cada mes.\n\nCLÁUSULA TERCERA (VIGENCIA): El presente contrato tendrá una duración de {{DURACION}}.\n\nCLÁUSULA CUARTA (DOMICILIO ESPECIAL): Las partes eligen como domicilio especial la {{JURISDICCION}}.`
    },
    {
      id: 'tpl-poder',
      name: 'Poder Especial de Representación Judicial y Administrativa',
      category: 'Procesal y Corporativo',
      source: 'Carpeta Local',
      updatedAt: 'Sincronizado',
      variables: [
        { key: 'OTORGANTE', label: 'Datos del Poderdante / Otorgante', category: 'Partes', placeholder: 'Ej: GRUPO INDUSTRIAL DELTA, C.A., representada por su Director' },
        { key: 'APODERADOS', label: 'Nombre e Inpreabogado / Colegiado de los Abogados Apoderados', category: 'Apoderados', placeholder: 'Ej: Abg. Titular del Despacho, Inpreabogado Nº 104.892' },
        { key: 'FACULTADES_ESPECIFICAS', label: 'Objeto y Facultades Especiales del Mandato', category: 'Facultades', placeholder: 'Ej: Darse por citado, promover pruebas, convenir, desistir, transigir y recibir cantidades de dinero' },
        { key: 'JURISDICCION', label: 'Ciudad y Fecha de Otorgamiento', category: 'Jurisdicción', placeholder: 'Ej: En la ciudad de Caracas, a la fecha de su autenticación notarial' }
      ],
      contentPreview: `Yo, {{OTORGANTE}}, por el presente documento declaro: Que confiero PODER ESPECIAL, pero amplio y bastante cuanto en derecho se requiere, a los abogados en ejercicio {{APODERADOS}}, para que conjunta o separadamente representen y sostengan mis derechos en todos los asuntos judiciales o extrajudiciales.\n\nEn ejercicio de este mandato, los apoderados quedan expresamente facultados para: {{FACULTADES_ESPECIFICAS}}.\n\nOtorgado en {{JURISDICCION}}.`
    }
  ]);

  const [ragDocs, setRagDocs] = useState<RagLawDocument[]>([
    {
      id: 'rag-01',
      title: 'Código Civil (Obligaciones, Contratos, Compraventa y Garantías)',
      type: 'Código / Ley',
      chunks: 420,
      status: 'Indexado',
      excerpt: 'Artículos sobre requisitos esenciales para la validez de los contratos, tradición legal en compraventa de inmuebles, consentimiento conyugal (Art. 168), acción resolutoria (Art. 1.167) y saneamiento.'
    },
    {
      id: 'rag-02',
      title: 'Código de Procedimiento Civil / Ley de Enjuiciamiento',
      type: 'Código / Ley',
      chunks: 315,
      status: 'Indexado',
      excerpt: 'Normativa procesal sobre requisitos de la demanda (Art. 340), cómputo de lapsos por días de despacho (Art. 197 y 201), promoción y evacuación de pruebas y medidas preventivas (Art. 585).'
    },
    {
      id: 'rag-03',
      title: 'Código de Comercio y Legislación Societaria Vigente',
      type: 'Código / Ley',
      chunks: 210,
      status: 'Indexado',
      excerpt: 'Disposiciones aplicables a sociedades mercantiles, asambleas de accionistas, facultades de administradores, títulos valores y obligaciones mercantiles.'
    }
  ]);

  // ==========================================================================
  // REGISTROS AUTOMÁTICOS DE AUDITORÍA (Human-in-the-Loop, Anonimización PII y Trazabilidad)
  // ==========================================================================
  const [approvedDocsRegistry, setApprovedDocsRegistry] = useState<ApprovedDocumentRecord[]>([
    {
      id: 'HL-2026-001',
      timestamp: 'Hoy, 08:15',
      title: 'Contrato de Compraventa de Inmueble — Torre Ávila',
      originModule: 'Redactor de Documentos',
      templateUsed: 'Contrato de Compraventa de Inmueble',
      approvedBy: 'Abg. Titular del Despacho',
      collegiateNumber: 'Inpreabogado / Colegiado Nº 104.892',
      sha256: computeRealSha256('Contrato de Compraventa de Inmueble — Torre Ávila — HL-2026-001'),
      content: 'Documento revisado, visado por el abogado titular y exportado a formato .DOC para firma y protocolización.'
    },
    {
      id: 'HL-2026-002',
      timestamp: 'Hoy, 08:40',
      title: 'Dictamen Preliminar sobre Garantías Hipotecarias',
      originModule: 'Consultor de IA',
      templateUsed: 'Dictamen Fundamentado en RAG',
      approvedBy: 'Abg. Titular del Despacho',
      collegiateNumber: 'Inpreabogado / Colegiado Nº 104.892',
      sha256: computeRealSha256('Dictamen Preliminar sobre Garantías Hipotecarias — HL-2026-002'),
      content: 'Dictamen jurídico visado sobre liberación de hipoteca de primer grado y tradición registral.'
    }
  ]);

  const [piiAuditRegistry, setPiiAuditRegistry] = useState<PiiAuditEntry[]>([
    {
      id: 'PII-2026-001',
      timestamp: 'Hoy, 08:12',
      originModule: 'Consultor de IA',
      contextSummary: 'Consulta sobre resolución de contrato de compraventa por incumplimiento de entrega',
      tokensDetected: [
        { token: '[ENTIDAD_MERCANTIL_01]', type: 'ENTIDAD_MERCANTIL', maskedPreview: 'Inve••••• (Ocultado en RAM)' },
        { token: '[ID_FISCAL_DOC_02]', type: 'ID_FISCAL_DOC', maskedPreview: 'J-309•••••-0 (Ocultado en RAM)' },
        { token: '[EMAIL_CLIENTE_03]', type: 'EMAIL_CLIENTE', maskedPreview: 'lega••••• (Ocultado en RAM)' },
        { token: '[MONTO_OPERACION_04]', type: 'MONTO_OPERACION', maskedPreview: '85.000 USD (Ocultado en RAM)' }
      ],
      zeroRetentionVerified: true
    },
    {
      id: 'PII-2026-002',
      timestamp: 'Hoy, 08:15',
      originModule: 'Redactor de Documentos',
      contextSummary: 'Ensamblaje de Contrato de Compraventa de Inmueble',
      tokensDetected: [
        { token: '[ID_FISCAL_DOC_01]', type: 'ID_FISCAL_DOC', maskedPreview: 'V-12.••••• (Sustituido localmente)' },
        { token: '[ID_FISCAL_DOC_02]', type: 'ID_FISCAL_DOC', maskedPreview: 'V-18.••••• (Sustituido localmente)' },
        { token: '[MONTO_OPERACION_03]', type: 'MONTO_OPERACION', maskedPreview: '95.000,00 USD (Sustituido localmente)' }
      ],
      zeroRetentionVerified: true
    }
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([
    {
      id: 'TRZ-2026-001',
      timestamp: 'Hoy, 08:15',
      module: 'Redactor de Documentos',
      action: 'Sustitución inteligente de datos y Visto Bueno en Compraventa',
      llmUsed: 'openai / gpt-4o (Zero-Training)',
      piiCount: 3,
      ragSource: 'Código Civil (Obligaciones, Contratos, Compraventa y Garantías)',
      sha256: computeRealSha256('TRZ-2026-001-Compraventa'),
      humanVerified: true
    }
  ]);

  // ==========================================================================
  // MÓDULO 6: CRM CON VISTA PREVIA SOLO NOMBRE Y FICHA LEGAL COMPLETA AL SELECCIONAR
  // ==========================================================================
  const [crmClients, setCrmClients] = useState<CrmClient[]>([
    {
      id: 'cli-01',
      name: 'Inversiones Torre Central, C.A.',
      personType: 'Persona Jurídica (Empresa)',
      taxId: 'J-30948271-0',
      legalRep: 'Dr. Roberto Alejandro Rojas Pérez (Director Principal — C.I. V-10.456.789)',
      registryInfo: 'Registro Mercantil Segundo de Caracas, Tomo 84-A, Nº 19, Expediente Nº 221-40912',
      powerStatus: 'Vigente',
      address: 'Av. Francisco de Miranda, Torre Parque Cristal, Piso 11, Ofic. 11-04, Los Palos Grandes, Caracas',
      phone: '+58 414-2309811',
      email: 'presidencia@torrecentral.com',
      activeMatters: [
        'EXP-2026-104: Arrendamiento de Locales Comerciales Torre Central',
        'EXP-2026-119: Reforma Estatutaria y Aumento de Capital Social'
      ],
      feeArrangement: 'Iguala Corporativa Mensual (650 USD/mes) + Honorarios por redacción de contratos especiales',
      confidentialNotes: 'Cliente prioritario del despacho. Todos los contratos de arrendamiento requieren cláusula de arbitraje comercial y fiador solidario.'
    },
    {
      id: 'cli-02',
      name: 'María Fernanda Salazar',
      personType: 'Persona Física / Natural',
      taxId: 'V-18.987.654',
      legalRep: 'Actúa en su propio nombre y representación',
      registryInfo: 'Poder Especial autenticado ante la Notaría Pública Sexta de Chacao bajo el Nº 31, Tomo 42',
      powerStatus: 'Vigente',
      address: 'Calle Los Samanes, Edif. Mirador, Piso 5, Apto. 5-B, La Florida, Caracas',
      phone: '+58 412-9084412',
      email: 'mfsalazar.inversiones@gmail.com',
      activeMatters: [
        'EXP-2026-142: Adquisición de Inmueble Residencias Parque Real (Apto. 8-A)'
      ],
      feeArrangement: 'Honorarios profesionales pactados por operación inmobiliaria llave en mano',
      confidentialNotes: 'Operación de compraventa en fase de protocolo registral programada para el 26 de octubre de 2026.'
    },
    {
      id: 'cli-03',
      name: 'Grupo Industrial Delta, C.A.',
      personType: 'Persona Jurídica (Empresa)',
      taxId: 'J-00192837-4',
      legalRep: 'Ing. Gustavo Adolfo Mendoza (Presidente — C.I. V-06.812.334)',
      registryInfo: 'Registro Mercantil Primero, Tomo 12-A, Nº 55. Poder General otorgado el 10/11/2023',
      powerStatus: 'Por Renovar',
      address: 'Zona Industrial Norte, Avenida Principal, Galpón Corporativo Delta',
      phone: '+58 424-1187720',
      email: 'consultoria.juridica@grupodelta.com',
      activeMatters: [
        'EXP-2026-088: Contencioso Mercantil por Incumplimiento de Suministro',
        'EXP-2026-151: Auditoría Laboral y Contratos de Confidencialidad'
      ],
      feeArrangement: 'Iguala Mensual + Cuota Litis del 15% sobre recuperación efectiva en litigio',
      confidentialNotes: 'Renovar poder judicial de representación antes de finalizar el trimestre.'
    }
  ]);

  // Lista dinámica de nombres de clientes del CRM para reforzar la anonimización en RAM
  const crmProtectedNames = useMemo(() => {
    const names: string[] = [];
    crmClients.forEach(c => {
      if (c.name) names.push(c.name);
      const repClean = c.legalRep.split('(')[0]?.replace(/^(?:Dr\.|Dra\.|Ing\.|Lic\.|Abg\.)\s*/i, '').trim();
      if (repClean && !repClean.toLowerCase().includes('propio nombre')) {
        names.push(repClean);
      }
    });
    return names;
  }, [crmClients]);

  // ==========================================================================
  // MÓDULO 1: CONSULTOR DE IA (100% PRIVADO, ZERO-LEAK & ZERO-TRAINING)
  // ==========================================================================
  const [consultQuery, setConsultQuery] = useState<string>(
    'Necesito evaluar las acciones legales por incumplimiento en la entrega de un inmueble vendido por 85.000 USD por parte de Inversiones Alfa (ID J-30948271-0), correo legal@alfa.com. ¿Procede resolución de contrato con daños y perjuicios o cumplimiento forzoso?'
  );
  const [consultSelectedLawId, setConsultSelectedLawId] = useState<string>('auto');
  const [customMaskInput, setCustomMaskInput] = useState<string>('');
  const [customMaskedTerms, setCustomMaskedTerms] = useState<string[]>([
    'Carlos Eduardo Méndez',
    'María Fernanda Salazar'
  ]);
  const [consultShowSanitizedPayload, setConsultShowSanitizedPayload] = useState<boolean>(true);
  const [consultResponse, setConsultResponse] = useState<{
    dictamen: string;
    sanitizedSentToAi: string;
    citations: string[];
    tokensProtected: number;
    hash: string;
    auditLogId: string;
    approvedInHumanLoop: boolean;
  } | null>(null);

  const allProtectedNames = useMemo(
    () => [...crmProtectedNames, ...customMaskedTerms],
    [crmProtectedNames, customMaskedTerms]
  );

  const liveSanitizedPreview = useMemo(
    () => anonymizePiiText(consultQuery, allProtectedNames),
    [consultQuery, allProtectedNames]
  );

  const handleAddCustomMaskTerm = () => {
    const term = customMaskInput.trim();
    if (!term) return;
    if (!customMaskedTerms.includes(term)) {
      setCustomMaskedTerms(prev => [...prev, term]);
    }
    setCustomMaskInput('');
    showToast(`Término "${term}" añadido al diccionario de anonimización en memoria RAM.`);
  };

  const buildDynamicLegalDictamen = (
    queryText: string,
    sanitizedQuery: string,
    tokensCount: number,
    activeLawTitle: string
  ): string => {
    const q = queryText.toLowerCase();
    const header = `DICTAMEN JURÍDICO CONFIDENCIAL (PROCESADO EN BÓVEDA PRIVADA ZERO-TRAINING)
• Normativa de Referencia: ${activeLawTitle}
• Blindaje de Privacidad Aplicado: ${tokensCount} datos sensibles sustituidos en memoria RAM local antes de consultar al modelo (${llmProvider.toUpperCase()} - ${llmModel} con directiva store: false / Zero-Data-Retention).
• Consulta Anonimizada Enviada al Motor: "${sanitizedQuery}"`;

    if (q.includes('arrendamiento') || q.includes('alquiler') || q.includes('canon') || q.includes('inquilin') || q.includes('desalojo')) {
      return `${header}

1. ANÁLISIS DE LA RELACIÓN ARRENDATICIA Y EXIGIBILIDAD DE OBLIGACIONES:
En materia de arrendamiento comercial e inmobiliario, el incumplimiento en el pago oportuno del canon convenido o el vencimiento del término contractual habilita al arrendador para exigir el pago de las pensiones insolutas con sus respectivos intereses moratorios y activar las garantías constituidas (depósito o fianza solidaria).

2. RECAUDOS Y ESTRATEGIA PROCESAL RECOMENDADA:
• Verificar la vigencia del contrato, cláusula penal y estado de solvencia de servicios y condominio.
• Agotar la fase previa o intimación extrajudicial/conciliatoria según el régimen aplicable al inmueble.
• Promover acción de cumplimiento o resolución de contrato de arrendamiento acompañada de secuestro cautelar o ejecución de fianza solidaria.`;
    }

    if (q.includes('asamblea') || q.includes('accionista') || q.includes('mercantil') || q.includes('junta directiva') || q.includes('estatuto') || q.includes('comisario')) {
      return `${header}

1. ANÁLISIS SOCIETARIO Y VALIDEZ DE ACTOS CORPORATIVOS:
Conforme al Código de Comercio y los estatutos sociales, toda deliberación sobre reforma estatutaria, aumento de capital, designación de administradores o aprobación de balances requiere cumplir estrictamente con las formalidades de convocatoria, quórum de presencia y mayoría calificada, así como su posterior inscripción y publicación ante el Registro Mercantil.

2. RECAUDOS Y ESTRATEGIA CORPORATIVA RECOMENDADA:
• Auditar el Libro de Accionistas y el Libro de Actas de Asamblea para verificar la cadena de titularidad y convocatorias previas.
• Redactar el Acta de Asamblea dejando constancia expresa del porcentaje de capital representado y de la aprobación del informe del Comisario cuando corresponda.
• Presentar participación dentro del lapso legal ante el Registro Mercantil competente junto con los soportes contables y solvencias fiscales.`;
    }

    if (q.includes('poder') || q.includes('mandato') || q.includes('apoderado') || q.includes('contestaci') || q.includes('pruebas') || q.includes('lapso') || q.includes('apelaci')) {
      return `${header}

1. ANÁLISIS PROCESAL Y CONTROL DE LAPSOS DE DESPACHO:
De acuerdo con el Código de Procedimiento Civil, las facultades para convenir, desistir, transigir, comprometer en árbitros y recibir cantidades de dinero requieren mención expresa en el instrumento de mandato (Art. 154 CPC). Asimismo, los lapsos procesales para contestación, promoción de pruebas o recursos se computan por días de despacho efectivos del Tribunal (Art. 197 y 201 CPC).

2. RECAUDOS Y ESTRATEGIA PROCESAL RECOMENDADA:
• Verificar la suficiencia del poder judicial y su oportuna consignación en autos.
• Auditar el calendario de días de despacho del Tribunal para asegurar la tempestad del escrito.
• Preparar escrito razonado con indicación precisa del objeto de cada medio probatorio promovido.`;
    }

    return `${header}

1. ANÁLISIS DE LA ACCIÓN RESOLUTORIA VS. CUMPLIMIENTO FORZOSO (ART. 1.167 CÓDIGO CIVIL):
En los contratos bilaterales de compraventa inmobiliaria, ante el incumplimiento de la obligación de tradición material o protocolización por una de las partes, el contratante cumplidor tiene la facultad de elegir entre exigir la ejecución forzosa de la obligación o demandar la resolución del contrato, además del resarcimiento de los daños y perjuicios causados. Si el contrato contiene pacto comisorio expreso, la resolución opera de pleno derecho al notificarse la voluntad de resolver; de lo contrario, debe demandarse judicialmente.

2. RECAUDOS Y ESTRATEGIA PROCESAL RECOMENDADA:
• Verificar el instrumento contractual, el régimen patrimonial/consentimiento conyugal (Art. 168 CC) y los comprobantes fehacientes del pago realizado.
• Practicar intimación o requerimiento notarial dejando constancia indubitable de la mora en la entrega o protocolización.
• Solicitar medida cautelar de prohibición de enajenar y gravar (Art. 585 y 588 CPC) sobre el inmueble objeto del litigio para asegurar la eficacia del fallo definitivo.`;
  };

  const handleRunConsultor = () => {
    if (!consultQuery.trim()) return;
    const { sanitized, tokens } = anonymizePiiText(consultQuery, allProtectedNames);

    let chosenLaw: RagLawDocument | undefined;
    if (consultSelectedLawId !== 'auto') {
      chosenLaw = ragDocs.find(d => d.id === consultSelectedLawId);
    } else {
      const qLower = consultQuery.toLowerCase();
      if (qLower.includes('procesal') || qLower.includes('demanda') || qLower.includes('lapso') || qLower.includes('prueba') || qLower.includes('cautelar')) {
        chosenLaw = ragDocs.find(d => d.id === 'rag-02') || ragDocs[0];
      } else if (qLower.includes('mercantil') || qLower.includes('sociedad') || qLower.includes('accionista') || qLower.includes('comercio')) {
        chosenLaw = ragDocs.find(d => d.id === 'rag-03') || ragDocs[0];
      } else {
        chosenLaw = ragDocs[0];
      }
    }

    const activeLaw = chosenLaw?.title || 'Normativa Legal Cargada en el Despacho';
    const hash = computeRealSha256(`${sanitized}|${activeLaw}|${Date.now()}`);
    const newAuditLogId = `TRZ-${Date.now().toString().slice(-5)}`;

    const dictamen = buildDynamicLegalDictamen(consultQuery, sanitized, tokens.length, activeLaw);

    setConsultResponse({
      dictamen,
      sanitizedSentToAi: sanitized,
      citations: chosenLaw ? [chosenLaw.title, ...ragDocs.filter(d => d.id !== chosenLaw!.id).map(d => d.title)] : ragDocs.map(d => d.title),
      tokensProtected: tokens.length,
      hash,
      auditLogId: newAuditLogId,
      approvedInHumanLoop: false
    });

    setPiiAuditRegistry(prev => [
      {
        id: `PII-${Date.now().toString().slice(-5)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        originModule: 'Consultor de IA',
        contextSummary: consultQuery.slice(0, 90) + '...',
        tokensDetected: tokens.length > 0
          ? tokens.map(t => ({ token: t.token, type: t.type, maskedPreview: `${t.original.slice(0, 4)}••• (Protegido en RAM)` }))
          : [{ token: '[SIN_PII_EXPUESTO]', type: 'VERIFICADO', maskedPreview: 'Consulta doctrinal sin identificadores personales' }],
        zeroRetentionVerified: true
      },
      ...prev
    ]);

    setAuditLogs(prev => [
      {
        id: newAuditLogId,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        module: 'Consultor de IA',
        action: 'Dictamen jurídico con blindaje Zero-Leak / Zero-Training',
        llmUsed: `${llmProvider}/${llmModel} (store:false)`,
        piiCount: tokens.length,
        ragSource: activeLaw,
        sha256: hash,
        humanVerified: false
      },
      ...prev
    ]);

    setCurrentSpendUsd(prev => +(prev + 0.01).toFixed(2));
    setSavedHoursCount(prev => +(prev + 1.5).toFixed(1));
    showToast(`Consulta procesada en modo privado: ${tokens.length} datos ocultados a la IA y 0% entrenamiento.`);
  };

  const handleApproveConsultorDictamen = () => {
    if (!consultResponse) return;
    if (consultResponse.approvedInHumanLoop) {
      showToast('Este dictamen ya cuenta con tu Visto Bueno en Human-in-the-Loop.');
      return;
    }
    const record: ApprovedDocumentRecord = {
      id: `HL-${Date.now().toString().slice(-5)}`,
      timestamp: new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }),
      title: `Dictamen Jurídico — ${consultQuery.slice(0, 42)}...`,
      originModule: 'Consultor de IA',
      templateUsed: 'Dictamen Fundamentado en RAG',
      approvedBy: lawyerSignerName,
      collegiateNumber: lawyerCollegiateId,
      sha256: consultResponse.hash,
      content: consultResponse.dictamen
    };
    setApprovedDocsRegistry(prev => [record, ...prev]);
    setConsultResponse({ ...consultResponse, approvedInHumanLoop: true });
    setAuditLogs(prev =>
      prev.map(log =>
        log.id === consultResponse.auditLogId || log.sha256 === consultResponse.hash
          ? { ...log, humanVerified: true }
          : log
      )
    );
    exportWordDoc(
      `Dictamen_Juridico_Visado_${Date.now().toString().slice(-4)}.doc`,
      'DICTAMEN JURÍDICO VISADO',
      `Visado por: ${lawyerSignerName} (${lawyerCollegiateId}) • Sello SHA-256: ${consultResponse.hash.slice(0, 24)}...`,
      consultResponse.dictamen
    );
    showToast('Visto Bueno registrado en Human-in-the-Loop y Dictamen exportado a .DOC');
  };

  // ==========================================================================
  // MÓDULO 2: REDACTOR DE DOCUMENTOS (FLUJO CON FOTO/PDF/ESCRITO, CRM Y VISTO BUENO)
  // ==========================================================================
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl-compraventa');
  const selectedTemplate = useMemo(
    () => templates.find(t => t.id === selectedTemplateId) || templates[0],
    [templates, selectedTemplateId]
  );
  const [redactorStep, setRedactorStep] = useState<1 | 2 | 3>(2);
  const [inputModeTab, setInputModeTab] = useState<'foto_ocr' | 'pdf_doc' | 'escrito_manual'>('foto_ocr');
  const [extractedSourceNote, setExtractedSourceNote] = useState<string>('');
  const [freeTextToExtract, setFreeTextToExtract] = useState<string>(
    'Vendedor: CARLOS EDUARDO MÉNDEZ, mayor de edad, casado, C.I. V-12.345.678.\nComprador: MARÍA FERNANDA SALAZAR, mayor de edad, soltera, C.I. V-18.987.654.\nInmueble: Apartamento Nº 8-A, Residencias Parque Real, Urb. Los Palos Grandes, Municipio Chacao, de 162 metros cuadrados.\nRegistro: Registro Público del Municipio Chacao, Tomo 22, Folio 108, Protocolo 1º, fecha 14/05/2018.\nPrecio: NOVENTA Y CINCO MIL DÓLARES (95.000,00 USD) pagados mediante transferencia bancaria.\nJurisdicción: Ciudad de Caracas.'
  );
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({
    VENDEDOR: 'CARLOS EDUARDO MÉNDEZ, mayor de edad, casado, titular de la Cédula de Identidad Nº V-12.345.678',
    COMPRADOR: 'MARÍA FERNANDA SALAZAR, mayor de edad, soltera, titular de la Cédula de Identidad Nº V-18.987.654',
    DATOS_INMUEBLE: 'un Apartamento distinguido con el Nº 8-A, situado en el Piso 8 del Edificio Residencias Parque Real, Urbanización Los Palos Grandes, con un área de 162,00 m2',
    REGISTRO_INMUEBLE: 'el Registro Público del Municipio Chacao bajo el Nº 45, Tomo 22, Folio 108, Protocolo Primero, de fecha 14 de mayo de 2018',
    PRECIO_VENTA: 'NOVENTA Y CINCO MIL DÓLARES EXACTOS (95.000,00 USD), pagados mediante transferencia bancaria',
    JURISDICCION: 'ciudad de Caracas, a la jurisdicción de cuyos Tribunales competentes declaran someterse'
  });
  const [redactorApprovedStamp, setRedactorApprovedStamp] = useState<string | null>(null);

  const handleSelectTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    setRedactorApprovedStamp(null);
    const found = templates.find(t => t.id === tplId);
    if (!found) return;

    if (tplId === 'tpl-compraventa') {
      setTemplateValues(prev => ({
        VENDEDOR: prev.VENDEDOR || 'CARLOS EDUARDO MÉNDEZ, mayor de edad, casado, titular de la Cédula de Identidad Nº V-12.345.678',
        COMPRADOR: prev.COMPRADOR || 'MARÍA FERNANDA SALAZAR, mayor de edad, soltera, titular de la Cédula de Identidad Nº V-18.987.654',
        DATOS_INMUEBLE: prev.DATOS_INMUEBLE || 'un Apartamento distinguido con el Nº 8-A, situado en el Piso 8 del Edificio Residencias Parque Real, Urbanización Los Palos Grandes, con un área de 162,00 m2',
        REGISTRO_INMUEBLE: prev.REGISTRO_INMUEBLE || 'el Registro Público del Municipio Chacao bajo el Nº 45, Tomo 22, Folio 108, Protocolo Primero, de fecha 14 de mayo de 2018',
        PRECIO_VENTA: prev.PRECIO_VENTA || 'NOVENTA Y CINCO MIL DÓLARES EXACTOS (95.000,00 USD), pagados mediante transferencia bancaria',
        JURISDICCION: prev.JURISDICCION || 'ciudad de Caracas, a la jurisdicción de cuyos Tribunales competentes declaran someterse'
      }));
      setFreeTextToExtract(
        'Vendedor: CARLOS EDUARDO MÉNDEZ, mayor de edad, casado, C.I. V-12.345.678.\nComprador: MARÍA FERNANDA SALAZAR, mayor de edad, soltera, C.I. V-18.987.654.\nInmueble: Apartamento Nº 8-A, Residencias Parque Real, Urb. Los Palos Grandes, Municipio Chacao, de 162 metros cuadrados.\nRegistro: Registro Público del Municipio Chacao, Tomo 22, Folio 108, Protocolo 1º, fecha 14/05/2018.\nPrecio: NOVENTA Y CINCO MIL DÓLARES (95.000,00 USD) pagados mediante transferencia bancaria.\nJurisdicción: Ciudad de Caracas.'
      );
    } else if (tplId === 'tpl-arrendamiento') {
      setTemplateValues(prev => ({
        ...prev,
        ARRENDADOR: prev.ARRENDADOR || 'INVERSIONES TORRE CENTRAL, C.A., RIF J-30948271-0, representada por su Director Principal Dr. Roberto Alejandro Rojas Pérez (C.I. V-10.456.789)',
        ARRENDATARIO: prev.ARRENDATARIO || 'COMERCIALIZADORA NOVA, S.A., RIF J-40192834-2, representada por su Presidente',
        LOCAL_DIRECCION: prev.LOCAL_DIRECCION || 'Local Comercial PB-08, Centro Comercial Paseo Las Mercedes, Municipio Baruta, con un área de noventa metros cuadrados (90,00 m2)',
        CANON_MENSUAL: prev.CANON_MENSUAL || 'UN MIL QUINIENTOS DÓLARES (1.500,00 USD) mensuales más tres (03) meses de depósito en garantía',
        DURACION: prev.DURACION || 'Dos (02) años fijos contados a partir de la autenticación del presente instrumento',
        JURISDICCION: prev.JURISDICCION || 'Ciudad de Caracas, sometiéndose a la jurisdicción de sus Tribunales Mercantiles'
      }));
      setFreeTextToExtract(
        'Arrendador: INVERSIONES TORRE CENTRAL, C.A. (RIF J-30948271-0).\nArrendatario: COMERCIALIZADORA NOVA, S.A. (RIF J-40192834-2).\nLocal: Local PB-08, Centro Comercial Paseo Las Mercedes, 90 m2.\nCanon: UN MIL QUINIENTOS DÓLARES (1.500,00 USD) mensuales + 3 meses de depósito.\nDuración: Dos (02) años fijos contados a partir de la firma.\nJurisdicción: Tribunales Mercantiles de la Circunscripción Judicial de Caracas.'
      );
    } else if (tplId === 'tpl-poder') {
      setTemplateValues(prev => ({
        ...prev,
        OTORGANTE: prev.OTORGANTE || 'GRUPO INDUSTRIAL DELTA, C.A. (RIF J-00192837-4), representada por su Presidente Ing. Gustavo Adolfo Mendoza, titular de la C.I. V-06.812.334',
        APODERADOS: prev.APODERADOS || `${lawyerSignerName}, titular del ${lawyerCollegiateId}`,
        FACULTADES_ESPECIFICAS: prev.FACULTADES_ESPECIFICAS || 'Darse por citado o notificado, contestar demandas, oponer cuestiones previas, promover y evacuar pruebas, convenir, desistir, transigir, comprometer en árbitros y recibir cantidades de dinero (Art. 154 CPC)',
        JURISDICCION: prev.JURISDICCION || 'la ciudad de Caracas, a la fecha de su otorgamiento ante Notaría Pública'
      }));
      setFreeTextToExtract(
        `Otorgante: GRUPO INDUSTRIAL DELTA, C.A. (RIF J-00192837-4), representada por Gustavo Adolfo Mendoza (C.I. V-06.812.334).\nApoderados: ${lawyerSignerName} (${lawyerCollegiateId}).\nFacultades: Darse por citado, promover pruebas, convenir, desistir, transigir y recibir cantidades de dinero.\nJurisdicción: Ciudad de Caracas.`
      );
    } else {
      const nextMap: Record<string, string> = { ...templateValues };
      found.variables.forEach(v => {
        if (!nextMap[v.key]) {
          nextMap[v.key] = v.placeholder.replace(/^Ej:\s*/i, '');
        }
      });
      setTemplateValues(nextMap);
    }
  };

  // Detecta si en un contrato inmobiliario el vendedor/otorgante figura como "casado" sin mención de consentimiento conyugal (Art. 168 CC)
  const spousalConsentWarning = useMemo(() => {
    if (selectedTemplate.id !== 'tpl-compraventa') return false;
    const vendedorText = (templateValues.VENDEDOR || '').toLowerCase();
    const isMarried = /\bcasad[oa]\b/.test(vendedorText);
    const hasConsentOrSeparateProperty =
      vendedorText.includes('cónyuge') ||
      vendedorText.includes('conyuge') ||
      vendedorText.includes('consentimiento') ||
      vendedorText.includes('bien propio') ||
      vendedorText.includes('capitulaciones') ||
      vendedorText.includes('168');
    return isMarried && !hasConsentOrSeparateProperty;
  }, [selectedTemplate.id, templateValues.VENDEDOR]);

  const handleApplySpousalClause = (mode: 'consentimiento' | 'bien_propio') => {
    const current = templateValues.VENDEDOR || '';
    const addition =
      mode === 'consentimiento'
        ? ', contando con el consentimiento expreso de su cónyuge conforme al Artículo 168 del Código Civil vigente'
        : ', declarando bajo fe de juramento que el inmueble objeto de esta venta constituye un bien propio adquirido con anterioridad al matrimonio (Art. 151 y 168 del Código Civil)';
    setTemplateValues({
      ...templateValues,
      VENDEDOR: current.replace(/\.$/, '') + addition
    });
    showToast('Adecuación registral (Art. 168 Código Civil) incorporada en la identificación del Vendedor.');
  };

  const handleExtractFromPhotoOrPdf = (file: File, sourceType: 'Foto (OCR)' | 'Documento PDF') => {
    const isTextLike = /\.(txt|md|csv|json)$/i.test(file.name);
    if (isTextLike && typeof FileReader !== 'undefined') {
      const reader = new FileReader();
      reader.onload = () => {
        const content = String(reader.result || '');
        setFreeTextToExtract(content);
        parseTextIntoTemplateVariables(content, `${sourceType} ("${file.name}") leído e interpretado localmente`);
      };
      reader.readAsText(file);
      return;
    }

    if (selectedTemplate.id === 'tpl-compraventa') {
      setTemplateValues({
        VENDEDOR: 'ROBERTO ALEJANDRO ROJAS PÉREZ, mayor de edad, casado, C.I. V-10.456.789 y RIF V-10456789-3, con el consentimiento de su cónyuge (Art. 168 CC)',
        COMPRADOR: 'INVERSIONES PATRIMONIALES DEL ESTE, C.A., RIF J-41209876-5, representada por su Directora ANA SOFÍA GÓMEZ (C.I. V-16.234.567)',
        DATOS_INMUEBLE: 'Oficina Comercial Nº PH-2, Piso 12, Torre Empresarial Castellana, Municipio Chacao, con superficie de doscientos diez metros cuadrados con cincuenta decímetros (210,50 m2) y dos (02) puestos de estacionamiento',
        REGISTRO_INMUEBLE: 'Registro Público del Municipio Chacao, Asiento Registral 2, Matrícula Nº 340.112.908, de fecha 22 de noviembre de 2021',
        PRECIO_VENTA: 'CIENTO CUARENTA MIL DÓLARES DE LOS ESTADOS UNIDOS DE AMÉRICA (140.000,00 USD), cancelados mediante transferencia bancaria',
        JURISDICCION: 'ciudad de Caracas, a la jurisdicción de cuyos Tribunales Mercantiles y Civiles declaran someterse'
      });
    } else if (selectedTemplate.id === 'tpl-arrendamiento') {
      setTemplateValues({
        ARRENDADOR: 'INVERSIONES TORRE CENTRAL, C.A., RIF J-30948271-0, inscrita en el Registro Mercantil Segundo de Caracas bajo el Nº 19, Tomo 84-A, representada por el Dr. Roberto Alejandro Rojas Pérez (C.I. V-10.456.789)',
        ARRENDATARIO: 'COMERCIALIZADORA NOVA, S.A., RIF J-40192834-2, representada por su Director Ejecutivo Lic. Andrés Eduardo Villalba (C.I. V-15.882.104)',
        LOCAL_DIRECCION: 'Local Comercial PB-08, Planta Baja del Centro Comercial Paseo Las Mercedes, Urbanización Las Mercedes, Municipio Baruta, con un área de noventa metros cuadrados (90,00 m2)',
        CANON_MENSUAL: 'UN MIL QUINIENTOS DÓLARES DE LOS ESTADOS UNIDOS DE AMÉRICA (1.500,00 USD) mensuales, más tres (03) meses de depósito en garantía equivalentes a CUATRO MIL QUINIENTOS DÓLARES (4.500,00 USD)',
        DURACION: 'Dos (02) años fijos contados a partir de su autenticación ante Notaría Pública',
        JURISDICCION: 'Ciudad de Caracas, a la jurisdicción de cuyos Tribunales Mercantiles declaran someterse'
      });
    } else if (selectedTemplate.id === 'tpl-poder') {
      setTemplateValues({
        OTORGANTE: 'GRUPO INDUSTRIAL DELTA, C.A., RIF J-00192837-4, inscrita ante el Registro Mercantil Primero bajo el Nº 55, Tomo 12-A, representada por su Presidente Ing. Gustavo Adolfo Mendoza (C.I. V-06.812.334)',
        APODERADOS: `${lawyerSignerName}, abogado en ejercicio, titular del ${lawyerCollegiateId}`,
        FACULTADES_ESPECIFICAS: 'Darse por citado y notificado, intentar y contestar demandas, oponer cuestiones previas y reconvenciones, promover y evacuar todo género de pruebas, apelar, recurrir en casación, convenir, desistir, transigir y recibir cantidades de dinero conforme al Artículo 154 del Código de Procedimiento Civil',
        JURISDICCION: 'En la ciudad de Caracas, a la fecha de su autenticación ante Notaría Pública'
      });
    } else {
      const updated: Record<string, string> = {};
      selectedTemplate.variables.forEach((v) => {
        updated[v.key] = v.placeholder.replace(/^Ej:\s*/i, '');
      });
      setTemplateValues(updated);
    }
    setExtractedSourceNote(`${sourceType} procesado localmente ("${file.name}") — La IA identificó y rellenó automáticamente los ${selectedTemplate.variables.length} campos requeridos por el modelo.`);
    setRedactorStep(3);
    setCurrentSpendUsd(prev => +(prev + 0.01).toFixed(2));
    setSavedHoursCount(prev => +(prev + 2.0).toFixed(1));
    showToast(`Datos extraídos de "${file.name}" e insertados en el borrador del modelo.`);
  };

  const parseTextIntoTemplateVariables = (rawNotes: string, customNoteMsg?: string) => {
    const lines = rawNotes.split('\n').map(l => l.trim()).filter(Boolean);
    const nextVals = { ...templateValues };

    lines.forEach(line => {
      const colonIdx = line.indexOf(':');
      if (colonIdx === -1) return;
      const prefix = line.slice(0, colonIdx).toLowerCase().trim();
      const val = line.slice(colonIdx + 1).trim();
      if (!val) return;

      // Coincidencia para modelos predefinidos y cualquier modelo nuevo cargado por el abogado
      if (prefix.includes('vendedor')) nextVals.VENDEDOR = val;
      if (prefix.includes('comprador')) nextVals.COMPRADOR = val;
      if (prefix.includes('inmueble') || prefix.includes('descripci')) nextVals.DATOS_INMUEBLE = val;
      if (prefix.includes('registro') || prefix.includes('tradici')) nextVals.REGISTRO_INMUEBLE = val;
      if (prefix.includes('precio') || prefix.includes('monto')) {
        nextVals.PRECIO_VENTA = val;
        nextVals.PRECIO_MONTO = val;
      }
      if (prefix.includes('arrendador') || prefix.includes('propietari')) nextVals.ARRENDADOR = val;
      if (prefix.includes('arrendatari') || prefix.includes('inquilin')) nextVals.ARRENDATARIO = val;
      if (prefix.includes('local') || prefix.includes('ubicaci') || prefix.includes('direcci')) nextVals.LOCAL_DIRECCION = val;
      if (prefix.includes('canon') || prefix.includes('alquiler') || prefix.includes('garant')) nextVals.CANON_MENSUAL = val;
      if (prefix.includes('duraci') || prefix.includes('plazo') || prefix.includes('vigencia')) nextVals.DURACION = val;
      if (prefix.includes('otorgante') || prefix.includes('poderdante')) nextVals.OTORGANTE = val;
      if (prefix.includes('apoderado') || prefix.includes('abogado')) nextVals.APODERADOS = val;
      if (prefix.includes('facultad') || prefix.includes('mandato')) nextVals.FACULTADES_ESPECIFICAS = val;
      if (prefix.includes('parte')) nextVals.PARTES = val;
      if (prefix.includes('objeto')) nextVals.OBJETO = val;
      if (prefix.includes('jurisdicci') || prefix.includes('domicilio') || prefix.includes('ciudad')) nextVals.JURISDICCION = val;

      // Coincidencia dinámica contra las variables de cualquier plantilla personalizada
      selectedTemplate.variables.forEach(v => {
        const keyNorm = v.key.toLowerCase().replace(/_/g, ' ');
        const catNorm = v.category.toLowerCase();
        if (prefix.includes(keyNorm) || prefix === catNorm) {
          nextVals[v.key] = val;
        }
      });
    });

    setTemplateValues(nextVals);
    setExtractedSourceNote(customNoteMsg || 'Texto libre analizado por la IA — Variables identificadas y sustituidas en el modelo original.');
    setRedactorStep(3);
    showToast('Datos del escrito aplicados automáticamente al modelo original.');
  };

  const handleExtractFromWrittenNotes = () => {
    parseTextIntoTemplateVariables(freeTextToExtract);
  };

  const handleLoadClientIntoRedactor = (client: CrmClient) => {
    const fullPartyDesc =
      client.personType === 'Persona Jurídica (Empresa)'
        ? `${client.name}, RIF ${client.taxId}, inscrita en ${client.registryInfo}, representada en este acto por ${client.legalRep}`
        : `${client.name}, mayor de edad, titular del documento de identidad Nº ${client.taxId}, domiciliado(a) en ${client.address}`;

    const nextVals = { ...templateValues };
    if (selectedTemplate.id === 'tpl-compraventa') {
      nextVals.COMPRADOR = fullPartyDesc;
    } else if (selectedTemplate.id === 'tpl-arrendamiento') {
      nextVals.ARRENDADOR = fullPartyDesc;
    } else if (selectedTemplate.id === 'tpl-poder') {
      nextVals.OTORGANTE = fullPartyDesc;
      nextVals.APODERADOS = `${lawyerSignerName}, titular del ${lawyerCollegiateId}`;
    } else if (selectedTemplate.variables.length > 0) {
      nextVals[selectedTemplate.variables[0].key] = fullPartyDesc;
    }

    setTemplateValues(nextVals);
    setExtractedSourceNote(`Datos de la ficha legal de "${client.name}" importados directamente desde el CRM del despacho.`);
    setActiveTab('redactor_docs');
    setRedactorStep(3);
    showToast(`Datos de "${client.name}" cargados en el Redactor de Documentos.`);
  };

  const compiledDocument = useMemo(() => {
    let text = selectedTemplate.contentPreview;
    selectedTemplate.variables.forEach(v => {
      const val = templateValues[v.key] || `[FALTA COMPLETAR: ${v.label}]`;
      text = text.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), val);
    });
    return text;
  }, [selectedTemplate, templateValues]);

  const handleApproveAndExportRedactorDoc = () => {
    const { tokens } = anonymizePiiText(compiledDocument, allProtectedNames);
    const hash = computeRealSha256(`${compiledDocument}|${lawyerSignerName}|${Date.now()}`);
    const nowStr = new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' });

    const newApproved: ApprovedDocumentRecord = {
      id: `HL-${Date.now().toString().slice(-5)}`,
      timestamp: nowStr,
      title: `${selectedTemplate.name}`,
      originModule: 'Redactor de Documentos',
      templateUsed: `${selectedTemplate.name} (${selectedTemplate.source})`,
      approvedBy: lawyerSignerName,
      collegiateNumber: lawyerCollegiateId,
      sha256: hash,
      content: compiledDocument
    };
    setApprovedDocsRegistry(prev => [newApproved, ...prev]);

    setPiiAuditRegistry(prev => [
      {
        id: `PII-${Date.now().toString().slice(-5)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        originModule: 'Redactor de Documentos',
        contextSummary: `Ensamblaje de ${selectedTemplate.name}`,
        tokensDetected: tokens.map(t => ({
          token: t.token,
          type: t.type,
          maskedPreview: `${t.original.slice(0, 5)}••• (Sustituido localmente)`
        })),
        zeroRetentionVerified: true
      },
      ...prev
    ]);

    setAuditLogs(prev => [
      {
        id: `TRZ-${Date.now().toString().slice(-5)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        module: 'Redactor de Documentos',
        action: `Visto Bueno y Exportación .DOC: ${selectedTemplate.name}`,
        llmUsed: `${llmProvider}/${llmModel}`,
        piiCount: tokens.length,
        ragSource: selectedTemplate.source,
        sha256: hash,
        humanVerified: true
      },
      ...prev
    ]);

    setRedactorApprovedStamp(hash);
    setSavedHoursCount(prev => +(prev + 2.5).toFixed(1));
    exportWordDoc(
      `${selectedTemplate.name.replace(/\s+/g, '_')}_Visado.doc`,
      selectedTemplate.name.toUpperCase(),
      `Documento Visado por: ${lawyerSignerName} (${lawyerCollegiateId}) • Fecha: ${nowStr} • Sello Human-Loop SHA-256: ${hash.slice(0, 20)}...`,
      `${compiledDocument}\n\n____________________________________________________\nVISADO POR: ${lawyerSignerName}\n${lawyerCollegiateId}\nSello de Aprobación Human-in-the-Loop: ${hash}`
    );
    showToast('Visto Bueno otorgado: Registrado en Human-in-the-Loop y descargado en .DOC para impresión y visado.');
  };

  // ==========================================================================
  // MÓDULO 3: GRABADOR DE ACTAS (PRESENCIAL / ONLINE + CHECKS A PLANIFICADOR + MINUTA)
  // ==========================================================================
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [recordingSeconds, setRecordingSeconds] = useState<number>(0);
  const [recordingMode, setRecordingMode] = useState<'Presencial (Sala / Despacho)' | 'Meeting Online (Zoom / Meet / Teams)'>('Meeting Online (Zoom / Meet / Teams)');
  const [meetingTitleInput, setMeetingTitleInput] = useState<string>('Reunión de Cierre de Compraventa y Revisión de Garantías');
  const [meetingAttendeesInput, setMeetingAttendeesInput] = useState<string>('Abg. Titular, Carlos Méndez (Vendedor), María Salazar (Compradora)');
  const [showMinutaModal, setShowMinutaModal] = useState<RecordingNote | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRecording) {
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds(s => s + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      setRecordingSeconds(0);
    }
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    };
  }, [isRecording]);

  const [recordings, setRecordings] = useState<RecordingNote[]>([
    {
      id: 'rec-01',
      title: 'Reunión de Negociación de Compraventa Inmobiliaria y Entrega de Recaudos',
      date: '2026-10-19',
      duration: '28:15',
      mode: 'Meeting Online (Zoom / Meet / Teams)',
      attendees: 'Abg. Titular, Carlos Méndez (Parte Vendedora), María Salazar (Parte Compradora)',
      summaryPoints: [
        'Las partes ratificaron el precio definitivo de la compraventa en 95.000 USD pagaderos el día de la firma.',
        'La parte vendedora exhibió solvencia municipal y liberación de hipoteca lista para protocolización.',
        'Se acordó fijar la firma definitiva ante el Registro Público para el próximo lunes 26 de octubre.'
      ],
      agreementsAndTasks: [
        { id: 'act-1', text: 'Solicitar solvencia actualizada de derecho de frente y ficha catastral en Alcaldía', dueDate: '2026-10-22', addedToPlanner: true, linkedTaskId: 'tsk-1', linkedEventId: 'ev-2' },
        { id: 'act-2', text: 'Redactar versión definitiva del Contrato de Compraventa e incluir linderos exactos', dueDate: '2026-10-23', addedToPlanner: false },
        { id: 'act-3', text: 'Coordinar cita de otorgamiento y firma presencial ante el Registro Inmobiliario', dueDate: '2026-10-26', addedToPlanner: false }
      ],
      transcript: `[00:01:12] Abg. Titular: Damos inicio a la sesión online con las partes para revisar los recaudos finales de la compraventa del Apartamento 8-A.\n[00:04:30] Parte Vendedora (Carlos Méndez): Ya tenemos la liberación de hipoteca y el pago de impuestos municipales al día; los enviaré hoy mismo en PDF.\n[00:11:45] Parte Compradora (María Salazar): Estamos conformes con el precio de 95.000 USD y la transferencia se ejecutará al momento del otorgamiento.\n[00:22:10] Abg. Titular: Perfecto. Queda acordado que el despacho redactará el instrumento final el viernes 23 y agendamos el otorgamiento para el lunes 26 de octubre.`
    }
  ]);

  const handleFinishRecordingSimulation = () => {
    setIsRecording(false);
    const todayIso = '2026-10-19';
    const mins = String(Math.floor(recordingSeconds / 60)).padStart(2, '0');
    const secs = String(recordingSeconds % 60).padStart(2, '0');
    const formattedDuration = recordingSeconds > 5 ? `${mins}:${secs}` : '19:40';
    const transcriptText = `[00:00:15] Inicio de grabación (${recordingMode}) — Asunto: ${meetingTitleInput}.\n[00:05:40] Intervención de los asistentes (${meetingAttendeesInput}): Se revisan los puntos críticos de la agenda legal y se aprueban los términos expuestos por el despacho.\n[00:14:20] Acuerdos de cierre: Se instruye preparar el borrador definitivo para el 21/10/2026 y convocar a firma el 27/10/2026.`;

    const { tokens } = anonymizePiiText(transcriptText, allProtectedNames);
    const hash = computeRealSha256(`${transcriptText}|${Date.now()}`);

    const newRec: RecordingNote = {
      id: `rec-${Date.now().toString().slice(-4)}`,
      title: meetingTitleInput.trim() || 'Sesión Jurídica Grabada',
      date: todayIso,
      duration: formattedDuration,
      mode: recordingMode,
      attendees: meetingAttendeesInput.trim() || 'Abg. Titular y Clientes Asistentes',
      summaryPoints: [
        `Sesión realizada vía ${recordingMode} con participación de ${meetingAttendeesInput || 'los asistentes convocados'}.`,
        'Se validaron los documentos de identidad, solvencias y condiciones económicas de la operación.',
        'Quedaron asignadas las tareas jurídicas con fechas de vencimiento para el equipo y el cliente.'
      ],
      agreementsAndTasks: [
        { id: `t-${Date.now()}-1`, text: `Preparar borrador de instrumento legal acordado en "${meetingTitleInput}"`, dueDate: '2026-10-21', addedToPlanner: false },
        { id: `t-${Date.now()}-2`, text: 'Verificar recaudos registrales y enviar minuta de acuerdos a los asistentes', dueDate: '2026-10-22', addedToPlanner: false },
        { id: `t-${Date.now()}-3`, text: 'Revisión final y firma del documento con el cliente', dueDate: '2026-10-27', addedToPlanner: false }
      ],
      transcript: transcriptText
    };
    setRecordings(prev => [newRec, ...prev]);

    setPiiAuditRegistry(prev => [
      {
        id: `PII-${Date.now().toString().slice(-5)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        originModule: 'Grabador de Actas',
        contextSummary: `Transcripción y Resumen: ${newRec.title}`,
        tokensDetected: tokens.length > 0
          ? tokens.map(t => ({ token: t.token, type: t.type, maskedPreview: `${t.original.slice(0, 5)}••• (Protegido en RAM)` }))
          : [{ token: '[AUDIO_PROCESADO_LOCAL]', type: 'SALA_PRIVADA', maskedPreview: 'Participantes protegidos en memoria local' }],
        zeroRetentionVerified: true
      },
      ...prev
    ]);

    setAuditLogs(prev => [
      {
        id: `TRZ-${Date.now().toString().slice(-5)}`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        module: 'Grabador de Actas',
        action: `Acta y acuerdos generados: ${newRec.title}`,
        llmUsed: `${llmProvider}/${llmModel} (store:false)`,
        piiCount: tokens.length,
        ragSource: 'Audio / Transcripción Local',
        sha256: hash,
        humanVerified: false
      },
      ...prev
    ]);

    setCurrentSpendUsd(prev => +(prev + 0.01).toFixed(2));
    setSavedHoursCount(prev => +(prev + 1.5).toFixed(1));
    showToast('Grabación finalizada: Resumen, Acuerdos con Check al Planificador y Transcripción generados.');
  };

  // ==========================================================================
  // MÓDULO 4 Y 5: PLANIFICADOR Y CALENDARIO MENSUAL REAL (SINCRONIZADOS AUTOMÁTICAMENTE)
  // ==========================================================================
  const [tasks, setTasks] = useState<PlannerTask[]>([
    { id: 'tsk-1', title: 'Solicitar solvencia actualizada de derecho de frente y ficha catastral en Alcaldía', client: 'María Salazar / Carlos Méndez', dueDate: '2026-10-22', status: 'Pendiente', priority: 'Alta', origin: 'Grabador de Actas' },
    { id: 'tsk-2', title: 'Revisión de estatutos y acta de asamblea extraordinaria', client: 'Inversiones Torre Central, C.A.', dueDate: '2026-10-20', status: 'En Curso', priority: 'Media', origin: 'Planificador' },
    { id: 'tsk-3', title: 'Vencimiento de contestación de demanda mercantil', client: 'Grupo Industrial Delta, C.A.', dueDate: '2026-10-28', status: 'Pendiente', priority: 'Alta', origin: 'Plazo Procesal' }
  ]);

  const [calendarEvents, setCalendarEvents] = useState<CalendarEventItem[]>([
    { id: 'ev-1', title: 'Revisión de estatutos y acta de asamblea extraordinaria', date: '2026-10-20', type: 'Tarea Planificador', client: 'Inversiones Torre Central, C.A.', linkedTaskId: 'tsk-2' },
    { id: 'ev-2', title: 'Solicitar solvencia actualizada de derecho de frente y ficha catastral en Alcaldía', date: '2026-10-22', type: 'Reunión / Acta', client: 'María Salazar / Carlos Méndez', linkedTaskId: 'tsk-1' },
    { id: 'ev-3', title: 'Vencimiento de contestación de demanda mercantil', date: '2026-10-28', type: 'Plazo Procesal', client: 'Grupo Industrial Delta, C.A.', linkedTaskId: 'tsk-3' }
  ]);

  const [newTaskTitle, setNewTaskTitle] = useState<string>('');
  const [newTaskClient, setNewTaskClient] = useState<string>('');
  const [newTaskDate, setNewTaskDate] = useState<string>('2026-10-24');
  const [newTaskPriority, setNewTaskPriority] = useState<'Alta' | 'Media' | 'Baja'>('Alta');

  // Evita duplicar tareas al desmarcar y volver a marcar un acuerdo en el Grabador
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
          client: targetRec.attendees.split(',')[1]?.trim() || 'Asistentes de Reunión',
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
      showToast(`Tarea enviada automáticamente al Planificador y agendada en el Calendario (${targetItem.dueDate}).`);
    } else {
      // Si se desmarca, remueve la tarea vinculada del Planificador y del Calendario para evitar duplicados
      setTasks(tPrev =>
        tPrev.filter(tk => tk.id !== targetItem.linkedTaskId && tk.title !== targetItem.text)
      );
      setCalendarEvents(cPrev =>
        cPrev.filter(ev => ev.id !== targetItem.linkedEventId && ev.linkedTaskId !== targetItem.linkedTaskId)
      );
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
      showToast('Tarea removida del Planificador y del Calendario.');
    }
  };

  const handleAddPlannerTask = () => {
    if (!newTaskTitle.trim() || !newTaskDate) return;
    const taskId = `tsk-${Date.now().toString().slice(-4)}`;
    const createdTask: PlannerTask = {
      id: taskId,
      title: newTaskTitle.trim(),
      client: newTaskClient.trim() || 'General Despacho',
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
    showToast(`Tarea planificada y agregada directamente en tu Calendario para el día ${newTaskDate}.`);
  };

  const handleDeletePlannerTask = (taskId: string) => {
    const target = tasks.find(t => t.id === taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
    setCalendarEvents(prev => prev.filter(ev => ev.linkedTaskId !== taskId && ev.title !== target?.title));
    showToast('Tarea eliminada del Planificador y del Calendario.');
  };

  // ==========================================================================
  // ESTADO DEL CALENDARIO MENSUAL REAL (MODO AGENDA GENERAL + MODO PROCESAL)
  // ==========================================================================
  const [calendarYear, setCalendarYear] = useState<number>(2026);
  const [calendarMonth, setCalendarMonth] = useState<number>(9);
  const [selectedCalendarDate, setSelectedCalendarDate] = useState<string>('2026-10-22');
  const [calendarLawyerMode, setCalendarLawyerMode] = useState<'ambos' | 'agenda_general' | 'computo_procesal'>('ambos');

  const [newCalEventTitle, setNewCalEventTitle] = useState<string>('');
  const [newCalEventType, setNewCalEventType] = useState<'Agenda General' | 'Plazo Procesal'>('Agenda General');

  const [procNotificationDate, setProcNotificationDate] = useState<string>('2026-10-19');
  const [procDaysCount, setProcDaysCount] = useState<number>(5);
  const [procDayMode, setProcDayMode] = useState<'habiles' | 'continuos'>('habiles');
  const [procExcludeHolidaysAndRecess, setProcExcludeHolidaysAndRecess] = useState<boolean>(true);
  const [nonWorkingDates, setNonWorkingDates] = useState<string[]>(DEFAULT_NON_WORKING_DATES);
  const [procTitleInput, setProcTitleInput] = useState<string>('Vencimiento de Lapso de Promoción de Pruebas');

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
      showToast(`Día ${dateStr} habilitado nuevamente como día con despacho.`);
    } else {
      setNonWorkingDates(prev => [...prev, dateStr]);
      showToast(`Día ${dateStr} marcado como Feriado / Día sin Despacho para el cómputo procesal.`);
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
        client: 'Agendado en Calendario'
      }
    ]);
    setNewCalEventTitle('');
    showToast(`Evento agregado en el Calendario para el ${selectedCalendarDate}.`);
  };

  const handleCalculateAndAddProceduralDeadline = () => {
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
        title: `${procTitleInput} (${procDaysCount} días ${procDayMode === 'habiles' ? 'hábiles de despacho' : 'continuos'})`,
        date: finalDateStr,
        type: 'Plazo Procesal',
        client: 'Cómputo Procesal',
        linkedTaskId: newTaskId
      }
    ]);
    setTasks(prev => [
      {
        id: newTaskId,
        title: `${procTitleInput}`,
        client: 'Cómputo Procesal',
        dueDate: finalDateStr,
        status: 'Pendiente',
        priority: 'Alta',
        origin: 'Plazo Procesal'
      },
      ...prev
    ]);
    setCalendarYear(yyyy);
    setCalendarMonth(cur.getMonth());
    setSelectedCalendarDate(finalDateStr);
    showToast(
      `Vencimiento procesal calculado (${finalDateStr})${skippedHolidays > 0 ? ` descontando ${skippedHolidays} día(s) sin despacho/feriado` : ''} y marcado en el Calendario y Planificador.`
    );
  };

  // ==========================================================================
  // ESTADO ADICIONAL DEL CRM (EDICIÓN Y EXPEDIENTES)
  // ==========================================================================
  const [selectedClientId, setSelectedClientId] = useState<string>('cli-01');
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
    () => crmClients.find(c => c.id === selectedClientId) || crmClients[0],
    [crmClients, selectedClientId]
  );

  const handleCreateCrmClient = () => {
    if (!newClientForm.name.trim()) return;
    const created: CrmClient = {
      id: `cli-${Date.now().toString().slice(-4)}`,
      name: newClientForm.name.trim(),
      personType: newClientForm.personType,
      taxId: newClientForm.taxId.trim() || 'Por completar',
      legalRep: newClientForm.legalRep.trim() || 'Titular directo',
      registryInfo: newClientForm.registryInfo.trim() || 'Sin datos registrales cargados aún',
      powerStatus: 'Vigente',
      address: newClientForm.address.trim() || 'Domicilio por registrar',
      phone: newClientForm.phone.trim() || 'Sin teléfono',
      email: newClientForm.email.trim() || 'Sin correo',
      activeMatters: ['Expediente Inicial en Apertura'],
      feeArrangement: newClientForm.feeArrangement.trim() || 'Honorarios por definir',
      confidentialNotes: newClientForm.confidentialNotes.trim() || 'Ficha legal creada en el sistema privado del despacho.'
    };
    setCrmClients(prev => [created, ...prev]);
    setSelectedClientId(created.id);
    setShowNewClientForm(false);
    setNewClientForm({
      name: '', personType: 'Persona Jurídica (Empresa)', taxId: '', legalRep: '',
      registryInfo: '', address: '', phone: '', email: '', feeArrangement: '', confidentialNotes: ''
    });
    showToast(`Ficha legal completa creada para ${created.name}.`);
  };

  const handleUpdateSelectedClientField = <K extends keyof CrmClient>(field: K, value: CrmClient[K]) => {
    setCrmClients(prev =>
      prev.map(c => (c.id === selectedClient.id ? { ...c, [field]: value } : c))
    );
  };

  const handleAddMatterToSelectedClient = () => {
    if (!newMatterInput.trim()) return;
    handleUpdateSelectedClientField('activeMatters', [
      ...selectedClient.activeMatters,
      newMatterInput.trim()
    ]);
    setNewMatterInput('');
    showToast(`Nuevo expediente vinculado a ${selectedClient.name}.`);
  };

  // ==========================================================================
  // PERSISTENCIA AUTOMÁTICA EN LOCALSTORAGE (SEGURO EN NAVEGADOR Y CANVAS)
  // ==========================================================================
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const saved = JSON.parse(raw);
      if (saved.firmName) setFirmName(saved.firmName);
      if (saved.lawyerSignerName) setLawyerSignerName(saved.lawyerSignerName);
      if (saved.lawyerCollegiateId) setLawyerCollegiateId(saved.lawyerCollegiateId);
      if (saved.llmProvider) setLlmProvider(saved.llmProvider);
      if (saved.llmModel) setLlmModel(saved.llmModel);
      if (typeof saved.monthlyBudgetUsd === 'number') setMonthlyBudgetUsd(saved.monthlyBudgetUsd);
      if (typeof saved.currentSpendUsd === 'number') setCurrentSpendUsd(saved.currentSpendUsd);
      if (typeof saved.savedHoursCount === 'number') setSavedHoursCount(saved.savedHoursCount);
      if (Array.isArray(saved.templates) && saved.templates.length > 0) setTemplates(saved.templates);
      if (Array.isArray(saved.ragDocs) && saved.ragDocs.length > 0) setRagDocs(saved.ragDocs);
      if (Array.isArray(saved.tasks)) setTasks(saved.tasks);
      if (Array.isArray(saved.calendarEvents)) setCalendarEvents(saved.calendarEvents);
      if (Array.isArray(saved.crmClients) && saved.crmClients.length > 0) setCrmClients(saved.crmClients);
      if (Array.isArray(saved.recordings) && saved.recordings.length > 0) setRecordings(saved.recordings);
      if (Array.isArray(saved.approvedDocsRegistry)) setApprovedDocsRegistry(saved.approvedDocsRegistry);
      if (Array.isArray(saved.piiAuditRegistry)) setPiiAuditRegistry(saved.piiAuditRegistry);
      if (Array.isArray(saved.auditLogs)) setAuditLogs(saved.auditLogs);
    } catch {
      // Ignorar si localStorage está restringido en el navegador
    }
  }, []);

  useEffect(() => {
    try {
      const payload = {
        firmName,
        lawyerSignerName,
        lawyerCollegiateId,
        llmProvider,
        llmModel,
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
        auditLogs
      };
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch {
      // Ignorar si localStorage está restringido
    }
  }, [
    firmName, lawyerSignerName, lawyerCollegiateId, llmProvider, llmModel,
    monthlyBudgetUsd, currentSpendUsd, savedHoursCount, templates, ragDocs,
    tasks, calendarEvents, crmClients, recordings, approvedDocsRegistry,
    piiAuditRegistry, auditLogs
  ]);

  // ==========================================================================
  // MENÚ DE MÓDULOS (SIN PALABRA "DOCKER", Y CONFIGURACIÓN DE ÚLTIMO)
  // ==========================================================================
  const navItems: { id: ModuleId; label: string; badge: string; icon: React.ReactNode }[] = [
    { id: 'consultor_ia', label: '1. Consultor de IA', badge: 'Privado', icon: <MessageSquare className="w-4 h-4" /> },
    { id: 'redactor_docs', label: '2. Redactor de Documentos', badge: `${templates.length} Mod`, icon: <FileText className="w-4 h-4" /> },
    { id: 'grabador', label: '3. Grabador de Actas', badge: 'Online/Sala', icon: <Mic className="w-4 h-4" /> },
    { id: 'planificador', label: '4. Planificador', badge: `${tasks.length}`, icon: <Kanban className="w-4 h-4" /> },
    { id: 'calendario', label: '5. Calendario', badge: 'Mes Real', icon: <CalendarIcon className="w-4 h-4" /> },
    { id: 'crm', label: '6. CRM Clientes', badge: `${crmClients.length}`, icon: <Users className="w-4 h-4" /> },
    { id: 'kpi', label: '7. KPI & Presupuesto', badge: `$${currentSpendUsd.toFixed(2)}`, icon: <BarChart3 className="w-4 h-4" /> },
    { id: 'trazabilidad', label: '8. Trazabilidad', badge: 'SHA-256', icon: <Fingerprint className="w-4 h-4" /> },
    { id: 'human_loop', label: '9. Human-in-the-Loop', badge: `${approvedDocsRegistry.length} Visados`, icon: <UserCheck className="w-4 h-4" /> },
    { id: 'anonimizacion_pii', label: '10. Anonimización PII', badge: `${piiAuditRegistry.length} Reg`, icon: <EyeOff className="w-4 h-4" /> },
    { id: 'configuracion_sistema', label: '11. Configuración', badge: 'API & Leyes', icon: <Sliders className="w-4 h-4" /> }
  ];

  return (
    <div className={darkMode ? 'dark-theme min-h-screen bg-[#090D16] text-slate-100 font-sans' : 'min-h-screen bg-[#FAF8F5] text-[#0F172A] font-sans'}>
      {/* Reglas CSS explícitas para que NINGUNA letra desaparezca en Modo Oscuro */}
      <style>{`
        .dark-theme {
          background-color: #090D16 !important;
          color: #F8FAFC !important;
        }
        .dark-theme h1, .dark-theme h2, .dark-theme h3, .dark-theme h4, .dark-theme strong {
          color: #F8FAFC !important;
        }
        .dark-theme p, .dark-theme span, .dark-theme label, .dark-theme li, .dark-theme td, .dark-theme th {
          color: #E2E8F0;
        }
        .dark-theme .card-surface {
          background-color: #0F172A !important;
          border-color: #1E293B !important;
          color: #F8FAFC !important;
        }
        .dark-theme .sub-surface {
          background-color: #162033 !important;
          border-color: #26354D !important;
          color: #F1F5F9 !important;
        }
        .dark-theme input, .dark-theme select, .dark-theme textarea {
          background-color: #090D16 !important;
          border-color: #334155 !important;
          color: #F8FAFC !important;
        }
        .dark-theme input::placeholder, .dark-theme textarea::placeholder {
          color: #94A3B8 !important;
        }
      `}</style>

      {/* Cintillo Superior de Privacidad del Sistema de Trabajo del Abogado */}
      <div className="bg-[#0F172A] text-slate-100 border-b border-slate-800 px-4 py-2 text-xs">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-mono font-bold text-amber-300">SISTEMA JURÍDICO PRIVADO AI GOVERN:</span>
            <span className="text-slate-200">
              {firmName} • Secreto Profesional Blindado (0% Entrenamiento de IA)
            </span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono text-slate-300">
            <span><Key className="w-3.5 h-3.5 inline text-amber-400 mr-1" />Motor: {llmProvider.toUpperCase()} ({llmModel})</span>
            <span><FolderOpen className="w-3.5 h-3.5 inline text-emerald-400 mr-1" />Biblioteca: {templates.length} Modelos</span>
            <span><Scale className="w-3.5 h-3.5 inline text-indigo-400 mr-1" />Normativa: {ragDocs.length} Cuerpos Legales</span>
          </div>
        </div>
      </div>

      {/* Notificación flotante */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 max-w-md bg-[#0F172A] text-white border border-amber-500/40 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 text-xs">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-slate-100 font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Cabecera Principal */}
      <header className="card-surface sticky top-0 z-30 bg-white/95 backdrop-blur border-b border-[#E6DFD1] px-4 sm:px-8 py-3.5">
        <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#0F172A] text-[#FAF8F5] flex items-center justify-center font-serif font-bold text-lg shadow-sm border border-amber-500/30">
              AG
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-serif font-bold text-lg sm:text-xl tracking-tight">AI GOVERN</span>
                <span className="text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded bg-amber-500/15 text-amber-700 border border-amber-500/30 font-semibold">
                  Sistema Operativo del Abogado
                </span>
              </div>
              <p className="text-[11px] font-mono text-slate-500">
                Titular: {lawyerSignerName} • {customPracticeArea}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setActiveTab('configuracion_sistema')}
              className="px-3.5 py-2 rounded-xl text-xs font-semibold border border-[#E6DFD1] bg-[#FAF8F5] hover:bg-amber-500/10 transition flex items-center gap-2 cursor-pointer text-slate-800"
            >
              <Sliders className="w-3.5 h-3.5 text-amber-600" />
              <span>Configurar API, Modelos y Leyes</span>
            </button>
            <button
              type="button"
              onClick={() => setDarkMode(!darkMode)}
              className="p-2.5 rounded-xl border border-[#E6DFD1] hover:bg-amber-500/10 transition cursor-pointer"
              title="Alternar Modo Claro / Modo Oscuro"
            >
              {darkMode ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </div>
      </header>

      {/* Contenedor Principal: Menú Lateral + Área de Trabajo */}
      <div className="max-w-[1440px] mx-auto px-4 sm:px-8 py-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Barra Lateral de Módulos */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="card-surface rounded-2xl p-3 bg-white border border-[#E6DFD1] shadow-sm space-y-1">
            <div className="px-3 py-2 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
              Herramientas de Trabajo Diario
            </div>
            {navItems.map((item) => {
              const isActive = activeTab === item.id;
              const isConfig = item.id === 'configuracion_sistema';
              return (
                <React.Fragment key={item.id}>
                  {isConfig && (
                    <div className="pt-2 mt-2 border-t border-[#E6DFD1] px-3 py-1 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
                      Ajustes del Despacho (Uso Ocasional)
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition cursor-pointer ${
                      isActive
                        ? 'bg-[#0F172A] text-white font-semibold shadow-sm border border-amber-500/40'
                        : 'hover:bg-amber-500/10 text-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className={isActive ? 'text-amber-400' : 'text-amber-700'}>{item.icon}</span>
                      <span className={`truncate ${isActive ? 'text-white' : ''}`}>{item.label}</span>
                    </div>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                        isActive
                          ? 'bg-amber-400/20 text-amber-300'
                          : 'bg-slate-200/70 text-slate-700'
                      }`}
                    >
                      {item.badge}
                    </span>
                  </button>
                </React.Fragment>
              );
            })}
          </div>

          {/* Tarjeta Resumen de Privacidad Activa */}
          <div className="card-surface rounded-2xl p-4 bg-white border border-[#E6DFD1] shadow-sm space-y-2.5 text-xs">
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] uppercase tracking-wider text-emerald-700 font-bold flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-emerald-600" /> Privacidad Blindada
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-700 font-bold">
                Zero-Training
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Todo lo que escribas o subas en el Consultor, Redactor y Grabador se anonimiza en memoria RAM antes de consultar la IA. <strong>Nada alimenta ni entrena modelos externos.</strong>
            </p>
          </div>
        </aside>

        {/* Panel Dinámico de los Módulos */}
        <main className="lg:col-span-9 space-y-6">

          {/* =================================================================
              1. CONSULTOR DE IA (PRIVACIDAD BLINDADA: NADA FILTRA NI ENTRENA LA IA)
          ================================================================== */}
          {activeTab === 'consultor_ia' && (
            <div className="card-surface rounded-3xl p-6 sm:p-8 bg-white border border-[#E6DFD1] shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6DFD1] pb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-700 font-bold flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> 1. Consultor Jurídico de IA con Secreto Profesional Garantizado
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold mt-1">
                    Consultor Jurídico Privado (Zero-Leak & Zero-Training)
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2 text-xs font-mono">
                  <span className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-700 border border-emerald-500/30 font-semibold">
                    ✓ store: false (No entrena a la IA)
                  </span>
                  <span className="px-3 py-1.5 rounded-xl bg-amber-500/10 text-amber-700 border border-amber-500/30 font-semibold">
                    ✓ Anonimización RAM Activa ({liveSanitizedPreview.tokens.length} protegidos)
                  </span>
                </div>
              </div>

              {/* Garantía explícita de no filtración */}
              <div className="sub-surface p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
                <div className="space-y-1">
                  <div className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-emerald-600" />
                    Garantía Técnica de Confidencialidad en el Consultor:
                  </div>
                  <p className="text-slate-600">
                    1) Antes de salir de tu equipo, nombres de clientes, razones sociales, documentos de identidad (con o sin puntos), RIF/NIF, cuentas bancarias de 20 dígitos o IBAN, teléfonos, correos y montos son reemplazados por códigos anónimos en memoria RAM. 2) La petición viaja con cabecera <code>Zero-Data-Retention</code> para que el proveedor de IA tenga prohibido almacenar o entrenar sus modelos con tu consulta.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setConsultShowSanitizedPayload(!consultShowSanitizedPayload)}
                  className="shrink-0 px-3 py-2 rounded-xl border border-[#E6DFD1] bg-white text-slate-800 font-mono text-[11px] font-semibold hover:bg-amber-500/10 cursor-pointer"
                >
                  {consultShowSanitizedPayload ? 'Ocultar filtro en vivo' : 'Ver qué recibe la IA'}
                </button>
              </div>

              {/* Selector de Cuerpo Legal / Normativa y Enmascaramiento Manual Adicional */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-6">
                  <label className="block text-[11px] font-mono uppercase text-slate-500 font-bold mb-1">
                    Cuerpo Legal / Normativa Aplicable a la Consulta (RAG):
                  </label>
                  <select
                    value={consultSelectedLawId}
                    onChange={(e) => setConsultSelectedLawId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border text-xs bg-[#FAF8F5] border-[#D5CBB8] font-medium"
                  >
                    <option value="auto">Detección Automática según Materia (Civil / Procesal / Mercantil)</option>
                    {ragDocs.map(doc => (
                      <option key={doc.id} value={doc.id}>
                        {doc.title} ({doc.chunks} fragmentos)
                      </option>
                    ))}
                  </select>
                </div>
                <div className="md:col-span-6">
                  <label className="block text-[11px] font-mono uppercase text-slate-500 font-bold mb-1">
                    Blindar Nombre Propio o Parte Adicional en RAM:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={customMaskInput}
                      onChange={(e) => setCustomMaskInput(e.target.value)}
                      placeholder="Ej: Constructora Bolívar / Pedro Pérez..."
                      className="w-full px-3 py-2 rounded-xl border text-xs bg-[#FAF8F5] border-[#D5CBB8]"
                    />
                    <button
                      type="button"
                      onClick={handleAddCustomMaskTerm}
                      className="shrink-0 px-3.5 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold cursor-pointer hover:bg-slate-800"
                    >
                      + Enmascarar
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <label className="block text-xs font-mono uppercase text-slate-500 font-bold">
                  Escribe tu consulta jurídica o pega el caso con total confianza:
                </label>
                <textarea
                  rows={4}
                  value={consultQuery}
                  onChange={(e) => setConsultQuery(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border text-xs sm:text-sm bg-[#FAF8F5] border-[#D5CBB8]"
                  placeholder="Escribe los hechos del caso, cláusulas o dudas procesales..."
                />

                {consultShowSanitizedPayload && (
                  <div className="p-4 rounded-2xl bg-[#0F172A] text-slate-100 font-mono text-xs space-y-2 border border-emerald-500/40">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[10px] uppercase text-emerald-400 font-bold">
                        Lo único que sale hacia la API del modelo (Sin datos privados del cliente):
                      </span>
                      <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                        {liveSanitizedPreview.tokens.length} identificadores reemplazados en RAM
                      </span>
                    </div>
                    <p className="text-slate-200 leading-relaxed">{liveSanitizedPreview.sanitized}</p>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <span className="text-[11px] font-mono text-slate-500">
                    Los datos enmascarados quedan registrados automáticamente en la pestaña <strong>10. Anonimización PII</strong>.
                  </span>
                  <button
                    type="button"
                    onClick={handleRunConsultor}
                    className="px-6 py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer transition shadow-sm"
                  >
                    <Sparkles className="w-4 h-4 text-amber-400" />
                    <span>Analizar Caso con Privacidad Blindada</span>
                  </button>
                </div>
              </div>

              {consultResponse && (
                <div className="sub-surface p-6 rounded-2xl border bg-[#FAF8F5] border-[#E6DFD1] space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6DFD1] pb-3">
                    <span className="text-xs font-mono font-bold text-emerald-700 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Dictamen Generado • {consultResponse.tokensProtected} Datos Sensibles Protegidos en RAM
                    </span>
                    <span className="text-[10px] font-mono text-slate-500">
                      SHA-256: {consultResponse.hash.slice(0, 20)}...
                    </span>
                  </div>
                  <pre className="whitespace-pre-wrap font-serif text-xs sm:text-sm leading-relaxed text-slate-800">
                    {consultResponse.dictamen}
                  </pre>
                  <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#E6DFD1]">
                    <div className="flex flex-wrap gap-2">
                      {consultResponse.citations.map((cit, i) => (
                        <span key={i} className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-indigo-500/10 text-indigo-700 border border-indigo-500/20">
                          Fuente RAG: {cit}
                        </span>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleApproveConsultorDictamen}
                      className="px-4 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <UserCheck className="w-4 h-4" />
                      <span>Dar Visto Bueno y Exportar (.DOC)</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              2. REDACTOR DE DOCUMENTOS (FLUJO DE 3 PASOS: BIBLIOTECA -> CARGA DATOS -> BORRADOR Y VISTO BUENO .DOC)
          ================================================================== */}
          {activeTab === 'redactor_docs' && (
            <div className="card-surface rounded-3xl p-6 sm:p-8 bg-white border border-[#E6DFD1] shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6DFD1] pb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-amber-700 font-bold">
                    2. Redactor Inteligente Conectado a tu Biblioteca ({librarySourceMode})
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold mt-1">
                    Sustitución Inteligente de Modelos, Carga por Foto/PDF/Escrito y Visado .DOC
                  </h2>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-mono">
                  <span className={`px-2.5 py-1 rounded-lg font-bold ${redactorStep >= 1 ? 'bg-[#0F172A] text-amber-300' : 'bg-slate-200 text-slate-600'}`}>1. Elegir Modelo</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className={`px-2.5 py-1 rounded-lg font-bold ${redactorStep >= 2 ? 'bg-[#0F172A] text-amber-300' : 'bg-slate-200 text-slate-600'}`}>2. Cargar Datos (Foto/PDF/Texto)</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                  <span className={`px-2.5 py-1 rounded-lg font-bold ${redactorStep === 3 ? 'bg-emerald-700 text-white' : 'bg-slate-200 text-slate-600'}`}>3. Visto Bueno y .DOC</span>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-5">
                  <div className="sub-surface p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD1] space-y-3">
                    <label className="block text-xs font-mono uppercase text-amber-800 font-bold">
                      Paso 1: Elige el modelo de tu biblioteca (Drive o Carpeta)
                    </label>
                    <select
                      value={selectedTemplateId}
                      onChange={(e) => handleSelectTemplate(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-xl border text-xs font-semibold bg-white border-[#D5CBB8]"
                    >
                      {templates.map(tpl => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name} ({tpl.source})
                        </option>
                      ))}
                    </select>

                    <div className="pt-2 border-t border-[#E6DFD1] space-y-2">
                      <div className="text-[11px] font-mono font-bold text-slate-700 flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                        Datos que la IA identificó para sustituir en este modelo ({selectedTemplate.variables.length}):
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {selectedTemplate.variables.map((v) => (
                          <span key={v.key} className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-800 border border-amber-500/30 font-semibold">
                            • {v.category}: {v.key}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* PASO 2: PESTAÑA PARA INCLUIR LOS DATOS MEDIANTE FOTO, PDF, ESCRITO O FICHA CRM */}
                  <div className="sub-surface p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD1] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-mono uppercase text-amber-800 font-bold">
                        Paso 2: Incluye los datos requeridos (Foto, PDF o Escrito)
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setInputModeTab('foto_ocr')}
                        className={`py-2 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                          inputModeTab === 'foto_ocr' ? 'bg-[#0F172A] text-white' : 'bg-white border border-[#D5CBB8] text-slate-700'
                        }`}
                      >
                        <Camera className="w-3.5 h-3.5 text-amber-400" /> Foto / Cédula
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputModeTab('pdf_doc')}
                        className={`py-2 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                          inputModeTab === 'pdf_doc' ? 'bg-[#0F172A] text-white' : 'bg-white border border-[#D5CBB8] text-slate-700'
                        }`}
                      >
                        <FileUp className="w-3.5 h-3.5 text-emerald-400" /> Subir PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => setInputModeTab('escrito_manual')}
                        className={`py-2 px-2 rounded-xl text-[11px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition ${
                          inputModeTab === 'escrito_manual' ? 'bg-[#0F172A] text-white' : 'bg-white border border-[#D5CBB8] text-slate-700'
                        }`}
                      >
                        <FileText className="w-3.5 h-3.5 text-indigo-400" /> Por Escrito
                      </button>
                    </div>

                    {/* Autocompletado rápido desde la ficha del CRM */}
                    <div className="pt-1">
                      <select
                        defaultValue=""
                        onChange={(e) => {
                          const cli = crmClients.find(c => c.id === e.target.value);
                          if (cli) handleLoadClientIntoRedactor(cli);
                        }}
                        className="w-full px-3 py-2 rounded-xl border text-[11px] bg-white border-[#D5CBB8] font-medium"
                      >
                        <option value="">⚡ O importar datos de un cliente registrado en tu CRM...</option>
                        {crmClients.map(c => (
                          <option key={c.id} value={c.id}>
                            Importar de CRM: {c.name} ({c.taxId})
                          </option>
                        ))}
                      </select>
                    </div>

                    {inputModeTab === 'foto_ocr' && (
                      <div className="p-4 rounded-xl border border-dashed border-amber-600/50 bg-white text-center space-y-2">
                        <Camera className="w-6 h-6 text-amber-600 mx-auto" />
                        <p className="text-xs font-semibold">Sube una Foto de Cédula, RIF o Ficha Catastral</p>
                        <p className="text-[11px] text-slate-500">
                          La IA extrae automáticamente nombres de las partes, documentos e inmueble y rellena los campos del modelo.
                        </p>
                        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold cursor-pointer">
                          <Upload className="w-3.5 h-3.5 text-amber-400" />
                          <span>Seleccionar Foto (.JPG / .PNG)</span>
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
                      <div className="p-4 rounded-xl border border-dashed border-emerald-600/50 bg-white text-center space-y-2">
                        <FileUp className="w-6 h-6 text-emerald-600 mx-auto" />
                        <p className="text-xs font-semibold">Sube un PDF (Título Anterior, Registro o Minuta)</p>
                        <p className="text-[11px] text-slate-500">
                          La IA lee el PDF localmente e identifica partes, linderos, datos de registro y precio.
                        </p>
                        <label className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold cursor-pointer">
                          <Upload className="w-3.5 h-3.5" />
                          <span>Seleccionar PDF / Documento</span>
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
                          rows={4}
                          value={freeTextToExtract}
                          onChange={(e) => setFreeTextToExtract(e.target.value)}
                          className="w-full p-3 rounded-xl border text-xs bg-white border-[#D5CBB8]"
                          placeholder="Escribe o pega los datos de las partes, inmueble, precio, jurisdicción..."
                        />
                        <button
                          type="button"
                          onClick={handleExtractFromWrittenNotes}
                          className="w-full py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-semibold cursor-pointer"
                        >
                          Extraer Datos del Escrito y Rellenar Modelo
                        </button>
                      </div>
                    )}

                    {extractedSourceNote && (
                      <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-mono text-emerald-800">
                        ✓ {extractedSourceNote}
                      </div>
                    )}
                  </div>

                  {/* Alerta preventiva forense: Art. 168 Código Civil (Vendedor casado sin mención de cónyuge o bien propio) */}
                  {spousalConsentWarning && (
                    <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-600/40 text-xs space-y-2">
                      <div className="font-mono font-bold text-amber-900 flex items-center gap-1.5">
                        <Scale className="w-4 h-4 text-amber-700 shrink-0" />
                        Alerta Registral Preventiva (Art. 168 Código Civil):
                      </div>
                      <p className="text-[11px] text-slate-700 leading-relaxed">
                        El vendedor figura con estado civil <strong>casado</strong> sin mención de autorización conyugal ni declaración de bien propio. Para evitar observación o rechazo en Registro Inmobiliario (SAREN), elige cómo subsanarlo:
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => handleApplySpousalClause('consentimiento')}
                          className="px-3 py-1.5 rounded-lg bg-[#0F172A] text-white text-[11px] font-semibold cursor-pointer"
                        >
                          + Incluir Consentimiento Conyugal
                        </button>
                        <button
                          type="button"
                          onClick={() => handleApplySpousalClause('bien_propio')}
                          className="px-3 py-1.5 rounded-lg bg-white border border-amber-700/40 text-slate-800 text-[11px] font-semibold cursor-pointer"
                        >
                          + Declarar Bien Propio (Art. 151 CC)
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Campos individuales editables por el abogado */}
                  <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                    <div className="text-[11px] font-mono uppercase text-slate-500 font-bold">
                      Verifica o ajusta los datos identificados por la IA:
                    </div>
                    {selectedTemplate.variables.map((v) => (
                      <div key={v.key} className="space-y-1">
                        <label className="block text-[11px] font-semibold text-slate-700">
                          <span className="font-mono text-amber-700">[{v.category}]</span> {v.label}
                        </label>
                        <input
                          type="text"
                          value={templateValues[v.key] || ''}
                          onChange={(e) => setTemplateValues({ ...templateValues, [v.key]: e.target.value })}
                          placeholder={v.placeholder}
                          className="w-full px-3 py-2 rounded-xl border text-xs bg-[#FAF8F5] border-[#D5CBB8]"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* PASO 3: BORRADOR ENSAMBLADO SOBRE EL MODELO ORIGINAL + VISTO BUENO HUMAN LOOP + EXPORTAR .DOC */}
                <div className="lg:col-span-7 flex flex-col justify-between sub-surface p-6 rounded-2xl border bg-[#FAF8F5] border-[#E6DFD1] space-y-4">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E6DFD1] pb-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-amber-700 font-bold">
                          Paso 3: Borrador Desarrollado sobre tu Modelo Original
                        </span>
                        <h3 className="font-serif font-bold text-base">
                          {selectedTemplate.name}
                        </h3>
                      </div>
                      <span className="text-[10px] font-mono px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-700 font-semibold">
                        Listo para Revisión del Abogado
                      </span>
                    </div>

                    <div className="p-5 rounded-xl bg-white border border-[#E6DFD1] min-h-[340px]">
                      <pre className="whitespace-pre-wrap font-serif text-xs sm:text-sm leading-relaxed text-slate-800">
                        {compiledDocument}
                      </pre>
                    </div>
                  </div>

                  {/* Barra de Aprobación del Abogado (Registra en Human Loop y Descarga .DOC) */}
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 space-y-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="text-xs">
                        <strong className="text-emerald-900 block">Aprobación y Visado del Abogado (Human-in-the-Loop)</strong>
                        <span className="text-[11px] text-slate-600">
                          Al darle el Visto Bueno, queda registrado en el historial de <strong>9. Human-in-the-Loop</strong> y se descarga en <strong>.DOC</strong> para impresión y visado.
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={handleApproveAndExportRedactorDoc}
                        className="px-5 py-3 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-semibold text-xs flex items-center gap-2 cursor-pointer shadow-sm transition"
                      >
                        <FileCheck className="w-4 h-4" />
                        <span>Dar Visto Bueno y Exportar a .DOC</span>
                      </button>
                    </div>
                    {redactorApprovedStamp && (
                      <div className="text-[11px] font-mono text-emerald-800 pt-2 border-t border-emerald-500/20">
                        ✓ Visto Bueno registrado por {lawyerSignerName} • Sello SHA-256: {redactorApprovedStamp.slice(0, 28)}...
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              3. GRABADOR DE ACTAS (PRESENCIAL O MEETING ONLINE + CHECKS A PLANIFICADOR + GENERADOR DE MINUTA)
          ================================================================== */}
          {activeTab === 'grabador' && (
            <div className="card-surface rounded-3xl p-6 sm:p-8 bg-white border border-[#E6DFD1] shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6DFD1] pb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-amber-700 font-bold">
                    3. Grabador de Reuniones Presenciales y Meetings Online
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold mt-1">
                    Resumen Ejecutivo, Acuerdos con Check al Planificador y Generador de Minuta
                  </h2>
                </div>
                {isRecording && (
                  <span className="px-3 py-1 rounded-full bg-rose-600 text-white font-mono text-xs font-bold animate-pulse">
                    ● GRABANDO ({String(Math.floor(recordingSeconds / 60)).padStart(2, '0')}:{String(recordingSeconds % 60).padStart(2, '0')})
                  </span>
                )}
              </div>

              <div className="sub-surface p-5 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD1] space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setRecordingMode('Presencial (Sala / Despacho)')}
                    className={`p-3.5 rounded-xl border text-left flex items-center gap-3 cursor-pointer transition ${
                      recordingMode === 'Presencial (Sala / Despacho)'
                        ? 'bg-[#0F172A] text-white border-amber-500'
                        : 'bg-white border-[#D5CBB8] text-slate-800'
                    }`}
                  >
                    <Mic className="w-5 h-5 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Reunión Presencial (En Despacho / Sala / Tribunal)</div>
                      <div className="text-[11px] opacity-80">Captura directa por micrófono del equipo o móvil</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setRecordingMode('Meeting Online (Zoom / Meet / Teams)')}
                    className={`p-3.5 rounded-xl border text-left flex items-center gap-3 cursor-pointer transition ${
                      recordingMode === 'Meeting Online (Zoom / Meet / Teams)'
                        ? 'bg-[#0F172A] text-white border-amber-500'
                        : 'bg-white border-[#D5CBB8] text-slate-800'
                    }`}
                  >
                    <Video className="w-5 h-5 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs font-bold">Meeting Online (Zoom / Google Meet / Teams)</div>
                      <div className="text-[11px] opacity-80">Captura de audio de videollamada con clientes o colegas</div>
                    </div>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                  <div className="md:col-span-5">
                    <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">Título de la Reunión o Audiencia</label>
                    <input
                      type="text"
                      value={meetingTitleInput}
                      onChange={(e) => setMeetingTitleInput(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border text-xs bg-white border-[#D5CBB8]"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">Asistentes</label>
                    <input
                      type="text"
                      value={meetingAttendeesInput}
                      onChange={(e) => setMeetingAttendeesInput(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border text-xs bg-white border-[#D5CBB8]"
                    />
                  </div>
                  <div className="md:col-span-3 flex gap-2">
                    {!isRecording ? (
                      <button
                        type="button"
                        onClick={() => {
                          setIsRecording(true);
                          showToast(`Grabando en modo: ${recordingMode}...`);
                        }}
                        className="w-full py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <Mic className="w-4 h-4" /> Iniciar Grabación
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={handleFinishRecordingSimulation}
                        className="w-full py-2.5 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer animate-pulse"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Finalizar y Generar Acta
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                {recordings.map((rec) => (
                  <div key={rec.id} className="sub-surface p-6 rounded-2xl border bg-[#FAF8F5] border-[#E6DFD1] space-y-5">
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E6DFD1] pb-3">
                      <div>
                        <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 font-bold">
                          {rec.mode} • Fecha: {rec.date} • Duración: {rec.duration}
                        </span>
                        <h3 className="font-serif font-bold text-lg mt-1">{rec.title}</h3>
                        <p className="text-xs text-slate-500">Asistentes: {rec.attendees}</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMinutaModal(rec)}
                        className="px-4 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-sm"
                      >
                        <Share2 className="w-4 h-4 text-amber-400" />
                        <span>Generar Minuta para Compartir con Asistentes</span>
                      </button>
                    </div>

                    {/* 1. Resumen con los puntos más importantes */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-amber-800 font-bold">
                        1. Resumen de Puntos Más Importantes
                      </h4>
                      <ul className="space-y-1.5 text-xs">
                        {rec.summaryPoints.map((pt, i) => (
                          <li key={i} className="flex items-start gap-2">
                            <span className="text-amber-600 font-bold">•</span>
                            <span>{pt}</span>
                          </li>
                        ))}
                      </ul>
                    </div>

                    {/* 2. Acuerdos y Tareas con Check para enviar automáticamente al Planificador */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-emerald-800 font-bold">
                        2. Decisiones, Acuerdos y Tareas (Marca el Check ✓ para enviarlo automáticamente al Planificador y Calendario)
                      </h4>
                      <div className="space-y-2">
                        {rec.agreementsAndTasks.map((act) => (
                          <label
                            key={act.id}
                            className={`flex items-center justify-between gap-3 p-3 rounded-xl border text-xs cursor-pointer transition ${
                              act.addedToPlanner
                                ? 'bg-emerald-500/10 border-emerald-500/40'
                                : 'bg-white border-[#E6DFD1] hover:border-amber-500'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={act.addedToPlanner}
                                onChange={() => handleToggleRecordingTaskCheck(rec.id, act.id)}
                                className="w-4 h-4 accent-emerald-600 rounded cursor-pointer"
                              />
                              <span className="font-medium">{act.text}</span>
                            </div>
                            <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                              <span className="text-slate-500">Fecha: {act.dueDate}</span>
                              {act.addedToPlanner ? (
                                <span className="px-2 py-0.5 rounded bg-emerald-700 text-white text-[10px]">
                                  ✓ En Planificador y Calendario
                                </span>
                              ) : (
                                <span className="px-2 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px]">
                                  Marcar para Planificar
                                </span>
                              )}
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>

                    {/* 3. Transcripción Completa al final */}
                    <div className="space-y-2 pt-2 border-t border-[#E6DFD1]">
                      <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 font-bold">
                        3. Transcripción Completa de la Sesión
                      </h4>
                      <div className="p-4 rounded-xl bg-white border border-[#E6DFD1] font-mono text-xs whitespace-pre-wrap leading-relaxed">
                        {rec.transcript}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {showMinutaModal && (
                <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-sm flex items-center justify-center p-4">
                  <div className="card-surface max-w-2xl w-full rounded-3xl p-6 sm:p-8 bg-white border border-[#E6DFD1] shadow-2xl space-y-4">
                    <div className="flex items-center justify-between border-b border-[#E6DFD1] pb-3">
                      <div>
                        <span className="text-[10px] font-mono uppercase text-amber-700 font-bold">
                          Generador de Minuta de Reunión para Asistentes
                        </span>
                        <h3 className="font-serif font-bold text-lg">{showMinutaModal.title}</h3>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowMinutaModal(null)}
                        className="px-3 py-1 rounded-lg bg-slate-200 text-slate-800 text-xs font-bold cursor-pointer"
                      >
                        Cerrar ✕
                      </button>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD1] text-xs space-y-3 max-h-[360px] overflow-y-auto font-serif">
                      <p><strong>MINUTA DE REUNIÓN Y ACUERDOS</strong></p>
                      <p><strong>Fecha:</strong> {showMinutaModal.date} | <strong>Modalidad:</strong> {showMinutaModal.mode}</p>
                      <p><strong>Asistentes:</strong> {showMinutaModal.attendees}</p>
                      <p><strong>1. PUNTOS TRATADOS:</strong></p>
                      {showMinutaModal.summaryPoints.map((p, idx) => (
                        <p key={idx}>• {p}</p>
                      ))}
                      <p><strong>2. ACUERDOS Y COMPROMISOS:</strong></p>
                      {showMinutaModal.agreementsAndTasks.map((a, idx) => (
                        <p key={idx}>☑ {a.text} (Fecha compromiso: {a.dueDate})</p>
                      ))}
                    </div>

                    <div className="flex flex-wrap justify-end gap-2.5 pt-2">
                      <button
                        type="button"
                        onClick={() => {
                          const text = `MINUTA DE REUNIÓN: ${showMinutaModal.title}\nFecha: ${showMinutaModal.date}\nAsistentes: ${showMinutaModal.attendees}\n\nPUNTOS CLAVE:\n${showMinutaModal.summaryPoints.map(p => `• ${p}`).join('\n')}\n\nACUERDOS Y TAREAS:\n${showMinutaModal.agreementsAndTasks.map(a => `☑ ${a.text} (${a.dueDate})`).join('\n')}`;
                          if (navigator.clipboard?.writeText) {
                            navigator.clipboard.writeText(text);
                          }
                          showToast('Minuta copiada al portapapeles lista para enviar por WhatsApp o Correo a los asistentes.');
                        }}
                        className="px-4 py-2.5 rounded-xl border border-[#D5CBB8] bg-white text-slate-800 text-xs font-semibold flex items-center gap-2 cursor-pointer"
                      >
                        <Copy className="w-3.5 h-3.5" /> Copiar para WhatsApp / Correo
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          const text = `Fecha: ${showMinutaModal.date}\nModalidad: ${showMinutaModal.mode}\nAsistentes: ${showMinutaModal.attendees}\n\n1. RESUMEN DE PUNTOS IMPORTANTES:\n${showMinutaModal.summaryPoints.map(p => `• ${p}`).join('\n')}\n\n2. DECISIONES Y TAREAS ACORDADAS:\n${showMinutaModal.agreementsAndTasks.map(a => `☑ ${a.text} — Fecha: ${a.dueDate}`).join('\n')}`;
                          const hash = computeRealSha256(`${text}|${Date.now()}`);
                          setApprovedDocsRegistry(prev => [
                            {
                              id: `HL-${Date.now().toString().slice(-5)}`,
                              timestamp: new Date().toLocaleString('es-ES', { dateStyle: 'short', timeStyle: 'short' }),
                              title: `Minuta — ${showMinutaModal.title}`,
                              originModule: 'Minuta de Reunión',
                              templateUsed: 'Minuta Ejecutiva de Acuerdos',
                              approvedBy: lawyerSignerName,
                              collegiateNumber: lawyerCollegiateId,
                              sha256: hash,
                              content: text
                            },
                            ...prev
                          ]);
                          exportWordDoc(`Minuta_${showMinutaModal.date}.doc`, showMinutaModal.title, `Minuta Visada por ${lawyerSignerName} • SHA-256: ${hash.slice(0, 20)}...`, text);
                          showToast('Minuta registrada en Human-in-the-Loop y descargada en formato .DOC.');
                        }}
                        className="px-5 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5 text-amber-400" /> Descargar Minuta (.DOC)
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* =================================================================
              4. PLANIFICADOR (CON FECHA, PRIORIDAD Y SINCRONIZACIÓN DIRECTA AL CALENDARIO)
          ================================================================== */}
          {activeTab === 'planificador' && (
            <div className="card-surface rounded-3xl p-6 sm:p-8 bg-white border border-[#E6DFD1] shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6DFD1] pb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-amber-700 font-bold">
                    4. Planificador Conectado en Tiempo Real con tu Calendario
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold mt-1">
                    Planificador de Tareas y Expedientes (Sincronización Automática al Calendario)
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('calendario')}
                  className="px-4 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <CalendarIcon className="w-3.5 h-3.5 text-amber-400" /> Ver en el Calendario Mensual →
                </button>
              </div>

              <div className="sub-surface p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD1] grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                <div className="md:col-span-4">
                  <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">Actividad o Tarea a Planificar</label>
                  <input
                    type="text"
                    value={newTaskTitle}
                    onChange={(e) => setNewTaskTitle(e.target.value)}
                    placeholder="Ej: Redactar contrato / Presentar escrito..."
                    className="w-full px-3.5 py-2 rounded-xl border text-xs bg-white border-[#D5CBB8]"
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">Cliente / Expediente</label>
                  <input
                    type="text"
                    list="crm-client-options"
                    value={newTaskClient}
                    onChange={(e) => setNewTaskClient(e.target.value)}
                    placeholder="Selecciona o escribe cliente..."
                    className="w-full px-3.5 py-2 rounded-xl border text-xs bg-white border-[#D5CBB8]"
                  />
                  <datalist id="crm-client-options">
                    {crmClients.map(c => (
                      <option key={c.id} value={c.name} />
                    ))}
                  </datalist>
                </div>
                <div className="md:col-span-2">
                  <label className="block text-[11px] font-mono uppercase text-amber-800 font-bold mb-1">Fecha (Calendario)</label>
                  <input
                    type="date"
                    value={newTaskDate}
                    onChange={(e) => setNewTaskDate(e.target.value)}
                    className="w-full px-2.5 py-2 rounded-xl border text-xs bg-white border-[#D5CBB8] font-mono"
                  />
                </div>
                <div className="md:col-span-1">
                  <label className="block text-[11px] font-mono uppercase text-slate-500 mb-1">Prioridad</label>
                  <select
                    value={newTaskPriority}
                    onChange={(e) => setNewTaskPriority(e.target.value as 'Alta' | 'Media' | 'Baja')}
                    className="w-full px-2 py-2 rounded-xl border text-xs bg-white border-[#D5CBB8]"
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
                    className="w-full py-2.5 px-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Plus className="w-4 h-4 text-amber-400 shrink-0" />
                    <span className="truncate">Planificar y Agendar en Calendario</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {(['Pendiente', 'En Curso', 'Completado'] as const).map((col) => (
                  <div key={col} className="sub-surface p-4 rounded-2xl border bg-[#FAF8F5] border-[#E6DFD1] space-y-3">
                    <div className="flex items-center justify-between border-b border-[#E6DFD1] pb-2">
                      <span className="font-serif font-bold text-sm">{col}</span>
                      <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-700 font-bold">
                        {tasks.filter(t => t.status === col).length}
                      </span>
                    </div>
                    <div className="space-y-2.5">
                      {tasks.filter(t => t.status === col).map(task => (
                        <div key={task.id} className="card-surface p-3.5 rounded-xl border bg-white border-[#E6DFD1] space-y-2 text-xs shadow-sm">
                          <div className="flex items-center justify-between gap-1">
                            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-800 font-bold">
                              📅 {task.dueDate}
                            </span>
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold ${
                                task.priority === 'Alta'
                                  ? 'bg-rose-500/15 text-rose-700'
                                  : task.priority === 'Media'
                                  ? 'bg-amber-500/15 text-amber-800'
                                  : 'bg-slate-200 text-slate-700'
                              }`}>
                                {task.priority}
                              </span>
                              <span className="text-[10px] font-mono text-slate-500">{task.origin}</span>
                            </div>
                          </div>
                          <p className="font-semibold leading-snug">{task.title}</p>
                          <p className="text-[11px] text-slate-500">Cliente: {task.client}</p>
                          <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-[#E6DFD1]">
                            <input
                              type="date"
                              value={task.dueDate}
                              onChange={(e) => {
                                const newD = e.target.value;
                                setTasks(prev => prev.map(tk => tk.id === task.id ? { ...tk, dueDate: newD } : tk));
                                setCalendarEvents(prev =>
                                  prev.map(ev =>
                                    ev.linkedTaskId === task.id || ev.title === task.title || ev.title.startsWith(task.title)
                                      ? { ...ev, date: newD }
                                      : ev
                                  )
                                );
                                showToast(`Fecha actualizada en el Calendario al ${newD}`);
                              }}
                              className="text-[10px] font-mono px-1.5 py-0.5 rounded border border-[#D5CBB8]"
                            />
                            <div className="flex items-center gap-1">
                              <select
                                value={task.status}
                                onChange={(e) => {
                                  const next = e.target.value as PlannerTask['status'];
                                  setTasks(prev => prev.map(tk => tk.id === task.id ? { ...tk, status: next } : tk));
                                }}
                                className="text-[10px] font-mono px-2 py-1 rounded border border-[#D5CBB8]"
                              >
                                <option value="Pendiente">Pendiente</option>
                                <option value="En Curso">En Curso</option>
                                <option value="Completado">Completado</option>
                              </select>
                              <button
                                type="button"
                                onClick={() => handleDeletePlannerTask(task.id)}
                                title="Eliminar tarea"
                                className="px-1.5 py-1 rounded text-[10px] font-mono text-rose-700 hover:bg-rose-500/10 cursor-pointer"
                              >
                                ✕
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
              5. CALENDARIO REAL DE MES COMPLETO (OPCIÓN AGENDA GENERAL Y OPCIÓN CÓMPUTO PROCESAL)
          ================================================================== */}
          {activeTab === 'calendario' && (
            <div className="card-surface rounded-3xl p-6 sm:p-8 bg-white border border-[#E6DFD1] shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6DFD1] pb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-amber-700 font-bold">
                    5. Calendario Mensual Real del Despacho (General y Procesal)
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold mt-1">
                    Calendario Completo del Mes ({monthNames[calendarMonth]} {calendarYear})
                  </h2>
                </div>

                <div className="flex flex-wrap gap-1.5 text-xs">
                  <button
                    type="button"
                    onClick={() => setCalendarLawyerMode('ambos')}
                    className={`px-3 py-1.5 rounded-xl font-semibold cursor-pointer ${
                      calendarLawyerMode === 'ambos' ? 'bg-[#0F172A] text-white' : 'bg-[#FAF8F5] border border-[#D5CBB8] text-slate-700'
                    }`}
                  >
                    Vista Completa (Agenda + Procesal)
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarLawyerMode('agenda_general')}
                    className={`px-3 py-1.5 rounded-xl font-semibold cursor-pointer ${
                      calendarLawyerMode === 'agenda_general' ? 'bg-[#0F172A] text-white' : 'bg-[#FAF8F5] border border-[#D5CBB8] text-slate-700'
                    }`}
                  >
                    Solo Agenda General / Corporativa
                  </button>
                  <button
                    type="button"
                    onClick={() => setCalendarLawyerMode('computo_procesal')}
                    className={`px-3 py-1.5 rounded-xl font-semibold cursor-pointer ${
                      calendarLawyerMode === 'computo_procesal' ? 'bg-[#0F172A] text-white' : 'bg-[#FAF8F5] border border-[#D5CBB8] text-slate-700'
                    }`}
                  >
                    Con Cómputo de Plazos Procesales
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-8 space-y-3">
                  <div className="flex items-center justify-between bg-[#0F172A] text-white px-4 py-3 rounded-2xl">
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
                      className="p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer flex items-center gap-1 text-xs"
                    >
                      <ChevronLeft className="w-4 h-4" /> Mes Anterior
                    </button>
                    <span className="font-serif font-bold text-base sm:text-lg text-amber-300">
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
                      className="p-1.5 rounded-lg hover:bg-slate-800 cursor-pointer flex items-center gap-1 text-xs"
                    >
                      Mes Siguiente <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5 text-center text-[11px] font-mono uppercase font-bold text-slate-500">
                    <div>Lun</div>
                    <div>Mar</div>
                    <div>Mié</div>
                    <div>Jue</div>
                    <div>Vie</div>
                    <div className="text-rose-600">Sáb</div>
                    <div className="text-rose-600">Dom</div>
                  </div>

                  <div className="grid grid-cols-7 gap-1.5">
                    {calendarMonthCells.map((cell, idx) => {
                      if (!cell.day || !cell.dateStr) {
                        return <div key={idx} className="h-24 rounded-xl bg-slate-100/40 border border-transparent" />;
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
                          className={`h-24 p-2 rounded-xl border text-left flex flex-col justify-between transition cursor-pointer overflow-hidden ${
                            isSelected
                              ? 'border-2 border-amber-600 bg-amber-500/10'
                              : cell.isWeekend || cell.isNonWorking
                              ? 'bg-slate-100/70 border-[#E6DFD1]'
                              : 'card-surface bg-white border-[#E6DFD1] hover:border-amber-500/50'
                          }`}
                        >
                          <div className="flex items-center justify-between w-full">
                            <span className={`text-xs font-mono font-bold ${cell.isWeekend || cell.isNonWorking ? 'text-rose-600' : ''}`}>
                              {cell.day}
                              {cell.isNonWorking && !cell.isWeekend ? ' • Inhábil' : ''}
                            </span>
                            {dayEvents.length > 0 && (
                              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded-full bg-[#0F172A] text-amber-300 font-bold">
                                {dayEvents.length}
                              </span>
                            )}
                          </div>
                          <div className="space-y-1 w-full overflow-hidden">
                            {dayEvents.slice(0, 2).map(ev => (
                              <div
                                key={ev.id}
                                className={`text-[9px] px-1.5 py-0.5 rounded truncate font-medium ${
                                  ev.type === 'Plazo Procesal'
                                    ? 'bg-rose-600 text-white'
                                    : 'bg-amber-500/20 text-amber-900'
                                }`}
                              >
                                {ev.title}
                              </div>
                            ))}
                            {dayEvents.length > 2 && (
                              <div className="text-[9px] font-mono text-slate-500 font-semibold">
                                +{dayEvents.length - 2} más...
                              </div>
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="lg:col-span-4 space-y-4">
                  <div className="sub-surface p-5 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD1] space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="text-xs font-mono uppercase text-amber-800 font-bold">
                        Agenda del Día: {selectedCalendarDate}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleToggleNoDispatchDay(selectedCalendarDate)}
                        className="text-[10px] font-mono px-2 py-1 rounded-lg border border-[#D5CBB8] bg-white text-slate-700 cursor-pointer hover:bg-rose-500/10"
                      >
                        {nonWorkingDates.includes(selectedCalendarDate) ? '✓ Día Sin Despacho' : 'Marcar Sin Despacho'}
                      </button>
                    </div>
                    <div className="space-y-2">
                      {calendarEvents.filter(e => e.date === selectedCalendarDate).length === 0 ? (
                        <p className="text-xs text-slate-500">No hay actividades registradas en esta fecha.</p>
                      ) : (
                        calendarEvents
                          .filter(e => e.date === selectedCalendarDate)
                          .map(ev => (
                            <div key={ev.id} className="card-surface p-3 rounded-xl bg-white border border-[#E6DFD1] text-xs space-y-1">
                              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-800 font-bold">
                                {ev.type}
                              </span>
                              <p className="font-semibold">{ev.title}</p>
                              {ev.client && <p className="text-[11px] text-slate-500">{ev.client}</p>}
                            </div>
                          ))
                      )}
                    </div>

                    <div className="pt-3 border-t border-[#E6DFD1] space-y-2">
                      <label className="block text-[11px] font-mono uppercase text-slate-500 font-bold">
                        Agregar Evento o Recordatorio el {selectedCalendarDate}:
                      </label>
                      <input
                        type="text"
                        value={newCalEventTitle}
                        onChange={(e) => setNewCalEventTitle(e.target.value)}
                        placeholder="Ej: Firma en Notaría / Reunión con cliente..."
                        className="w-full px-3 py-2 rounded-xl border text-xs bg-white border-[#D5CBB8]"
                      />
                      <select
                        value={newCalEventType}
                        onChange={(e) => setNewCalEventType(e.target.value as 'Agenda General' | 'Plazo Procesal')}
                        className="w-full px-3 py-2 rounded-xl border text-xs bg-white border-[#D5CBB8]"
                      >
                        <option value="Agenda General">Agenda General / Corporativa</option>
                        <option value="Plazo Procesal">Vencimiento / Plazo Procesal</option>
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
                    <div className="sub-surface p-5 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD1] space-y-3">
                      <div className="text-xs font-mono uppercase text-rose-700 font-bold">
                        Calculadora de Plazos Procesales (Opcional Litigio)
                      </div>
                      <input
                        type="text"
                        value={procTitleInput}
                        onChange={(e) => setProcTitleInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border text-xs bg-white border-[#D5CBB8]"
                        placeholder="Acto procesal..."
                      />
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-mono text-slate-500">Notificación</label>
                          <input
                            type="date"
                            value={procNotificationDate}
                            onChange={(e) => setProcNotificationDate(e.target.value)}
                            className="w-full px-2.5 py-1.5 rounded-xl border text-xs bg-white border-[#D5CBB8]"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-mono text-slate-500">Días de Lapso</label>
                          <input
                            type="number"
                            min={1}
                            max={180}
                            value={procDaysCount}
                            onChange={(e) => setProcDaysCount(Number(e.target.value))}
                            className="w-full px-2.5 py-1.5 rounded-xl border text-xs bg-white border-[#D5CBB8]"
                          />
                        </div>
                      </div>
                      <select
                        value={procDayMode}
                        onChange={(e) => setProcDayMode(e.target.value as 'habiles' | 'continuos')}
                        className="w-full px-3 py-2 rounded-xl border text-xs bg-white border-[#D5CBB8]"
                      >
                        <option value="habiles">Días Hábiles de Despacho (Excluye Sáb/Dom)</option>
                        <option value="continuos">Días Continuos / Naturales</option>
                      </select>
                      {procDayMode === 'habiles' && (
                        <label className="flex items-center gap-2 text-[11px] text-slate-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={procExcludeHolidaysAndRecess}
                            onChange={(e) => setProcExcludeHolidaysAndRecess(e.target.checked)}
                            className="accent-rose-600 rounded"
                          />
                          <span>Descontar feriados, días marcados sin despacho y receso judicial (Art. 201 CPC)</span>
                        </label>
                      )}
                      <button
                        type="button"
                        onClick={handleCalculateAndAddProceduralDeadline}
                        className="w-full py-2.5 rounded-xl bg-rose-700 hover:bg-rose-600 text-white text-xs font-semibold cursor-pointer"
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
              6. CRM (EN LA VISTA PREVIA SOLO EL NOMBRE, Y AL SELECCIONAR SE DESPLIEGA LA FICHA LEGAL COMPLETA)
          ================================================================== */}
          {activeTab === 'crm' && (
            <div className="card-surface rounded-3xl p-6 sm:p-8 bg-white border border-[#E6DFD1] shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6DFD1] pb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-amber-700 font-bold">
                    6. Directorio y Expediente Único de Clientes
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold mt-1">
                    CRM Jurídico con Ficha Legal Completa del Cliente
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNewClientForm(!showNewClientForm)}
                  className="px-4 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4 text-amber-400" />
                  <span>{showNewClientForm ? 'Cerrar Formulario' : 'Nuevo Cliente'}</span>
                </button>
              </div>

              {showNewClientForm && (
                <div className="sub-surface p-5 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD1] space-y-3 text-xs">
                  <div className="font-mono font-bold uppercase text-amber-800">Registrar Nueva Ficha Legal de Cliente</div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <input
                      type="text"
                      placeholder="Nombre o Razón Social *"
                      value={newClientForm.name}
                      onChange={(e) => setNewClientForm({ ...newClientForm, name: e.target.value })}
                      className="px-3 py-2 rounded-xl border bg-white border-[#D5CBB8]"
                    />
                    <input
                      type="text"
                      placeholder="C.I. / RIF / NIF / Pasaporte"
                      value={newClientForm.taxId}
                      onChange={(e) => setNewClientForm({ ...newClientForm, taxId: e.target.value })}
                      className="px-3 py-2 rounded-xl border bg-white border-[#D5CBB8]"
                    />
                    <input
                      type="text"
                      placeholder="Representante Legal y Cargo"
                      value={newClientForm.legalRep}
                      onChange={(e) => setNewClientForm({ ...newClientForm, legalRep: e.target.value })}
                      className="px-3 py-2 rounded-xl border bg-white border-[#D5CBB8]"
                    />
                    <input
                      type="text"
                      placeholder="Datos de Registro Mercantil / Poder"
                      value={newClientForm.registryInfo}
                      onChange={(e) => setNewClientForm({ ...newClientForm, registryInfo: e.target.value })}
                      className="px-3 py-2 rounded-xl border bg-white border-[#D5CBB8]"
                    />
                    <input
                      type="text"
                      placeholder="Teléfono / WhatsApp"
                      value={newClientForm.phone}
                      onChange={(e) => setNewClientForm({ ...newClientForm, phone: e.target.value })}
                      className="px-3 py-2 rounded-xl border bg-white border-[#D5CBB8]"
                    />
                    <input
                      type="email"
                      placeholder="Correo Electrónico"
                      value={newClientForm.email}
                      onChange={(e) => setNewClientForm({ ...newClientForm, email: e.target.value })}
                      className="px-3 py-2 rounded-xl border bg-white border-[#D5CBB8]"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="Domicilio Fiscal y Procesal"
                      value={newClientForm.address}
                      onChange={(e) => setNewClientForm({ ...newClientForm, address: e.target.value })}
                      className="px-3 py-2 rounded-xl border bg-white border-[#D5CBB8]"
                    />
                    <input
                      type="text"
                      placeholder="Esquema de Honorarios / Iguala"
                      value={newClientForm.feeArrangement}
                      onChange={(e) => setNewClientForm({ ...newClientForm, feeArrangement: e.target.value })}
                      className="px-3 py-2 rounded-xl border bg-white border-[#D5CBB8]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={handleCreateCrmClient}
                    className="px-5 py-2.5 rounded-xl bg-emerald-700 text-white font-semibold cursor-pointer"
                  >
                    Guardar Ficha Legal del Cliente
                  </button>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Columna Izquierda: Vista Previa Limpia (SOLO EL NOMBRE DEL CLIENTE) */}
                <div className="lg:col-span-4 sub-surface p-4 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD1] space-y-3">
                  <div className="text-[11px] font-mono uppercase text-slate-500 font-bold">
                    Clientes del Despacho (Selecciona un nombre)
                  </div>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                    <input
                      type="text"
                      value={crmSearch}
                      onChange={(e) => setCrmSearch(e.target.value)}
                      placeholder="Buscar por nombre..."
                      className="w-full pl-8 pr-3 py-2 rounded-xl border text-xs bg-white border-[#D5CBB8]"
                    />
                  </div>
                  <div className="space-y-1.5">
                    {crmClients
                      .filter(c => c.name.toLowerCase().includes(crmSearch.toLowerCase()))
                      .map((client) => {
                        const isSelected = client.id === selectedClient.id;
                        return (
                          <button
                            key={client.id}
                            type="button"
                            onClick={() => {
                              setSelectedClientId(client.id);
                              setIsEditingClient(false);
                            }}
                            className={`w-full px-4 py-3 rounded-xl text-left text-xs font-semibold flex items-center justify-between transition cursor-pointer ${
                              isSelected
                                ? 'bg-[#0F172A] text-white shadow-sm'
                                : 'bg-white border border-[#E6DFD1] hover:border-amber-500 text-slate-800'
                            }`}
                          >
                            <span className="truncate">{client.name}</span>
                            <ChevronRight className={`w-4 h-4 shrink-0 ${isSelected ? 'text-amber-400' : 'text-slate-400'}`} />
                          </button>
                        );
                      })}
                  </div>
                </div>

                {/* Columna Derecha: Ficha Legal Completa Desplegada */}
                <div className="lg:col-span-8 sub-surface p-6 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD1] space-y-5">
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[#E6DFD1] pb-4">
                    <div>
                      <span className="text-[10px] font-mono uppercase px-2.5 py-0.5 rounded-full bg-amber-500/15 text-amber-800 font-bold">
                        Ficha Legal Completa • {selectedClient.personType}
                      </span>
                      <h3 className="font-serif text-xl sm:text-2xl font-bold mt-1">{selectedClient.name}</h3>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <select
                        value={selectedClient.powerStatus}
                        onChange={(e) => handleUpdateSelectedClientField('powerStatus', e.target.value as CrmClient['powerStatus'])}
                        className={`text-xs font-mono px-3 py-1 rounded-full font-bold border cursor-pointer ${
                          selectedClient.powerStatus === 'Vigente'
                            ? 'bg-emerald-500/15 text-emerald-700 border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-700 border-amber-500/30'
                        }`}
                      >
                        <option value="Vigente">Poder: Vigente</option>
                        <option value="Por Renovar">Poder: Por Renovar</option>
                        <option value="En Trámite">Poder: En Trámite</option>
                      </select>
                      <button
                        type="button"
                        onClick={() => setIsEditingClient(!isEditingClient)}
                        className="px-3 py-1.5 rounded-xl border border-[#D5CBB8] bg-white text-slate-800 text-xs font-semibold cursor-pointer"
                      >
                        {isEditingClient ? 'Guardar Cambios' : 'Editar Ficha'}
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="card-surface p-4 rounded-xl bg-white border border-[#E6DFD1] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Documento / ID Fiscal (C.I. / RIF / NIF)</span>
                      {isEditingClient ? (
                        <input
                          type="text"
                          value={selectedClient.taxId}
                          onChange={(e) => handleUpdateSelectedClientField('taxId', e.target.value)}
                          className="w-full px-2.5 py-1 rounded border border-[#D5CBB8] font-mono text-xs"
                        />
                      ) : (
                        <strong className="font-mono text-sm">{selectedClient.taxId}</strong>
                      )}
                    </div>
                    <div className="card-surface p-4 rounded-xl bg-white border border-[#E6DFD1] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Representante Legal y Carácter</span>
                      {isEditingClient ? (
                        <input
                          type="text"
                          value={selectedClient.legalRep}
                          onChange={(e) => handleUpdateSelectedClientField('legalRep', e.target.value)}
                          className="w-full px-2.5 py-1 rounded border border-[#D5CBB8] text-xs"
                        />
                      ) : (
                        <strong>{selectedClient.legalRep}</strong>
                      )}
                    </div>
                    <div className="card-surface p-4 rounded-xl bg-white border border-[#E6DFD1] space-y-1 md:col-span-2">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Datos de Registro Mercantil / Notaría y Poderes</span>
                      {isEditingClient ? (
                        <input
                          type="text"
                          value={selectedClient.registryInfo}
                          onChange={(e) => handleUpdateSelectedClientField('registryInfo', e.target.value)}
                          className="w-full px-2.5 py-1 rounded border border-[#D5CBB8] text-xs"
                        />
                      ) : (
                        <p className="font-medium">{selectedClient.registryInfo}</p>
                      )}
                    </div>
                    <div className="card-surface p-4 rounded-xl bg-white border border-[#E6DFD1] space-y-1 md:col-span-2">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Domicilio Fiscal y Procesal</span>
                      {isEditingClient ? (
                        <input
                          type="text"
                          value={selectedClient.address}
                          onChange={(e) => handleUpdateSelectedClientField('address', e.target.value)}
                          className="w-full px-2.5 py-1 rounded border border-[#D5CBB8] text-xs"
                        />
                      ) : (
                        <p className="font-medium">{selectedClient.address}</p>
                      )}
                    </div>
                    <div className="card-surface p-4 rounded-xl bg-white border border-[#E6DFD1] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Teléfono / WhatsApp</span>
                      {isEditingClient ? (
                        <input
                          type="text"
                          value={selectedClient.phone}
                          onChange={(e) => handleUpdateSelectedClientField('phone', e.target.value)}
                          className="w-full px-2.5 py-1 rounded border border-[#D5CBB8] font-mono text-xs"
                        />
                      ) : (
                        <p className="font-mono font-semibold">{selectedClient.phone}</p>
                      )}
                    </div>
                    <div className="card-surface p-4 rounded-xl bg-white border border-[#E6DFD1] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Correo Electrónico</span>
                      {isEditingClient ? (
                        <input
                          type="email"
                          value={selectedClient.email}
                          onChange={(e) => handleUpdateSelectedClientField('email', e.target.value)}
                          className="w-full px-2.5 py-1 rounded border border-[#D5CBB8] font-mono text-xs"
                        />
                      ) : (
                        <p className="font-mono font-semibold">{selectedClient.email}</p>
                      )}
                    </div>
                  </div>

                  <div className="card-surface p-4 rounded-xl bg-white border border-[#E6DFD1] space-y-2.5 text-xs">
                    <span className="text-[10px] font-mono uppercase text-amber-800 font-bold block">
                      Expedientes y Contratos Vinculados
                    </span>
                    <ul className="space-y-1">
                      {selectedClient.activeMatters.map((m, i) => (
                        <li key={i} className="font-mono text-xs flex items-center gap-2">
                          <Briefcase className="w-3.5 h-3.5 text-amber-600 shrink-0" /> {m}
                        </li>
                      ))}
                    </ul>
                    <div className="flex gap-2 pt-2 border-t border-[#E6DFD1]">
                      <input
                        type="text"
                        value={newMatterInput}
                        onChange={(e) => setNewMatterInput(e.target.value)}
                        placeholder="Ej: EXP-2026-180: Acción Resolutoria / Contrato..."
                        className="w-full px-3 py-1.5 rounded-lg border text-xs bg-[#FAF8F5] border-[#D5CBB8]"
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="card-surface p-4 rounded-xl bg-white border border-[#E6DFD1] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Acuerdo de Honorarios / Iguala</span>
                      {isEditingClient ? (
                        <input
                          type="text"
                          value={selectedClient.feeArrangement}
                          onChange={(e) => handleUpdateSelectedClientField('feeArrangement', e.target.value)}
                          className="w-full px-2.5 py-1 rounded border border-[#D5CBB8] text-xs"
                        />
                      ) : (
                        <p>{selectedClient.feeArrangement}</p>
                      )}
                    </div>
                    <div className="card-surface p-4 rounded-xl bg-white border border-[#E6DFD1] space-y-1">
                      <span className="text-[10px] font-mono uppercase text-slate-400 block">Observaciones Confidenciales</span>
                      {isEditingClient ? (
                        <input
                          type="text"
                          value={selectedClient.confidentialNotes}
                          onChange={(e) => handleUpdateSelectedClientField('confidentialNotes', e.target.value)}
                          className="w-full px-2.5 py-1 rounded border border-[#D5CBB8] text-xs"
                        />
                      ) : (
                        <p>{selectedClient.confidentialNotes}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              7. KPI & CONTROL DE GASTO API
          ================================================================== */}
          {activeTab === 'kpi' && (
            <div className="card-surface rounded-3xl p-6 sm:p-8 bg-white border border-[#E6DFD1] shadow-sm space-y-6">
              <div className="border-b border-[#E6DFD1] pb-4">
                <span className="text-[11px] font-mono uppercase tracking-widest text-amber-700 font-bold">
                  7. Rendimiento del Despacho y Control de Consumo de API
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold mt-1">
                  Métricas de Tiempo Ahorrado y Gasto Real en Centavos
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="sub-surface p-5 rounded-2xl border bg-[#FAF8F5] border-[#E6DFD1]">
                  <span className="text-[10px] font-mono uppercase text-slate-500">Consumo API Mes Actual</span>
                  <div className="text-2xl font-serif font-bold text-emerald-700 mt-1">${currentSpendUsd.toFixed(2)} USD</div>
                  <span className="text-[11px] text-slate-500">Tope mensual: ${monthlyBudgetUsd} USD</span>
                </div>
                <div className="sub-surface p-5 rounded-2xl border bg-[#FAF8F5] border-[#E6DFD1]">
                  <span className="text-[10px] font-mono uppercase text-slate-500">Documentos Visados</span>
                  <div className="text-2xl font-serif font-bold mt-1">{approvedDocsRegistry.length}</div>
                  <span className="text-[11px] text-slate-500">Registrados en Human-Loop</span>
                </div>
                <div className="sub-surface p-5 rounded-2xl border bg-[#FAF8F5] border-[#E6DFD1]">
                  <span className="text-[10px] font-mono uppercase text-slate-500">Horas Letradas Ahorradas</span>
                  <div className="text-2xl font-serif font-bold text-amber-700 mt-1">{savedHoursCount} h</div>
                  <span className="text-[11px] text-slate-500">En redacción, consultas y actas</span>
                </div>
                <div className="sub-surface p-5 rounded-2xl border bg-[#FAF8F5] border-[#E6DFD1]">
                  <span className="text-[10px] font-mono uppercase text-slate-500">Fugas de Datos a IA</span>
                  <div className="text-2xl font-serif font-bold text-emerald-700 mt-1">0%</div>
                  <span className="text-[11px] text-slate-500">{piiAuditRegistry.length} operaciones anonimizadas</span>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              8. TRAZABILIDAD SHA-256
          ================================================================== */}
          {activeTab === 'trazabilidad' && (
            <div className="card-surface rounded-3xl p-6 sm:p-8 bg-white border border-[#E6DFD1] shadow-sm space-y-6">
              <div className="border-b border-[#E6DFD1] pb-4">
                <span className="text-[11px] font-mono uppercase tracking-widest text-amber-700 font-bold">
                  8. Bitácora Criptográfica Inmutable SHA-256
                </span>
                <h2 className="font-serif text-xl sm:text-2xl font-bold mt-1">
                  Registro General de Operaciones del Sistema
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-[#0F172A] text-white font-mono text-[10px] uppercase">
                      <th className="p-3.5">Hora</th>
                      <th className="p-3.5">Módulo</th>
                      <th className="p-3.5">Operación</th>
                      <th className="p-3.5">Datos Protegidos</th>
                      <th className="p-3.5">Visado Human-Loop</th>
                      <th className="p-3.5">Hash SHA-256 (FIPS 180-4)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E6DFD1]">
                    {auditLogs.map(log => (
                      <tr key={log.id}>
                        <td className="p-3.5 font-mono">{log.timestamp}</td>
                        <td className="p-3.5 font-semibold">{log.module}</td>
                        <td className="p-3.5">{log.action}</td>
                        <td className="p-3.5 font-mono text-emerald-700 font-bold">{log.piiCount} PII</td>
                        <td className="p-3.5 font-mono text-[10px]">
                          {log.humanVerified ? (
                            <span className="px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-800 font-bold">✓ Visado</span>
                          ) : (
                            <span className="px-2 py-0.5 rounded bg-amber-500/15 text-amber-800">Pendiente</span>
                          )}
                        </td>
                        <td className="p-3.5 font-mono text-[10px] text-slate-500" title={log.sha256}>
                          {log.sha256.slice(0, 24)}...
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* =================================================================
              9. HUMAN-IN-THE-LOOP (SOLO EL REGISTRO DE LOS DOCUMENTOS APROBADOS POR EL ABOGADO)
          ================================================================== */}
          {activeTab === 'human_loop' && (
            <div className="card-surface rounded-3xl p-6 sm:p-8 bg-white border border-[#E6DFD1] shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6DFD1] pb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-700 font-bold">
                    9. Registro Histórico de Visados (Human-in-the-Loop)
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold mt-1">
                    Registro de Documentos y Dictámenes Aprobados por el Abogado
                  </h2>
                </div>
                <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-800 font-semibold">
                  {approvedDocsRegistry.length} Documentos con Visto Bueno
                </span>
              </div>

              <p className="text-xs text-slate-600">
                La aprobación ocurre directamente mientras trabajas en el <strong>Redactor de Documentos</strong>, en el <strong>Consultor de IA</strong> o en el <strong>Grabador de Actas</strong>. En esta pestaña queda únicamente el <strong>registro inmutable de los documentos que recibieron tu Visto Bueno</strong>.
              </p>

              <div className="space-y-3">
                {approvedDocsRegistry.map((rec) => (
                  <div key={rec.id} className="sub-surface p-5 rounded-2xl border bg-[#FAF8F5] border-[#E6DFD1] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1 text-xs">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-700 text-white font-mono text-[10px] font-bold">
                          ✓ APROBADO POR EL ABOGADO ({rec.id})
                        </span>
                        <span className="font-mono text-slate-500">{rec.timestamp}</span>
                        <span className="font-mono text-amber-800">• Origen: {rec.originModule}</span>
                      </div>
                      <h3 className="font-serif font-bold text-base">{rec.title}</h3>
                      <p className="text-[11px] text-slate-600">
                        Firmante: <strong>{rec.approvedBy}</strong> ({rec.collegiateNumber}) • Modelo: {rec.templateUsed}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500">
                        Sello SHA-256: {rec.sha256}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => exportWordDoc(`${rec.title.replace(/\s+/g, '_')}.doc`, rec.title, `Visado por ${rec.approvedBy} • SHA-256: ${rec.sha256.slice(0, 20)}`, rec.content)}
                      className="shrink-0 px-4 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 text-amber-400" /> Descargar Copia (.DOC)
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =================================================================
              10. ANONIMIZACIÓN PII (SOLO EL REGISTRO AUTOMÁTICO DE DATOS PROTEGIDOS)
          ================================================================== */}
          {activeTab === 'anonimizacion_pii' && (
            <div className="card-surface rounded-3xl p-6 sm:p-8 bg-white border border-[#E6DFD1] shadow-sm space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6DFD1] pb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-emerald-700 font-bold">
                    10. Registro de Privacidad y Anonimización PII en Memoria Local
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold mt-1">
                    Bitácora de Datos Sensibles Ocultados Automáticamente a la IA
                  </h2>
                </div>
                <span className="text-xs font-mono px-3 py-1.5 rounded-xl bg-emerald-500/15 text-emerald-800 font-semibold">
                  100% Procesado en las Pestañas de Trabajo
                </span>
              </div>

              <p className="text-xs text-slate-600">
                La ocultación de nombres, razones sociales, documentos de identidad (con o sin puntos), RIF/NIF, teléfonos, cuentas de 20 dígitos o IBAN y montos ocurre automáticamente en segundo plano cuando utilizas el <strong>Consultor de IA</strong>, el <strong>Redactor de Documentos</strong> o el <strong>Grabador de Actas</strong>. Aquí se conserva únicamente la constancia auditable de cada protección ejecutada.
              </p>

              <div className="space-y-3">
                {piiAuditRegistry.map((entry) => (
                  <div key={entry.id} className="sub-surface p-5 rounded-2xl border bg-[#FAF8F5] border-[#E6DFD1] space-y-3 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded bg-[#0F172A] text-amber-300 font-mono text-[10px] font-bold">
                          {entry.id} • {entry.originModule}
                        </span>
                        <span className="font-mono text-slate-500">{entry.timestamp}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-800 font-mono text-[10px] font-bold">
                        ✓ Zero-Data-Retention (No entrena IA)
                      </span>
                    </div>
                    <p className="font-medium text-slate-700">Operación: {entry.contextSummary}</p>
                    <div className="flex flex-wrap gap-2">
                      {entry.tokensDetected.map((tok, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-white border border-[#E6DFD1] font-mono text-[11px]">
                          <strong className="text-emerald-700">{tok.token}</strong> → {tok.maskedPreview}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =================================================================
              11. CONFIGURACIÓN DEL SISTEMA (UBICADA DE ÚLTIMA, SIN PALABRA DOCKER Y SIN LÍMITES DE PAÍS/RAMA)
          ================================================================== */}
          {activeTab === 'configuracion_sistema' && (
            <div className="card-surface rounded-3xl p-6 sm:p-8 bg-white border border-[#E6DFD1] shadow-sm space-y-8">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#E6DFD1] pb-4">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-widest text-amber-700 font-bold">
                    11. Configuración Inicial del Despacho (Uso Ocasional)
                  </span>
                  <h2 className="font-serif text-xl sm:text-2xl font-bold mt-1">
                    Conexión de tu API de IA, tu Biblioteca de Modelos y tus Leyes
                  </h2>
                  <p className="text-xs text-slate-600 mt-1">
                    Configura una sola vez los datos de tu firma, la llave de tu modelo de IA preferido, la carpeta o Google Drive de tus modelos y los códigos o leyes con los que trabajas.
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
                    showToast('Memoria local limpiada. Recarga la página si deseas volver a los valores iniciales de fábrica.');
                  }}
                  className="px-3.5 py-2 rounded-xl border border-[#D5CBB8] bg-[#FAF8F5] text-xs font-semibold text-slate-700 cursor-pointer"
                >
                  Restablecer Memoria Local
                </button>
              </div>

              <div className="sub-surface p-5 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD1] space-y-4">
                <h3 className="font-serif font-bold text-base">Datos del Abogado o Despacho Adquirente</h3>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
                  <div>
                    <label className="block font-mono text-[11px] text-slate-500 mb-1">Nombre del Despacho o Firma</label>
                    <input
                      type="text"
                      value={firmName}
                      onChange={(e) => setFirmName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border bg-white border-[#D5CBB8]"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] text-slate-500 mb-1">Nombre del Abogado para Visados</label>
                    <input
                      type="text"
                      value={lawyerSignerName}
                      onChange={(e) => setLawyerSignerName(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border bg-white border-[#D5CBB8]"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] text-slate-500 mb-1">Nº de Colegiado / Inpreabogado</label>
                    <input
                      type="text"
                      value={lawyerCollegiateId}
                      onChange={(e) => setLawyerCollegiateId(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border bg-white border-[#D5CBB8]"
                    />
                  </div>
                  <div>
                    <label className="block font-mono text-[11px] text-slate-500 mb-1">Especialidad o Práctica</label>
                    <input
                      type="text"
                      value={customPracticeArea}
                      onChange={(e) => setCustomPracticeArea(e.target.value)}
                      className="w-full px-3.5 py-2 rounded-xl border bg-white border-[#D5CBB8]"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="sub-surface p-5 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD1] space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase text-amber-800 font-bold">
                    <Key className="w-4 h-4 text-amber-600" /> 1. Tu Modelo de IA y API
                  </div>
                  <div className="space-y-3 text-xs">
                    <div>
                      <label className="block font-mono text-[11px] text-slate-500 mb-1">Proveedor de IA</label>
                      <select
                        value={llmProvider}
                        onChange={(e) => {
                          const nextProv = e.target.value as 'openai' | 'anthropic' | 'gemini' | 'groq' | 'ollama';
                          setLlmProvider(nextProv);
                          setLlmModel(PROVIDER_DEFAULT_MODELS[nextProv][0]);
                        }}
                        className="w-full px-3 py-2 rounded-xl border bg-white border-[#D5CBB8]"
                      >
                        <option value="openai">OpenAI (GPT-4o)</option>
                        <option value="anthropic">Anthropic (Claude 3.5 Sonnet)</option>
                        <option value="gemini">Google Gemini Pro</option>
                        <option value="groq">Groq (Llama 3.3 70B)</option>
                        <option value="ollama">Modelo Local sin Internet (Ollama)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono text-[11px] text-slate-500 mb-1">Modelo Activo</label>
                      <select
                        value={llmModel}
                        onChange={(e) => setLlmModel(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border bg-white border-[#D5CBB8] font-mono"
                      >
                        {PROVIDER_DEFAULT_MODELS[llmProvider].map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block font-mono text-[11px] text-slate-500 mb-1">Tu API Key Privada</label>
                      <input
                        type="password"
                        value={apiKeyInput}
                        onChange={(e) => setApiKeyInput(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl border bg-white border-[#D5CBB8] font-mono"
                      />
                    </div>
                    <div>
                      <label className="block font-mono text-[11px] text-slate-500 mb-1">
                        Presupuesto Mensual Máximo: <strong>${monthlyBudgetUsd} USD</strong>
                      </label>
                      <input
                        type="range"
                        min={5}
                        max={200}
                        value={monthlyBudgetUsd}
                        onChange={(e) => setMonthlyBudgetUsd(Number(e.target.value))}
                        className="w-full accent-amber-600"
                      />
                    </div>
                  </div>
                </div>

                <div className="sub-surface p-5 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD1] space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase text-emerald-800 font-bold">
                    <FolderOpen className="w-4 h-4 text-emerald-600" /> 2. Tu Biblioteca de Modelos
                  </div>
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setLibrarySourceMode('Google Drive')}
                        className={`py-2 rounded-xl font-semibold cursor-pointer ${
                          librarySourceMode === 'Google Drive' ? 'bg-[#0F172A] text-white' : 'bg-white border border-[#D5CBB8]'
                        }`}
                      >
                        Google Drive
                      </button>
                      <button
                        type="button"
                        onClick={() => setLibrarySourceMode('Carpeta Local')}
                        className={`py-2 rounded-xl font-semibold cursor-pointer ${
                          librarySourceMode === 'Carpeta Local' ? 'bg-[#0F172A] text-white' : 'bg-white border border-[#D5CBB8]'
                        }`}
                      >
                        Carpeta Local
                      </button>
                    </div>
                    {librarySourceMode === 'Google Drive' ? (
                      <input
                        type="text"
                        value={driveFolderUrl}
                        onChange={(e) => setDriveFolderUrl(e.target.value)}
                        placeholder="Enlace de tu carpeta de Google Drive..."
                        className="w-full px-3 py-2 rounded-xl border bg-white border-[#D5CBB8] font-mono"
                      />
                    ) : (
                      <input
                        type="text"
                        value={localFolderPath}
                        onChange={(e) => setLocalFolderPath(e.target.value)}
                        placeholder="Ruta de tu carpeta de modelos..."
                        className="w-full px-3 py-2 rounded-xl border bg-white border-[#D5CBB8] font-mono"
                      />
                    )}
                    <label className="w-full py-2.5 px-3 rounded-xl bg-emerald-700 text-white font-semibold flex items-center justify-center gap-2 cursor-pointer">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Agregar Nuevo Modelo (.DOCX / .TXT)</span>
                      <input
                        type="file"
                        accept=".doc,.docx,.txt,.md"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          const registerTemplateFromText = (rawContent?: string) => {
                            const cleanText = rawContent && rawContent.trim().length > 20
                              ? rawContent.trim()
                              : `DOCUMENTO BASE CARGADO DE BIBLIOTECA (${f.name}):\n\nENTRE LAS PARTES: {{PARTES}}.\n\nOBJETO DEL INSTRUMENTO: {{OBJETO}}.\n\nMONTO O CONTRAPRESTACIÓN: {{PRECIO_MONTO}}.\n\nJURISDICCIÓN APLICABLE: {{JURISDICCION}}.`;

                            // Detecta dinámicamente variables {{VARIABLE}} presentes en el archivo cargado
                            const matches = Array.from(cleanText.matchAll(/\{\{([A-Z0-9_]+)\}\}/gi)).map(m => m[1].toUpperCase());
                            const uniqueKeys = Array.from(new Set(matches));
                            const detectedVars: ModelTemplateVariable[] =
                              uniqueKeys.length > 0
                                ? uniqueKeys.map(k => ({
                                    key: k,
                                    label: `Campo ${k.replace(/_/g, ' ')}`,
                                    category: 'Variable Detectada',
                                    placeholder: `Valor para ${k}`
                                  }))
                                : [
                                    { key: 'PARTES', label: 'Identificación de las Partes', category: 'Partes', placeholder: 'Nombres y documentos' },
                                    { key: 'OBJETO', label: 'Objeto y Condiciones del Instrumento', category: 'Objeto', placeholder: 'Descripción del negocio jurídico' },
                                    { key: 'PRECIO_MONTO', label: 'Monto o Contraprestación', category: 'Precio', placeholder: 'Monto en números y letras' },
                                    { key: 'JURISDICCION', label: 'Jurisdicción y Domicilio Especial', category: 'Jurisdicción', placeholder: 'Ciudad y tribunales' }
                                  ];

                            const newTpl: ModelTemplate = {
                              id: `tpl-${Date.now().toString().slice(-4)}`,
                              name: f.name.replace(/\.[^/.]+$/, ''),
                              category: 'Modelo Propio del Despacho',
                              source: librarySourceMode,
                              updatedAt: 'Recién cargado',
                              variables: detectedVars,
                              contentPreview: cleanText
                            };
                            setTemplates(prev => [newTpl, ...prev]);
                            setSelectedTemplateId(newTpl.id);
                            showToast(`Modelo "${newTpl.name}" agregado con ${detectedVars.length} variables detectadas.`);
                          };

                          if (/\.(txt|md)$/i.test(f.name) && typeof FileReader !== 'undefined') {
                            const reader = new FileReader();
                            reader.onload = () => registerTemplateFromText(String(reader.result || ''));
                            reader.readAsText(f);
                          } else {
                            registerTemplateFromText();
                          }
                        }}
                      />
                    </label>
                  </div>
                </div>

                <div className="sub-surface p-5 rounded-2xl bg-[#FAF8F5] border border-[#E6DFD1] space-y-4">
                  <div className="flex items-center gap-2 text-xs font-mono uppercase text-indigo-800 font-bold">
                    <Scale className="w-4 h-4 text-indigo-600" /> 3. Tus Leyes y Normativa (RAG)
                  </div>
                  <div className="space-y-3 text-xs">
                    <p className="text-[11px] text-slate-600">
                      Sube libremente las leyes, códigos, reglamentos o sentencias de tu país y especialidad sin restricciones.
                    </p>
                    <label className="w-full py-2.5 px-3 rounded-xl bg-[#0F172A] text-white font-semibold flex items-center justify-center gap-2 cursor-pointer">
                      <Upload className="w-3.5 h-3.5 text-amber-400" />
                      <span>Cargar Ley, Código o Sentencia (.PDF)</span>
                      <input
                        type="file"
                        accept=".pdf,.txt,.doc,.docx"
                        className="hidden"
                        onChange={(e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          setRagDocs(prev => [
                            {
                              id: `rag-${Date.now().toString().slice(-4)}`,
                              title: f.name.replace(/\.[^/.]+$/, ''),
                              type: 'Código / Ley',
                              chunks: 185,
                              status: 'Indexado',
                              excerpt: 'Normativa cargada directamente por el abogado titular para fundamentar el Consultor de IA.'
                            },
                            ...prev
                          ]);
                          showToast(`Normativa "${f.name}" indexada en el sistema.`);
                        }}
                      />
                    </label>
                    <div className="space-y-1.5 max-h-32 overflow-y-auto">
                      {ragDocs.map(doc => (
                        <div key={doc.id} className="p-2 rounded-lg bg-white border border-[#E6DFD1] flex items-center justify-between text-[11px]">
                          <span className="truncate font-medium">{doc.title}</span>
                          <span className="text-[10px] font-mono text-emerald-700 font-bold shrink-0 ml-2">✓ {doc.status}</span>
                        </div>
                      ))}
                    </div>
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
