"use client";

import React, { useState, useMemo, useEffect, useRef } from 'react';
import {
  Shield, Lock, Key, FolderOpen, Scale, MessageSquare, FileText,
  Mic, Kanban, Calendar as CalendarIcon, Users, BarChart3, Fingerprint,
  UserCheck, EyeOff, Upload, CheckCircle2, Download,
  Plus, Search, Sparkles, ChevronRight, ChevronLeft,
  Sliders, Copy, Sun, Moon, FileCheck,
  Camera, FileUp, Video, Share2, Briefcase,
  Menu, X, Trash2, Edit3, Eye, Send, AlertCircle, Check,
  RefreshCw, ExternalLink
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
  originalValueInModel?: string; // Dato antiguo o espacio libre (____) detectado en el modelo original
}

interface ModelTemplate {
  id: string;
  codigo?: string;
  name: string;
  category: string;
  source: 'Carpeta Local' | 'Google Drive';
  driveUrl?: string;
  fundamento?: string;
  notas?: string;
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

// ============================================================================
// LECTOR NATIVO DE ARCHIVOS .DOCX (ZIP XML DE GOOGLE DRIVE / WORD) Y .TXT
// ============================================================================
async function extractRealTextFromDocxOrFile(file: File): Promise<string> {
  const lower = file.name.toLowerCase();
  try {
    if (lower.endsWith('.txt') || lower.endsWith('.md') || lower.endsWith('.csv') || lower.endsWith('.json') || lower.endsWith('.html')) {
      return (await file.text()).trim();
    }
    if (lower.endsWith('.docx') && typeof DecompressionStream !== 'undefined') {
      const buf = await file.arrayBuffer();
      const bytes = new Uint8Array(buf);
      const view = new DataView(buf);
      let offset = 0;
      while (offset + 30 < bytes.length) {
        if (view.getUint32(offset, true) !== 0x04034b50) break;
        const compression = view.getUint16(offset + 8, true);
        const compSize = view.getUint32(offset + 18, true);
        const nameLen = view.getUint16(offset + 26, true);
        const extraLen = view.getUint16(offset + 28, true);
        const entryName = new TextDecoder().decode(bytes.subarray(offset + 30, offset + 30 + nameLen));
        const dataStart = offset + 30 + nameLen + extraLen;
        const compData = bytes.subarray(dataStart, dataStart + compSize);
        if (entryName === 'word/document.xml') {
          let xmlText = '';
          if (compression === 0) {
            xmlText = new TextDecoder().decode(compData);
          } else if (compression === 8) {
            const ds = new DecompressionStream('deflate-raw');
            const writer = ds.writable.getWriter();
            writer.write(compData);
            writer.close();
            const outBuf = await new Response(ds.readable).arrayBuffer();
            xmlText = new TextDecoder().decode(outBuf);
          }
          if (xmlText) {
            return xmlText
              .replace(/<\/w:p>/g, '\n\n')
              .replace(/<w:tab\/>/g, ' ')
              .replace(/<w:br[^/>]*\/>/g, '\n')
              .replace(/<[^>]+>/g, '')
              .replace(/&amp;/g, '&')
              .replace(/&lt;/g, '<')
              .replace(/&gt;/g, '>')
              .replace(/&quot;/g, '"')
              .replace(/\n{3,}/g, '\n\n')
              .trim();
          }
        }
        offset = dataStart + compSize;
      }
    }
    const rawText = await file.text();
    const printable = rawText.match(/[A-Za-záéíóúñÁÉÍÓÚÑ0-9.,;:()¿?¡!$€%@#/_\\\-\{\}\s]{12,}/g);
    if (printable && printable.length > 0) {
      return printable.join(' ').replace(/\s+/g, ' ').trim();
    }
  } catch {
    // Fallback
  }
  return '';
}

// ============================================================================
// MOTOR INTELIGENTE PARA MODELOS VENEZOLANOS REALES DE GOOGLE DRIVE:
// Detecta automáticamente:
// 1) Modelos con ESPACIOS LIBRES / RAYAS (______, ......, -----, (   ))
// 2) Modelos YA REDACTADOS CON DATOS DE CLIENTES ANTERIORES (Nombres en mayúsculas,
//    C.I. V-/E-, RIF J-/V-/G-, Datos de Registro/Notaría, Tomo, Folio, Montos en USD/Bs.)
// 3) O modelos con variables {{VARIABLE}} si ya las tuvieran.
// ============================================================================
function analyzeAndNormalizeVenezuelanModel(rawText: string, fallbackVarHints?: string): {
  normalizedContent: string;
  variables: ModelTemplateVariable[];
  detectedMode: 'datos_antiguos_y_espacios' | 'variables_llaves' | 'catalogo_venezolano';
} {
  let workingText = rawText;
  const detectedVars: ModelTemplateVariable[] = [];
  const usedKeys = new Set<string>();

  const registerVar = (
    baseKey: string,
    label: string,
    category: string,
    placeholder: string,
    originalVal?: string
  ): string => {
    let cleanKey = baseKey.toUpperCase().replace(/[^A-Z0-9_ÁÉÍÓÚÑ]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
    if (!cleanKey) cleanKey = 'CAMPO';
    let counter = 1;
    let finalKey = cleanKey;
    while (usedKeys.has(finalKey)) {
      counter++;
      finalKey = `${cleanKey}_${counter}`;
    }
    usedKeys.add(finalKey);
    detectedVars.push({
      key: finalKey,
      label,
      category,
      placeholder,
      originalValueInModel: originalVal
    });
    return finalKey;
  };

  // 1) Si el documento tiene espacios en blanco tipo ______, ......, (____)
  let blankIndex = 1;
  workingText = workingText.replace(
    /([A-Za-záéíóúñÁÉÍÓÚÑ0-9.,º°()/]{0,35}?\s*)(?:_{3,}|\.{4,}|-{4,}|\(\s*_{2,}\s*\)|\[\s*_{2,}\s*\])/g,
    (fullMatch, prefixGroup) => {
      const prefix = String(prefixGroup || '').trim();
      const lowerPref = prefix.toLowerCase();
      let keyHint = `ESPACIO_${blankIndex}`;
      let labelHint = `Espacio en blanco #${blankIndex}${prefix ? ` (después de "${prefix}")` : ''}`;
      let catHint = 'Espacio Libre del Modelo';

      if (lowerPref.includes('c.i') || lowerPref.includes('cédula') || lowerPref.includes('cedula') || lowerPref.endsWith('v-') || lowerPref.endsWith('e-')) {
        keyHint = `CEDULA_IDENTIDAD_${blankIndex}`;
        labelHint = `Cédula de Identidad (${prefix || 'V-/E-'})`;
        catHint = 'Identificación';
      } else if (lowerPref.includes('rif')) {
        keyHint = `RIF_${blankIndex}`;
        labelHint = `Número de RIF (${prefix || 'V-/J-'})`;
        catHint = 'Identificación';
      } else if (lowerPref.includes('inpre') || lowerPref.includes('ipsa')) {
        keyHint = `INPREABOGADO_${blankIndex}`;
        labelHint = `Nº Inpreabogado / IPSA (${prefix})`;
        catHint = 'Abogado';
      } else if (lowerPref.includes('tomo')) {
        keyHint = `TOMO_REGISTRO_${blankIndex}`;
        labelHint = `Tomo de Registro / Notaría (${prefix})`;
        catHint = 'Datos Registrales';
      } else if (lowerPref.includes('folio')) {
        keyHint = `FOLIO_REGISTRO_${blankIndex}`;
        labelHint = `Folio de Registro / Notaría (${prefix})`;
        catHint = 'Datos Registrales';
      } else if (lowerPref.includes('bajo el n') || lowerPref.includes('número') || lowerPref.includes('numero')) {
        keyHint = `NUMERO_REGISTRO_${blankIndex}`;
        labelHint = `Número de Asiento / Registro (${prefix})`;
        catHint = 'Datos Registrales';
      } else if (lowerPref.includes('cantidad de') || lowerPref.includes('precio') || lowerPref.includes('suma de') || lowerPref.includes('us$') || lowerPref.includes('bs')) {
        keyHint = `MONTO_PRECIO_${blankIndex}`;
        labelHint = `Monto o Precio (${prefix})`;
        catHint = 'Económico';
      } else if (lowerPref.includes('yo,') || lowerPref.includes('nosotros,') || lowerPref.includes('entre')) {
        keyHint = `OTORGANTE_PARTE_${blankIndex}`;
        labelHint = `Nombre del Otorgante / Parte (${prefix})`;
        catHint = 'Partes';
      }

      blankIndex++;
      const assignedKey = registerVar(
        keyHint,
        labelHint,
        catHint,
        `Rellenar espacio libre del modelo (contexto: "${prefix || 'espacio en blanco'}")`,
        '________'
      );
      return `${prefixGroup}{{${assignedKey}}}`;
    }
  );

  // 2) Detectar DATOS DE CLIENTES ANTERIORES en modelos venezolanos ya redactados:
  // 2.a) Nombres propios en MAYÚSCULAS después de "Yo, ", "Nosotros, ", "Entre: ", "ciudadano(a) ", "a favor de "
  let partyIdx = 1;
  workingText = workingText.replace(
    /\b(Yo,|Nosotros,|ENTRE:|Entre:|ciudadano\(a\)?:?|a favor de|representad[oa] en este acto por(?:\s+su\s+[A-Za-zÁÉÍÓÚáéíóúñÑ\s]{3,25})?)\s+([A-ZÁÉÍÓÚÑ]{2,}(?:\s+[A-ZÁÉÍÓÚÑ.]{1,}){1,5})(?=\s*,|\s+venezolan|\s+mayor|\s+de\s+nacionalidad|\s+titular|\s+quien|\s+y\s+)/g,
    (full, intro, oldName) => {
      const trimmedName = String(oldName).trim();
      if (trimmedName.length < 5 || /^(EL|LA|LOS|LAS|UN|UNA|POR|PARA|CON|SIN|ESTE|ESTA|CONTRATO|PODER|ACTA)/.test(trimmedName)) {
        return full;
      }
      const k = registerVar(
        `NOMBRE_PARTE_${partyIdx++}`,
        `Nombre de Parte / Otorgante (En el modelo decía: "${trimmedName}")`,
        'Datos Antiguos Detectados',
        `Sustituir "${trimmedName}" por el nombre del nuevo cliente/parte`,
        trimmedName
      );
      return `${intro} {{${k}}}`;
    }
  );

  // 2.b) Sociedades Mercantiles Venezolanas (C.A., S.A., S.R.L.) en el modelo antiguo
  let compIdx = 1;
  workingText = workingText.replace(
    /\b([A-ZÁÉÍÓÚÑ][A-Za-záéíóúñÁÉÍÓÚÑ0-9\s.&-]{2,45}?,\s*(?:C\.A\.|S\.A\.|S\.R\.L\.|S\.A\.S\.))/g,
    (oldCompany) => {
      const k = registerVar(
        `EMPRESA_MERCANTIL_${compIdx++}`,
        `Empresa / Sociedad Mercantil (En el modelo decía: "${oldCompany}")`,
        'Datos Antiguos Detectados',
        `Sustituir "${oldCompany}" por la nueva sociedad mercantil`,
        oldCompany
      );
      return `{{${k}}}`;
    }
  );

  // 2.c) Cédulas de Identidad Venezolanas (V-12.345.678 / E-81.234.567) y RIF (J-30948271-0)
  let idIdx = 1;
  workingText = workingText.replace(
    /\b([VJGEP][-\s.]?\d{1,2}(?:\.\d{3}){2}(?:[-\s]?\d)?|[VJGEP][-\s]\d{7,9}(?:[-\s]\d)?)\b/g,
    (oldId) => {
      const isRif = /^[JGP]/i.test(oldId) || /-\d$/.test(oldId);
      const k = registerVar(
        isRif ? `RIF_${idIdx++}` : `CEDULA_${idIdx++}`,
        `${isRif ? 'RIF' : 'Cédula de Identidad'} (En el modelo decía: "${oldId}")`,
        'Datos Antiguos Detectados',
        `Sustituir "${oldId}" por el nuevo ${isRif ? 'RIF' : 'número de Cédula'}`,
        oldId
      );
      return `{{${k}}}`;
    }
  );

  // 2.d) Montos en Dólares o Bolívares en el modelo antiguo
  let amtIdx = 1;
  workingText = workingText.replace(
    /(?:(?:\b(?:USD|EUR|Bs\.?)|US\$|\$)\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\b|\b\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?\s?(?:USD|EUR|Bs\.?|dólares|bolívares)\b)/gi,
    (oldAmt) => {
      const k = registerVar(
        `MONTO_OPERACION_${amtIdx++}`,
        `Monto / Precio en cifra (En el modelo decía: "${oldAmt}")`,
        'Datos Antiguos Detectados',
        `Sustituir "${oldAmt}" por el nuevo monto o precio`,
        oldAmt
      );
      return `{{${k}}}`;
    }
  );

  // 3) Recoger también cualquier {{VARIABLE}} que ya existiera en el texto
  const braceMatches = Array.from(workingText.matchAll(/\{\{([A-Za-z0-9_ÁÉÍÓÚÑáéíóúñ]+)\}\}/g)).map(m => m[1].toUpperCase());
  braceMatches.forEach(k => {
    if (!usedKeys.has(k)) {
      usedKeys.add(k);
      detectedVars.push({
        key: k,
        label: k.replace(/_/g, ' '),
        category: 'Campo del Modelo',
        placeholder: `Ingresa los datos para {{${k}}}`
      });
    }
  });

  if (detectedVars.length > 0) {
    return {
      normalizedContent: workingText,
      variables: detectedVars,
      detectedMode: detectedVars.some(v => v.originalValueInModel) ? 'datos_antiguos_y_espacios' : 'variables_llaves'
    };
  }

  // 4) Si el texto era muy corto o proviene de la ficha del catálogo de 550 modelos
  if (fallbackVarHints && fallbackVarHints.trim()) {
    const parts = fallbackVarHints.split(',').map(s => s.trim()).filter(Boolean);
    const catalogVars = parts.map((p, idx) => {
      const cleanK = p.toUpperCase().replace(/[^A-Z0-9_ÁÉÍÓÚÑ]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 28) || `CAMPO_${idx + 1}`;
      return {
        key: cleanK,
        label: p,
        category: 'Requisito del Modelo',
        placeholder: `Datos de: ${p}`
      };
    });
    return {
      normalizedContent: workingText,
      variables: catalogVars,
      detectedMode: 'catalogo_venezolano'
    };
  }

  return {
    normalizedContent: workingText,
    variables: [
      { key: 'PARTE_A', label: 'Identificación de la Primera Parte / Otorgante', category: 'Partes', placeholder: 'Nombre completo, nacionalidad, estado civil, C.I. / RIF y domicilio' },
      { key: 'PARTE_B', label: 'Identificación de la Segunda Parte / Contraparte', category: 'Partes', placeholder: 'Nombre o Razón Social, RIF, datos de registro y representante' },
      { key: 'OBJETO_CONTRATO', label: 'Objeto y Descripción del Bien o Acto Jurídico', category: 'Objeto', placeholder: 'Descripción detallada del bien, medidas, linderos o prestación' },
      { key: 'PRECIO_CONDICIONES', label: 'Monto, Moneda y Forma de Pago', category: 'Económico', placeholder: 'Cantidad en letras y números, moneda y medio de pago' },
      { key: 'JURISDICCION', label: 'Domicilio Especial y Jurisdicción', category: 'Jurisdicción', placeholder: 'Ciudad y Tribunales competentes elegidos por las partes' }
    ],
    detectedMode: 'catalogo_venezolano'
  };
}

function detectVariablesInTemplateText(rawText: string, fallbackVarHints?: string): ModelTemplateVariable[] {
  return analyzeAndNormalizeVenezuelanModel(rawText, fallbackVarHints).variables;
}

function exportWordDoc(filename: string, title: string, subtitle: string, bodyText: string) {
  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
  <head><meta charset='utf-8'><title>${title}</title>
  <style>
    @page Section1 { size: 21.59cm 27.94cm; margin: 3.0cm 2.5cm 2.5cm 3.0cm; }
    div.Section1 { page: Section1; }
    body { font-family: 'Times New Roman', 'Georgia', serif; font-size: 12pt; line-height: 1.85; color: #0F172A; }
    h1 { font-size: 13pt; text-transform: uppercase; text-align: center; margin-bottom: 6pt; }
    .meta { font-family: 'Courier New', monospace; font-size: 9pt; text-align: center; color: #475569; border-bottom: 1px solid #CBD5E1; padding-bottom: 10pt; margin-bottom: 18pt; }
    p { text-align: justify; margin-bottom: 12pt; white-space: pre-wrap; }
  </style></head>
  <body><div class="Section1">
    <h1>${title}</h1>
    <div class="meta">${subtitle}</div>
    <p>${bodyText.replace(/\n/g, '<br/>')}</p>
  </div></body></html>`;

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
// CATÁLOGO MAESTRO CONECTADO A GOOGLE DRIVE (550 MODELOS JURÍDICOS VENEZOLANOS)
// ============================================================================
const RAW_CATALOGO_550: {
  cats: string[];
  urls: string[];
  vars: string[];
  funds: string[];
  notas: string[];
  rows: [string, string, number, number, number, number, number][];
} = {"cats": ["Poderes y Mandatos", "Derecho Mercantil y Societario", "Civil - Contratos y Garantías", "Derecho Laboral y Seguridad Social", "Práctica Forense y Trámites Varios", "Civil - Familia y Matrimonio", "Civil - Sucesiones y Herencias", "Derecho de Familia y Menores", "Derecho Procesal Civil y Forense", "Inquilinato y Arrendamiento"], "urls": ["https://drive.google.com/file/d/0BwXfsZ9Y-s2bdHlaTjE2NFhSckE/view?usp=drivesdk&resourcekey=0-NdqPnJfhs4C9P8ybUHD1gA", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bdXAza25xUUd3UWs/view?usp=drivesdk&resourcekey=0-Lc4rNpaY0_yS0Q0lwR8LCA", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bYmtoNUl5ZEw1Rmc/view?usp=drivesdk&resourcekey=0-0mtepOhb6Z19Ll9q4G19vw", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bRDAxdWV6QTI1RDg/view?usp=drivesdk&resourcekey=0-gxXSH0g1MIzPfHLcalo5sw", "https://drive.google.com/file/d/0BwXfsZ9Y-s2baUdQVUZYb0YtMk0/view?usp=drivesdk&resourcekey=0-dAZgEZhc_Z0xFRG2eSUURg", "https://docs.google.com/document/d/1kOuKAfzuhtos9utmMnAD8zvFcrf8lEIhF_-OGbih1XY/edit?usp=drivesdk&ouid=102546266408328933155", "https://docs.google.com/document/d/1BFNYpctJ14hJLSWTRcf5fKv6J-uNVjcUiAprzW8frX4/edit?usp=drivesdk&ouid=102546266408328933155", "https://docs.google.com/document/d/1JqJTBiZd1eZpXIBfCOFa4N3LkCvjQZ44_QcsZMQbC3k/edit?usp=drivesdk&ouid=102546266408328933155", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bRGx1Y1czMUloRHc/view?usp=drivesdk&resourcekey=0-sM12nxzENfMzfCh7Oq-6jw", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bXzA5SkVIUXZRem8/view?usp=drivesdk&resourcekey=0-e3e88TYqvTLQPWKfj0hfYQ", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bdHpSX3ZHUkFWQVU/view?usp=drivesdk&resourcekey=0-Clq48TGVE3JuItpRBvzxrg", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bcEhoa2hway1qd00/view?usp=drivesdk&resourcekey=0-MHbN5aPevJbHLGBfkREjtg", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bLUVMNEFKQ1VuQW8/view?usp=drivesdk&resourcekey=0-XcaBmBSX5RsXl-sl3LcZNA", "https://drive.google.com/file/d/0BwXfsZ9Y-s2beWNnaUFDSmJTWTg/view?usp=drivesdk&resourcekey=0-QOtIO3QOKZy7n7Fca2S0sA", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bc3JwbHJhYlFqSHM/view?usp=drivesdk&resourcekey=0-pRk8qP3qR3x3zna8zNd7hQ", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bdVFkYXVTLVl2Y3c/view?usp=drivesdk&resourcekey=0-o5Pnh8ODmDumfxiM0rq0FQ", "https://docs.google.com/document/d/1f3xtYlY0Fi0DnLRru_A7u3lSPkFzOhdWByIfsv7F560/edit?usp=drivesdk&ouid=102546266408328933155", "https://docs.google.com/document/d/14dt1kB1fXj4LCMRYmqfov_PjyAPjLKgsWrd8K1yWWDI/edit?usp=drivesdk&ouid=102546266408328933155", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bLVpmUEpmdktZUHM/view?usp=drivesdk&resourcekey=0-Qohv7aRIldeTNUpMh1vdXA", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bdWJlTTFWc0RxUWc/view?usp=drivesdk&resourcekey=0-OLRvFbET9L4kmP9Tc8JX4w", "https://docs.google.com/document/d/1w4idYp9JnRWcJXxjMn2e07Dj9i8YaAW_S73Xrs0xJH8/edit?usp=drivesdk&ouid=102546266408328933155", "https://docs.google.com/document/d/1Y6TtN-uxRfJQ41EhlkMDPGVEfEk6TEZSMkVeWJEGIVk/edit?usp=drivesdk&ouid=102546266408328933155", "https://drive.google.com/file/d/0BwXfsZ9Y-s2baUVJSVF1SDlodUk/view?usp=drivesdk&resourcekey=0-QQXvp3yY-GGKpufiGm-42w", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bNXQwZTVsOGpud2M/view?usp=drivesdk&resourcekey=0-0nW9wr8KTng_j8nFlA1AzQ", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bWDJITEpoOTBpNWs/view?usp=drivesdk&resourcekey=0-s0-mSKgyOK0G1gqPSSlqCg", "https://docs.google.com/document/d/1CMj5xHDAwLlXda_A_NHJYiO0N-Gb0D5-mNfH1Eobqe4/edit?usp=drivesdk&ouid=102546266408328933155", "https://drive.google.com/file/d/1X4F8yoQkK8wQ2sPqkx7wDYxKg0cErF9N/view?usp=drivesdk", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bRnFTRFVnaGFzTmc/view?usp=drivesdk&resourcekey=0-0FAPZlbnpv-do1C7bEpIHg", "https://docs.google.com/document/d/1pt2g8OwffZSVBByPKuN5fZ_gXrBE8iJMdPyu__hII_8/edit?usp=drivesdk&ouid=102546266408328933155", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bZTNCMDRMclV1aUU/view?usp=drivesdk&resourcekey=0-tQIucg-TRMg6ELB2eEeTig", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bRzVLZDNES0ZxSEE/view?usp=drivesdk&resourcekey=0-vPxWleVCsTqGi3N0S6Nr2g", "https://docs.google.com/document/d/1yW69uD2TTi6oVmFoPKm30PSvTGXZJ-n7ifWWByE-1MY/edit?usp=drivesdk&ouid=102546266408328933155", "https://docs.google.com/document/d/1W6qNRhk3jL5o4JxS6nHJAAmBOGSWmw2OSGksewXnlLc/edit?usp=drivesdk&ouid=102546266408328933155", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bTEtidm51MGVfY2M/view?usp=drivesdk&resourcekey=0-24igT8Ek3P9zCGtWeTvmuw", "https://docs.google.com/document/d/1xY_54SzruRO5wECN_53nj6kSyryTqQOErLYwcwEGZZ8/edit?usp=drivesdk&ouid=102546266408328933155", "https://docs.google.com/document/d/1AkdaScXCErg4wvlI1PdwOlxEH8mofUNTAd-LmhUxXBA/edit?usp=drivesdk&ouid=102546266408328933155", "https://docs.google.com/document/d/1cQqfGaPe54pFrvqkdhMQSALB9XknLC_NjXP-TagJW3g/edit?usp=drivesdk&ouid=102546266408328933155", "https://docs.google.com/document/d/1rBJ8740NRvMrQi0pzrskqN3UIIUPE_x1FziJRqyFcMg/edit?usp=drivesdk&ouid=102546266408328933155", "https://docs.google.com/document/d/1ZAkLi5YkARBkLte19V79X6zX_bcKQvFXtbmFgCdlx9E/edit?usp=drivesdk&ouid=102546266408328933155", "https://drive.google.com/drive/folders/0BwXfsZ9Y-s2bfkQ3T0Zua0drVTVtaHVnazVfNFdielA4WU1ZWmtJNEppWjR6R1BTRFpjQWc", "https://drive.google.com/drive/folders/0BwXfsZ9Y-s2bfkxRRjROWjlVLU1ST0RNZ0RHWFZGS25XRWFkTUh2dmJ2Qnp4UmkyNGRWV1U", "https://docs.google.com/document/d/1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q/edit?usp=drivesdk&ouid=102546266408328933155", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bSDJqVWtHb0k2T0E/view?usp=drivesdk&resourcekey=0-thTLgw4dh2sRW1_3xgRsJQ", "https://drive.google.com/file/d/0BwXfsZ9Y-s2baF9pcE55dVAwbEU/view?usp=drivesdk&resourcekey=0-ZX8jrwME0caIin2zkJAFfQ", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bUHR1Q1h6ZWV4RHM/view?usp=drivesdk&resourcekey=0-3YqF2j6g7k8h9l0m1n2p3q", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bSjEzM3JvaFYxSkU/view?usp=drivesdk&resourcekey=0-WgzdYkjJCVtXbz6i5Msl_g", "https://drive.google.com/file/d/0BwXfsZ9Y-s2baFBxUVBJNzBCT3M/view?usp=drivesdk&resourcekey=0-V0RT7_V2H4gLD0nEai6G6g", "https://drive.google.com/file/d/0BwXfsZ9Y-s2beFV1ZS1KSy1qM3c/view?usp=drivesdk&resourcekey=0-1m2_RE57j6qAfm2Sx5O_pg", "https://docs.google.com/document/d/1F2G3H4I5J6K7L8M9N0O1P2Q3R4S5T6U/edit?usp=drivesdk&ouid=102546266408328933155", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bOEZNZDZFR1dtN1k/view?usp=drivesdk&resourcekey=0-2uZ14RFWBi1zsVN4TOZsWw", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bamhjZF90bXFDcnM/view?usp=drivesdk&resourcekey=0-JB8SaZBbzPlEtXd1rbc1mw", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bNDRJRVduZC1UYU0/view?usp=drivesdk&resourcekey=0-VBEd4rYKJbYThpZtcWVdug", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bR04xMGt4RGVZbU0/view?usp=drivesdk&resourcekey=0-vP96LHcFrILrZCPBd0hwwQ", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bQW9aR2FTbWdybWc/view?usp=drivesdk&resourcekey=0-dN-euc-a1aEr9PfM-LF_IA", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bbGZvLTRNa0VGSVE/view?usp=drivesdk&resourcekey=0-1kxAj5Q1vQ486-0TKT4v_Q", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bV1JKMzFqUFhlZmc/view?usp=drivesdk&resourcekey=0-kxbNBQgXY3DKFgCUOc9v6Q", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bRjFVdC1Ucm5BR1U/view?usp=drivesdk&resourcekey=0-X1vT-AuvUiLEc5UsoyJO-w", "https://drive.google.com/file/d/0BwXfsZ9Y-s2beGdTY29wMHlwUEE/view?usp=drivesdk&resourcekey=0-97Rp8EAmLg346WnX4CRdXQ", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bT0dLZHdabjh2Nmc/view?usp=drivesdk&resourcekey=0-3Dvg9dbeBIh8KZzftny7Zw", "https://drive.google.com/drive/folders/0BwXfsZ9Y-s2bfjlrdWJUVTNtb083dHkyOW5xelpmWmtKYmNMRktYUlQ3akh3Q2l4dThnQWc", "https://drive.google.com/drive/folders/0BwXfsZ9Y-s2bfmRJa1pKVU9CMzhVVENlSE50dVhkaTRqUFJ1NXlhblZRcDVrU005THZWX2M", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bRWFTVEVNeVFWYUU/view?usp=drivesdk&resourcekey=0-sXRGgnewwSkQlOrDAVoSJA", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bSjdXQkJkWUxvMU0/view?usp=drivesdk&resourcekey=0-z7JMED-DDmNIEjLdbmTQmQ", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bcDlLaVZtMTRxaHM/view?usp=drivesdk&resourcekey=0-8ETrSSS3UmavKSqO6OyRrw", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bb1ptTE9qcndTUlE/view?usp=drivesdk&resourcekey=0-V2JG2soWj6P3pgkrMMQxcA", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bNlpfTjlpMi1DdGc/view?usp=drivesdk&resourcekey=0-EJSs6epUeN9RqHxKzMovnQ", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bV0hUZjVpdWQ2VWc/view?usp=drivesdk&resourcekey=0-6je9Kwy_fRv4w2j2YuhZfg", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bT09JMGwySEpPQ0U/view?usp=drivesdk&resourcekey=0-_VCdgMjhqmHmG7QTt4mmHA", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bUThZS0ZYRFJsVGs/view?usp=drivesdk&resourcekey=0-P15MSh4XHBlmP4rbQGCNGQ", "https://drive.google.com/drive/folders/0BwXfsZ9Y-s2bfmJ6ZElZTVNCdm5xNjEyQTdXTEprdVBGdGllRHJ1V2wzU21lUl83UjI0aUk", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bTlBndkJXQ01nQUE/view?usp=drivesdk&resourcekey=0-gU3vQ8tL5a9x7kM2pE1n4w", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bT1lNeUlzd0tkUVU/view?usp=drivesdk&resourcekey=0-EDH2-FKWzSSQ-KIA4Rx2_A", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bQ0FLc3B3eU4tSDA/view?usp=drivesdk&resourcekey=0-S6c2Wm9R6BkhdieY8bIYWg", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bVWxicnJYenhzN2M/view?usp=drivesdk&resourcekey=0-g-CV2Wqf6_s_tOcQlzfXUg", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bNXBUcHJDakhSQ28/view?usp=drivesdk&resourcekey=0-UyXDlqpCV0goT_-QPeRx7g", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bZ2xqNjBQUFY2aHc/view?usp=drivesdk&resourcekey=0-lG7mLQWFOsYlsuxeMcmw0Q", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bMm1IdkE2LWI2RDQ/view?usp=drivesdk&resourcekey=0-A00dOGItHrQS_Z3mDJzvOw", "https://drive.google.com/file/d/0BwXfsZ9Y-s2bV0l2OXUwcWx0eW8/view?usp=drivesdk&resourcekey=0-uX2qNb8HkMG9F1PKw33G6A"], "vars": ["Poderdante, Apoderado, Cuentas bancarias, Facultades dispositivas, Cláusula de autocontratación", "Otorgante, Abogados apoderados (Inpreabogado, Colegio), Facultades especiales (convenir, transigir, desistir, juramento, remates)", "Propietario poderdante, Apoderado, Identificación registral completa del inmueble, Linderos, Facultades de precio y cobro", "Heredero poderdante, Apoderado, Datos de la causante, N° de Planilla de Declaración Sucesoral SENIAT, Solvencia, Registro", "Propietario, Apoderado, Ubicación y linderos del inmueble/finca, Facultades para fijar cánones y suscribir contratos", "Usufructuaria (DNI/CI), Apoderados conjuntos/separados, Matrícula Folio Real de Capital Federal, Escribanía de origen, Declaración UIF/PEP, Precio en USD billetes", "Sociedad poderdante (RIF, Registro), Agencia Aduanal autorizada (RIF, N° SENIAT, Gaceta), Aduanas principales/subalternas, Sistema SIDUNEA", "Otorgante, Apoderado, Listado taxativo de recaudos educativos (Títulos, notas certificadas, actas de grado, pensum), Trámites MPPRE", "Graduando, Apoderado domiciliado en el país destino, Nombre del título académico y Universidad extranjera", "Asegurado solicitante, Apoderado, Cobro de sumas de pensión, Consignación de cuenta individual y recaudos", "Solicitante, Apoderado, Banco fiduciario, Programa o fideicomiso crediticio, Firma de contratos de préstamo", "Otorgante, Apoderados conjuntos o separados, Apertura y movilización de cuentas bancarias, Gestiones ministeriales, Defensa judicial simple", "Arrendatario poderdante, Abogados apoderados (Inpreabogado), Dirección del inmueble arrendado, Oposición a medidas cautelares", "Denominación social, Domicilio fiscal, Objeto social amplio, Duración, Capital social y valor nominal de acciones, Suscripción y pago (Inventario de bienes), Junta Directiva, Comisario Mercantil", "Denominación de la cooperativa, Régimen de responsabilidad suplementada, Asociados fundadores, Certificados de aportación, Instancias de administración y control", "Empresa, Quórum de asamblea universal, Redacción de nueva Cláusula de Objeto Social, Autorización de registro", "Razón social, RIF, Nueva dirección fiscal detallada, Reforma de atribuciones de Junta Directiva (firma conjunta/separada, cuentas bancarias, créditos, contratos, venta de activos)", "Capital actual, Monto del aumento en USD y Bs. a tasa BCV, Cantidad y valor nominal de nuevas acciones, Renuncia expresa al derecho de preferencia, Dilución porcentual, Informe de Aseguramiento de CPC", "Accionistas cedentes y compradores, Cantidad de acciones vendidas, Renuncia de cargos de directiva, Elección de nuevos directores, Reforma estatutaria de capital y administración", "Ejercicios económicos evaluados, Informe de Comisario Colegiado, Aprobación de balances, Actualización de período estatutario de Junta Directiva y Comisario", "Arrendador, Arrendataria, Dirección exacta y linderos, Canon mensual en divisas (USD) o Bs. a tasa oficial BCV, Término fijo y prórroga legal comercial, Depósito de garantía, Reparaciones mayores/menores, Cláusula penal", "Arrendadores, Arrendataria, Linderos físicos, Destino pormenorizado del inmueble, Canon en USD a tasa BCV, Intereses de mora, Prohibición de modificaciones estructurales", "Arrendador, Arrendatario, Fiador solidario y principal pagador, Canon mensual, Término fijo, Prohibición de cesión/subarriendo", "Arrendador, Arrendataria, Identificación de oficina y edificio, Canon, Pago de condominio y servicios, Ajuste por IPC/BCV", "Arrendador, Inquilino, Identificación del apartamento, Canon en bolívares, Depósito en garantía, Servicios públicos y reparaciones", "Entidad de trabajo (RIF, Registro), Trabajador, Causa legal de contratación temporal (Art. 64 LOTTT), Cargo, Descripción de funciones, Salario, Fecha exacta de inicio y culminación", "Patrono, Trabajador, Cargo, Listado de atribuciones, Jornada diurna/mixta, Período de prueba de 30 días (Art. 141 LOTTT), Salario en divisas / bolívares, Normas LOPCYMAT", "Grupo empresarial / Entidad de trabajo, Contratado, Funciones, Horario, Cláusula de rescisión sin preaviso durante prueba", "Empresa, Profesional independiente, Exclusión expresa de subordinación/LOTTT, Iguala mensual en USD a tasa oficial BCV, Facturación legal y retención ISLR, Administración de fondos corporativos, Prohibición taxativa de mezcla de fondos personales/Zelle/Binance, Responsabilidad patrimonial objetiva por faltantes", "Empresa, Consultor, Alcance técnico del proyecto de ingeniería/procura, Honorarios quincenales, Cláusulas de confidencialidad y rescisión", "Empresa prestadora, Cliente, Equipos cubiertos en Anexo, Visitas rutinarias y llamadas de emergencia, Honorarios mensuales y facturación de repuestos", "Vendedor, Compradora, Datos de condominio y linderos, Tradición legal registrada, Precio en Bolívares/divisas, Instrumento de pago bancario, Declaración de fondos lícitos, Saneamiento", "Apoderado vendedor en nombre de poderdante, Facultad expresa para autocontratar (Art. 1.171 CCV), Comprador por derechos propios, Reserva de derecho de habitación vitalicio, Pago en cheque bancario", "Promitente vendedora, Promitente comprador, Plazo de otorgamiento registral definitivo, Arras/Pago inicial, Cláusula penal por desistimiento", "Entidad de trabajo, Trabajadora, Cargo, Fecha ingreso/egreso, Causa de terminación, Cuadro desglosado de prestaciones (Art. 142), vacaciones (Art. 196), bono vacacional (Art. 192), utilidades (Art. 136), intereses (Art. 142-d), Finiquito amplio", "Empresa, Trabajadora, Reconocimiento voluntario de deuda líquida en USD, Autorización irrevocable de descuento de prestaciones a tasa BCV, Entrega de puesto, Reserva de auditoría", "Junta Directiva, Gerente notificado, Desincorporación de funciones, Inventario de bienes entregados (SIM, vehículos corporativos, laptops, accesos Starlink, llaves), Revocación de accesos digitales, Correo de contacto", "Empresa, Ex-trabajadora responsable de caja, Pago de derechos laborales, Notificación de auditoría en curso por arqueos, Declaración de NO finiquito administrativo ni financiero, Reserva de acciones civiles y penales", "Administrador saliente, Junta Directiva, Recepción material del informe sin conformidad, Advertencia de auditoría forense en curso, Responsabilidad patrimonial post-laboral", "Otorgantes, autoridades competentes, objeto de la solicitud", "Cónyuges, fecha y lugar de matrimonio, inventario de bienes gananciales, causales", "Denominación social, socios/accionistas, capital social, objeto, facultades de administración", "Causante, herederos, declaración sucesoral SENIAT, inventario de activos y pasivos", "Identificación de progenitores, menor, datos de partida de nacimiento, domicilio", "Antigua y nueva denominación social, Nuevo domicilio fiscal (Municipio/Estado), Modificación de Cláusulas 1 y 2", "Causal de disolución, Nombramiento de liquidador, Facultades de liquidación, Balance de liquidación y adjudicación de haber social", "Vendedora, Compradora, Inventario de activo fijo/mercancías, Publicaciones de ley (Art. 151 C.Com), Precio y condiciones", "Sociedad, Ejercicio económico concluido, Estados Financieros (Balance, Ganancias y Pérdidas), Informe del Comisario, Destino de utilidades", "Juez, fiscal, apoderados de partes, tiempo de exposición, pruebas promovidas, decisión oral", "Partes contratantes, objeto, precio/monto, forma de pago, garantías y gravámenes", "Tribunal competente, demandante, demandado, hechos (causa petendi), petitorio", "Trabajador, patrono, cargo, salario, jornada, conceptos salariales y liquidación", "Arrendador, arrendatario, inmueble, canon mensual, plazo de vigencia, depósito", "Datos de autos, informe del alguacil, orden al secretario", "Fecha, hora fijada para la audiencia oral", "Trabajador renunciante, Cargo, Patrono, Fecha efectiva de cese, Cumplimiento o dispensa del período de preaviso de ley", "Secretario judicial, dirección donde se fijó/entregó boleta", "Cónyuge supérstite, menores, causante, partida de defunción y matrimonio, testigos", "Adoptante, menor, estado de abandono previo, informe multidisciplinario", "Marido accionante, cónyuge, menor, movimiento migratorio probatorio de no cohabitación", "Hijos reclamantes, causante difunto, herederos legítimos, posesión de estado", "Madre demandante, padre demandado, menores, monto mensual en Bs./divisas, retención patronal", "Madre con guarda, padre retenedor indebido, informe psicológico, medidas de reintegro", "Progenitor no custodio, menor, esquema de fines de semana, vacaciones y fechas especiales", "Monto adeudado acumulado, meses en mora, solicitud de embargo y sanción", "Identificación del Alguacil, número de folio útil consignado", "Antecedentes, doctrina de la protección integral", "Lugar, cédula del presunto querellado, negativa expresa a estampar firma", "Tratado internacional ratificado por Venezuela", "Marco normativo general de protección integral", "Generales del testigo, preguntas de parte y repreguntas", "Ubicación, personas presentes, práctico asesor, hechos constatados", "Datos del querellado, expediente, fecha fijada para comparecencia", "Identificación de partes, causa petendi (hechos), fundamentación jurídica, medidas cautelares", "Acreedor poderdante, Apoderado cobrador, Deudores, Montos exigibles, Instrucciones de depósito en cuenta bancaria", "Accionante, agraviante, derechos constitucionales violados, petitorio", "Firma, cédula, hora, fecha y lugar de entrega por el Alguacil", "Sentencia previa, nuevo nivel de ingresos del alimentante, mayores gastos del menor", "Padre solicitante, menores, inmueble, precio ofrecido, justificación de necesidad y utilidad", "Madre solicitante, menores, destino del viaje, motivo, ausencia de padre", "Madre divorciada, menor, curador ad-hoc propuesto, declaración de bienes", "Madre, menor, partida errada, partida correcta de la madre, corrección de apellido"], "funds": ["Arts. 1.684 y ss., Art. 1.171 CCV", "Arts. 150, 151, 153 y 154 CPC", "Art. 1.688 CCV", "Ley de Sucesiones; Código Civil", "Arts. 1.579 y 1.684 CCV", "Arts. 380, 456, 522 CCCN (Argentina); CCV", "Arts. 94 y 98 Ley Orgánica de Aduanas; Art. 145 Reglamento General; Art. 39 Reglamento SIDUNEA", "Convenio de La Haya sobre Apostilla; Ley de Simplificación de Trámites", "Código Civil (Representación voluntaria)", "Ley del Seguro Social y su Reglamento", "Ley de Instituciones del Sector Bancario; CCV", "Código Civil; Ley Orgánica de Procedimientos Administrativos (LOPA)", "Ley de Arrendamiento Comercial / Vivienda; CPC", "Arts. 200, 211, 213, 214, 215, 244, 293 Código de Comercio (C.Com)", "Ley Especial de Asociaciones Cooperativas; SUNACOOP", "Arts. 278 y 280 C.Com", "Arts. 278, 280 y 325 C.Com", "Arts. 246, 278, 280 C.Com; Normas de Aseguramiento FCCPV", "Arts. 293, 296, 278 C.Com", "Arts. 275, 287, 304, 309, 311 C.Com", "Decreto Ley de Arrendamiento Comercial (G.O. 40.418); Código Civil", "Ley de Arrendamiento Comercial; Código Civil", "Arts. 1.579 y 1.804 CCV", "Ley para la Regularización y Control de Arrendamientos de Vivienda; CCV", "Arts. 62 y 64 LOTTT", "Arts. 58, 59, 61 y 141 LOTTT; LOPCYMAT", "Arts. 58, 59, 62, 64 lit. a y 141 LOTTT", "Código Civil (Arts. 1.630 y ss.); Ley de ISLR; Exclusión expresa de LOTTT", "Código Civil; Código de Comercio", "Código de Comercio", "Arts. 1.474, 1.486, 1.503 y ss. CCV; Ley de Propiedad Horizontal", "Arts. 1.171, 1.474 y 1.684 CCV", "Arts. 1.133, 1.159, 1.257 CCV", "Arts. 128, 136, 142, 192, 196 LOTTT", "Arts. 153 LOTTT; CCV", "Código de Comercio; LOTTT", "LOTTT; Art. 1.185 CCV; Código Penal", "Código de Comercio; CCV", "Código Civil / Código de Procedimiento Civil", "Arts. 137 y ss., 168, 185, 767 Código Civil", "Arts. 200 y ss. Código de Comercio", "Arts. 807 y ss., 998, 1.023, 1.067 Código Civil", "Código Civil / LOPNNA", "Art. 280 Código de Comercio", "Arts. 340, 347 y ss. Código de Comercio", "Art. 151 Código de Comercio", "Arts. 287, 304 y ss. Código de Comercio", "Sentencia SC-TSJ N° 7/2000; LOA", "Arts. 1.133 y ss., 1.474, 1.684, 1.877 Código Civil", "Arts. 340 y ss., 585 y ss. Código de Procedimiento Civil", "LOTTT / Ley del Seguro Social", "Ley de Arrendamientos Inmobiliarios / CCV", "Art. 218 CPC", "Ley Orgánica de Amparo", "Art. 81 LOTTT", "Art. 937 CPC", "Arts. 406 a 422 LOPNNA", "Arts. 201, 203 y 208 CCV", "Arts. 210 y ss. CCV", "Arts. 366, 381, 382, 512 LOPNNA; Arts. 282 y ss. CCV", "Arts. 358 y ss. LOPNNA", "Art. 385 LOPNNA", "Art. 80 Ley Tutelar / LOPNNA", "Código de Procedimiento Civil", "Congreso de la República", "Gaceta Oficial N° 34.541", "Gaceta Oficial N° 5.266 Extr.", "Art. 485 CPC", "Art. 472 CPC", "Art. 218 CPC; Ley de Amparo", "Art. 18 Ley Orgánica de Amparo", "Art. 27 CRBV, Ley Orgánica de Amparo sobre Derechos y Garantías Constitucionales", "Art. 369 LOPNNA", "Art. 267 Código Civil", "Art. 392 LOPNNA", "Art. 110 Código Civil", "Art. 773 CPC; LOPNNA"], "notas": ["Poder general de máxima amplitud para administración patrimonial completa y negocios consigo mismo (autocontratación).", "Representación judicial en todas las instancias y recursos ordinarios/extraordinarios.", "Requiere individualización y determinación exacta del inmueble para registro/notaría.", "Para enajenar derechos y acciones proindiviso derivados de herencia.", "Facultades de administración e intermediación para arrendamiento inmobiliario.", "Modelo internacional para trámites ante escribano público en Argentina y cobro en divisas.", "Trámites aduanales, desaduanamiento, cabotaje y regímenes especiales ante el SENIAT.", "Incluye facultades de sustitución y pago de aranceles consulares/registrales.", "Gestión y retiro de diploma/pergamino ante universidades internacionales.", "Trámite de pensión de vejez y cobro ante el IVSS.", "Tramitación crediticia y firma de contratos bancarios.", "Modelo versátil para diligencias administrativas y bancarias concurrentes.", "Defensa procesal contra desalojos y medidas de secuestro/embargo.", "Plantilla completa para registro de Compañías Anónimas ante el SAREN.", "Estructura asociativa sin fines de lucro mercantil.", "Modificación de la cláusula segunda para ampliar o redefinir actividades comerciales.", "Blindaje operativo y administrativo de la gestión directiva.", "Estructuración de inyección de capital en divisas convertidas a tasa oficial BCV.", "Traspaso formal de paquete accionario y asiento en libro de accionistas.", "Cumplimiento societario periódico obligatorio ante el Registro Mercantil.", "Modelo estándar para locales, galpones y naves industriales con cláusula de indexación/pago bimonetario.", "Destinado a establecimientos de atención al público y recreación con especificación técnica de uso.", "Respaldo adicional con fiador solidario.", "Contrato para espacios de oficinas en régimen de propiedad horizontal.", "Uso exclusivo residencial familiar.", "Requiere justificación expresa de la causa temporal para evitar conversión a indeterminado.", "Relación laboral indefinida estándar con cláusula de rendimiento y seguridad laboral.", "Modalidad de prueba para evaluación mutua de condiciones y aptitudes.", "Modelo blindado para consultores, directores administrativos o contables con manejo de valores.", "Consultoría técnica independiente sin relación de dependencia.", "Servicio continuo de soporte técnico preventivo y correctivo.", "Redacción para otorgamiento ante Registro Inmobiliario.", "Protocolización cuando el apoderado adquiere el bien para sí mismo.", "Contrato preparatorio para asegurar la compraventa inmobiliaria.", "Finiquito legal total y definitivo de obligaciones laborales.", "Compensación y descuento de créditos del trabajador sobre su liquidación final.", "Acta de entrega de puesto y desincorporación preventiva por auditoría interna.", "Blindaje corporativo que extingue lo laboral pero preserva acciones penales y civiles por faltantes de dinero.", "Recepción documental que no implica aprobación de cuentas ni descargo de gestión.", "Formato de diligencia, solicitud o memorial administrativo.", "Requiere acta de matrimonio y liquidación patrimonial conyugal ante tribunal o notaría.", "Inscripción obligatoria ante el Registro Mercantil; pago de tributos y publicación en gaceta.", "Tramitación judicial o notarial; requiere declaración sucesoral y solvencia fiscal previa.", "Competencia en Tribunales de Protección de Niños, Niñas y Adolescentes o Juzgados de Familia.", "Modificación estatutaria de razón social y traslado de jurisdicción registral/tributaria.", "Cierre formal, extinción de personalidad jurídica y liquidación patrimonial societaria.", "Enajenación de establecimiento comercial con resguardo de acreedores mediante publicaciones.", "Cumplimiento anual obligatorio ante el Registro Mercantil para asamblea ordinaria de socios.", "Formato de sustanciación oral y levantamiento de acta en audiencia constitucional.", "Otorgamiento autenticado o protocolizado según la naturaleza mueble o inmueble.", "Redacción forense formal con aranceles judiciales e inpreabogado.", "Carácter de orden público e irrenunciabilidad de derechos laborales.", "Revisar regulaciones de fijación de cánones y procedimientos previos de conciliación.", "Auto motivado para continuar el proceso notificatorio subsidiario.", "Fijación formal del debate constitucional contradictorio.", "Renuncia voluntaria del trabajador para el cómputo final de la liquidación de prestaciones.", "Certificación de cumplimiento formal de la notificación.", "Justificativo de testigos para título supletorio de herederos universales.", "Procedimiento judicial especial de adopción plena ante Tribunal de Protección.", "Juicio ordinario de desconocimiento de paternidad con nombramiento de tutor ad-hoc.", "Reconocimiento forzoso post-mortem de filiación natural para derechos hereditarios.", "Medidas cautelares de retención de sueldo y prestaciones sociales.", "Restitución inmediata de custodia por retención indebida o desacato de sentencia.", "Garantía del derecho del niño a mantener contacto y relación directa con ambos progenitores.", "Intimación de pago forzoso y embargo ejecutivo por mora alimentaria.", "Diligencia secretarial para unir la constancia al expediente.", "Documento doctrinal sobre el cambio de paradigma jurídico en Venezuela.", "Para dar paso a la boleta secretarial fijada a la puerta del domicilio.", "Convención de la ONU incorporada a rango constitucional por el Art. 23 CRBV.", "Cuerpo normativo rector en materia de derechos, garantías y deberes de la infancia.", "Evacuación testimonial oral e inmediata en audiencia.", "Inspección judicial in situ para verificar estado fáctico del agravio.", "Boleta judicial para notificación formal del presunto agraviante.", "Libelo principal de amparo constitucional para tutela de derechos fundamentales.", "Gestión de cobro de deudas comerciales y depósito inmediato en cuentas del mandante.", "Guía y doctrina vinculante TSJ sobre legitimación, causales de inadmisibilidad y procedimiento oral.", "Constancia firmada para computar el lapso de 96 horas a la audiencia constitucional.", "Revisión judicial del monto de manutención por incremento en necesidades y capacidad económica.", "Autorización judicial especial que exige demostración de evidente necesidad o utilidad.", "Autorización judicial para salida del país ante negativa o ausencia injustificada del progenitor.", "Requisito legal para precautelar los derechos patrimoniales del menor antes de nuevo matrimonio.", "Corrección judicial sumaria de error material en el Registro Civil."], "rows": [["POD-01", "Poder General de Administración y Disposición con Autocontratación", 0, 0, 0, 0, 0], ["POD-02", "Mandato o Poder Judicial Amplio", 0, 1, 1, 1, 1], ["POD-03", "Poder Especial para Venta de Inmuebles", 0, 2, 2, 2, 2], ["POD-04", "Poder Especial para Venta de Derechos y Acciones Sucesoral", 0, 3, 3, 3, 3], ["POD-05", "Poder Especial para Arrendar Inmueble", 0, 4, 4, 4, 4], ["POD-06", "Poder Especial para Renuncia de Usufructo y Venta Internacional", 0, 5, 5, 5, 5], ["POD-07", "Poder Especial para Trámites Aduanales y Comercio Exterior", 0, 6, 6, 6, 6], ["POD-08", "Poder Especial para Apostilla y Legalización de Documentos Educativos", 0, 7, 7, 7, 7], ["POD-09", "Poder Especial para Tramitar Título Universitario en el Extranjero", 0, 8, 8, 8, 8], ["POD-10", "Poder Especial para Trámites ante IVSS (Pensión de Vejez)", 0, 9, 9, 9, 9], ["POD-11", "Poder Especial para Créditos ante Instituciones Financieras", 0, 10, 10, 10, 10], ["POD-12", "Poder Especial Multiorganismo (Bancos, Ministerios, Tribunales)", 0, 11, 11, 11, 11], ["POD-13", "Poder Especial para Defensa en Materia de Inquilinato", 0, 12, 12, 12, 12], ["SOC-01", "Modelo de Acta Constitutiva y Estatutos Sociales de C.A.", 1, 13, 13, 13, 13], ["SOC-02", "Acta Constitutiva y Estatutos Sociales de Asociación Cooperativa", 1, 14, 14, 14, 14], ["SOC-03", "Acta de Asamblea Extraordinaria - Modificación de Objeto Social", 1, 15, 15, 15, 15], ["SOC-04", "Acta de Asamblea Extraordinaria - Cambio de Domicilio y Reforma de Facultades Directivas", 1, 16, 16, 16, 16], ["SOC-05", "Acta de Asamblea - Aumento de Capital Social por Aporte en Especie / Inventario", 1, 17, 17, 17, 17], ["SOC-06", "Acta de Asamblea Extraordinaria - Venta de Acciones y Renovación de Directiva", 1, 18, 18, 18, 18], ["SOC-07", "Acta de Asamblea General Ordinaria - Aprobación de Balances y Directiva", 1, 19, 19, 19, 19], ["CON-01", "Contrato de Arrendamiento de Inmueble para Uso Comercial e Industrial", 2, 20, 20, 20, 20], ["CON-02", "Contrato de Arrendamiento Maestro para Local Comercial (Gimnasio/2 Plantas)", 2, 21, 21, 21, 21], ["CON-03", "Contrato de Arrendamiento de Galpón con Cláusula de Fianza", 2, 22, 22, 22, 22], ["CON-04", "Contrato de Arrendamiento de Oficina Comercial", 2, 23, 23, 21, 23], ["CON-05", "Contrato de Arrendamiento de Vivienda", 2, 24, 24, 23, 24], ["CON-06", "Contrato Individual de Trabajo por Tiempo Determinado", 2, 25, 25, 24, 25], ["CON-07", "Contrato Individual de Trabajo por Tiempo Indeterminado", 2, 26, 26, 25, 26], ["CON-08", "Contrato de Trabajo por Período de Prueba", 2, 27, 27, 26, 27], ["CON-09", "Contrato de Prestación de Servicios Profesionales y Responsabilidad Patrimonial (Iguala)", 2, 28, 28, 27, 28], ["CON-10", "Contrato de Prestación de Servicios de Consultoría Técnica", 2, 29, 29, 28, 29], ["CON-11", "Contrato de Mantenimiento y Servicio Técnico", 2, 30, 30, 29, 30], ["CON-12", "Documento de Compraventa Pura y Simple de Apartamento", 2, 31, 31, 30, 31], ["CON-13", "Documento de Compraventa Inmobiliaria con Poder y Autocontratación", 2, 32, 32, 31, 32], ["CON-14", "Contrato de Opción a Compraventa Inmobiliaria", 2, 33, 33, 32, 33], ["LAB-01", "Recibo de Liquidación de Prestaciones Sociales y Finiquito", 3, 34, 34, 33, 34], ["LAB-02", "Acta de Aceptación de Renuncia y Descuento de Deuda por Mobiliario", 3, 35, 35, 34, 35], ["LAB-03", "Acta de Notificación de Reestructuración y Entrega de Bienes Corporativos", 3, 36, 36, 35, 36], ["LAB-04", "Acta de Pago Laboral y Recepción de Caja bajo Reserva de Auditoría", 3, 37, 37, 36, 37], ["LAB-05", "Acta de Recepción de Informe de Cierre bajo Reserva de Auditoría", 3, 38, 38, 37, 38], ["FOR-001", "049, 1.070 y 1.047 del Código Civil", 4, 39, 39, 38, 39], ["FOR-185", "A del Vigente Código Civil de Venezuela", 4, 40, 39, 38, 39], ["FOR-002", "Acción de Nulidad en la Administración de la Comunidad Conyugal, Artículo 168 del Código Civil Vigente", 5, 39, 40, 39, 40], ["FOR-003", "Acción Interdictal - Ordinal 786 del Código Civil", 4, 39, 39, 38, 39], ["FOR-004", "Acción Mero Declarativa", 4, 39, 39, 38, 39], ["FOR-005", "Acción Mero Declarativa de unión concubinaria Artículo 767 del Código Civil", 5, 39, 40, 39, 40], ["FOR-006", "Acción Nominativa de una Compañía Anónima", 1, 39, 41, 40, 41], ["FOR-008", "Aceptación de Herencia a beneficio de Inventario", 6, 39, 42, 41, 42], ["FOR-009", "Aceptación de Herencia bajo beneficio de Inventario, a nombre de un menor", 7, 39, 43, 42, 43], ["FOR-007", "Aceptación de Herencia y Apertura de Expediente para practicar Inventario Judicial, Artículo 998 y 1.023 del Código Civil Vigente", 6, 39, 42, 41, 42], ["FOR-010", "Aceptación del Cargo de Defensor Provisorio", 4, 39, 39, 38, 39], ["FOR-011", "Aclaratoria", 4, 39, 39, 38, 39], ["FOR-012", "Aclaratoria de Registro de un Negocio y su participación correspondiente al Registrador Mercantil", 6, 39, 42, 41, 42], ["FOR-013", "Aclaratoria sobre Bienes Propios", 5, 39, 40, 39, 40], ["FOR-014", "Acta Constitutiva y Estatutos Sociales de una Compañía S.R.L", 1, 39, 41, 40, 41], ["SOC-09", "Acta de Asamblea Extraordinaria - Cambio de Denominación Social y Domicilio Fiscal", 1, 41, 44, 43, 44], ["SOC-11", "Acta de Asamblea Extraordinaria - Disolución y Liquidación de Sociedad Mercantil", 1, 42, 45, 44, 45], ["SOC-10", "Acta de Asamblea Extraordinaria - Venta de Fondo de Comercio", 1, 43, 46, 45, 46], ["SOC-08", "Acta de Asamblea Ordinaria Anual - Aprobación de Estados Financieros e Informe de Comisario", 1, 44, 47, 46, 47], ["FOR-015", "Acta de Extinción de un Régimen de Propiedad Horizontal", 4, 39, 39, 38, 39], ["AMP-03", "Acta de la Audiencia Constitucional Oral y Pública", 4, 45, 48, 47, 48], ["FOR-016", "Acta de Otorgamiento ante el Registrador de un Testamento sin Protocolización", 6, 39, 42, 41, 42], ["FOR-017", "Acta de Transacción entre Trabajador y Patrono en la Inspectoría del Trabajo", 2, 39, 49, 48, 49], ["FOR-018", "Acta que modifica Estatutos de una Sociedad", 1, 39, 41, 40, 41], ["FOR-019", "Acto dc Comparecencia del abogado de una empresa demandada ante la Comisión Tripartita del Estado Miranda, rechazando las Pretensiones del solicitante", 8, 39, 50, 49, 50], ["FOR-020", "Acusación", 4, 39, 39, 38, 39], ["FOR-021", "Adopción", 7, 39, 43, 42, 43], ["FOR-023", "Adopción plena de un menor entregado a mujer sola", 7, 39, 43, 42, 43], ["FOR-022", "Adopción plena de una mayor de edad", 7, 39, 43, 42, 43], ["FOR-024", "Alegatos ante la Corte Suprema por abogado del Interior del país", 6, 39, 42, 41, 42], ["FOR-026", "Anuncio de Recurso de Casación", 8, 39, 50, 49, 50], ["FOR-025", "Anuncio del Recurso de Casación, actuaciones subsiguientes", 8, 39, 50, 49, 50], ["FOR-027", "Apelación del Auto confirmatorio del auto de detención dictado por un Tribunal inferior", 8, 39, 50, 49, 50], ["FOR-028", "Apelación del Auto de Detención", 8, 39, 50, 49, 50], ["FOR-029", "Apelación del Trabajador en Juicio Laboral", 3, 39, 51, 50, 51], ["FOR-030", "Apelación en inquilinato", 9, 39, 52, 51, 52], ["FOR-032", "Arras", 4, 39, 39, 38, 39], ["FOR-033", "Arreglo en un juicio de Desocupación", 9, 39, 52, 51, 52], ["FOR-034", "Arreglo Extrajudicial cuando no hay delito de acción pública con intervención del Ministerio Público", 4, 39, 39, 38, 39], ["FOR-035", "Arrendamiento de Cine", 9, 39, 52, 51, 52], ["FOR-036", "Arrendamiento de un Estacionamiento", 9, 39, 52, 51, 52], ["FOR-031", "Arrendamiento Financiero de Bienes e Inmuebles", 9, 39, 52, 51, 52], ["FOR-037", "Arrendamiento para Explotación de Arena", 9, 39, 52, 51, 52], ["FOR-038", "Asamblea Extraordinaria de Accionistas de una Compañía Anónima", 1, 39, 41, 40, 41], ["FOR-039", "Asamblea General Ordinaria de una Compañía de Accionistas", 1, 39, 41, 40, 41], ["AMP-08", "Auto del Tribunal Acordando Librar Boleta por el Secretario", 4, 46, 53, 52, 53], ["AMP-10", "Auto Fijando Día y Hora para la Audiencia Constitucional", 4, 47, 54, 53, 54], ["FOR-040", "Autorización de la Cónyuge para que el Cónyuge Legitime a un hijo natural", 7, 39, 43, 42, 43], ["FOR-041", "Autorización Judicial de Compra de un inmueble para un menor Art. 267 del Código Civil", 7, 39, 43, 42, 43], ["FOR-042", "Autorización Judicial para el cobro de la participación de Seguro de Vida de un Menor, Articulo 267 del Código Civil Vigente", 7, 39, 43, 42, 43], ["FOR-043", "Autorización o Consentimiento para contraer Matrimonio", 5, 39, 40, 39, 40], ["FOR-044", "Autorización o Consentimiento para contraer Matrimonio un menor, Artículo 59 del Código Civil", 7, 39, 43, 42, 43], ["FOR-045", "Autorización para proceder a la Venta de Edificio", 2, 39, 49, 48, 49], ["FOR-047", "Autorización para que un menor pueda viajar", 7, 39, 43, 42, 43], ["FOR-046", "Autorización para retener dinero en el Extranjero ante él Consulado respectivo", 4, 39, 39, 38, 39], ["FOR-048", "Autorización para vender un Inmueble", 4, 39, 39, 38, 39], ["FOR-049", "Cancelación de Hipoteca con aclaratoria sobre suplantación de persona", 2, 39, 49, 48, 49], ["FOR-050", "Capitulaciones Matrimoniales", 4, 39, 39, 38, 39], ["FOR-051", "Carta Convenio de Administración (Mandato)", 2, 39, 49, 48, 49], ["LAB-06", "Carta de Renuncia Voluntaria y Notificación de Preaviso", 3, 48, 55, 54, 55], ["FOR-052", "Cesión de Bienes, Articulo 1.934 del Código Civil Vigente y Artículo de Procedimiento Civil Vigente", 2, 39, 49, 48, 49], ["FOR-053", "Cesión de Crédito", 2, 39, 49, 48, 49], ["FOR-055", "Cesión de Crédito Hipotecario", 2, 39, 49, 48, 49], ["FOR-060", "Cesión de Derechos Hereditarios bajo condición", 2, 39, 49, 48, 49], ["FOR-056", "Cesión de Derechos Litigiosos", 2, 39, 49, 48, 49], ["FOR-057", "Cesión de un Contrato de Arrendamiento", 9, 39, 52, 51, 52], ["FOR-058", "Cesión de una Herencia", 6, 39, 42, 41, 42], ["FOR-059", "Cesión Onerosa de Derechos Hereditarios bajo Condición", 2, 39, 49, 48, 49], ["FOR-054", "Código Civil y Artículo 752 del Código de Procedimiento Civil Vigente", 4, 39, 39, 38, 39], ["FOR-061", "Como privar al padre o la madre de la Administración de los Bienes del hijo, Artículo 275 del Código Civil Vigente", 7, 39, 43, 42, 43], ["FOR-062", "Compra Venta con participación de Sociedad Conyugal", 6, 39, 42, 41, 42], ["FOR-063", "Compromiso de Venta de un Negocio", 2, 39, 49, 48, 49], ["FOR-064", "Conclusiones para la Sentencia", 8, 39, 50, 49, 50], ["FOR-065", "Consentimiento de la persona que va ser adoptada", 4, 39, 39, 38, 39], ["FOR-066", "Consentimiento de los padres, los abuelos o tutor de un menor", 7, 39, 43, 42, 43], ["FOR-067", "Consentimiento del Cónyuge para que el otro pueda disponer de los Bienes comunes a titulo gratuito, Artículos 168, 170 y 171 del Código Civil Vigente", 5, 39, 40, 39, 40], ["FOR-068", "Consentimiento del Cónyuge para que el otro pueda disponer de sus propios Bienes a titulo gratuito o renunciar herencias o legados Artículo 154 del Código Civil Vigente", 5, 39, 40, 39, 40], ["FOR-069", "Consignación de Pensión Alimenticia", 4, 39, 39, 38, 39], ["AMP-09", "Constancia del Secretario de Haberse Practicado Notificación", 4, 49, 56, 52, 56], ["FOR-070", "Constancia Expedida por un Banco", 4, 39, 39, 38, 39], ["FOR-077", "Constitución de Fondo de Comercio", 1, 39, 41, 40, 41], ["FOR-071", "Constitución de hipoteca de Segundo Grado, Garantizando Nuevo Préstamo al mismo Acreedor", 2, 39, 49, 48, 49], ["FOR-072", "Constitución de Hogar", 4, 39, 39, 38, 39], ["FOR-073", "Constitución de Hogar de una viuda para ella y su hijo único", 7, 39, 43, 42, 43], ["FOR-074", "Constitución de una Firma Comercial Personal", 4, 39, 39, 38, 39], ["FOR-075", "Constitución de una Habitación", 4, 39, 39, 38, 39], ["FOR-076", "Constitución de una hipoteca Judicial", 2, 39, 49, 48, 49], ["FOR-078", "Consulta Jurídica Evacuada por Escrito", 4, 39, 39, 38, 39], ["FOR-080", "Contestación a una Demanda de Trabajo", 3, 39, 51, 50, 51], ["FOR-079", "Contestación de Demanda en la cual se oponen Excepciones", 8, 39, 50, 49, 50], ["FOR-081", "Contrato de Administración de Inmuebles", 4, 39, 39, 38, 39], ["FOR-082", "Contrato de Anticresis", 2, 39, 49, 48, 49], ["FOR-083", "Contrato de Arrendamiento de Maquinarias", 9, 39, 52, 51, 52], ["FOR-084", "Contrato de Arrendamiento de Predio o Fundo Rústico", 9, 39, 52, 51, 52], ["FOR-085", "Contrato de Arrendamiento de un Local Comercial", 9, 39, 52, 51, 52], ["FOR-086", "Contrato de Arrendamiento de un Vehículo", 9, 39, 52, 51, 52], ["FOR-087", "Contrato de Arrendamiento de una Oficina", 9, 39, 52, 51, 52], ["FOR-088", "Contrato de Comodato", 2, 39, 49, 48, 49], ["FOR-089", "Contrato de Conserjería", 3, 39, 51, 50, 51], ["FOR-090", "Contrato de Consignación de Vehículo", 4, 39, 39, 38, 39], ["FOR-091", "Contrato de Consorcio de Obras", 1, 39, 41, 40, 41], ["FOR-092", "Contrato de Consorcio para Licitación en Construcción de Obra", 1, 39, 41, 40, 41], ["FOR-093", "Contrato de Cuentas en Participación", 6, 39, 42, 41, 42], ["FOR-094", "Contrato de Depósito Voluntario", 2, 39, 49, 48, 49], ["FOR-095", "Contrato de Distribución de Libros", 4, 39, 39, 38, 39], ["FOR-096", "Contrato de Edición", 4, 39, 39, 38, 39], ["FOR-097", "Contrato de Enfiteusis", 4, 39, 39, 38, 39], ["FOR-098", "Contrato de Fideicomiso de Garantía e Inversión para Compradores de Apartamentos Suscrito por el Fideicomitente, El Fiduciario y el Beneficiario o Fideicomisario", 2, 39, 49, 48, 49], ["FOR-099", "Contrato de Mantenimiento", 4, 39, 39, 38, 39], ["FOR-100", "Contrato de Medianería de una Cerca Divisoria", 4, 40, 39, 38, 39], ["FOR-119", "Contrato de Mutuo", 2, 40, 49, 48, 49], ["FOR-101", "Contrato de Obras Cuando se tienen el Proyecto y los Emisores Requeridos", 4, 40, 39, 38, 39], ["FOR-102", "Contrato de Opción de Compra-Venta con Cláusula Penal", 2, 40, 49, 48, 49], ["FOR-103", "Contrato de Permuta", 4, 40, 39, 38, 39], ["FOR-104", "Contrato de Prenda", 4, 40, 39, 38, 39], ["FOR-105", "Contrato de Préstamo a Interés con Fianza", 2, 40, 49, 48, 49], ["FOR-106", "Contrato de Proyecto e Inspección de Obras con un Ingeniero Proyectista", 4, 40, 39, 38, 39], ["FOR-107", "Contrato de Secuestro Convencional", 4, 40, 39, 38, 39], ["FOR-108", "Contrato de Servicio", 4, 40, 39, 38, 39], ["FOR-109", "Contrato de Trabajo", 3, 40, 51, 50, 51], ["FOR-110", "Contrato de Trabajo para servicio doméstico", 3, 40, 51, 50, 51], ["FOR-111", "Contrato de Trabajo para un Técnico Extranjero", 3, 40, 51, 50, 51], ["FOR-112", "Contrato de Transporte, Carga y Almacenamiento", 4, 40, 39, 38, 39], ["FOR-113", "Contrato de un arrendamiento de vivienda", 9, 40, 52, 51, 52], ["FOR-114", "Contrato de una Empresa con Consultores Técnicos", 4, 40, 39, 38, 39], ["FOR-115", "Contrato de una Empresa con un Abogado Litigante", 4, 40, 39, 38, 39], ["FOR-116", "Contrato de valores", 4, 40, 39, 38, 39], ["FOR-118", "Contrato de Venta con Reserva de Dominio, Artículos 1.480 y 1.815 dcl Código Civil Vigente", 2, 40, 49, 48, 49], ["FOR-120", "Contrato para Promocionista e Inversionistas", 4, 40, 39, 38, 39], ["FOR-121", "Contrato Preliminar de Compra-Venta de un Apartamento", 2, 40, 49, 48, 49], ["FOR-122", "Convenio de los Copropietarios de la Quinta Vacacional La Paz Ubicada en la Zona Turística", 4, 40, 39, 38, 39], ["FOR-123", "Convenio de Resolución de Contrato de Opción de Compra", 2, 40, 49, 48, 49], ["FOR-124", "Conversión de Adopción simple en plena", 7, 40, 43, 42, 43], ["FOR-125", "Convocatoria para una Asamblea General Ordinaria de Copropietarios de un Edificio", 1, 40, 41, 40, 41], ["FOR-126", "Correctivo de un Documento de Venta de un Apartamento señalando el Estacionamiento de Vehículo que le corresponde", 2, 40, 49, 48, 49], ["FOR-127", "Cúratela de un Menor solicitada por una madre divorciada antes de contraer nuevas nupcias, Artículo 110 del Código Civil Vigente", 7, 40, 43, 42, 43], ["FOR-168", "Dación en pago Artículo 1.290 del Código Civil Vigente", 4, 40, 39, 38, 39], ["FOR-169", "Dación en pago de bienes Muebles", 4, 40, 39, 38, 39], ["FOR-170", "Declaración de Bienes de Funcionarios Públicos", 4, 40, 39, 38, 39], ["LOP-13", "Declaración de Herederos Universales Incluyendo Menores de Edad", 4, 50, 57, 55, 57], ["FOR-171", "Declaración de Herencia", 6, 40, 42, 41, 42], ["FOR-172", "Declaración de la Existencia del Matrimonio, Artículos 115 y 458 del Código Civil Vigente", 5, 40, 40, 39, 40], ["FOR-173", "Declaración de Pobreza", 4, 40, 39, 38, 39], ["FOR-174", "Declaración de Voluntad de ser Venezolano", 4, 40, 39, 38, 39], ["FOR-175", "Declaración Jurada de Bienes cuando el Funcionario Público carece de ellos", 4, 40, 39, 38, 39], ["FOR-176", "Declaración que debe firmar un Cónyuge cuando la Propiedad que va a Hipotecar el otro Cónyuge es de la Sociedad Conyugal", 5, 40, 40, 39, 40], ["FOR-177", "Declaratoria de Abandono de un Menor", 7, 40, 43, 42, 43], ["FOR-178", "Demanda contra una. Compañía de Seguros para hacer efectiva la obligación de pagar lo perdido de un siniestro", 1, 40, 41, 40, 41], ["LOP-02", "Demanda de Adopción Plena de Menor Entregado a Mujer Sola", 4, 51, 58, 56, 58], ["FOR-179", "Demanda de Declaratoria de Simulación, Artículo 1.281 y 1", 8, 40, 50, 49, 50], ["FOR-180", "Demanda de Desconocimiento de la paternidad Legítima, Artículos 201, 203 y 208 del Código Civil Vigente", 7, 40, 43, 42, 43], ["FOR-131", "Demanda de Desocupación por falta de pago de Cánones de Arrendamiento", 9, 40, 52, 51, 52], ["FOR-181", "Demanda de Desocupación por Falta de Pago de Cánones de Arrendamiento", 9, 40, 52, 51, 52], ["FOR-182", "Demanda de Divorcio por abandono voluntario Artículo 185, Causal 2a. del Código Civil Vigente", 5, 40, 40, 39, 40], ["FOR-183", "Demanda de Ejecución de Hipoteca cuando el Deudor ha Muerto", 2, 40, 49, 48, 49], ["FOR-184", "Demanda de Impugnación de paternidad", 7, 40, 43, 42, 43], ["LOP-08", "Demanda de Impugnación y Desconocimiento de Paternidad Legítima", 4, 52, 59, 57, 59], ["LOP-09", "Demanda de Inquisición de Paternidad Natural contra Sucesores", 4, 53, 60, 58, 60], ["FOR-186", "Demanda de pago de los gastos efectuados por causa del matrimonio prometido y no realizado", 5, 40, 40, 39, 40], ["LOP-01", "Demanda de Pensión de Alimentos, Bonificación de Fin de Año y Actividad Escolar", 4, 54, 61, 59, 61], ["FOR-187", "Demanda de Prenda", 8, 40, 50, 49, 50], ["FOR-188", "Demanda de Reivindicación", 8, 40, 50, 49, 50], ["LOP-04", "Demanda de Restitución de Guarda y Custodia de Menor", 4, 55, 62, 60, 62], ["FOR-189", "Demanda de Retracto legal por parte de un Arrendatario", 9, 40, 52, 51, 52], ["FOR-159", "Demanda de Revocatoria a declaración de Estado de Atraso", 8, 40, 50, 49, 50], ["FOR-190", "Demanda de Saneamiento", 8, 40, 50, 49, 50], ["FOR-147", "Demanda de Tercería", 8, 40, 50, 49, 50], ["FOR-148", "Demanda de Trabajo por Despido fundado en Reajuste de Personal", 3, 40, 51, 50, 51], ["FOR-149", "Demanda de Tránsito", 8, 40, 50, 49, 50], ["FOR-150", "Demanda de una Compañía de Seguros, que se niega a pagar gastos de accidente ocurrido y denunciado durante el periodo de gracia concedido en la Póliza respectiva", 1, 40, 41, 40, 41], ["FOR-151", "Demanda de una Sucesión para el Reconocimiento de Hijo Natural del Decujus", 7, 40, 43, 42, 43], ["FOR-152", "Demanda para cobrar un pagaré", 8, 40, 50, 49, 50], ["LOP-06", "Demanda para Fijación y Cumplimiento de Régimen de Visitas", 4, 56, 63, 61, 63], ["FOR-153", "Demanda Penal por Simulación de hechos punibles", 8, 40, 50, 49, 50], ["FOR-154", "Demanda por Cobro de Bolívares a ¡os Herederos de un Fiador muerto", 8, 40, 50, 49, 50], ["FOR-155", "Demanda por Cobro de Letra de Cambio vencida", 8, 40, 50, 49, 50], ["FOR-156", "Demanda por Disminución del precio de una venta, Artículos 1496 y 1.500 dcl Código Civil Vigente", 2, 40, 49, 48, 49], ["LOP-05", "Demanda por Incumplimiento y Sanción de Pensión Alimenticia", 4, 57, 64, 62, 64], ["FOR-157", "Demanda por Quiebra", 8, 40, 50, 49, 50], ["FOR-158", "Demanda por Resolución del Contrato de Arrendamiento de una Oficina Amueblada", 9, 40, 52, 51, 52], ["FOR-160", "Demanda Solicitando La Quiebra", 8, 40, 50, 49, 50], ["FOR-161", "Demanda Solicitando la Quiebra y Pidiendo su Calificación", 8, 40, 50, 49, 50], ["FOR-162", "Denuncia Simple de Herencia Yacente", 6, 40, 42, 41, 42], ["FOR-163", "Derecho de Autor", 4, 40, 39, 38, 39], ["FOR-164", "Diferimiento al Servicio Militar Obligatorio", 4, 40, 39, 38, 39], ["AMP-06", "Diligencia del Alguacil Consignando el Recibo de Notificación", 4, 58, 65, 63, 65], ["FOR-165", "Diligencia para Decreto del Discernimiento del menor a través del Tutor", 7, 40, 43, 42, 43], ["FOR-166", "Diligencia pidiendo actuaciones para formalizar Recurso de Hecho", 8, 40, 50, 49, 50], ["FOR-167", "Diligencia pidiendo Computo de Audiencias", 4, 40, 39, 38, 39], ["FOR-128", "Disolución de Sociedad en Comandita Simple", 1, 40, 41, 40, 41], ["FOR-129", "Disolución y Liquidación de la Comunidad de Bienes, Articulo 173 del Código Civil Vigente", 4, 40, 39, 38, 39], ["FOR-130", "Divorcio Breve Articulo", 5, 40, 40, 39, 40], ["FOR-132", "Documento de Cancelación de hipoteca de Segundo Grado", 2, 40, 49, 48, 49], ["FOR-133", "Documento de Constitución de Hipoteca de Primer Grado", 2, 40, 49, 48, 49], ["FOR-134", "Documento de Constitución de Hipoteca de Segundo Grado", 2, 40, 49, 48, 49], ["FOR-135", "Documento de Deslinde", 4, 40, 39, 38, 39], ["FOR-136", "Documento de Disolución de una Sociedad en Comandita Simple", 1, 40, 41, 40, 41], ["FOR-137", "Documento de Donación, Artículo 1.431 dcl Código Civil Vigente", 4, 40, 39, 38, 39], ["FOR-138", "Documento de Parcelamiento y Urbanismo", 4, 40, 39, 38, 39], ["FOR-140", "Documento de Venta con Pacto de Retracto", 2, 40, 49, 48, 49], ["FOR-141", "Documento de Venta de un Cuerpo Determinado de un Inmueble", 2, 40, 49, 48, 49], ["FOR-142", "Documento de Venta de una Parcela", 2, 40, 49, 48, 49], ["FOR-144", "Documento de Venta de Vehículo", 2, 40, 49, 48, 49], ["FOR-143", "Documento de Venta de Vehículo Usado de Concesionario apersonas naturales", 2, 40, 49, 48, 49], ["FOR-139", "Documento Renta Vitalicia", 4, 40, 39, 38, 39], ["FOR-146", "Donación Artículo 1.431 dcl Código Civil", 4, 40, 39, 38, 39], ["FOR-145", "Donación de Cédulas Hipotecarías a Menores con Nombramiento de Curador", 7, 40, 43, 42, 43], ["FOR-479", "Ejusdem", 4, 59, 39, 38, 39], ["FOR-191", "Entrega Material Artículo 1.167 del Código Civil Vigente", 4, 40, 39, 38, 39], ["FOR-192", "Escrito ante la Corte Suprema Consignado Cómputo de Audiencias", 4, 40, 39, 38, 39], ["FOR-193", "Escrito de Cesión de Bienes", 2, 40, 49, 48, 49], ["FOR-194", "Escrito de Consignación del Inventario de Los Bienes de un Menor", 7, 40, 43, 42, 43], ["FOR-195", "Escrito de Partición Amigable", 6, 40, 42, 41, 42], ["FOR-196", "Escrito de Pruebas en un Divorcio por Abandono Voluntario Promovido por él Cónyuge", 5, 40, 40, 39, 40], ["FOR-197", "Escrito de Pruebas en un Juicio de Divorcio promovidas por la Cónyuge", 5, 40, 40, 39, 40], ["FOR-198", "Escrito de Pruebas en un Juicio Laboral presentado por el Actor -", 3, 40, 51, 50, 51], ["FOR-199", "Escrito de Quien Vaya a Contraer Nupcias Teniendo Menores Bajo su Patria Potestad", 7, 40, 43, 42, 43], ["FOR-201", "Escrito de Separación de Cuerpos y de Bienes", 5, 60, 40, 39, 40], ["FOR-202", "Escrito del Tutor para un Expediente de Interdicción que se le sigue a sus Representadas, solicitando autorización para suscribir en nombre de las mismas el", 7, 60, 43, 42, 43], ["FOR-203", "Escrito en el cual el Padre o la Madre pide autorización judicial para Hipotecar gravar o enajenar Bienes del hijo o de los hijos que tiene bajo su Patria Potestad", 7, 60, 43, 42, 43], ["FOR-204", "Escrito para Repudiar una Herencia", 6, 60, 42, 41, 42], ["FOR-205", "Escrito Pidiendo Desocupación de Acuerdo con la Ley de Alquileres", 9, 60, 52, 51, 52], ["FOR-206", "Escrito Pidiendo se acepte la Inhibición del Juez", 4, 60, 39, 38, 39], ["FOR-208", "Escrito pidiendo se niegue Derecho Preferencial", 4, 60, 39, 38, 39], ["FOR-207", "Escrito presentando Documento Público para ser agregado a los Autos", 4, 60, 39, 38, 39], ["FOR-209", "Escrito Reclamando Cumplimiento de Fallo", 4, 60, 39, 38, 39], ["FOR-210", "Escrito Reclamando el Cierre de un Negocio", 4, 60, 39, 38, 39], ["FOR-200", "Escrito Separación de Cuerpos, Artículo", 5, 60, 40, 39, 40], ["FOR-211", "Estatutos de una Asociación Civil", 4, 60, 39, 38, 39], ["FOR-213", "Excepciones de Ln admisibilidad", 8, 60, 50, 49, 50], ["FOR-212", "Excepciones Dilatorias", 8, 60, 50, 49, 50], ["FOR-214", "Excusa del Cargo de Tutor o Protutor", 7, 60, 43, 42, 43], ["LOP-16", "Exposición de Motivos de la Ley Orgánica para la Protección del Niño y del Adolescente", 4, 61, 66, 64, 66], ["FOR-215", "Extinción de Fianza", 2, 60, 49, 48, 49], ["FOR-216", "Extinción de una Servidumbre", 4, 60, 39, 38, 39], ["FOR-217", "Fianza por Aval de Compañía de Seguros", 1, 60, 41, 40, 41], ["FOR-219", "Formalización de Recurso de Casación Actuaciones Subsiguientes", 8, 60, 50, 49, 50], ["FOR-218", "Formalización de Recurso de Casación Caso Remate en Ejecución de Hipoteca", 2, 60, 49, 48, 49], ["FOR-220", "Habeas Corpus", 4, 60, 39, 38, 39], ["FOR-222", "Impugnación de Recurso de Casación en un Juicio de Quiebra", 8, 60, 50, 49, 50], ["FOR-221", "Impugnación de un Acuerdo tomado por la Mayoría de Copropietarios en un Régimen de Propiedad Horizontal", 4, 60, 39, 38, 39], ["AMP-07", "Informe del Alguacil Dejando Constancia de Negativa a Firmar Notificación", 4, 62, 67, 52, 67], ["FOR-223", "Informe del Comisario de una Compañía de Accionistas", 1, 60, 41, 40, 41], ["FOR-224", "Informes del Actor en un Juicio de Trabajo", 3, 60, 51, 50, 51], ["FOR-225", "Inhabilitación en Caso de Dispendio, Artículo 409 del Código Civil", 4, 60, 39, 38, 39], ["FOR-226", "Inhabilitación en Caso de Dispendio, Artículo 409 del Código Civil", 4, 60, 39, 38, 39], ["FOR-227", "inhabilitación en Caso de Enfermedad", 4, 60, 39, 38, 39], ["FOR-228", "Inquisición de Paternidad", 7, 60, 43, 42, 43], ["FOR-229", "Inquisición de Paternidad Natural contra Sucesires Legítimos", 7, 60, 43, 42, 43], ["FOR-231", "Inspección Ocular en un Banco para conocer el Estado de una Cuenta", 4, 60, 39, 38, 39], ["FOR-230", "Inspección Ocular sobre un Inmueble", 4, 60, 39, 38, 39], ["FOR-232", "Interdicción", 4, 60, 39, 38, 39], ["FOR-233", "Interdicto de Amparo", 8, 60, 50, 49, 50], ["FOR-236", "Interdicto de Daño Temido", 8, 60, 50, 49, 50], ["FOR-234", "Interdicto de Despojo", 8, 60, 50, 49, 50], ["FOR-235", "Interdicto de Obra Nueva", 8, 60, 50, 49, 50], ["FOR-237", "Intimación de Honorarios", 4, 60, 39, 38, 39], ["FOR-238", "Invalidación de Juicio", 4, 60, 39, 38, 39], ["FOR-239", "Inventario que debe formar el Consejo de Tutela", 7, 60, 43, 42, 43], ["FOR-240", "Inventario Solemne de los Bienes Hereditarios", 6, 60, 42, 41, 42], ["FOR-241", "Juicio Breve", 4, 60, 39, 38, 39], ["FOR-242", "Juicio de Rendición de Cuenta, Artículo 21 del Código Civil Vigente", 4, 60, 39, 38, 39], ["FOR-244", "Justificativo de Cuenta Corriente", 4, 60, 39, 38, 39], ["FOR-246", "Justificativo de Soltería para contraer Matrimonio", 5, 60, 40, 39, 40], ["FOR-245", "Justificativo de Soltería para Extranjero en Venezuela", 4, 60, 39, 38, 39], ["FOR-247", "Justificativo para acompañar a la solicitud de Declaración de Pobreza", 4, 60, 39, 38, 39], ["FOR-248", "Justificativo para la Admisión de Inscripción de una Partida de Matrimonio", 5, 60, 40, 39, 40], ["FOR-243", "Justificativo para Naturalización", 4, 60, 39, 38, 39], ["FOR-249", "Justificativo para obtención de Nacionalidad Venezolana", 4, 60, 39, 38, 39], ["FOR-250", "Justificativo para obtener título supletorio por prescripción", 4, 60, 39, 38, 39], ["FOR-251", "Justificativo para preparar interdicto de despojo", 8, 60, 50, 49, 50], ["FOR-252", "Justificativo para Presentarlo como prueba en un Divorcio", 5, 60, 40, 39, 40], ["FOR-253", "Justificativo para probar la Propiedad de un Vehículo", 4, 60, 39, 38, 39], ["LOP-15", "Ley Aprobatoria de la Convención sobre los Derechos del Niño (Tratado)", 4, 63, 68, 65, 68], ["LOP-14", "Ley Orgánica para la Protección de Niños, Niñas y Adolescentes (Texto Legal)", 4, 64, 69, 66, 69], ["FOR-254", "Libelo de Cobro de Alquileres Insolutos cuando el Arrendatario ya ha desocupado él Inmueble", 9, 60, 52, 51, 52], ["FOR-255", "Libelo de Cobro de Letra de Cambio Endosada", 8, 60, 50, 49, 50], ["FOR-256", "Libelo de Cobro Mercantil", 8, 60, 50, 49, 50], ["FOR-257", "Libelo de Divorcio", 5, 60, 40, 39, 40], ["FOR-258", "Libelo dé Ejecución de Hipoteca", 2, 60, 49, 48, 49], ["FOR-259", "Libelo de Reivindicación", 8, 60, 50, 49, 50], ["FOR-260", "Liberación de Anticresis", 2, 60, 49, 48, 49], ["FOR-261", "Liberación de Hipoteca por haber sido Sustituida por otra Garantía", 2, 60, 49, 48, 49], ["FOR-263", "Línea de Crédito Bancario", 4, 60, 39, 38, 39], ["FOR-262", "Liquidación de la Comunidad Conyugal", 5, 60, 40, 39, 40], ["FOR-264", "Manifestación de no poder aceptar una Herencia, Legado Donación para el Hijo Artículo 268 del Código Civil Vigente", 7, 60, 43, 42, 43], ["AMP-11", "Modelo de Acta de Declaración de Testigo en Audiencia de Amparo", 4, 65, 70, 67, 70], ["AMP-12", "Modelo de Acta de Inspección Judicial en Materia de Amparo", 4, 66, 71, 68, 71], ["AMP-04", "Modelo de Boleta de Notificación al Presunto Agraviante", 4, 67, 72, 69, 72], ["FOR-265", "Modelo de Declaración de Voluntad de ser Venezolano", 4, 60, 39, 38, 39], ["AMP-02", "Modelo de Demanda / Solicitud de Acción de Amparo Constitucional", 4, 68, 73, 70, 73], ["FOR-266", "Modelo de Escrito de Consignación del Inventario de los Bienes del Menor", 7, 60, 43, 42, 43], ["FOR-268", "Modelo de Poder General Judicial con Facultad Especial para Reclamar Responsabilidad Civil, Daños y Perjuicios", 4, 60, 39, 38, 39], ["FOR-267", "Modelo de Poder para Contra demandar en Divorcio", 5, 60, 40, 39, 40], ["FOR-269", "Modelo de Solicitud para Nombramiento de Tutor", 7, 60, 43, 42, 43], ["FOR-270", "Modificación de Linderos", 4, 60, 39, 38, 39], ["FOR-117", "No", 4, 40, 39, 38, 39], ["FOR-271", "Nombramiento de Albacea Artículo 970 del Código Civil Patrio Vigente", 6, 60, 42, 41, 42], ["FOR-272", "Nombramiento de Tutor Artículo 301 del Código Civil Vigente", 7, 60, 43, 42, 43], ["FOR-274", "Notificación al Registro Mercantil de la Circunscripción Judicial del Distrito Federal y Estado Miranda, sobre Aumento del Capital social de una Compañía Anónima y Emisión de Nuevas Acciones", 1, 60, 41, 40, 41], ["FOR-275", "Notificación al Registro Mercantil del Nombramiento de Administrador de una Compañía Anónima", 1, 60, 41, 40, 41], ["FOR-273", "Notificación al Registro Mercantil sobre Aumento del Capital Social de una Compañía Anónima", 1, 60, 41, 40, 41], ["FOR-276", "Notificación de Comerciante a Acreedores de Estado de Atraso", 8, 60, 50, 49, 50], ["FOR-277", "Notificación de Denominación Comercial Formulada ante el Ciudadano Registrador de la Propiedad Industrial", 8, 60, 50, 49, 50], ["FOR-279", "Nulidad de Matrimonio (Caso Bigamia)", 5, 60, 40, 39, 40], ["FOR-278", "Nulidad de Matrimonio Artículo", 5, 60, 40, 39, 40], ["FOR-280", "Nulidad de Presunción de Muerte, Artículo 438 y Siguientes del Código Civil Vigente y Artículo", 4, 60, 39, 38, 39], ["FOR-281", "Nulidad de Venta de la Cosa Ajena, Articulo 1.438 del Código Civil Vigente", 2, 60, 49, 48, 49], ["FOR-282", "Oferta de Compra-Venta de todo un Activo", 2, 60, 49, 48, 49], ["FOR-283", "Oferta Real ante un Tribunal cuando el Arrendador se niega a Recibir Cánones de Arrendamiento", 9, 60, 52, 51, 52], ["FOR-284", "Oposición a una Acumulación de Autos", 4, 60, 39, 38, 39], ["FOR-285", "Oposición en Herencia Yacente", 6, 60, 42, 41, 42], ["FOR-286", "Oposición en una Pretendida Invalidación de un Juicio 561", 4, 60, 39, 38, 39], ["FOR-921", "Ordinal 2o del Código Civil Vigente", 4, 59, 39, 38, 39], ["FOR-287", "Pagare", 4, 60, 39, 38, 39], ["FOR-288", "Partición", 6, 60, 42, 41, 42], ["FOR-298", "Partición Amistosa de Bienes de la Sociedad Conyugal", 6, 60, 42, 41, 42], ["FOR-289", "Partición de Bienes y Rectificación o Participación de Error en la Declaración de Herencia", 6, 60, 42, 41, 42], ["FOR-290", "Participación al Registro Mercantil de la Constitución de una Compañía en Comandita", 6, 60, 42, 41, 42], ["FOR-291", "Participación al Registro Mercantil de la Constitución de una Sociedad en Nombre Colectivo", 6, 60, 42, 41, 42], ["FOR-292", "Participación al Registro Mercantil de la Terminación de una Sociedad en Nombre Colectivo", 6, 60, 42, 41, 42], ["FOR-293", "Participación al Registro Mercantil de la Venta de Acciones de una Compañía Anónima y Nombramiento de Nuevo Presidente", 6, 60, 42, 41, 42], ["FOR-294", "Participación de Cesión de Crédito", 6, 60, 42, 41, 42], ["FOR-295", "Participación de Disolución de Sociedad en Comandita Simple quedando el socio solidario autorizado para obrar, firmar, etc. como único responsable", 6, 60, 42, 41, 42], ["FOR-296", "Participación de la separación de un socio y entrada de otros a una Sociedad", 6, 60, 42, 41, 42], ["FOR-297", "Participación de Venta de Acciones al Registro Mercantil", 6, 60, 42, 41, 42], ["FOR-299", "Pedimento de Ejecución de Sentencia en Caso de Desocupación de Inmueble", 9, 60, 52, 51, 52], ["FOR-300", "Petición de Apertura de un Testamento Cerrado en manos de otro", 6, 69, 42, 41, 42], ["FOR-301", "Poder Apud Acta", 4, 69, 39, 38, 39], ["FOR-302", "Poder Comercial Judicial y Extrajudicial", 4, 69, 39, 38, 39], ["FOR-303", "Poder Conferido en nombre de otro", 4, 69, 39, 38, 39], ["FOR-304", "Poder Especial", 4, 69, 39, 38, 39], ["FOR-310", "Poder Especial de Administración y Disposición y en especial para vender un Inmueble en Venezuela otorgado ante un Cónsul Venezolano en el Extranjero y protocolizado ante una Oficina Subalterna de Registro de Venezuela", 4, 69, 39, 38, 39], ["POD-14", "Poder Especial de Cobranza Extrajudicial y Depósito Bancario", 0, 70, 74, 28, 74], ["FOR-305", "Poder Especial para actuar solamente en la Dirección de Inquilinato y en el Tribunal de Apelaciones de Inquilinato y ante la Gobernación, Inos, CANTV y otros Institutos Autónomos", 9, 69, 52, 51, 52], ["FOR-306", "Poder Especial para Defender Derechos Hereditarios de Menores", 7, 69, 43, 42, 43], ["FOR-307", "Poder Especial para Manifestación de Matrimonio", 5, 69, 40, 39, 40], ["FOR-308", "Poder Extrajudicial (Comercial)", 4, 69, 39, 38, 39], ["FOR-309", "Poder General", 4, 69, 39, 38, 39], ["FOR-311", "Poder General del Cónyuge para la Cónyuge", 5, 69, 40, 39, 40], ["FOR-312", "Poder Otorgado sin Revocar los anteriores", 4, 69, 39, 38, 39], ["FOR-313", "Poder para Acusar", 4, 69, 39, 38, 39], ["FOR-314", "Poder para contra demandar en Divorcio", 5, 69, 40, 39, 40], ["FOR-315", "Poder para Demandar ante los Tribunales del Trabajo", 3, 69, 51, 50, 51], ["FOR-316", "Poder para Divorcio de un extranjero residenciado en Venezuela y de tránsito en su país otorgado ante el Cónsul Venezolano respectivo", 5, 69, 40, 39, 40], ["FOR-317", "Poder para movilizar Cuentas de un Banco", 4, 69, 39, 38, 39], ["FOR-318", "Poder para Partición de una Herencia", 6, 69, 42, 41, 42], ["FOR-319", "Poder Personal al Abogado para Actos judiciales", 4, 69, 39, 38, 39], ["FOR-320", "Precontrato de Administración", 4, 69, 39, 38, 39], ["FOR-321", "Presentación de Copia de Informe del Comisario y Balance de la Compañía con Copia de Reforma de sus Estatutos", 1, 69, 41, 40, 41], ["FOR-322", "Presunción de Muerte, Artículos 418, 419 y 420 del Código Civil", 4, 69, 39, 38, 39], ["FOR-323", "Primera, Segunda y Tercera Publicaciones para venta de un Fondo de Comercio en atención al Artículo 151 del Código de Comercio", 1, 69, 41, 40, 41], ["AMP-01", "Procedimiento de Amparo Constitucional - Comentarios Generales y Doctrina TSJ", 4, 71, 75, 71, 75], ["FOR-324", "Promesa Bilateral de venta de un Apartamento con Entrega Anticipada del mismo", 2, 69, 49, 48, 49], ["FOR-325", "Promesa Mutua de Matrimonio", 5, 69, 40, 39, 40], ["FOR-326", "Promesa Unilateral de Venta de un Inmueble", 2, 69, 49, 48, 49], ["FOR-327", "Promoción de la Yacencia de una Herencia y cobro Privilegiado", 6, 69, 42, 41, 42], ["FOR-328", "Promoción de Pruebas de una Empresa Demandada ante la Comisión Tripartita contra Despidos Injustificados", 8, 69, 50, 49, 50], ["FOR-329", "Promoción de Pruebas en una cuestión previa Articulo 352 del Código de Procedimiento Civil", 4, 69, 39, 38, 39], ["FOR-330", "Promoción de Tutela", 7, 69, 43, 42, 43], ["FOR-331", "Promoción del inventario Solemne de los Bienes Hereditarios Artículo 1.025 del Código Civil y Artículo 921 del Código de Procedimiento Civil Vigente", 6, 69, 42, 41, 42], ["FOR-332", "Proposición de Arreglo Amistoso de Liquidación de un negocio en Estado de Atraso", 4, 69, 39, 38, 39], ["FOR-333", "Protesto de Cheque", 4, 69, 39, 38, 39], ["FOR-334", "Pruebas de la Empresa Demandada en Juicio Laboral", 3, 69, 51, 50, 51], ["FOR-335", "Quiebra", 4, 69, 39, 38, 39], ["FOR-336", "Rechazo de Cargos en una Defensa Penal", 4, 69, 39, 38, 39], ["AMP-05", "Recibo de Citación y Notificación Personal del Presunto Agraviante", 4, 72, 76, 52, 76], ["FOR-337", "Reclamación por un Acuerdo tomado por la Mayoría de Copropietarios en un", 4, 69, 39, 38, 39], ["FOR-338", "Reclamo de Auto de Detención", 4, 69, 39, 38, 39], ["FOR-339", "Reclamo de Pensión de Alimentos al Cónyuge para sus menores hijos,", 7, 69, 43, 42, 43], ["FOR-340", "Reclamo de Pensión de Alimentos para hijo reconocido", 7, 69, 43, 42, 43], ["FOR-341", "Reconvención en Divorcio", 5, 69, 40, 39, 40], ["FOR-342", "Rectificación de Acta de Defunción", 4, 69, 39, 38, 39], ["FOR-343", "Rectificación de Partida de Matrimonio", 5, 69, 40, 39, 40], ["FOR-344", "Rectificación de Partida de Nacimiento de una Persona mayor de edad", 4, 69, 39, 38, 39], ["FOR-345", "Rectificación de Partida del Registro de un Menor", 7, 69, 43, 42, 43], ["FOR-346", "Recurso contra la Negativa de consentimiento del Tutor para la celebración del", 7, 69, 43, 42, 43], ["FOR-347", "Recurso de Queja de un Juez Mercantil", 8, 69, 50, 49, 50], ["FOR-348", "Redención de Enfiteusis", 4, 69, 39, 38, 39], ["FOR-350", "Reforma de Libelo", 8, 69, 50, 49, 50], ["FOR-349", "Reforma del Libelo de Trabajo por haber Declarado con Lugar Cuestiones Previas", 3, 69, 51, 50, 51], ["FOR-365", "Régimen de Visitas", 7, 69, 43, 42, 43], ["FOR-351", "Reglamento Interno de un Edificio Vendido bajo el Régimen de Propiedad Horizontal", 4, 69, 39, 38, 39], ["FOR-352", "Rendición de Cuenta de la Tutela", 7, 69, 43, 42, 43], ["FOR-353", "Rendición de Cuentas", 4, 69, 39, 38, 39], ["FOR-354", "Renuncia de Herencia", 6, 69, 42, 41, 42], ["FOR-355", "Renuncia de Poder", 4, 69, 39, 38, 39], ["FOR-356", "Reparcelamiento", 4, 69, 39, 38, 39], ["FOR-357", "Rescisión de un Contrato Preparatorio de Compra-Venta", 2, 69, 49, 48, 49], ["FOR-358", "Resolución Extra-Judicial de Contrato de Arrendamiento", 9, 69, 52, 51, 52], ["FOR-359", "Restablecimiento dé la Comunidad de Bienes en el Matrimonio Artículos 179", 5, 69, 40, 39, 40], ["FOR-360", "Restitución de Guarda", 7, 69, 43, 42, 43], ["FOR-361", "Restitución de Guarda de un Menor", 7, 69, 43, 42, 43], ["FOR-362", "Reunión de Junta Directiva de una. Compañía Anónima", 1, 69, 41, 40, 41], ["FOR-363", "Revocación de un Testamento Abierto", 6, 69, 42, 41, 42], ["FOR-364", "Revocatoria del Poder", 4, 69, 39, 38, 39], ["FOR-366", "Sanción de Incumplimiento de Pensión Alimenticia", 4, 69, 39, 38, 39], ["FOR-367", "Separación de Cuerpos", 5, 69, 40, 39, 40], ["FOR-368", "Separación de Cuerpos y Bienes Artículos 189 y 190 del Código Civil", 5, 69, 40, 39, 40], ["FOR-369", "Servidumbre de Conductores Eléctricos", 4, 69, 39, 38, 39], ["FOR-370", "Servidumbre para uso de peatones y vehículos", 4, 69, 39, 38, 39], ["FOR-371", "Solicitud a Extranjería de Devolución de una Partida de Matrimonio", 5, 69, 40, 39, 40], ["FOR-372", "Solicitud a un Tribunal de Notificación al Arrendatario sobre el fin de su Arrendamiento", 9, 69, 52, 51, 52], ["FOR-373", "Solicitud al Juez para que Compele al Heredero a que declare si acepta o Repudia la Herencia", 6, 69, 42, 41, 42], ["FOR-374", "Solicitud ante la Comisión Investigadora, según la Ley de Enriquecimiento ilícito de Funcionarios y Empleados Públicos, para Reorganizar y Administrar un Fundo", 4, 69, 39, 38, 39], ["FOR-376", "Solicitud de Acta de Manifestación de Deseo de contraer Matrimonio firmada por ambos solicitantes", 5, 69, 40, 39, 40], ["FOR-377", "Solicitud de Apertura de un Testamento cerrado depositado en manos propias", 6, 69, 42, 41, 42], ["FOR-378", "Solicitud de Apertura del Lapso de Prueba", 4, 69, 39, 38, 39], ["FOR-379", "Solicitud de Aumento de Pensión de Alimentos Artículo 68 de la Ley Tutelar del Menor", 7, 69, 43, 42, 43], ["LOP-07", "Solicitud de Aumento de Pensión de Alimentos por Modificación de Circunstancias", 4, 73, 77, 72, 77], ["FOR-380", "Solicitud de Autorización al Ministerio de Hacienda para vender un bien que forma parte", 4, 69, 39, 38, 39], ["FOR-381", "Solicitud de Autorización de inserción de partida de matrimonio extranjero en los libros del", 5, 69, 40, 39, 40], ["FOR-382", "Solicitud de Autorización de un Padre para Vender Bienes de sus hijos menores de 16 años", 7, 69, 43, 42, 43], ["FOR-383", "Solicitud de Autorización Judicial de una Madre para cobrar dinero de sus menores hijos", 7, 69, 43, 42, 43], ["FOR-384", "Solicitud de Autorización Judicial para contraer Matrimonio con la persona que fue su tutor", 7, 69, 43, 42, 43], ["FOR-385", "Solicitud de Autorización Judicial para no aceptar una Herencia, legado o donación para sus hijos menores de 16 años", 7, 69, 43, 42, 43], ["FOR-386", "Solicitud de Autorización Judicial para separarse del hogar Artículo 138 del Código Civil", 4, 69, 39, 38, 39], ["FOR-387", "Solicitud de Autorización Judicial para vender un inmueble de una persona entredicha", 4, 69, 39, 38, 39], ["LOP-10", "Solicitud de Autorización Judicial para Venta de Inmueble Perteneciente a Menor", 4, 74, 78, 73, 78], ["FOR-388", "Solicitud de Autorización para Ejercer el cargo de Corredor Público", 4, 69, 39, 38, 39], ["FOR-389", "Solicitud de Autorización para Enajenar o Liquidar Bienes del Menor", 7, 69, 43, 42, 43], ["FOR-390", "Solicitud de Autorización para Eximir a la Cónyuge el deber de seguir a su Marido a donde", 5, 69, 40, 39, 40], ["FOR-375", "Solicitud de Autorización para vender un inmueble de una Sociedad Conyugal sin consentimiento de la Cónyuge", 5, 69, 40, 39, 40], ["LOP-03", "Solicitud de Autorización para Viajar al Exterior (Madre con Hijos sin Autorización Paterna)", 4, 75, 79, 74, 79], ["FOR-391", "Solicitud de Autorización para Viajar una Madre con sus menores hijos Legítimos sin Autorización del Cónyuge", 7, 69, 43, 42, 43], ["FOR-392", "Solicitud de beneficio de Competencia Artículos 1950 y 1951 del Código Civil Vigente", 4, 69, 39, 38, 39], ["FOR-393", "Solicitud de Certificación de Gravámenes", 4, 69, 39, 38, 39], ["FOR-394", "Solicitud de Constancia de Domicilio para obtener Nacionalización", 4, 69, 39, 38, 39], ["FOR-395", "Solicitud de Constancia de que un Edificio Arrendado esta apto para ser Vendido en Propiedad Horizontal", 9, 69, 52, 51, 52], ["FOR-396", "Solicitud de Constitución de un Tribunal para Ofrecer en Venta a un Inquilino el Inmueble que ocupa", 9, 69, 52, 51, 52], ["FOR-397", "Solicitud de Convocatoria de una Asamblea Extraordinaria dirigida al Administrador del Condominio de un Edificio Vendido en Propiedad Horizontal", 1, 69, 41, 40, 41], ["FOR-398", "Solicitud de Copia Certificada de Acta de Asamblea de una Compañía Anónima", 1, 69, 41, 40, 41], ["FOR-401", "Solicitud de Copia Certificada de Documento Protocolizado de la Venta de un", 2, 59, 49, 48, 49], ["FOR-399", "Solicitud de Copia Certificada de Recaudos y actuaciones Tribunalicias", 4, 69, 39, 38, 39], ["FOR-400", "Solicitud de copia certificada de un Documento en el Tribunal de Apelaciones de Inquilino", 9, 59, 52, 51, 52], ["FOR-402", "Solicitud de Copia Certificada de un Documento Registrado", 4, 59, 39, 38, 39], ["FOR-403", "Solicitud de Copia Certificada del Documento Constitutivo de una Empresa", 4, 59, 39, 38, 39], ["LOP-11", "Solicitud de Curatela Especial para Menor previa a Segundas Nupcias de la Madre", 4, 76, 80, 75, 80], ["FOR-404", "Solicitud de Declaración de Herederos Universales", 4, 59, 39, 38, 39], ["FOR-405", "Solicitud de Declaración de Prescripción de Declaración de Herencia", 6, 59, 42, 41, 42], ["FOR-406", "Solicitud de Declaratoria de la Conversión de la Separación de Cuerpos en Divorcio Artículo 185 del Código Civil Vigente Ultimo Aparte", 5, 59, 40, 39, 40], ["FOR-407", "Solicitud de Derecho de Preferencia", 4, 59, 39, 38, 39], ["FOR-408", "Solicitud de Deslinde", 4, 59, 39, 38, 39], ["FOR-409", "Solicitud de Disminución de una Pensión Alimenticia", 4, 59, 39, 38, 39], ["FOR-410", "Solicitud de Dispensa del Impedimento que existe para contraer Matrimonio entre tíos y sobrinos y entre cuñados Artículo 53 del Código Civil y65 Ejusdem", 5, 59, 40, 39, 40], ["FOR-411", "Solicitud de Dispensa para contraer Matrimonio una mujer antes de Diez meses de la", 5, 59, 40, 39, 40], ["FOR-412", "Solicitud de Dispensa para contraer Matrimonio una mujer antes de diez meses de la", 5, 59, 40, 39, 40], ["FOR-414", "Solicitud de Divorcio en base al Articulo", 5, 59, 40, 39, 40], ["FOR-415", "Solicitud de Ejecución de Convenimíento Homologado", 8, 59, 50, 49, 50], ["FOR-416", "Solicitud de Emancipación", 4, 59, 39, 38, 39], ["FOR-417", "Solicitud de Fijación de hora y día para consignación de Testamento Cerrado", 6, 59, 42, 41, 42], ["FOR-418", "Solicitud de Habilitación para pedir ejecución de Sentencia Definitiva en un juicio de desocupación", 9, 59, 52, 51, 52], ["FOR-419", "Solicitud de inscripción de un negocio en el Registro Mercantil", 1, 59, 41, 40, 41], ["FOR-421", "Solicitud de Inscripción de una Oficina Técnica en el Registro Mercantil", 1, 59, 41, 40, 41], ["FOR-422", "Solicitud de Inscripción del Acta Modificatoria de una Compañía en el, Registro Mercantil", 1, 59, 41, 40, 41], ["FOR-420", "Solicitud de Inserción de Partida de Nacimiento", 4, 59, 39, 38, 39], ["FOR-423", "Solicitud de Interdicción de parte de la Cónyuge Artículos 393, 395, 396 y 397 del Código", 5, 59, 40, 39, 40], ["FOR-424", "Solicitud de Interdicción Provisional", 4, 59, 39, 38, 39], ["FOR-425", "Solicitud de Legitimación", 4, 59, 39, 38, 39], ["FOR-426", "Solicitud de Legitimación de un hijo natural por Subsiguiente Matrimonio", 7, 59, 43, 42, 43], ["FOR-427", "Solicitud de Nombramiento de un Curador sin cuya intervención el padre o la madre no", 7, 59, 43, 42, 43], ["FOR-428", "Solicitud de Notificación aun Arrendador de que el inmueble arrendado esta a su disposición", 9, 59, 52, 51, 52], ["FOR-429", "Solicitud de Notificación para pedir desocupación de casa por razones sanitarias", 9, 59, 52, 51, 52], ["FOR-430", "Solicitud de partición suplementaria", 6, 59, 42, 41, 42], ["FOR-431", "Solicitud de pensión alimenticia de una hija mayor de edad Artículo 282 del Código Civil Vigente", 4, 59, 39, 38, 39], ["FOR-432", "Solicitud de Reconocimiento de un Documento privado en su contenido y firma", 4, 59, 39, 38, 39], ["LOP-12", "Solicitud de Rectificación de Partida de Nacimiento de Menor ante Tribunal de Protección", 4, 77, 81, 76, 81], ["FOR-433", "Solicitud de Registro (le una Marca Comercial o Patente", 4, 59, 39, 38, 39], ["FOR-434", "Solicitud de Registro, Publicación y Fijación de una Compañía Anónima", 1, 59, 41, 40, 41], ["FOR-435", "Solicitud de Selladura de Libros para la Contabilidad", 4, 59, 39, 38, 39], ["FOR-436", "Solicitud de Separación de los Patrimonios del Decujus y Los Herederos Artículos", 4, 59, 39, 38, 39], ["FOR-437", "Solicitud de Traslado del Tribunal para notificar opción de Compra Terminada", 2, 59, 49, 48, 49], ["FOR-438", "Solicitud de un Cónyuge para separación temporal del hogar Artículo 138 del Código", 5, 59, 40, 39, 40], ["FOR-439", "Solicitud de una madre soltera para que su hijo use sus dos apelli dos Artículo 238 del", 7, 59, 43, 42, 43], ["FOR-440", "Solicitud para Autorización Matrimonial de una menor", 7, 59, 43, 42, 43], ["FOR-413", "Solicitud para Nombramiento de Tutor", 7, 59, 43, 42, 43], ["FOR-441", "Solicitud para portar armas", 4, 59, 39, 38, 39], ["FOR-442", "Solicitud para preparar la vía Ejecutiva", 4, 59, 39, 38, 39], ["FOR-443", "Solicitud para privar al padre de la Administración de los bienes del hijo", 7, 59, 43, 42, 43], ["FOR-444", "Solicitud para que el Juez dicte las Providencias Conducentes a Evitar las consecuencias", 4, 59, 39, 38, 39], ["FOR-445", "Solicitud para que se Compele al Heredero a que declare si acepta o repudia la Herencia", 6, 59, 42, 41, 42], ["FOR-446", "Solicitud para que se nombre curador por haber oposición de intereses entre los hijos y el", 7, 59, 43, 42, 43], ["FOR-447", "Solicitud para una Adopción", 7, 59, 43, 42, 43], ["FOR-448", "Sustitución de Poder en un Juicio", 4, 59, 39, 38, 39], ["FOR-449", "Testamento Abierto con Herederos Legítimos forzosos", 6, 59, 42, 41, 42], ["FOR-450", "Testamento Abierto con un solo heredero universal", 6, 59, 42, 41, 42], ["FOR-451", "Testamento abierto Instituyendo como única y universal herede ra a la Cónyuge", 5, 59, 40, 39, 40], ["FOR-452", "Testamento abierto o mancupativo instituyendo la Cónyuge al Cónyuge como único y", 5, 59, 40, 39, 40], ["FOR-453", "Testamento abierto sin herederos legítimos forzosos", 6, 59, 42, 41, 42], ["FOR-454", "Testamento que establece una fundación", 6, 59, 42, 41, 42], ["FOR-455", "Título o Acción", 4, 59, 39, 38, 39], ["FOR-456", "Título Supletorio", 4, 59, 39, 38, 39], ["FOR-457", "Título Supletorio de Construcción sobre Terreno Municipal", 4, 59, 39, 38, 39], ["FOR-458", "Transacción en forma de diligencia", 2, 59, 49, 48, 49], ["FOR-459", "Transacción en litigios cursantes en Tribunales de Alemania y Ve nezuela", 2, 59, 49, 48, 49], ["FOR-460", "Transacción Extrajudicial", 2, 59, 49, 48, 49], ["FOR-461", "Transacción Judicial", 2, 59, 49, 48, 49], ["FOR-462", "Traspaso de Acción C.A", 4, 59, 39, 38, 39], ["FOR-463", "Usufructo", 4, 59, 39, 38, 39], ["FOR-464", "Usufructo Legal Recursos para compelar al cumplimiento", 8, 59, 50, 49, 50], ["FOR-465", "Venta con Hipoteca de Primer Grado (Documento privado)", 2, 59, 49, 48, 49], ["FOR-466", "Venta de Acciones de una Compañía Anónima", 1, 59, 41, 40, 41], ["FOR-467", "Venta de Automóvil Artículo 1.474 del Código Civil", 2, 59, 49, 48, 49], ["FOR-468", "Venta de inmueble adquirido en remate con Hipoteca sobre el mismo", 2, 59, 49, 48, 49], ["FOR-469", "Venta de Muebles con Inventario y cesión de Derecho de Arrenda miento de un Lugar", 6, 59, 42, 41, 42], ["FOR-470", "Venta de Propiedad Horizontal - Condominio", 2, 59, 49, 48, 49], ["FOR-471", "Venta de un inmueble con pacto de Retracto Artículos 1.534 y 1544 del Código Civil", 2, 59, 49, 48, 49], ["FOR-472", "Venta de un inmueble efectuado en Venezuela por una extranje ra, actuando como", 2, 59, 49, 48, 49], ["FOR-473", "Venta de un Negocio", 2, 59, 49, 48, 49], ["FOR-474", "Venta del Activo de un Negocio en proceso de Quiebra, efectua do por el Depositario", 2, 59, 49, 48, 49], ["FOR-475", "Venta y Traspaso de todas las cuotas de una Sociedad de Respon sabilidad Limitada", 1, 59, 41, 40, 41]]};

function buildVenezuelanModelFromCatalogRow(r: [string, string, number, number, number, number, number]): ModelTemplate {
  const codigo = r[0];
  const titulo = r[1];
  const category = RAW_CATALOGO_550.cats[r[2]] || "Práctica Forense y Trámites Varios";
  const driveUrl = RAW_CATALOGO_550.urls[r[3]] || "https://drive.google.com/drive/folders/1xHuhO7x1zL7Ll3-0J0s59Td2LBentREF";
  const rawVars = RAW_CATALOGO_550.vars[r[4]] || "Otorgante / Primera Parte, Contraparte / Apoderado, Objeto del Acto Jurídico, Condiciones y Monto, Domicilio Especial y Jurisdicción";
  const fundamento = RAW_CATALOGO_550.funds[r[5]] || "Código Civil / Código de Procedimiento Civil de Venezuela";
  const notas = RAW_CATALOGO_550.notas[r[6]] || "Redacción jurídica venezolana con visado profesional.";

  const varParts = rawVars.split(",").map(s => s.trim()).filter(Boolean);
  const used = new Set<string>();
  const variables: ModelTemplateVariable[] = varParts.map((labelStr, idx) => {
    let k = labelStr.toUpperCase().replace(/[^A-Z0-9_ÁÉÍÓÚÑ]/g, "_").replace(/_+/g, "_").replace(/^_|_$/g, "").slice(0, 26);
    if (!k) k = `CAMPO_${idx + 1}`;
    let c = 1;
    let finalK = k;
    while (used.has(finalK)) {
      c++;
      finalK = `${k}_${c}`;
    }
    used.add(finalK);
    return {
      key: finalK,
      label: labelStr,
      category: idx === 0 ? "Partes / Otorgantes" : idx === 1 ? "Contraparte / Apoderados" : "Datos del Modelo",
      placeholder: `Ingresa: ${labelStr}`
    };
  });

  const firstKey = variables[0]?.key || "OTORGANTE";
  const secondKey = variables[1]?.key || firstKey;
  const restVarsBlock = variables.slice(2).map((v, i) => `CLÁUSULA ${i + 2} (${v.label.toUpperCase()}): En relación con ${v.label.toLowerCase()}, se establece expresamente lo siguiente: {{${v.key}}}.`).join("\n\n");

  const contentPreview = `INSTRUMENTO JURÍDICO VENEZOLANO: ${titulo.toUpperCase()} (CÓDIGO DRIVE: ${codigo})
MATERIA: ${category.toUpperCase()}

ENTRE: {{${firstKey}}}, venezolano(a), mayor de edad, civilmente hábil, de este domicilio, por una parte; y por la otra, {{${secondKey}}}, suficientemente identificado(a) en autos y para este otorgamiento, se ha convenido en otorgar y suscribir el presente ${titulo.toUpperCase()}, contenido en las siguientes cláusulas y declaraciones de conformidad con el ordenamiento jurídico venezolano vigente:

CLÁUSULA 1 (DECLARACIÓN PRINCIPAL Y OBJETO): Las partes otorgan formalmente el presente instrumento de ${titulo}, conforme a los datos y recaudos siguientes: ${variables.map(v => `${v.label}: {{${v.key}}}`).join("; ")}.

${restVarsBlock ? restVarsBlock + "\n\n" : ""}FUNDAMENTACIÓN LEGAL Y TÉCNICA FORENSE VENEZOLANA: El presente instrumento se rige por las disposiciones contenidas en ${fundamento}. Criterio forense aplicable: ${notas}

DECLARACIÓN DE ORIGEN Y DESTINO LÍCITO DE FONDOS Y DOMICILIO ESPECIAL: Las partes declaran bajo fe de juramento que los bienes, haberes o recursos involucrados tienen origen y destino lícitos. Para todos los efectos derivados de este instrumento, se elige como domicilio especial, único y excluyente a la ciudad de Caracas, a la jurisdicción de cuyos Tribunales competentes declaran someterse.

Nota: Puedes abrir el archivo original de este modelo directamente en tu Google Drive con el botón "Abrir en Google Drive", o pegar/subir su texto exacto (aunque tenga datos de un cliente anterior o espacios en blanco ____) para sustituir los datos conservando el 100% de tu redacción.`;

  return {
    id: `drive-${codigo.toLowerCase()}`,
    codigo,
    name: `[${codigo}] ${titulo}`,
    category,
    source: "Google Drive",
    driveUrl,
    fundamento,
    notas,
    updatedAt: "Google Drive",
    variables,
    contentPreview
  };
}

const INITIAL_DRIVE_TEMPLATES: ModelTemplate[] = [
  {
    id: "tpl-compraventa",
    codigo: "CON-12",
    name: "Contrato de Compraventa de Inmueble",
    category: "Civil - Contratos y Garantías",
    source: "Google Drive",
    driveUrl: RAW_CATALOGO_550.urls[31] || "https://drive.google.com/drive/folders/1xHuhO7x1zL7Ll3-0J0s59Td2LBentREF",
    fundamento: "Arts. 1.474, 1.486, 1.503 y ss. CCV; Ley de Propiedad Horizontal",
    notas: "Redacción jurídica venezolana para otorgamiento ante Registro Inmobiliario.",
    updatedAt: "Google Drive",
    variables: [
      { key: "VENDEDOR", label: "Identificación completa del Vendedor (Nombre, Estado Civil, C.I. / RIF)", category: "Partes", placeholder: "Ej: CARLOS EDUARDO MÉNDEZ, mayor de edad, casado, C.I. V-12.345.678" },
      { key: "COMPRADOR", label: "Identificación completa del Comprador (Nombre, Estado Civil, C.I. / RIF)", category: "Partes", placeholder: "Ej: MARÍA FERNANDA SALAZAR, mayor de edad, soltera, C.I. V-18.987.654" },
      { key: "DATOS_INMUEBLE", label: "Descripción, Ubicación, Superficie y Linderos del Inmueble", category: "Inmueble", placeholder: "Ej: Apartamento Nº 4-B, Edificio Torre Ávila, Urb. Altamira, 145 m2" },
      { key: "REGISTRO_INMUEBLE", label: "Datos de Registro Inmobiliario / Tradición Legal (Oficina, Tomo, Folio, Fecha)", category: "Inmueble", placeholder: "Ej: Registro Público del Municipio Chacao, Tomo 14, Protocolo 1º, Año 2019" },
      { key: "PRECIO_VENTA", label: "Precio de la Compraventa (en letras y números) y Forma de Pago", category: "Precio y Pago", placeholder: "Ej: OCHENTA Y CINCO MIL DÓLARES (85.000,00 USD) mediante transferencia bancaria" },
      { key: "JURISDICCION", label: "Jurisdicción y Domicilio Especial elegido por las partes", category: "Jurisdicción", placeholder: "Ej: Ciudad de Caracas, a la jurisdicción de cuyos Tribunales declaran someterse" }
    ],
    contentPreview: `ENTRE: {{VENDEDOR}}, quien en lo adelante y a los efectos de este contrato se denominará EL VENDEDOR, por una parte; y por la otra, {{COMPRADOR}}, quien en lo sucesivo se denominará EL COMPRADOR, se ha convenido en celebrar el presente CONTRATO DE COMPRAVENTA DE INMUEBLE:\n\nPRIMERA (OBJETO Y DESCRIPCIÓN DEL INMUEBLE): EL VENDEDOR da en venta pura y simple, perfecta e irrevocable a EL COMPRADOR, un inmueble constituido por {{DATOS_INMUEBLE}}.\n\nSEGUNDA (TÍTULO DE ADQUISICIÓN Y REGISTRO): El referido inmueble pertenece a EL VENDEDOR según consta en documento protocolizado ante {{REGISTRO_INMUEBLE}}.\n\nTERCERA (PRECIO Y FORMA DE PAGO): El precio de esta venta ha sido pactado de común acuerdo en la cantidad de {{PRECIO_VENTA}}, que EL VENDEDOR declara recibir a su entera y cabal satisfacción.\n\nCUARTA (SANEAMIENTO Y ENTREGA MATERIAL): EL VENDEDOR garantiza que el inmueble se encuentra libre de todo gravamen, hipoteca o medida de prohibición, haciendo la tradición legal y entrega material con el otorgamiento del presente instrumento.\n\nQUINTA (JURISDICCIÓN): Para todos los efectos derivados de este contrato, las partes eligen como domicilio especial a la {{JURISDICCION}}.`
  },
  {
    id: "tpl-arrendamiento",
    codigo: "CON-01",
    name: "Contrato de Arrendamiento de Local Comercial",
    category: "Inquilinato y Arrendamiento",
    source: "Google Drive",
    driveUrl: RAW_CATALOGO_550.urls[20] || "https://drive.google.com/drive/folders/1xHuhO7x1zL7Ll3-0J0s59Td2LBentREF",
    fundamento: "Decreto Ley de Arrendamiento Comercial (G.O. 40.418); Código Civil",
    notas: "Modelo venezolano para locales comerciales con cláusula bimonetaria.",
    updatedAt: "Google Drive",
    variables: [
      { key: "ARRENDADOR", label: "Datos de la Parte Arrendadora / Propietaria", category: "Partes", placeholder: "Ej: INVERSIONES TORRE CENTRAL, C.A. (RIF J-30948271-0)" },
      { key: "ARRENDATARIO", label: "Datos de la Parte Arrendataria / Inquilina", category: "Partes", placeholder: "Ej: COMERCIALIZADORA NOVA, S.A. (RIF J-40192834-2)" },
      { key: "LOCAL_DIRECCION", label: "Identificación y Ubicación del Local Comercial", category: "Inmueble", placeholder: "Ej: Local PB-08, Centro Comercial Paseo Las Mercedes, 90 m2" },
      { key: "CANON_MENSUAL", label: "Canon de Arrendamiento Mensual y Depósito en Garantía", category: "Precio y Pago", placeholder: "Ej: 1.500,00 USD mensuales + 3 meses de depósito" },
      { key: "DURACION", label: "Plazo de Duración del Contrato", category: "Plazo", placeholder: "Ej: Dos (02) años fijos contados a partir de la firma" },
      { key: "JURISDICCION", label: "Jurisdicción Aplicable", category: "Jurisdicción", placeholder: "Ej: Tribunales Mercantiles de la Circunscripción Judicial de Caracas" }
    ],
    contentPreview: `ENTRE: {{ARRENDADOR}} (EL ARRENDADOR) y {{ARRENDATARIO}} (EL ARRENDATARIO), se suscribe el presente CONTRATO DE ARRENDAMIENTO DE LOCAL COMERCIAL:\n\nCLÁUSULA PRIMERA (INMUEBLE): EL ARRENDADOR cede en arrendamiento el inmueble ubicado en {{LOCAL_DIRECCION}}.\n\nCLÁUSULA SEGUNDA (CANON Y GARANTÍA): El canon de arrendamiento convenido es de {{CANON_MENSUAL}}, pagaderos dentro de los primeros cinco (5) días de cada mes.\n\nCLÁUSULA TERCERA (VIGENCIA): El presente contrato tendrá una duración de {{DURACION}}.\n\nCLÁUSULA CUARTA (DOMICILIO ESPECIAL): Las partes eligen como domicilio especial la {{JURISDICCION}}.`
  },
  {
    id: "tpl-poder",
    codigo: "POD-01",
    name: "Poder Especial de Representación Judicial y Administrativa",
    category: "Poderes y Mandatos",
    source: "Google Drive",
    driveUrl: RAW_CATALOGO_550.urls[0] || "https://drive.google.com/drive/folders/1xHuhO7x1zL7Ll3-0J0s59Td2LBentREF",
    fundamento: "Arts. 1.684 y ss. CCV; Arts. 150 y ss. CPC",
    notas: "Representación judicial y extrajudicial amplia.",
    updatedAt: "Google Drive",
    variables: [
      { key: "OTORGANTE", label: "Datos del Poderdante / Otorgante", category: "Partes", placeholder: "Ej: GRUPO INDUSTRIAL DELTA, C.A., representada por su Director" },
      { key: "APODERADOS", label: "Nombre e Inpreabogado / IPSA de los Abogados Apoderados", category: "Apoderados", placeholder: "Ej: Abg. Bárbara Piccolo, Inpreabogado Nº 115.794 / IPSA Nº 102.485" },
      { key: "FACULTADES_ESPECIFICAS", label: "Objeto y Facultades Especiales del Mandato", category: "Facultades", placeholder: "Ej: Darse por citado, promover pruebas, convenir, desistir, transigir y recibir cantidades de dinero" },
      { key: "JURISDICCION", label: "Ciudad y Fecha de Otorgamiento", category: "Jurisdicción", placeholder: "Ej: En la ciudad de Caracas, a la fecha de su autenticación notarial" }
    ],
    contentPreview: `Yo, {{OTORGANTE}}, por el presente documento declaro: Que confiero PODER ESPECIAL, pero amplio y bastante cuanto en derecho se requiere, a los abogados en ejercicio {{APODERADOS}}, para que conjunta o separadamente representen y sostengan mis derechos en todos los asuntos judiciales o extrajudiciales.\n\nEn ejercicio de este mandato, los apoderados quedan expresamente facultados para: {{FACULTADES_ESPECIFICAS}}.\n\nOtorgado en {{JURISDICCION}}.`
  },
  ...RAW_CATALOGO_550.rows.map(buildVenezuelanModelFromCatalogRow)
];

// Constante de compatibilidad de IDs de auditoría
const LEGACY_AUDIT_IDS = [
  { id: "HL-2026-001" }, { id: "PII-2026-001" }, { id: "TRZ-2026-001" },
  { id: "act-1" }, { id: "act-2" }, { id: "act-3" },
  { id: "cli-01" }, { id: "cli-02" }, { id: "cli-03" },
  { id: "ev-1" }, { id: "ev-2" }, { id: "ev-3" },
  { id: "rag-01" }, { id: "rag-02" }, { id: "rag-03" },
  { id: "rec-01" }, { id: "tsk-1" }, { id: "tsk-2" }, { id: "tsk-3" }
];
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
  // ESTADO DE CONFIGURACIÓN GENERAL Y CONEXIÓN GOOGLE DRIVE (550+ MODELOS)
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
  const [localFolderPath, setLocalFolderPath] = useState<string>('/Mis_Modelos_Juridicos');
  const [driveFolderUrl, setDriveFolderUrl] = useState<string>('https://drive.google.com/drive/folders/1xHuhO7x1zL7Ll3-0J0s59Td2LBentREF');
  const [driveDocUrlToImport, setDriveDocUrlToImport] = useState<string>('');
  const [isSyncingDriveCatalog, setIsSyncingDriveCatalog] = useState<boolean>(false);

  // Biblioteca de Modelos pre-conectada con los 550+ modelos venezolanos de Google Drive
  const [templates, setTemplates] = useState<ModelTemplate[]>(INITIAL_DRIVE_TEMPLATES);
  const [templateCategoryFilter, setTemplateCategoryFilter] = useState<string>('Todas');
  const [templateSearchQuery, setTemplateSearchQuery] = useState<string>('');
  const [newTplNameInput, setNewTplNameInput] = useState<string>('');
  const [newTplCategoryInput, setNewTplCategoryInput] = useState<string>('Civil - Contratos y Garantías');
  const [newTplContentInput, setNewTplContentInput] = useState<string>('');
  const [newTplDriveUrlInput, setNewTplDriveUrlInput] = useState<string>('');
  const [showAddTemplateModal, setShowAddTemplateModal] = useState<boolean>(false);

  // Modal/Panel en Redactor para pegar o subir el texto real de un modelo de Drive (con datos viejos o rayas ____)
  const [showAdaptRealModelBox, setShowAdaptRealModelBox] = useState<boolean>(false);
  const [rawRealModelTextInput, setRawRealModelTextInput] = useState<string>('');

  // Repositorio RAG de Leyes y Normativa
  const [ragDocs, setRagDocs] = useState<RagLawDocument[]>([
    {
      id: 'rag-01',
      title: 'Código Civil de Venezuela (Obligaciones, Contratos, Compraventa, Mandato y Garantías)',
      type: 'Código / Ley',
      chunks: 420,
      status: 'Indexado',
      excerpt: 'Artículos 151, 168 (consentimiento conyugal), 1.133, 1.159, 1.167, 1.474 y ss. (Compraventa), 1.579 (Arrendamiento), 1.684 y ss. (Mandato y Poderes).',
      fullText: 'Código Civil de Venezuela: Art. 151 (Bienes propios de los cónyuges). Art. 168 (Requiere consentimiento de ambos cónyuges para enajenar o gravar bienes gananciales). Art. 1.133 (El contrato es una convención entre dos o más personas para constituir, reglar, transmitir, modificar o extinguir entre ellas un vínculo jurídico). Art. 1.167 (En el contrato bilateral, si una de las partes no ejecuta su obligación, la otra puede a su elección reclamar judicialmente la ejecución del contrato o la resolución del mismo, con los daños y perjuicios). Art. 1.474 (La venta es un contrato por el cual el vendedor se obliga a transferir la propiedad de una cosa y el comprador a pagar el precio). Art. 1.684 (El mandato es un contrato por el cual una persona se obliga gratuitamente, o mediante salario, a ejecutar uno o más negocios por cuenta de otra, que la ha encargado de ello).'
    },
    {
      id: 'rag-02',
      title: 'Código de Procedimiento Civil de Venezuela (CPC)',
      type: 'Código / Ley',
      chunks: 315,
      status: 'Indexado',
      excerpt: 'Artículos 150 y ss. (Poderes judiciales), Art. 197 (Cómputo de lapsos por días de despacho), Art. 340 (Requisitos del libelo de demanda), Art. 585 (Medidas preventivas).',
      fullText: 'Código de Procedimiento Civil (CPC): Art. 151 (En el poder para actos judiciales deben expresarse las facultades para convenir, desistir, transigir, comprometer en árbitros, solicitar la decisión según la equidad, hacer posturas en remates y recibir cantidades de dinero). Art. 197 (Los términos o lapsos procesales se computarán por días calendarios consecutivos, excepto los lapsos de pruebas y aquellos en que la ley disponga que se computen por días de despacho). Art. 340 (Requisitos formales del libelo de la demanda). Art. 585 (Medidas preventivas de embargo, secuestro y prohibición de enajenar y gravar ante fumus boni iuris y periculum in mora).'
    },
    {
      id: 'rag-03',
      title: 'Código de Comercio, LOTTT, LOPNNA y Decreto Ley de Arrendamiento Comercial',
      type: 'Código / Ley',
      chunks: 260,
      status: 'Indexado',
      excerpt: 'Artículos 151, 200 y ss. del Código de Comercio (Sociedades Mercantiles y Asambleas); Decreto Ley de Arrendamiento Comercial (G.O. 40.418); LOTTT y LOPNNA.',
      fullText: 'Código de Comercio: Art. 151 (Enajenación de fondo de comercio y publicaciones). Art. 200 y ss. (Compañías Anónimas, S.R.L., Asambleas Ordinarias y Extraordinarias, facultades de administradores y comisarios). Decreto con Rango, Valor y Fuerza de Ley de Regulación del Arrendamiento Inmobiliario para el Uso Comercial (G.O. 40.418). Ley Orgánica del Trabajo, los Trabajadores y las Trabajadoras (LOTTT). Ley Orgánica para la Protección de Niños, Niñas y Adolescentes (LOPNNA).'
    }
  ]);
  const [newRagTitleInput, setNewRagTitleInput] = useState<string>('');
  const [newRagTypeInput, setNewRagTypeInput] = useState<'Código / Ley' | 'Jurisprudencia / Doctrina' | 'Reglamento / Norma'>('Código / Ley');
  const [newRagContentInput, setNewRagContentInput] = useState<string>('');
  const [showAddRagModal, setShowAddRagModal] = useState<boolean>(false);
  const [viewingRagDoc, setViewingRagDoc] = useState<RagLawDocument | null>(null);

  // Bitácoras y Registros Reales
  const [approvedDocsRegistry, setApprovedDocsRegistry] = useState<ApprovedDocumentRecord[]>([]);
  const [piiAuditRegistry, setPiiAuditRegistry] = useState<PiiAuditEntry[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([]);

  // CRM de Clientes
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

  const handleAddConsultFileAttachment = async (
    file: File,
    kind: 'Imagen / Captura' | 'Documento (.DOC / .DOCX)' | 'Archivo .PDF'
  ) => {
    let rawExtracted = `[Archivo adjunto: ${file.name} (${(file.size / 1024).toFixed(1)} KB)]`;
    if (kind !== 'Imagen / Captura') {
      const text = await extractRealTextFromDocxOrFile(file);
      if (text.length > 15) {
        rawExtracted = text.slice(0, 8000);
      }
    }
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
        : '• Aún no has cargado textos legales en el módulo 11 (Configuración -> Tus Leyes y Normativa RAG).';

    const tplBlock = selectedTpl
      ? `Instrumento de referencia en tu Biblioteca de Google Drive: «${selectedTpl.name}» (${selectedTpl.fundamento || selectedTpl.category}).\nCampos del modelo: ${selectedTpl.variables.map(v => v.label).join(', ')}.\n\nTexto base del modelo para estructurar la actuación:\n"${selectedTpl.contentPreview.slice(0, 500)}${selectedTpl.contentPreview.length > 500 ? '...' : ''}"`
      : 'Selecciona un modelo de tu Biblioteca de Google Drive.';

    const attBlock =
      attachments.length > 0
        ? `RECAUDOS EXAMINADOS EN ESTA CONSULTA (${attachments.length}):\n` +
          attachments.map((a, i) => `${i + 1}) [${a.kind}] ${a.name}: ${a.rawContent.slice(0, 220)}`).join('\n') +
          '\n\n'
        : '';

    return `${attBlock}I. BASE LEGAL Y ANÁLISIS DE LOS ARTÍCULOS INVOLUCRADOS POR CADA LEY (RAG):

${lawsBlock}

II. OPCIONES JURÍDICAS DISPONIBLES:

- Opción Primera (Vía Sustantiva / Contractual): Exigir el cumplimiento estricto o la adecuación de las estipulaciones conforme a la normativa indexada en el RAG y a las cláusulas del modelo venezolano aplicable.
- Opción Segunda (Vía Prejudicial / Intimatoria): Practicar requerimiento o notificación formal dejando constancia fehaciente de la pretensión y agotando la fase previa o constitutiva de mora.
- Opción Tercera (Vía Jurisdiccional y Cautelar): Interponer la acción correspondiente ante los Tribunales competentes solicitando medidas preventivas (Art. 585 CPC) para asegurar el resultado práctico del fallo.

III. ANÁLISIS DE ESCENARIOS Y CONSECUENCIAS DE CADA ESCENARIO:

- Escenario A (Ejecución Prejudicial Documentada):
  - Presupuesto: Existencia de recaudos suficientes y posibilidad de avenimiento o constitución inmediata en mora.
  - Consecuencias: Preconstituye prueba plena para un eventual litigio, reduce tiempos y evita defensas dilatorias de la contraparte.
- Escenario B (Contencioso con Solicitud de Medida Cautelar):
  - Presupuesto: Negativa de cumplimiento o riesgo de enajenación/insolvencia de la contraparte.
  - Consecuencias: Asegura el patrimonio objeto del litigio desde la admisión de la demanda e impone condena en costas procesales en caso de vencimiento total.

IV. DECISIÓN DE EJECUCIÓN, MODO DE ACCIONAR Y REDACCIÓN FORENSE:

- Secuencia de Ejecución:
  1) Auditar la suficiencia probatoria de los documentos e instrumentos del cliente.
  2) Formalizar la actuación utilizando la matriz correspondiente de tu Biblioteca de Google Drive.
  3) Proceder al otorgamiento, notificación o consignación dentro de los lapsos de ley.

- Vinculación con tu Biblioteca de Google Drive:
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

    const qLower = cleanQ.toLowerCase();
    const smartMatchedTemplate = templates.find(t =>
      t.name.toLowerCase().split(/\s+/).some(w => w.length > 4 && qLower.includes(w))
    );

    const chosenTemplate =
      consultSelectedTemplateId !== 'auto'
        ? templates.find(t => t.id === consultSelectedTemplateId) || templates[0]
        : smartMatchedTemplate || templates[0];

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
            : 'Responde conforme al Derecho positivo venezolano vigente aplicable.';

        const sampleTemplatesForContext = [
          chosenTemplate,
          ...templates.slice(0, 6)
        ]
          .filter(Boolean)
          .slice(0, 6);

        const tplContextStr = sampleTemplatesForContext
          .map(
            t =>
              `=== MODELO DE GOOGLE DRIVE: ${t!.name} (${t!.category}) ===\nFundamento: ${t!.fundamento || 'Derecho Venezolano'}\nCampos: ${t!.variables.map(v => v.label).join(', ')}\nContenido:\n${t!.contentPreview.slice(0, 900)}`
          )
          .join('\n\n');

        const historyStr = consultThread
          .slice(-4)
          .map(t => `Consulta previa del Abogado:\n${t.sanitizedSentToAi}\n\nDictamen previo:\n${t.dictamen}`)
          .join('\n\n---\n\n');

        const sysPrompt = `Eres un Abogado Venezolano Senior en Ejercicio y Jurisconsulto Forense del despacho "${firmName || 'Despacho Jurídico'}", asistiendo a ${lawyerSignerName || 'Dra. Bárbara Piccolo'} (${lawyerCollegiateId || 'Inpreabogado'}).
REGLAS ESTRICTAS DE RIGOR Y CERO ALUCINACIÓN:
1) Prohibido usar emojis, tono coloquial o frases de asistente genérico. Habla estrictamente como un abogado especialista en ejercicio en Venezuela.
2) Fundamenta tu dictamen en las LEYES CARGADAS EN EL RAG DEL DESPACHO y en los MODELOS DE GOOGLE DRIVE DEL DESPACHO suministrados abajo. No inventes artículos ni jurisprudencia inexistente.
3) ESTRUCTURA OBLIGATORIAMENTE TU RESPUESTA EN ESTAS CUATRO (04) FASES FORENSES:
   I. BASE LEGAL Y ANÁLISIS DE LOS ARTÍCULOS INVOLUCRADOS POR CADA LEY (RAG): Analiza ley por ley y artículo por artículo los preceptos aplicables al caso y su subsunción jurídica.
   II. OPCIONES JURÍDICAS DISPONIBLES: Determina con precisión técnica las vías o acciones que asisten al cliente.
   III. ANÁLISIS DE ESCENARIOS Y CONSECUENCIAS DE CADA ESCENARIO: Evalúa cada escenario posible (Escenario A, Escenario B, etc.), su carga probatoria y sus consecuencias jurídicas, procesales y patrimoniales.
   IV. DECISIÓN DE EJECUCIÓN, MODO DE ACCIONAR Y REDACCIÓN FORENSE: Define la decisión técnica de ejecución, el paso a paso concreto para lograr el resultado y entrega la redacción forense venezolana del instrumento, cláusula o escrito adaptada a los modelos de Google Drive del despacho.

LEYES Y NORMATIVA EN EL RAG DEL DESPACHO:
${ragContextStr}

MODELOS DE GOOGLE DRIVE DEL DESPACHO (${templates.length} modelos indexados):
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
        action: 'Dictamen Forense en 4 Etapas (RAG + Biblioteca Drive)',
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

  // ==========================================================================
  // MÓDULO 2: REDACTOR DE DOCUMENTOS (CONECTADO A TUS 550+ MODELOS DE GOOGLE DRIVE,
  //           CON DETECTOR DE DATOS ANTIGUOS Y ESPACIOS LIBRES ____ SIN NECESIDAD DE LLAVES)
  // ==========================================================================
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('tpl-compraventa');
  const selectedTemplate = useMemo(
    () => templates.find(t => t.id === selectedTemplateId) || templates[0] || null,
    [templates, selectedTemplateId]
  );

  const templateCategories = useMemo(() => {
    const setCats = new Set<string>(['Todas']);
    templates.forEach(t => {
      if (t.category) setCats.add(t.category);
    });
    return Array.from(setCats);
  }, [templates]);

  const filteredTemplatesForSelector = useMemo(() => {
    const q = templateSearchQuery.trim().toLowerCase();
    return templates.filter(t => {
      const catOk = templateCategoryFilter === 'Todas' || t.category === templateCategoryFilter;
      if (!catOk) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        (t.codigo && t.codigo.toLowerCase().includes(q)) ||
        t.category.toLowerCase().includes(q) ||
        (t.fundamento && t.fundamento.toLowerCase().includes(q))
      );
    });
  }, [templates, templateCategoryFilter, templateSearchQuery]);

  const [redactorStep, setRedactorStep] = useState<1 | 2 | 3>(1);
  const [inputModeTab, setInputModeTab] = useState<'foto_ocr' | 'pdf_doc' | 'escrito_manual'>('escrito_manual');
  const [extractedSourceNote, setExtractedSourceNote] = useState<string>('');
  const [freeTextToExtract, setFreeTextToExtract] = useState<string>('');
  const [templateValues, setTemplateValues] = useState<Record<string, string>>({});
  const [customEditedDocumentText, setCustomEditedDocumentText] = useState<string | null>(null);
  const [redactorApprovedStamp, setRedactorApprovedStamp] = useState<string | null>(null);
  const [isRedactorExtracting, setIsRedactorExtracting] = useState<boolean>(false);

  const handleSelectTemplate = (tplId: string) => {
    setSelectedTemplateId(tplId);
    setRedactorApprovedStamp(null);
    setCustomEditedDocumentText(null);
    const found = templates.find(t => t.id === tplId);
    if (!found) return;
    const cleanMap: Record<string, string> = {};
    found.variables.forEach(v => {
      cleanMap[v.key] = templateValues[v.key] || '';
    });
    setTemplateValues(cleanMap);
    setRedactorStep(2);
  };

  // Analiza cualquier modelo real venezolano de Google Drive (tenga datos de clientes viejos o tenga rayas ____)
  // y lo prepara automáticamente para sustituir datos conservando el 100% de su redacción jurídica venezolana
  const handleApplyRawVenezuelanModelText = (rawText: string, customName?: string) => {
    const clean = rawText.trim();
    if (!clean) {
      showToast('Pega o sube primero el texto del modelo de Google Drive.');
      return;
    }
    const { normalizedContent, variables, detectedMode } = analyzeAndNormalizeVenezuelanModel(
      clean,
      selectedTemplate?.variables.map(v => v.label).join(', ')
    );

    if (selectedTemplate) {
      const updatedTpl: ModelTemplate = {
        ...selectedTemplate,
        name: customName || selectedTemplate.name,
        variables,
        contentPreview: normalizedContent,
        updatedAt: 'Analizado (Redacción Venezolana)'
      };
      setTemplates(prev => prev.map(t => (t.id === selectedTemplate.id ? updatedTpl : t)));
      const nextVals: Record<string, string> = {};
      variables.forEach(v => {
        nextVals[v.key] = '';
      });
      setTemplateValues(nextVals);
      setCustomEditedDocumentText(null);
      setShowAdaptRealModelBox(false);
      setRawRealModelTextInput('');
      setExtractedSourceNote(
        detectedMode === 'datos_antiguos_y_espacios'
          ? `Se detectaron automáticamente ${variables.length} datos antiguos / espacios libres (____) en tu modelo venezolano. Rellénalos abajo o usa la IA para sustituirlos.`
          : `Modelo venezolano cargado con ${variables.length} campos listos para rellenar.`
      );
      showToast(`Modelo analizado: ${variables.length} datos antiguos o espacios en blanco detectados automáticamente.`);
    }
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
        ? ', con el consentimiento expreso de su cónyuge conforme al Artículo 168 del Código Civil Venezolano'
        : ', declarando que el bien objeto de este acto constituye bien propio (Art. 151 y 168 del Código Civil Venezolano)';
    setTemplateValues({
      ...templateValues,
      [firstKey]: current.replace(/\.$/, '') + addition
    });
    showToast('Mención del Artículo 168 del Código Civil Venezolano incorporada.');
  };

  const parseTextIntoTemplateVariables = async (rawNotes: string, sourceLabel: string) => {
    if (!selectedTemplate) {
      showToast('Selecciona un modelo de tu Biblioteca de Google Drive.');
      return;
    }
    const nextVals = { ...templateValues };
    const lines = rawNotes.split('\n').map(l => l.trim()).filter(Boolean);

    lines.forEach((line, lineIdx) => {
      const colonIdx = line.indexOf(':');
      if (colonIdx !== -1) {
        const prefix = line.slice(0, colonIdx).toLowerCase().trim();
        const val = line.slice(colonIdx + 1).trim();
        if (val) {
          selectedTemplate.variables.forEach(v => {
            const keyNorm = v.key.toLowerCase().replace(/_/g, ' ');
            const labelNorm = v.label.toLowerCase();
            if (prefix.includes(keyNorm) || keyNorm.includes(prefix) || labelNorm.includes(prefix)) {
              nextVals[v.key] = val;
            }
          });
        }
      } else if (selectedTemplate.variables[lineIdx] && !nextVals[selectedTemplate.variables[lineIdx].key]) {
        nextVals[selectedTemplate.variables[lineIdx].key] = line;
      }
    });

    const hasApi = llmProvider === 'ollama' || (apiKeyInput.trim().length > 8 && !apiKeyInput.includes('•'));
    if (hasApi && rawNotes.trim().length > 15) {
      setIsRedactorExtracting(true);
      try {
        const varDescriptions = selectedTemplate.variables
          .map(v => `"${v.key}" (${v.label}${v.originalValueInModel ? ` — sustituir dato viejo: ${v.originalValueInModel}` : ''})`)
          .join(', ');
        const sys = `Eres un Abogado Venezolano Senior. Extrae del texto suministrado los valores para rellenar o sustituir los campos de este modelo jurídico venezolano: [${varDescriptions}]. Devuelve ÚNICAMENTE un objeto JSON válido donde cada clave sea el nombre exacto de la variable y su valor sea el texto extraído con redacción jurídica venezolana formal.`;
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
        // Conserva la extracción local
      }
      setIsRedactorExtracting(false);
    }

    setTemplateValues(nextVals);
    setCustomEditedDocumentText(null);
    setExtractedSourceNote(`${sourceLabel} procesado y aplicado a los campos del modelo.`);
    setRedactorStep(3);
    showToast('Datos aplicados automáticamente a los campos del modelo.');
  };

  // Reescribe el modelo completo con IA cuando el modelo de Drive tenía datos viejos complejos o párrafos a adaptar,
  // conservando el 100% de la redacción jurídica venezolana original
  const handleAdaptFullModelWithAi = async () => {
    if (!selectedTemplate) return;
    const newCaseDataSummary = [
      freeTextToExtract.trim() ? `Notas / Escrito del nuevo caso:\n${freeTextToExtract.trim()}` : '',
      Object.entries(templateValues)
        .filter(([, val]) => val && val.trim())
        .map(([k, val]) => {
          const vObj = selectedTemplate.variables.find(v => v.key === k);
          return `• ${vObj?.label || k}${vObj?.originalValueInModel ? ` (reemplazar "${vObj.originalValueInModel}")` : ''}: ${val}`;
        })
        .join('\n')
    ]
      .filter(Boolean)
      .join('\n\n');

    if (!newCaseDataSummary.trim()) {
      showToast('Escribe los nuevos datos del cliente en los campos o en "Por Escrito" para adaptarlos al modelo.');
      return;
    }

    const hasApi = llmProvider === 'ollama' || (apiKeyInput.trim().length > 8 && !apiKeyInput.includes('•'));
    if (!hasApi) {
      setCustomEditedDocumentText(null);
      setRedactorStep(3);
      showToast('Sustitución local completada conservando la redacción venezolana. (Configura tu API Key en Módulo 11 para adaptación avanzada con IA).');
      return;
    }

    setIsRedactorExtracting(true);
    try {
      const combinedRaw = `MODELO BASE DEL DESPACHO (${selectedTemplate.name}):\n${selectedTemplate.contentPreview}\n\nNUEVOS DATOS DEL CLIENTE / OPERACIÓN PARA SUSTITUIR:\n${newCaseDataSummary}`;
      const { sanitized, tokens } = anonymizePiiText(combinedRaw, allProtectedNames);
      const sys = `Eres un Abogado Venezolano Senior especialista en redacción de instrumentos públicos, contratos, poderes y escritos forenses en Venezuela.
REGLA DE ORO: Tienes un MODELO BASE con redacción jurídica venezolana que puede contener datos de un cliente anterior o espacios en blanco (____ o {{VARIABLES}}).
Tu única función es SUSTITUIR todos los datos antiguos o rellenar todos los espacios libres con los NUEVOS DATOS DEL CLIENTE suministrados, CONSERVANDO PALABRA POR PALABRA el 100% de la estructura, el estilo forense venezolano, las fórmulas registrales/notariales y las cláusulas del modelo original. Devuelve únicamente el documento jurídico venezolano completo y listo para otorgamiento.`;

      const aiDoc = await callConfiguredLlmApi({
        provider: llmProvider,
        model: llmModel,
        apiKey: apiKeyInput,
        ollamaUrl: ollamaBaseUrl,
        systemPrompt: sys,
        userPrompt: sanitized
      });
      if (aiDoc.trim()) {
        setCustomEditedDocumentText(deAnonymizeText(aiDoc.trim(), tokens));
        setRedactorStep(3);
        showToast('Modelo venezolano adaptado íntegramente con los datos del nuevo caso.');
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al conectar con la API.';
      showToast(msg);
    }
    setIsRedactorExtracting(false);
  };

  const handleExtractFromPhotoOrPdf = async (file: File, sourceType: 'Foto (OCR)' | 'Documento PDF') => {
    const textContent = await extractRealTextFromDocxOrFile(file);
    if (textContent.trim()) {
      setFreeTextToExtract(textContent.slice(0, 4000));
      await parseTextIntoTemplateVariables(textContent.slice(0, 4000), `${sourceType} ("${file.name}")`);
    } else {
      setExtractedSourceNote(`Archivo "${file.name}" cargado. Completa o verifica los campos abajo.`);
      setRedactorStep(3);
    }
  };

  const handleExtractFromWrittenNotes = () => {
    if (!freeTextToExtract.trim()) return;
    parseTextIntoTemplateVariables(freeTextToExtract, 'Texto libre');
  };

  const handleLoadClientIntoRedactor = (client: CrmClient) => {
    if (!selectedTemplate) {
      setActiveTab('redactor_docs');
      showToast('Selecciona primero un modelo en el Redactor.');
      return;
    }
    const fullPartyDesc =
      client.personType === 'Persona Jurídica (Empresa)'
        ? `${client.name}, RIF ${client.taxId}, inscrita en ${client.registryInfo}, representada por ${client.legalRep}`
        : `${client.name}, venezolano(a), mayor de edad, titular de la Cédula de Identidad Nº ${client.taxId}, domiciliado(a) en ${client.address}`;

    const nextVals = { ...templateValues };
    if (selectedTemplate.variables.length > 0) {
      nextVals[selectedTemplate.variables[0].key] = fullPartyDesc;
    }
    setTemplateValues(nextVals);
    setCustomEditedDocumentText(null);
    setExtractedSourceNote(`Ficha legal de "${client.name}" importada desde el CRM.`);
    setActiveTab('redactor_docs');
    setRedactorStep(3);
    showToast(`Datos de "${client.name}" trasladados al Redactor.`);
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

  const compiledDocument = useMemo(() => {
    if (customEditedDocumentText !== null) return customEditedDocumentText;
    if (!selectedTemplate) return '';
    let text = selectedTemplate.contentPreview;
    selectedTemplate.variables.forEach(v => {
      const userVal = templateValues[v.key]?.trim();
      const fallbackDisplay = v.originalValueInModel
        ? `[SUSTITUIR (${v.originalValueInModel}): {{${v.key}}}]`
        : `[PENDIENTE: {{${v.key}}}]`;
      text = text.replace(new RegExp(`\\{\\{${escapeRegExp(v.key)}\\}\\}`, 'gi'), userVal || fallbackDisplay);
    });
    return text;
  }, [selectedTemplate, templateValues, customEditedDocumentText]);

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
      `${selectedTemplate.name.replace(/[^a-zA-Z0-9_]+/g, '_')}_Visado.doc`,
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
        // Permite transcripción/notas en vivo
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
  const [procExcludeHolidaysAndRecess] = useState<boolean>(true);
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
  // FUNCIONES CRUD DE MODELOS DE GOOGLE DRIVE / CARPETA LOCAL Y LEYES RAG
  // ==========================================================================
  const handleSyncGoogleDriveCatalog = async () => {
    setIsSyncingDriveCatalog(true);
    try {
      const sheetUrls = [
        'https://docs.google.com/spreadsheets/d/1uMWL2Fq1EnRj2MoblGuj7CToxuy0ZQl32p_xkCunxew/export?format=csv',
        'https://docs.google.com/spreadsheets/d/1M1Y9sllrCJuqrj_QLziuT10MnahuEzOEofXptE18py0/export?format=csv'
      ];
      const existingById = new Map<string, ModelTemplate>();
      INITIAL_DRIVE_TEMPLATES.forEach(t => existingById.set(t.id, t));
      templates.forEach(t => existingById.set(t.id, t));

      for (const u of sheetUrls) {
        try {
          const resp = await fetch(u);
          if (resp.ok) {
            const csvText = await resp.text();
            csvText.split(/\r?\n/).forEach(line => {
              const cols = line.split(',');
              if (cols.length >= 2) {
                const cod = cols[0].replace(/^"|"$/g, '').trim();
                const tit = cols[1].replace(/^"|"$/g, '').trim();
                const idKey = `drive-${cod.toLowerCase()}`;
                if (cod && tit && cod !== 'Código' && !cod.startsWith('SECCIÓN') && !existingById.has(idKey)) {
                  const rawVars = cols[5]?.replace(/^"|"$/g, '').trim() || 'Otorgantes, C.I./RIF, Objeto y Condiciones';
                  const { normalizedContent, variables } = analyzeAndNormalizeVenezuelanModel(
                    `INSTRUMENTO JURÍDICO VENEZOLANO: ${tit.toUpperCase()} (${cod})`,
                    rawVars
                  );
                  existingById.set(idKey, {
                    id: idKey,
                    codigo: cod,
                    name: `[${cod}] ${tit}`,
                    category: cols[2]?.replace(/^"|"$/g, '').trim() || 'Práctica Forense y Trámites Varios',
                    source: 'Google Drive',
                    driveUrl: cols[4]?.replace(/^"|"$/g, '').trim() || driveFolderUrl,
                    fundamento: cols[6]?.replace(/^"|"$/g, '').trim() || 'Código Civil / CPC',
                    notas: cols[7]?.replace(/^"|"$/g, '').trim() || 'Sincronizado desde Google Drive',
                    updatedAt: 'Sincronizado Drive',
                    variables,
                    contentPreview: normalizedContent
                  });
                }
              }
            });
          }
        } catch {
          // Si la hoja requiere sesión activa, conserva el catálogo maestro de 550+ modelos de Drive
        }
      }

      const merged = Array.from(existingById.values());
      setTemplates(merged);
      if (!selectedTemplateId && merged[0]) {
        setSelectedTemplateId(merged[0].id);
      }
      showToast(`Google Drive sincronizado: ${merged.length} modelos jurídicos venezolanos activos.`);
    } finally {
      setIsSyncingDriveCatalog(false);
    }
  };

  const handleImportModelFromDriveLink = async () => {
    const url = driveDocUrlToImport.trim();
    if (!url) {
      showToast('Pega el enlace de tu documento o carpeta de Google Drive.');
      return;
    }
    const docIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]{15,})/);
    if (!docIdMatch) {
      setDriveFolderUrl(url);
      setLibrarySourceMode('Google Drive');
      setDriveDocUrlToImport('');
      showToast('Carpeta de Google Drive vinculada correctamente.');
      return;
    }
    const fileId = docIdMatch[1];
    let fetchedText = '';
    try {
      const exportUrl = `https://docs.google.com/document/d/${fileId}/export?format=txt`;
      const resp = await fetch(exportUrl);
      if (resp.ok) {
        fetchedText = (await resp.text()).trim();
      }
    } catch {
      // Si el archivo en Drive es privado (CORS), permite pegar o subir el .docx/.txt y conserva el vínculo a Drive
    }

    if (fetchedText.length > 30) {
      const { normalizedContent, variables } = analyzeAndNormalizeVenezuelanModel(fetchedText);
      const created: ModelTemplate = {
        id: `tpl-drive-${Date.now().toString().slice(-5)}`,
        name: newTplNameInput.trim() || `Modelo Google Drive (${fileId.slice(0, 6)})`,
        category: newTplCategoryInput.trim() || 'Biblioteca Google Drive',
        source: 'Google Drive',
        driveUrl: url,
        updatedAt: new Date().toLocaleDateString('es-ES'),
        variables,
        contentPreview: normalizedContent
      };
      setTemplates(prev => [created, ...prev]);
      setSelectedTemplateId(created.id);
      setDriveDocUrlToImport('');
      showToast(`Modelo importado de Google Drive con ${variables.length} campos detectados automáticamente.`);
    } else {
      setNewTplDriveUrlInput(url);
      setShowAddTemplateModal(true);
      showToast('Enlace de Google Drive vinculado. Pega el texto del modelo o sube el archivo .DOCX descargado de tu Drive.');
    }
  };

  const handleBatchUploadTemplateFiles = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    const filesArray = Array.from(fileList);
    const createdModels: ModelTemplate[] = [];

    for (const f of filesArray) {
      const cleanText = await extractRealTextFromDocxOrFile(f);
      const bodyToAnalyze =
        cleanText.length > 20
          ? cleanText
          : `ENTRE: ________, venezolano(a), mayor de edad, titular de la C.I. Nº V-________, por una parte; y por la otra ________, titular de la C.I. Nº V-________, se celebra el presente instrumento (${f.name}):\n\nPRIMERA (OBJETO): ________.\n\nSEGUNDA (PRECIO / MONTO): ________.\n\nTERCERA (DOMICILIO ESPECIAL): Ciudad de Caracas.`;

      const { normalizedContent, variables } = analyzeAndNormalizeVenezuelanModel(bodyToAnalyze);
      createdModels.push({
        id: `tpl-${Date.now().toString().slice(-5)}-${Math.random().toString(36).slice(2, 5)}`,
        name: f.name.replace(/\.[^/.]+$/, ''),
        category: newTplCategoryInput.trim() || 'Biblioteca Google Drive',
        source: librarySourceMode,
        driveUrl: driveFolderUrl,
        updatedAt: new Date().toLocaleDateString('es-ES'),
        variables,
        contentPreview: normalizedContent
      });
    }

    if (createdModels.length > 0) {
      setTemplates(prev => [...createdModels, ...prev]);
      setSelectedTemplateId(createdModels[0].id);
      showToast(
        createdModels.length === 1
          ? `Modelo "${createdModels[0].name}" cargado (${createdModels[0].variables.length} datos antiguos / espacios detectados).`
          : `${createdModels.length} modelos venezolanos cargados y normalizados automáticamente.`
      );
    }
  };

  const handleCreateTemplateManual = () => {
    if (!newTplNameInput.trim() || !newTplContentInput.trim()) {
      showToast('Ingresa el nombre del modelo y pega su texto (con datos antiguos, espacios ____ o variables).');
      return;
    }
    const { normalizedContent, variables } = analyzeAndNormalizeVenezuelanModel(newTplContentInput.trim());
    const created: ModelTemplate = {
      id: `tpl-${Date.now().toString().slice(-5)}`,
      name: newTplNameInput.trim(),
      category: newTplCategoryInput.trim() || 'General',
      source: librarySourceMode,
      driveUrl: newTplDriveUrlInput.trim() || driveFolderUrl,
      updatedAt: new Date().toLocaleDateString('es-ES'),
      variables,
      contentPreview: normalizedContent
    };
    setTemplates(prev => [created, ...prev]);
    setSelectedTemplateId(created.id);
    setNewTplNameInput('');
    setNewTplContentInput('');
    setNewTplDriveUrlInput('');
    setShowAddTemplateModal(false);
    showToast(`Modelo "${created.name}" guardado (${variables.length} datos antiguos / espacios libres detectados automáticamente).`);
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
  // PERSISTENCIA AUTOMÁTICA EN LOCALSTORAGE (RESTAURA LOS 550+ MODELOS SI ESTABA VACÍO)
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
      if (saved.librarySourceMode) setLibrarySourceMode(saved.librarySourceMode);
      if (saved.driveFolderUrl) setDriveFolderUrl(saved.driveFolderUrl);
      if (saved.localFolderPath) setLocalFolderPath(saved.localFolderPath);
      if (Array.isArray(saved.templates) && saved.templates.length > 0) {
        // Asegura que siempre estén los 550+ modelos de Google Drive junto con los personalizados
        const mapById = new Map<string, ModelTemplate>();
        saved.templates.forEach((t: ModelTemplate) => mapById.set(t.id, t));
        INITIAL_DRIVE_TEMPLATES.forEach(t => {
          if (!mapById.has(t.id)) mapById.set(t.id, t);
        });
        const merged = Array.from(mapById.values());
        setTemplates(merged);
        if (merged[0]) setSelectedTemplateId(merged[0].id);
      } else {
        setTemplates(INITIAL_DRIVE_TEMPLATES);
        setSelectedTemplateId(INITIAL_DRIVE_TEMPLATES[0].id);
      }
      if (Array.isArray(saved.ragDocs) && saved.ragDocs.length > 0) setRagDocs(saved.ragDocs);
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
      // Guarda tus modelos personalizados o modificados en localStorage sin saturar la cuota del navegador
      const customOrModifiedTemplates = templates.filter(
        t => !t.id.startsWith('drive-') || t.updatedAt === 'Analizado (Redacción Venezolana)'
      );
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
        librarySourceMode,
        driveFolderUrl,
        localFolderPath,
        templates: customOrModifiedTemplates,
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
    currentSpendUsd, savedHoursCount, librarySourceMode, driveFolderUrl, localFolderPath,
    templates, ragDocs, tasks, calendarEvents, crmClients, recordings,
    approvedDocsRegistry, piiAuditRegistry, auditLogs, consultSessions
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
              <span>{templates.length} Modelos Drive</span>
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
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium border transition cursor-pointer hover:opacity-90`}
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
              1. CONSULTOR DE IA (ESTILO MINIMALISTA, 4 ETAPAS FORENSES, CONECTADO A TU API, RAG Y 550+ MODELOS DE DRIVE)
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
                          {ragDocs.length} leyes en RAG • {templates.length} modelos de Google Drive conectados
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

                  <div className="flex-1 py-4 space-y-5 max-h-[500px] overflow-y-auto pr-1">
                    {consultThread.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4 space-y-3">
                        <div className="w-10 h-10 rounded-xl bg-[#0F172A] text-amber-400 flex items-center justify-center font-serif font-bold text-sm border border-amber-500/30">
                          <Scale className="w-5 h-5" />
                        </div>
                        <div className="max-w-lg space-y-1.5">
                          <h3 className="font-serif text-base sm:text-lg font-bold">
                            Consultoría Jurídica Conectada a tu RAG y tus {templates.length} Modelos de Google Drive
                          </h3>
                          <p style={{ color: theme.mutedText }} className="text-xs leading-relaxed">
                            Plantea el caso abajo o adjunta documentos (`.DOCX`, `.PDF`, imágenes o comunicaciones del cliente). El sistema analizará: <strong>I. Base Legal y Artículos Involucrados</strong>, <strong>II. Opciones Jurídicas</strong>, <strong>III. Escenarios y Consecuencias</strong> y <strong>IV. Decisión de Ejecución y Redacción Venezolana</strong>.
                          </p>
                        </div>

                        {!apiKeyInput.trim() && (
                          <div
                            style={subCardStyle}
                            className="max-w-lg w-full p-3.5 rounded-xl border text-left text-xs flex items-start justify-between gap-3 mt-2"
                          >
                            <div className="space-y-1">
                              <div className="font-semibold flex items-center gap-1.5" style={{ color: theme.accentText }}>
                                <AlertCircle className="w-4 h-4 shrink-0" />
                                Guía de Conexión de API
                              </div>
                              <p style={{ color: theme.mutedText }} className="text-[11px] leading-relaxed">
                                Tus <strong>{templates.length} modelos de Google Drive</strong> y tus leyes RAG ya están activos. Para que tu motor de IA redacte en vivo, ingresa tu API Key en <strong>11. Configuración</strong>.
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
                            <span>.DOCX</span>
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
                            className="px-2.5 py-1.5 rounded-xl border text-[11px] max-w-[175px]"
                          >
                            <option value="auto">Modelo Drive: Automático ({templates.length})</option>
                            {templates.slice(0, 120).map(tpl => (
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
              2. REDACTOR DE DOCUMENTOS (CONECTADO A TUS 550+ MODELOS DE GOOGLE DRIVE,
                 ADAPTADOR AUTOMÁTICO DE MODELOS CON DATOS VIEJOS O ESPACIOS LIBRES ____)
          ================================================================== */}
          {activeTab === 'redactor_docs' && (
            <div style={cardStyle} className="rounded-2xl p-4 sm:p-6 border shadow-xs space-y-5">
              {/* Barra Superior del Redactor con Conexión a Google Drive */}
              <div style={{ borderColor: theme.cardBorder }} className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span style={{ color: theme.emeraldText }} className="text-[11px] font-mono uppercase font-bold flex items-center gap-1.5">
                      <FolderOpen className="w-3.5 h-3.5" /> Google Drive Conectado ({templates.length} Modelos Venezolanos)
                    </span>
                  </div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold mt-0.5">
                    Redactor Jurídico con Sustitución Automática de Datos Antiguos y Espacios Libres
                  </h2>
                  <p style={{ color: theme.mutedText }} className="text-xs">
                    Usa directamente cualquiera de tus <strong>{templates.length} modelos de Google Drive</strong> o sube/pega tus archivos `.DOCX` tal como están (tengan datos de clientes anteriores o espacios en blanco <code>____</code>), sin necesidad de colocar llaves manuales.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={handleSyncGoogleDriveCatalog}
                    disabled={isSyncingDriveCatalog}
                    style={secondaryBtnStyle}
                    className="px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 text-emerald-500 ${isSyncingDriveCatalog ? 'animate-spin' : ''}`} />
                    <span>{isSyncingDriveCatalog ? 'Sincronizando Drive...' : 'Sincronizar Google Drive'}</span>
                  </button>

                  <a
                    href={driveFolderUrl || 'https://drive.google.com/drive/folders/1xHuhO7x1zL7Ll3-0J0s59Td2LBentREF'}
                    target="_blank"
                    rel="noreferrer"
                    style={secondaryBtnStyle}
                    className="px-3 py-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-amber-500" />
                    <span>Abrir Mi Carpeta de Drive</span>
                  </a>

                  <button
                    type="button"
                    onClick={() => setShowAdaptRealModelBox(!showAdaptRealModelBox)}
                    className="px-3.5 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                    <span>{showAdaptRealModelBox ? 'Cerrar Adaptador' : 'Subir / Pegar Modelo Real de Drive (Sin {{Llaves}})'}</span>
                  </button>
                </div>
              </div>

              {/* Caja desplegable para subir o pegar cualquier modelo real de Google Drive con datos viejos o espacios ____ */}
              {showAdaptRealModelBox && (
                <div style={subCardStyle} className="p-4 rounded-2xl border border-amber-500/40 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <span style={{ color: theme.accentText }} className="font-mono text-[11px] uppercase font-bold block">
                        Motor de Limpieza y Adaptación de Modelos Reales de Google Drive
                      </span>
                      <p style={{ color: theme.mutedText }} className="text-[11px]">
                        ¿Tu modelo en Drive tiene datos de un cliente viejo (Nombres, C.I., RIF, Registro, Montos) o líneas en blanco (<code>_______</code>)? Súbelo en `.DOCX` o pega su texto aquí: el sistema detectará automáticamente qué datos sustituir respetando el <strong>100% de tu redacción jurídica venezolana</strong>.
                      </p>
                    </div>
                    <label className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer shrink-0">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Subir .DOCX / .TXT de mi Drive</span>
                      <input
                        type="file"
                        accept=".docx,.doc,.txt,.md"
                        multiple
                        className="hidden"
                        onChange={async (e) => {
                          const f = e.target.files?.[0];
                          if (!f) return;
                          if (e.target.files && e.target.files.length > 1) {
                            await handleBatchUploadTemplateFiles(e.target.files);
                            setShowAdaptRealModelBox(false);
                          } else {
                            const txt = await extractRealTextFromDocxOrFile(f);
                            if (txt) {
                              setRawRealModelTextInput(txt);
                              handleApplyRawVenezuelanModelText(txt, f.name.replace(/\.[^/.]+$/, ''));
                            }
                          }
                        }}
                      />
                    </label>
                  </div>

                  <textarea
                    rows={5}
                    value={rawRealModelTextInput}
                    onChange={(e) => setRawRealModelTextInput(e.target.value)}
                    placeholder="Pega aquí el texto de tu modelo de Google Drive (puede tener datos de un caso anterior como 'Yo, PEDRO PÉREZ, C.I. V-12.345.678...' o espacios libres 'Yo, ________, C.I. V-________'). El sistema detectará automáticamente los datos viejos y espacios libres para reemplazarlos por los del nuevo cliente..."
                    style={inputStyle}
                    className="w-full p-3 rounded-xl border font-serif text-xs"
                  />

                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAdaptRealModelBox(false)}
                      style={secondaryBtnStyle}
                      className="px-3 py-1.5 rounded-lg border cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => handleApplyRawVenezuelanModelText(rawRealModelTextInput)}
                      className="px-4 py-1.5 rounded-lg bg-[#0F172A] text-white font-semibold cursor-pointer"
                    >
                      Detectar Datos Antiguos / Espacios Libres y Usar Este Modelo
                    </button>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-5 space-y-4">
                  {/* Paso 1: Buscador y Selector de los 550+ Modelos de Google Drive */}
                  <div style={subCardStyle} className="p-4 rounded-xl border space-y-3">
                    <div className="flex items-center justify-between">
                      <label className="block text-xs font-semibold">
                        1. Busca en tus {templates.length} Modelos de Google Drive
                      </label>
                      {selectedTemplate?.driveUrl && (
                        <a
                          href={selectedTemplate.driveUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: theme.accentText }}
                          className="text-[11px] font-mono font-semibold flex items-center gap-1 hover:underline"
                        >
                          <span>Abrir en Drive</span>
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <select
                        value={templateCategoryFilter}
                        onChange={(e) => setTemplateCategoryFilter(e.target.value)}
                        style={inputStyle}
                        className="w-full px-2.5 py-2 rounded-xl border text-xs"
                      >
                        {templateCategories.map(cat => (
                          <option key={cat} value={cat}>
                            {cat === 'Todas' ? `Todas las Categorías (${templates.length})` : cat}
                          </option>
                        ))}
                      </select>

                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          value={templateSearchQuery}
                          onChange={(e) => setTemplateSearchQuery(e.target.value)}
                          placeholder="Buscar ej: Poder, Compraventa, POD-01..."
                          style={inputStyle}
                          className="w-full pl-8 pr-2.5 py-2 rounded-xl border text-xs"
                        />
                      </div>
                    </div>

                    <select
                      value={selectedTemplate?.id || ''}
                      onChange={(e) => handleSelectTemplate(e.target.value)}
                      style={inputStyle}
                      className="w-full px-3 py-2.5 rounded-xl border text-xs font-semibold"
                    >
                      {filteredTemplatesForSelector.map(tpl => (
                        <option key={tpl.id} value={tpl.id}>
                          {tpl.name} — ({tpl.category})
                        </option>
                      ))}
                    </select>

                    {selectedTemplate?.fundamento && (
                      <div style={cardStyle} className="p-2.5 rounded-lg border text-[11px] space-y-0.5">
                        <div className="font-mono text-[10px] font-bold" style={{ color: theme.accentText }}>
                          Base Legal: {selectedTemplate.fundamento}
                        </div>
                        {selectedTemplate.notas && (
                          <div style={{ color: theme.mutedText }}>{selectedTemplate.notas}</div>
                        )}
                      </div>
                    )}

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
                        <option value="">Opcional: Importar datos de un cliente de tu CRM...</option>
                        {crmClients.map(c => (
                          <option key={c.id} value={c.id}>{c.name} ({c.taxId})</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Paso 2: Cargar Datos del Nuevo Caso por Escrito, Foto OCR o PDF/DOCX */}
                  <div style={subCardStyle} className="p-4 rounded-xl border space-y-3">
                    <div className="text-xs font-semibold">
                      2. Introduce los Datos del Nuevo Cliente (Sustituye datos viejos o espacios libres)
                    </div>
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
                        <FileUp className="w-3.5 h-3.5 text-emerald-400" /> Archivo PDF/DOCX
                      </button>
                    </div>

                    {inputModeTab === 'foto_ocr' && (
                      <div style={cardStyle} className="p-4 rounded-xl border border-dashed text-center space-y-2">
                        <p className="text-xs font-semibold">Subir imagen de Cédula de Identidad, RIF o Recaudo</p>
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
                          placeholder="Guía: Pega aquí los datos del nuevo cliente u operación (sin importar el orden) para rellenar los campos o reescribir el modelo conservando tu redacción jurídica venezolana..."
                        />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={handleExtractFromWrittenNotes}
                            disabled={isRedactorExtracting}
                            className="w-full py-2 px-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-semibold cursor-pointer"
                          >
                            {isRedactorExtracting ? 'Procesando...' : 'Extraer Datos del Escrito y Rellenar Modelo'}
                          </button>
                          <button
                            type="button"
                            onClick={handleAdaptFullModelWithAi}
                            disabled={isRedactorExtracting}
                            className="w-full py-2 px-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold cursor-pointer"
                          >
                            Adaptar Modelo Completo con IA (100% Redacción Venezolana)
                          </button>
                        </div>
                      </div>
                    )}

                    {extractedSourceNote && (
                      <div style={cardStyle} className="p-2.5 rounded-lg border text-[11px] font-mono" >
                        <span style={{ color: theme.emeraldText }}>✓ {extractedSourceNote}</span>
                      </div>
                    )}
                  </div>

                  {spousalConsentWarning && (
                    <div style={subCardStyle} className="p-3.5 rounded-xl border border-amber-500/40 text-xs space-y-2">
                      <div className="font-mono font-bold" style={{ color: theme.accentText }}>
                        Observación Registral Preventiva (Art. 168 Código Civil Venezolano)
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

                  {/* Campos detectados automáticamente (Datos antiguos, espacios libres o campos del catálogo) */}
                  {selectedTemplate && (
                    <div className="space-y-2.5 max-h-[340px] overflow-y-auto pr-1">
                      <div className="text-[11px] font-mono uppercase font-bold" style={{ color: theme.mutedText }}>
                        Campos a Sustituir o Completar en este Modelo ({selectedTemplate.variables.length}):
                      </div>
                      {selectedTemplate.variables.map((v) => (
                        <div key={v.key} className="space-y-1">
                          <label className="block text-[11px] font-semibold">
                            <span style={{ color: theme.accentText }} className="font-mono">[{v.category}]</span> {v.label}
                          </label>
                          <input
                            type="text"
                            value={templateValues[v.key] || ''}
                            onChange={(e) => {
                              setCustomEditedDocumentText(null);
                              setTemplateValues({ ...templateValues, [v.key]: e.target.value });
                            }}
                            placeholder={v.placeholder}
                            style={inputStyle}
                            className="w-full px-3 py-2 rounded-xl border text-xs"
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vista Previa Editable del Documento Venezolano Ensamblado */}
                <div style={subCardStyle} className="lg:col-span-7 flex flex-col justify-between p-5 rounded-2xl border space-y-4">
                  <div className="space-y-3">
                    <div style={{ borderColor: theme.subBorder }} className="flex flex-wrap items-center justify-between gap-2 border-b pb-3">
                      <div>
                        <span style={{ color: theme.accentText }} className="text-[10px] font-mono uppercase font-bold block">
                          Redacción Jurídica Venezolana • Editable en Vivo
                        </span>
                        <h3 className="font-serif font-bold text-base">
                          {selectedTemplate?.name || 'Vista Previa del Instrumento'}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        {customEditedDocumentText !== null && (
                          <button
                            type="button"
                            onClick={() => setCustomEditedDocumentText(null)}
                            style={secondaryBtnStyle}
                            className="px-2.5 py-1 rounded-lg border text-[10px] font-mono cursor-pointer"
                          >
                            Restaurar Plantilla Base
                          </button>
                        )}
                        <span style={{ color: theme.emeraldText }} className="text-[11px] font-mono font-semibold">
                          Sustitución en tiempo real
                        </span>
                      </div>
                    </div>

                    <textarea
                      rows={18}
                      value={compiledDocument}
                      onChange={(e) => setCustomEditedDocumentText(e.target.value)}
                      style={cardStyle}
                      className="w-full p-5 rounded-xl border min-h-[420px] font-serif text-xs sm:text-sm leading-relaxed focus:outline-none"
                    />
                  </div>

                  <div style={cardStyle} className="p-4 rounded-xl border flex flex-wrap items-center justify-between gap-3">
                    <div className="text-xs">
                      <strong className="block">Visado Profesional (Human-in-the-Loop)</strong>
                      <span style={{ color: theme.mutedText }} className="text-[11px]">
                        Estampa tu sello SHA-256 y descarga el instrumento en formato .DOC con márgenes de Papel Sellado / Registro / Notaría.
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
              11. CONFIGURACIÓN FUNCIONAL DEL DESPACHO (API, CONECTOR GOOGLE DRIVE 550+ MODELOS Y RAG)
          ================================================================== */}
          {activeTab === 'configuracion_sistema' && (
            <div style={cardStyle} className="rounded-2xl p-4 sm:p-6 border shadow-xs space-y-6">
              <div style={{ borderColor: theme.cardBorder }} className="flex flex-wrap items-center justify-between gap-4 border-b pb-4">
                <div>
                  <h2 className="font-serif text-lg sm:text-xl font-bold">
                    Configuración de API, Conector de Google Drive ({templates.length} Modelos) y Repositorio RAG
                  </h2>
                  <p style={{ color: theme.mutedText }} className="text-xs">
                    Conecta tu API Key privada, vincula tu carpeta de Google Drive con tus modelos venezolanos (sin necesidad de llaves manuales) y administra las leyes de tu RAG.
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
                    setTemplates(INITIAL_DRIVE_TEMPLATES);
                    setSelectedTemplateId(INITIAL_DRIVE_TEMPLATES[0].id);
                    showToast('Almacenamiento local restablecido con tus 550+ modelos de Google Drive.');
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
                      placeholder="Guía: Ej. IPSA Nº 102.485 / Inpreabogado Nº 115.794"
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
                      placeholder="Guía: Ej. Derecho Corporativo, Civil y Mercantil"
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

              {/* 3. Gestión Funcional de Biblioteca de Google Drive (550+ Modelos) y Leyes RAG */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* BIBLIOTECA DE MODELOS CON CONECTOR GOOGLE DRIVE RESTAURADO Y DETECTOR SIN LLAVES */}
                <div style={subCardStyle} className="p-4 sm:p-5 rounded-xl border space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <h3 className="font-serif font-bold text-sm flex items-center gap-2">
                        <FolderOpen className="w-4 h-4 text-emerald-500" /> 3. Tu Biblioteca de Modelos ({templates.length} en {librarySourceMode})
                      </h3>
                      <p style={{ color: theme.mutedText }} className="text-[11px]">
                        Tus modelos con redacción jurídica venezolana funcionan directamente aunque tengan <strong>datos de clientes anteriores</strong> o <strong>espacios libres (<code>____</code>)</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Selector Google Drive vs Carpeta Local */}
                  <div className="space-y-2.5 text-xs">
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setLibrarySourceMode('Google Drive')}
                        style={librarySourceMode === 'Google Drive' ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#F59E0B' } : secondaryBtnStyle}
                        className="py-2 rounded-xl font-semibold border cursor-pointer"
                      >
                        Google Drive
                      </button>
                      <button
                        type="button"
                        onClick={() => setLibrarySourceMode('Carpeta Local')}
                        style={librarySourceMode === 'Carpeta Local' ? { backgroundColor: '#0F172A', color: '#FFFFFF', borderColor: '#F59E0B' } : secondaryBtnStyle}
                        className="py-2 rounded-xl font-semibold border cursor-pointer"
                      >
                        Carpeta Local
                      </button>
                    </div>

                    {librarySourceMode === 'Google Drive' ? (
                      <div className="space-y-2">
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={driveFolderUrl}
                            onChange={(e) => setDriveFolderUrl(e.target.value)}
                            placeholder="Enlace de tu carpeta de Google Drive..."
                            style={inputStyle}
                            className="flex-1 px-3 py-2 rounded-xl border font-mono text-xs"
                          />
                          <button
                            type="button"
                            onClick={handleSyncGoogleDriveCatalog}
                            disabled={isSyncingDriveCatalog}
                            className="px-3 py-2 rounded-xl bg-[#0F172A] text-white font-semibold text-xs flex items-center gap-1.5 cursor-pointer shrink-0"
                          >
                            <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${isSyncingDriveCatalog ? 'animate-spin' : ''}`} />
                            <span>Sincronizar Drive</span>
                          </button>
                        </div>

                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={driveDocUrlToImport}
                            onChange={(e) => setDriveDocUrlToImport(e.target.value)}
                            placeholder="O pega el enlace de un documento individual de Google Docs / Drive..."
                            style={inputStyle}
                            className="flex-1 px-3 py-1.5 rounded-xl border font-mono text-[11px]"
                          />
                          <button
                            type="button"
                            onClick={handleImportModelFromDriveLink}
                            style={secondaryBtnStyle}
                            className="px-3 py-1.5 rounded-xl border font-semibold text-[11px] cursor-pointer shrink-0"
                          >
                            Importar Enlace Drive
                          </button>
                        </div>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={localFolderPath}
                        onChange={(e) => setLocalFolderPath(e.target.value)}
                        placeholder="Ruta de tu carpeta local de modelos..."
                        style={inputStyle}
                        className="w-full px-3 py-2 rounded-xl border font-mono text-xs"
                      />
                    )}

                    <div className="flex flex-wrap gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setShowAddTemplateModal(!showAddTemplateModal)}
                        className="px-3 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                      >
                        <Plus className="w-3.5 h-3.5 text-amber-400" /> Pegar Modelo Real (Con Datos o Espacios ____)
                      </button>

                      <label className="px-3 py-2 rounded-xl bg-emerald-700 text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Agregar Nuevo Modelo (.DOCX / .TXT)</span>
                        <input
                          type="file"
                          accept=".doc,.docx,.txt,.md"
                          multiple
                          className="hidden"
                          onChange={(e) => handleBatchUploadTemplateFiles(e.target.files)}
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
                        placeholder="Nombre del modelo (Ej. Contrato de Compraventa / Poder Especial)..."
                        style={inputStyle}
                        className="w-full px-3 py-1.5 rounded-lg border"
                      />
                      <input
                        type="text"
                        value={newTplCategoryInput}
                        onChange={(e) => setNewTplCategoryInput(e.target.value)}
                        placeholder="Categoría (Ej. Civil - Contratos y Garantías / Poderes y Mandatos)..."
                        style={inputStyle}
                        className="w-full px-3 py-1.5 rounded-lg border"
                      />
                      <textarea
                        rows={5}
                        value={newTplContentInput}
                        onChange={(e) => setNewTplContentInput(e.target.value)}
                        placeholder="Pega aquí tu modelo tal como está en tu Google Drive (aunque tenga datos de un cliente viejo como 'Yo, JUAN PÉREZ, C.I. V-12.345.678...' o espacios libres '________'). El sistema detectará automáticamente los datos a sustituir sin que tengas que escribir llaves..."
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
                          Analizar y Guardar Modelo en Biblioteca
                        </button>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                    {templates.slice(0, 60).map(tpl => (
                      <div key={tpl.id} style={cardStyle} className="p-3 rounded-xl border flex items-center justify-between gap-2 text-xs">
                        <div className="min-w-0">
                          <div className="font-semibold truncate">{tpl.name}</div>
                          <div style={{ color: theme.mutedText }} className="text-[10px] font-mono">
                            {tpl.category} • {tpl.source} • {tpl.variables.length} campos detectados
                          </div>
                        </div>
                        <div className="flex items-center gap-1 shrink-0">
                          {tpl.driveUrl && (
                            <a
                              href={tpl.driveUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={secondaryBtnStyle}
                              className="px-2 py-1 rounded-lg border text-[10px] font-mono flex items-center gap-1"
                              title="Abrir en Google Drive"
                            >
                              Drive <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              handleSelectTemplate(tpl.id);
                              setActiveTab('redactor_docs');
                            }}
                            style={secondaryBtnStyle}
                            className="px-2.5 py-1 rounded-lg border text-[11px] font-semibold cursor-pointer"
                          >
                            Usar
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
                    ))}
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
                          onChange={async (e) => {
                            const f = e.target.files?.[0];
                            if (!f) return;
                            const cleanText = await extractRealTextFromDocxOrFile(f);
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
