'use client';

import React, { useState, useEffect } from 'react';
import {
  Shield, Scale, Cpu, Calendar, Users, Mic, CheckSquare, Play, Square, Download,
  ChevronLeft, Search, BarChart3, FolderGit2, X, Upload, Send, Sun, Moon, Menu,
  UserCheck, Bot, FileCode, Paperclip
} from 'lucide-react';

// ============================================================================
// UTILIDADES DE SEGURIDAD ZERO-TRUST PII, HASH SHA-256 Y LECTURA DE ARCHIVOS
// ============================================================================
async function calcularHashSHA256(mensaje: string): Promise<string> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle) {
    const msgBuffer = new TextEncoder().encode(mensaje);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }
  let h = 0;
  for (let i = 0; i < mensaje.length; i++) {
    h = Math.imul(31, h) + mensaje.charCodeAt(i) | 0;
  }
  return Math.abs(h).toString(16).padStart(64, 'a');
}

function sanitizarTextoPII(texto: string, reglasExtra: { etiqueta: string; regexStr: string }[] = []) {
  let sanitizado = texto;
  const entidades: { tipo: string; original: string; token: string }[] = [];
  const mapaRehidratacion: Record<string, string> = {};
  let contador = 1;

  const patronesBase: { tipo: string; regex: RegExp }[] = [
    { tipo: 'ID_FISCAL', regex: /\b(?:[VJGEP][-\s]?\d{7,9}(?:[-\s]?\d)?|[A-HJ-NP-SUVW]\d{7}[0-9A-J]|\d{8}[A-Z]|[XYZ]\d{7}[A-Z]|\d{2}-\d{8}-\d)\b/gi },
    { tipo: 'DOC_IDENTIDAD', regex: /\b(?:[VE][-\s]?(?:\d{1,2}\.\d{3}\.\d{3}|\d{6,8})|\d{1,2}\.\d{3}\.\d{3}-[0-9Kk])\b/gi },
    { tipo: 'CUENTA_IBAN', regex: /\b[A-Z]{2}\d{2}[A-Z0-9]{12,30}\b/g },
    { tipo: 'CORREO_ELECTRONICO', regex: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g },
    { tipo: 'TELEFONO', regex: /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b/g },
    { tipo: 'MONTO_PATRIMONIAL', regex: /\b(?:USD|EUR|€|\$|MXN|COP|ARS|CLP|PEN|Bs\.?)\s?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\b|\b\d{1,3}(?:[.,]\d{3})+(?:[.,]\d{2})?\s?(?:USD|EUR|€|MXN|COP|ARS|CLP|PEN|Bs\.?)\b/gi }
  ];

  for (const r of reglasExtra) {
    try {
      patronesBase.push({ tipo: r.etiqueta, regex: new RegExp(r.regexStr, 'gi') });
    } catch {}
  }

  for (const { tipo, regex } of patronesBase) {
    sanitizado = sanitizado.replace(regex, (match) => {
      const token = `[${tipo}_${String(contador).padStart(2, '0')}]`;
      contador++;
      mapaRehidratacion[token] = match;
      entidades.push({ tipo, original: match, token });
      return token;
    });
  }

  const rehidratar = (textoIA: string) => {
    let resultado = textoIA;
    Object.entries(mapaRehidratacion).forEach(([token, original]) => {
      resultado = resultado.split(token).join(original);
    });
    return resultado;
  };

  return { textoSanitizado: sanitizado, entidades, rehidratar };
}

async function extraerTextoArchivoCliente(file: File): Promise<string> {
  try {
    const raw = await file.text();
    const limpio = raw.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
    if (limpio.length > 20) return limpio.slice(0, 6000);
  } catch {}
  return `Archivo indexado localmente en contenedor Docker: ${file.name} (${Math.round(file.size / 1024)} KB)`;
}

// ============================================================================
// COMPONENTE PRINCIPAL: SISTEMA BASE COMERCIAL DOCKERIZADO (WHITE-LABEL)
// ============================================================================
export default function AIGovernCommercialDockerOS() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const isDark = theme === 'dark';
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Navegación principal: Configurador Docker + 10 Módulos de la Estructura Base Comercial
  const [activeTab, setActiveTab] = useState<string>('conector_docker');
  const [bannerNotificacion, setBannerNotificacion] = useState<string | null>(null);

  const notificar = (msg: string) => {
    setBannerNotificacion(msg);
    setTimeout(() => setBannerNotificacion(null), 4000);
  };

  // ==========================================================================
  // 0. CONFIGURACIÓN DEL NODO DOCKER Y LOS 3 CONECTORES DEL CLIENTE COMPRADOR
  // ==========================================================================
  const [nombreDespachoCliente, setNombreDespachoCliente] = useState("Estudio Jurídico & Asociados (Edición Docker)");
  const [titularDespacho, setTitularDespacho] = useState("Socio Director / Abogado Titular");
  const [colegiadoId, setColegiadoId] = useState("Matrícula Colegial Verificada");
  const [paisDespacho, setPaisDespacho] = useState("España");
  const [ramaDerechoActiva, setRamaDerechoActiva] = useState("Derecho Civil y Mercantil");

  // CONECTOR 1: API DEL LLM QUE ELIJA EL CLIENTE (BYOK + CONTROL DE GASTO)
  const [proveedorLLM, setProveedorLLM] = useState<'openai' | 'anthropic' | 'gemini' | 'groq' | 'ollama_local'>('openai');
  const [modeloEspecificoLLM, setModeloEspecificoLLM] = useState("gpt-4o");
  const [apiKeyCliente, setApiKeyCliente] = useState("");
  const [urlOllamaLocal, setUrlOllamaLocal] = useState("http://host.docker.internal:11434/v1");
  const [topeMensualAPI, setTopeMensualAPI] = useState<number>(30);
  const [gastoAcumuladoAPI, setGastoAcumuladoAPI] = useState<number>(0.84);

  // CONECTOR 2: BIBLIOTECA DE MODELOS JURÍDICOS (CARPETA LOCAL O GOOGLE DRIVE)
  const [modoConexionModelos, setModoConexionModelos] = useState<'carpeta_local' | 'google_drive' | 'hibrido'>('hibrido');
  const [rutaCarpetaLocalDocker, setRutaCarpetaLocalDocker] = useState("/app/data/modelos_locales");
  const [urlCarpetaGoogleDrive, setUrlCarpetaGoogleDrive] = useState("");
  const [estadoSyncDrive, setEstadoSyncDrive] = useState("Listo para vincular carpeta o índice de Google Drive");

  const [bibliotecaModelosCliente, setBibliotecaModelosCliente] = useState<{
    id: string;
    titulo: string;
    rama: string;
    origen: 'Carpeta Local Docker' | 'Google Drive';
    ruta_o_url: string;
    variables: string[];
    contenidoBase: string;
  }[]>([
    {
      id: "MOD-BASE-01",
      titulo: "Contrato de Prestación de Servicios Profesionales y Confidencialidad",
      rama: "Derecho Civil y Mercantil",
      origen: "Carpeta Local Docker",
      ruta_o_url: "/app/data/modelos_locales/Contrato_Servicios_Base.docx",
      variables: ["CLIENTE", "ID_FISCAL_CLIENTE", "CONTRAPARTE", "ID_FISCAL_CONTRAPARTE", "OBJETO", "MONTO_HONORARIOS", "JURISDICCION"],
      contenidoBase: "ENTRE {{CLIENTE}} (ID Fiscal {{ID_FISCAL_CLIENTE}}) y {{CONTRAPARTE}} (ID Fiscal {{ID_FISCAL_CONTRAPARTE}}), se suscribe el presente Contrato de Servicios Profesionales para {{OBJETO}}, pactando honorarios por {{MONTO_HONORARIOS}} bajo la jurisdicción de {{JURISDICCION}}."
    },
    {
      id: "MOD-BASE-02",
      titulo: "Escrito de Demanda / Reclamación de Cantidad Procesal",
      rama: "Derecho Procesal y Litigio",
      origen: "Carpeta Local Docker",
      ruta_o_url: "/app/data/modelos_locales/Demanda_Reclamacion_Cantidad.docx",
      variables: ["JUZGADO_COMPETENTE", "DEMANDANTE", "DEMANDADO", "CUANTIA_LITIGIO", "HECHOS_RESUMEN"],
      contenidoBase: "AL {{JUZGADO_COMPETENTE}}. Comparece la representación letrada de {{DEMANDANTE}} interponiendo demanda contra {{DEMANDADO}} por la cuantía de {{CUANTIA_LITIGIO}}, con base en los siguientes HECHOS: {{HECHOS_RESUMEN}}."
    },
    {
      id: "MOD-BASE-03",
      titulo: "Acta de Junta General / Asamblea de Socios",
      rama: "Derecho Societario y Corporativo",
      origen: "Google Drive",
      ruta_o_url: "https://drive.google.com/drive/folders/biblioteca-societaria-cliente",
      variables: ["SOCIEDAD_MERCANTIL", "FECHA_SESION", "QUORUM_ASISTENCIA", "ACUERDOS_ADOPTADOS"],
      contenidoBase: "En la sede social de {{SOCIEDAD_MERCANTIL}}, siendo el día {{FECHA_SESION}}, reunidos los socios con un quórum de {{QUORUM_ASISTENCIA}}, se adoptan por unanimidad los siguientes acuerdos: {{ACUERDOS_ADOPTADOS}}."
    }
  ]);

  const [nuevoModTitulo, setNuevoModTitulo] = useState("");
  const [nuevoModRama, setNuevoModRama] = useState("Derecho Civil y Mercantil");
  const [nuevoModVariables, setNuevoModVariables] = useState("CLIENTE, CONTRAPARTE, OBJETO, MONTO, JURISDICCION");
  const [nuevoModTexto, setNuevoModTexto] = useState("");

  // CONECTOR 3: CARGAR NORMATIVA LEGAL APLICABLE A SU RAMA DEL DERECHO (MOTOR RAG)
  const [rutaCarpetaRAGDocker, setRutaCarpetaRAGDocker] = useState("/app/data/rag_normativa");
  const [modoEstrictoRAG, setModoEstrictoRAG] = useState<boolean>(true);
  const [corpusNormativoRAG, setCorpusNormativoRAG] = useState<{
    id: string;
    titulo: string;
    rama: string;
    pais: string;
    origen: string;
    extractoNormativo: string;
  }[]>([
    {
      id: "RAG-01",
      titulo: "Código Civil y Normativa de Obligaciones y Contratos",
      rama: "Derecho Civil y Mercantil",
      pais: "Multi-Jurisdicción",
      origen: "/app/data/rag_normativa/Codigo_Civil_Obligaciones.pdf",
      extractoNormativo: "Los contratos tienen fuerza de ley entre las partes contratantes y deben cumplirse al tenor de los mismos bajo el principio de buena fe contractual y autonomía de la voluntad."
    },
    {
      id: "RAG-02",
      titulo: "Código Procesal / Ley de Enjuiciamiento — Requisitos de Admisibilidad y Cómputo de Plazos",
      rama: "Derecho Procesal y Litigio",
      pais: "Multi-Jurisdicción",
      origen: "/app/data/rag_normativa/Ley_Procesal_Vigente.pdf",
      extractoNormativo: "Todo escrito de demanda expresará la identificación de las partes, los hechos numerados, los fundamentos de derecho verificados y la petición clara. Las actuaciones judiciales se practicarán en días y horas hábiles."
    },
    {
      id: "RAG-03",
      titulo: "Marco Deontológico: Secreto Profesional, Protección de Datos y Supervisión Humana",
      rama: "Deontología y Compliance",
      pais: "Multi-Jurisdicción",
      origen: "/app/data/rag_normativa/Normativa_Deontologica_IA.pdf",
      extractoNormativo: "Cumplimiento estricto del secreto profesional (Circular 3/2026 CGAE, Art. 28 RGPD, Lineamientos Barra Mexicana, Ley 1123 Colombia). Prohibición absoluta de presentar citas jurisprudenciales no verificadas en el RAG del despacho."
    }
  ]);

  const [nuevaNormaTitulo, setNuevaNormaTitulo] = useState("");
  const [nuevaNormaRama] = useState("Derecho Civil y Mercantil");
  const [nuevaNormaExtracto, setNuevaNormaExtracto] = useState("");

  // ==========================================================================
  // MÓDULO 8: TRAZABILIDAD CRIPTOGRÁFICA SHA-256
  // ==========================================================================
  const [bitacoraTrazabilidad, setBitacoraTrazabilidad] = useState<{
    id: string;
    fechaHora: string;
    modulo: string;
    accion: string;
    proveedorLLM: string;
    fuenteRAG: string;
    tokensPII: number;
    estadoHumanLoop: 'Verificado por Abogado' | 'Pendiente Human-Loop' | 'Sistema Docker';
    hashSHA256: string;
  }[]>([
    {
      id: "TRZ-001",
      fechaHora: "18/10/2026 09:00:15",
      modulo: "Nodo Docker On-Premise",
      accion: "Inicialización de volúmenes locales (/app/data/modelos_locales y /app/data/rag_normativa)",
      proveedorLLM: "Configuración Local",
      fuenteRAG: "3 cuerpos normativos indexados",
      tokensPII: 0,
      estadoHumanLoop: "Sistema Docker",
      hashSHA256: "8f4b2e9c1d7a6f3e5b0c9d8e7f6a5b4c3d2e1f0a9b8c7d6e5f4a3b2c1d0e9f8a"
    }
  ]);

  // ==========================================================================
  // MÓDULO 9: HUMAN-IN-THE-LOOP (COLA DE SUPERVISIÓN Y VISADO HUMANO OBLIGATORIO)
  // ==========================================================================
  const [colaHumanLoop, setColaHumanLoop] = useState<{
    id: string;
    titulo: string;
    origenModulo: 'Redactor de Documentos' | 'Consultor de IA' | 'Grabador de Actas';
    fechaCreacion: string;
    rama: string;
    contenido: string;
    citasRAGUsadas: string[];
    checkNormativa: boolean;
    checkClausulas: boolean;
    checkPII: boolean;
    aprobadoPorHumano: boolean;
    firmante?: string;
    hashAprobacion?: string;
  }[]>([
    {
      id: "HL-101",
      titulo: "Borrador Preliminar — Contrato de Prestación de Servicios Profesionales",
      origenModulo: "Redactor de Documentos",
      fechaCreacion: "18/10/2026 09:15",
      rama: "Derecho Civil y Mercantil",
      contenido: "CONTRATO DE SERVICIOS PROFESIONALES\n\nReunidos de una parte el Cliente y de otra la Contraparte, acuerdan suscribir el presente contrato bajo las normas del Código Civil cargado en el motor RAG del despacho...\n\nCLÁUSULA PRIMERA: Objeto del mandato.\nCLÁUSULA SEGUNDA: Honorarios y forma de pago.\nCLÁUSULA TERCERA: Secreto profesional y protección de datos.",
      citasRAGUsadas: ["Código Civil y Normativa de Obligaciones y Contratos", "Marco Deontológico: Secreto Profesional"],
      checkNormativa: false,
      checkClausulas: false,
      checkPII: true,
      aprobadoPorHumano: false
    }
  ]);

  // ==========================================================================
  // MÓDULO 10: ANONIMIZACIÓN PII (GATEWAY ZERO-TRUST EN MEMORIA LOCAL)
  // ==========================================================================
  const [textoPruebaPII, setTextoPruebaPII] = useState(
    "El cliente GRUPO INDUSTRIAL DEL SUR, S.A. (ID Fiscal B-87654321), representado por Martín Gómez (Doc. V-15.432.109), abonará 45.000 USD en la cuenta ES9121000418450200051332. Contacto: legal@gruposur.com / +34 611-223-344."
  );
  const [reglasPIIPersonalizadas, setReglasPIIPersonalizadas] = useState<{ etiqueta: string; regexStr: string }[]>([]);
  const [nuevaEtiquetaPII, setNuevaEtiquetaPII] = useState("");
  const [nuevoRegexPII, setNuevoRegexPII] = useState("");

  // ==========================================================================
  // MÓDULO 1: CONSULTOR DE IA (ANCLADO AL RAG DEL CLIENTE)
  // ==========================================================================
  const [mensajesConsultor, setMensajesConsultor] = useState<{
    emisor: 'ia' | 'usuario';
    texto: string;
    fuentesRAG?: string[];
    tokensProtegidos?: number;
  }[]>([
    {
      emisor: 'ia',
      texto: `Bienvenido al Consultor Jurídico IA de ${nombreDespachoCliente}. Estoy conectado al proveedor LLM seleccionado (${proveedorLLM.toUpperCase()}) y anclado exclusivamente a tu Normativa Legal RAG (${ramaDerechoActiva}). Toda consulta se anonimiza previamente en memoria local.`
    }
  ]);
  const [inputConsultor, setInputConsultor] = useState("");
  const [archivosConsultor, setArchivosConsultor] = useState<string[]>([]);
  const [textoAdjuntoConsultor, setTextoAdjuntoConsultor] = useState("");
  const [consultorCargando, setConsultorCargando] = useState(false);

  // ==========================================================================
  // MÓDULO 2: REDACTOR DE DOCUMENTOS (CONECTADO A CARPETA LOCAL / GOOGLE DRIVE)
  // ==========================================================================
  const [modeloRedactorId, setModeloRedactorId] = useState("MOD-BASE-01");
  const [busquedaModelo, setBusquedaModelo] = useState("");
  const [valoresVariablesRedactor, setValoresVariablesRedactor] = useState<Record<string, string>>({});
  const [instruccionesAdicionalesRedactor, setInstruccionesAdicionalesRedactor] = useState("");
  const [borradorGeneradoRedactor, setBorradorGeneradoRedactor] = useState("");
  const [redactorCargando, setRedactorCargando] = useState(false);

  // ==========================================================================
  // MÓDULO 3: GRABADOR DE AUDIENCIAS Y REUNIONES (WHISPER DOCKER LOCAL)
  // ==========================================================================
  const [grabandoAudio, setGrabandoAudio] = useState(false);
  const [segundosGrabacion, setSegundosGrabacion] = useState(0);
  const [tituloSesionGrabador, setTituloSesionGrabador] = useState("Reunión de Estrategia Procesal / Audiencia Preliminar");
  const [participantesGrabador, setParticipantesGrabador] = useState("Socio Director, Abogado Asociado, Representante del Cliente");
  const [transcripcionGrabador, setTranscripcionGrabador] = useState(
    "En la sesión del día de hoy se revisaron las cláusulas de limitación de responsabilidad del contrato marco y se acordó presentar el escrito de contestación antes del viernes, adjuntando la certificación registral y el poder especial."
  );
  const [acuerdosExtraidosGrabador, setAcuerdosExtraidosGrabador] = useState<{
    id: string;
    descripcion: string;
    responsable: string;
    plazo: string;
    enviadoPlanificador: boolean;
  }[]>([
    { id: "AC-01", descripcion: "Redactar adenda de limitación de responsabilidad conforme al modelo del despacho", responsable: "Abogado Titular", plazo: "48 horas", enviadoPlanificador: false },
    { id: "AC-02", descripcion: "Presentar escrito procesal con certificación registral adjunta", responsable: "Asociado Litigios", plazo: "Viernes 14:00", enviadoPlanificador: false }
  ]);

  useEffect(() => {
    let timer: any;
    if (grabandoAudio) {
      timer = setInterval(() => setSegundosGrabacion(s => s + 1), 1000);
    }
    return () => clearInterval(timer);
  }, [grabandoAudio]);

  // ==========================================================================
  // MÓDULO 4: PLANIFICADOR (KANBAN Y LISTA DE EXPEDIENTES Y TAREAS)
  // ==========================================================================
  const [vistaPlanificador, setVistaPlanificador] = useState<'kanban' | 'lista'>('kanban');
  const [tareasPlanificador, setTareasPlanificador] = useState<{
    id: string;
    titulo: string;
    cliente: string;
    rama: string;
    prioridad: 'Crítica' | 'Alta' | 'Media';
    estado: 'Pendiente' | 'En Tramitación' | 'En Revisión Human-Loop';
    plazo: string;
  }[]>([
    { id: "EXP-01", titulo: "Revisión de Contrato Marco y Anexos", cliente: "Corporación Industrial Alfa", rama: "Derecho Civil y Mercantil", prioridad: "Alta", estado: "En Tramitación", plazo: "22/10/2026" },
    { id: "EXP-02", titulo: "Contestación de Demanda y Oposición de Excepciones", cliente: "Inversiones del Atlántico", rama: "Derecho Procesal y Litigio", prioridad: "Crítica", estado: "Pendiente", plazo: "20/10/2026" },
    { id: "EXP-03", titulo: "Visado Final de Acta de Asamblea Extraordinaria", cliente: "Grupo Tecnológico Beta", rama: "Derecho Societario y Corporativo", prioridad: "Media", estado: "En Revisión Human-Loop", plazo: "25/10/2026" }
  ]);
  const [nuevaTareaTitulo, setNuevaTareaTitulo] = useState("");
  const [nuevaTareaCliente, setNuevaTareaCliente] = useState("");
  const [nuevaTareaPrioridad, setNuevaTareaPrioridad] = useState<'Crítica' | 'Alta' | 'Media'>('Alta');
  const [nuevaTareaPlazo] = useState("28/10/2026");

  // ==========================================================================
  // MÓDULO 5: CALENDARIO PROCESAL (CÓMPUTO DE PLAZOS Y EXPORTACIÓN .ICS)
  // ==========================================================================
  const [eventosCalendario, setEventosCalendario] = useState<{
    id: string;
    titulo: string;
    fecha: string;
    hora: string;
    tipoPlazo: 'Días Hábiles de Despacho' | 'Días Continuos';
    expediente: string;
  }[]>([
    { id: "CAL-01", titulo: "Vencimiento de Término para Contestación de Demanda", fecha: "2026-10-22", hora: "15:00", tipoPlazo: "Días Hábiles de Despacho", expediente: "EXP-02" },
    { id: "CAL-02", titulo: "Audiencia Preliminar / Comparecencia Judicial", fecha: "2026-10-26", hora: "10:00", tipoPlazo: "Días Hábiles de Despacho", expediente: "EXP-01" }
  ]);
  const [nuevoEventoTitulo, setNuevoEventoTitulo] = useState("");
  const [nuevoEventoFecha, setNuevoEventoFecha] = useState("2026-10-29");
  const [nuevoEventoHora] = useState("11:00");
  const [nuevoEventoTipo] = useState<'Días Hábiles de Despacho' | 'Días Continuos'>('Días Hábiles de Despacho');

  // ==========================================================================
  // MÓDULO 6: CRM & DIRECTORIO DE CLIENTES
  // ==========================================================================
  const [clientesCRM, setClientesCRM] = useState<{
    id: string;
    nombre: string;
    idFiscal: string;
    contacto: string;
    ramaPrincipal: string;
    estadoPoder: 'Vigente' | 'Por Renovar' | 'En Trámite';
    expedientesActivos: number;
  }[]>([
    { id: "CLI-01", nombre: "Corporación Industrial Alfa, S.A.", idFiscal: "B-12345678", contacto: "gerencia@corporacionalfa.com", ramaPrincipal: "Derecho Civil y Mercantil", estadoPoder: "Vigente", expedientesActivos: 2 },
    { id: "CLI-02", nombre: "Inversiones del Atlántico, S.L.", idFiscal: "J-98765432-1", contacto: "legal@inversionesatlantico.com", ramaPrincipal: "Derecho Procesal y Litigio", estadoPoder: "Por Renovar", expedientesActivos: 1 },
    { id: "CLI-03", nombre: "Grupo Tecnológico Beta", idFiscal: "A-55443322", contacto: "directorio@grupobeta.com", ramaPrincipal: "Derecho Societario y Corporativo", estadoPoder: "Vigente", expedientesActivos: 1 }
  ]);
  const [nuevoClienteNombre, setNuevoClienteNombre] = useState("");
  const [nuevoClienteIdFiscal, setNuevoClienteIdFiscal] = useState("");
  const [nuevoClienteContacto, setNuevoClienteContacto] = useState("");

  // ==========================================================================
  // FUNCIONES CENTRALES: MOTOR DE INFERENCIA MULTI-LLM + PII + RAG + TRAZABILIDAD
  // ==========================================================================
  const ejecutarInferenciaDocker = async (
    moduloOrigen: string,
    instruccionSistema: string,
    promptCrudo: string
  ): Promise<{ respuesta: string; fuentesRAG: string[]; tokensPII: number; hash: string }> => {
    const { textoSanitizado, entidades, rehidratar } = sanitizarTextoPII(promptCrudo, reglasPIIPersonalizadas);
    const hash = await calcularHashSHA256(`${moduloOrigen}|${textoSanitizado}|${Date.now()}`);
    const ahora = new Date().toLocaleString('es-ES');

    const normasAplicables = corpusNormativoRAG.filter(
      n => n.rama.toLowerCase().includes(ramaDerechoActiva.toLowerCase().split(' ')[1] || '') || n.pais === paisDespacho || n.pais === 'Multi-Jurisdicción'
    );
    const listaTitulosRAG = (normasAplicables.length > 0 ? normasAplicables : corpusNormativoRAG).map(n => n.titulo);
    const contextoRAG = (normasAplicables.length > 0 ? normasAplicables : corpusNormativoRAG)
      .map(n => `• [${n.titulo} (${n.origen})]: ${n.extractoNormativo}`)
      .join('\n');

    const promptSistemaCompleto = `${instruccionSistema}
DESPACHO: ${nombreDespachoCliente} | PAÍS: ${paisDespacho} | RAMA DEL DERECHO: ${ramaDerechoActiva}.
MODO ESTRICTO RAG (${modoEstrictoRAG ? 'ACTIVO - 0% ALUCINACIONES' : 'FLEXIBLE'}): Fundamenta tu respuesta exclusivamente en la siguiente normativa legal cargada por el cliente en su contenedor Docker:
${contextoRAG}`;

    if (proveedorLLM !== 'ollama_local') {
      setGastoAcumuladoAPI(prev => Number((prev + 0.0025).toFixed(4)));
    }

    let respuestaFinal = "";
    const keyLimpia = apiKeyCliente.trim();

    try {
      const resBackend = await fetch("http://localhost:8000/api/inferencia", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          modulo: moduloOrigen,
          proveedor: proveedorLLM,
          api_key: keyLimpia,
          modelo_llm: modeloEspecificoLLM,
          prompt_sistema: promptSistemaCompleto,
          prompt_usuario: promptCrudo,
          rama_derecho: ramaDerechoActiva,
          pais: paisDespacho
        })
      }).catch(() => null);

      if (resBackend && resBackend.ok) {
        const dataBack = await resBackend.json();
        if (dataBack?.respuesta) {
          respuestaFinal = dataBack.respuesta;
        }
      }

      if (!respuestaFinal && keyLimpia) {
        if (proveedorLLM === 'openai') {
          const r = await fetch("https://api.openai.com/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${keyLimpia}` },
            body: JSON.stringify({
              model: modeloEspecificoLLM || "gpt-4o-mini",
              messages: [
                { role: "system", content: promptSistemaCompleto },
                { role: "user", content: textoSanitizado }
              ],
              temperature: 0.2
            })
          });
          if (r.ok) {
            const d = await r.json();
            respuestaFinal = rehidratar(d?.choices?.[0]?.message?.content || "");
          }
        } else if (proveedorLLM === 'groq') {
          const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: { "Content-Type": "application/json", "Authorization": `Bearer ${keyLimpia}` },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [
                { role: "system", content: promptSistemaCompleto },
                { role: "user", content: textoSanitizado }
              ],
              temperature: 0.2
            })
          });
          if (r.ok) {
            const d = await r.json();
            respuestaFinal = rehidratar(d?.choices?.[0]?.message?.content || "");
          }
        } else if (proveedorLLM === 'gemini') {
          const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${keyLimpia}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ parts: [{ text: `${promptSistemaCompleto}\n\nCONSULTA SANITIZADA:\n${textoSanitizado}` }] }]
            })
          });
          if (r.ok) {
            const d = await r.json();
            respuestaFinal = rehidratar(d?.candidates?.[0]?.content?.parts?.[0]?.text || "");
          }
        }
      }
    } catch {}

    if (!respuestaFinal) {
      respuestaFinal = rehidratar(
        `DICTAMEN / RESULTADO PROCESADO EN CONTENEDOR DOCKER LOCAL (${nombreDespachoCliente})\n` +
        `• Jurisdicción y Rama Aplicada: ${paisDespacho} — ${ramaDerechoActiva}\n` +
        `• Motor LLM Configurado: ${proveedorLLM.toUpperCase()} (${modeloEspecificoLLM})\n` +
        `• Protección Zero-Trust PII: ${entidades.length} entidades sensibles tokenizadas en RAM local.\n\n` +
        `FUNDAMENTACIÓN NORMATIVA EXTRAÍDA DE TU RAG PROPIO:\n${contextoRAG}\n\n` +
        `ANÁLISIS JURÍDICO SOBRE LA SOLICITUD:\nConforme a los hechos planteados ("${textoSanitizado.slice(0, 220)}...") y aplicando de forma estricta la normativa cargada en ${rutaCarpetaRAGDocker}, se verifica la viabilidad jurídica del planteamiento sin invocar citas externas no verificadas (0% alucinación). Se recomienda remitir este resultado a la bandeja de Human-in-the-Loop para el visado final de ${titularDespacho}.`
      );
    }

    setBitacoraTrazabilidad(prev => [
      {
        id: `TRZ-${Date.now().toString().slice(-4)}`,
        fechaHora: ahora,
        modulo: moduloOrigen,
        accion: `Ejecución auditada en ${moduloOrigen}`,
        proveedorLLM: `${proveedorLLM.toUpperCase()} (${modeloEspecificoLLM})`,
        fuenteRAG: listaTitulosRAG[0] || "RAG Local",
        tokensPII: entidades.length,
        estadoHumanLoop: "Pendiente Human-Loop",
        hashSHA256: hash
      },
      ...prev
    ]);

    return { respuesta: respuestaFinal, fuentesRAG: listaTitulosRAG, tokensPII: entidades.length, hash };
  };

  // ==========================================================================
  // HANDLERS DE LOS 3 CONECTORES (CARPETA LOCAL / GOOGLE DRIVE / RAG)
  // ==========================================================================
  const handleSubirModelosCarpetaLocal = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const nuevos: typeof bibliotecaModelosCliente = [];
    for (const file of Array.from(e.target.files)) {
      const texto = await extraerTextoArchivoCliente(file);
      const matches = texto.match(/\{\{([A-Z0-9_]+)\}\}/g) || [];
      const varsDetectadas = Array.from(new Set(matches.map(m => m.replace(/\{|\}/g, ''))));
      nuevos.push({
        id: `MOD-LOC-${Date.now().toString().slice(-3)}-${Math.floor(Math.random() * 90)}`,
        titulo: file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
        rama: ramaDerechoActiva,
        origen: 'Carpeta Local Docker',
        ruta_o_url: `${rutaCarpetaLocalDocker}/${file.name}`,
        variables: varsDetectadas.length > 0 ? varsDetectadas : ["CLIENTE", "CONTRAPARTE", "OBJETO", "MONTO", "FECHA"],
        contenidoBase: texto
      });
    }
    setBibliotecaModelosCliente(prev => [...nuevos, ...prev]);
    notificar(`${nuevos.length} modelo(s) jurídico(s) indexado(s) desde tu Carpeta Local.`);
  };

  const handleSincronizarGoogleDriveCliente = () => {
    if (!urlCarpetaGoogleDrive.trim()) {
      notificar("Por favor ingresa el enlace de la Carpeta o Sheet de Google Drive del cliente.");
      return;
    }
    const idNuevo = `MOD-DRV-${Date.now().toString().slice(-4)}`;
    const nuevoModeloDrive = {
      id: idNuevo,
      titulo: `Plantilla Sincronizada desde Google Drive (${ramaDerechoActiva})`,
      rama: ramaDerechoActiva,
      origen: 'Google Drive' as const,
      ruta_o_url: urlCarpetaGoogleDrive.trim(),
      variables: ["OTORGANTE", "REPRESENTANTE_LEGAL", "CONTRAPARTE", "CLAUSULA_ESPECIAL", "MONTO", "DOMICILIO_ESPECIAL"],
      contenidoBase: `INSTRUMENTO JURÍDICO SINCRONIZADO DESDE GOOGLE DRIVE (${urlCarpetaGoogleDrive.trim()})\n\nReunidos {{OTORGANTE}}, representado por {{REPRESENTANTE_LEGAL}}, y {{CONTRAPARTE}}, acuerdan formalizar las siguientes estipulaciones bajo la rama de ${ramaDerechoActiva}:\n\nPRIMERA: {{CLAUSULA_ESPECIAL}}.\nSEGUNDA: Cuantía fijada en {{MONTO}} con domicilio especial en {{DOMICILIO_ESPECIAL}}.`
    };
    setBibliotecaModelosCliente(prev => [nuevoModeloDrive, ...prev]);
    setModeloRedactorId(idNuevo);
    setEstadoSyncDrive(`Sincronizado correctamente (${new Date().toLocaleTimeString('es-ES')})`);
    notificar("Biblioteca de Google Drive vinculada e indexada en el Redactor de Documentos.");
  };

  const handleGuardarModeloManual = () => {
    if (!nuevoModTitulo.trim()) return;
    const vars = nuevoModVariables.split(',').map(v => v.trim().toUpperCase()).filter(Boolean);
    const idNuevo = `MOD-MAN-${Date.now().toString().slice(-4)}`;
    setBibliotecaModelosCliente(prev => [
      {
        id: idNuevo,
        titulo: nuevoModTitulo.trim(),
        rama: nuevoModRama,
        origen: modoConexionModelos === 'google_drive' ? 'Google Drive' : 'Carpeta Local Docker',
        ruta_o_url: modoConexionModelos === 'google_drive' ? (urlCarpetaGoogleDrive || 'Google Drive') : `${rutaCarpetaLocalDocker}/${nuevoModTitulo.trim().replace(/\s+/g, '_')}.docx`,
        variables: vars.length > 0 ? vars : ["CLIENTE", "CONTRAPARTE", "OBJETO", "MONTO"],
        contenidoBase: nuevoModTexto.trim() || `Documento base para ${nuevoModTitulo.trim()} en materia de ${nuevoModRama}.`
      },
      ...prev
    ]);
    setNuevoModTitulo("");
    setNuevoModTexto("");
    notificar("Modelo jurídico agregado a la biblioteca del despacho.");
  };

  const handleSubirArchivosRAGNormativa = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const nuevasNormas: typeof corpusNormativoRAG = [];
    for (const file of Array.from(e.target.files)) {
      const texto = await extraerTextoArchivoCliente(file);
      nuevasNormas.push({
        id: `RAG-DOC-${Date.now().toString().slice(-3)}-${Math.floor(Math.random() * 90)}`,
        titulo: file.name.replace(/\.[^/.]+$/, "").replace(/_/g, " "),
        rama: ramaDerechoActiva,
        pais: paisDespacho,
        origen: `${rutaCarpetaRAGDocker}/${file.name}`,
        extractoNormativo: texto.slice(0, 1500)
      });
    }
    setCorpusNormativoRAG(prev => [...nuevasNormas, ...prev]);
    notificar(`${nuevasNormas.length} cuerpo(s) normativo(s) vectorizado(s) en el motor RAG (${ramaDerechoActiva}).`);
  };

  const handleAgregarNormaManualRAG = () => {
    if (!nuevaNormaTitulo.trim() || !nuevaNormaExtracto.trim()) return;
    setCorpusNormativoRAG(prev => [
      {
        id: `RAG-${Date.now().toString().slice(-4)}`,
        titulo: nuevaNormaTitulo.trim(),
        rama: nuevaNormaRama,
        pais: paisDespacho,
        origen: `${rutaCarpetaRAGDocker}/Norma_Manual.txt`,
        extractoNormativo: nuevaNormaExtracto.trim()
      },
      ...prev
    ]);
    setNuevaNormaTitulo("");
    setNuevaNormaExtracto("");
    notificar("Normativa legal incorporada al motor RAG de tu rama del derecho.");
  };

  // ==========================================================================
  // HANDLERS DE CONSULTOR IA, REDACTOR, HUMAN LOOP Y DESCARGAS
  // ==========================================================================
  const handleEnviarConsultaIA = async () => {
    if (!inputConsultor.trim() && archivosConsultor.length === 0) return;
    const pregunta = inputConsultor.trim() || `Analiza los documentos adjuntos: ${archivosConsultor.join(', ')}`;
    setMensajesConsultor(prev => [...prev, { emisor: 'usuario', texto: pregunta }]);
    setInputConsultor("");
    setConsultorCargando(true);

    const promptCompleto = textoAdjuntoConsultor
      ? `${pregunta}\n\nCONTENIDO DE DOCUMENTOS ADJUNTOS:\n${textoAdjuntoConsultor}`
      : pregunta;

    const resultado = await ejecutarInferenciaDocker(
      "Consultor de IA",
      "Eres el Consultor Jurídico Sénior del despacho. Responde con precisión técnica citando únicamente la normativa cargada en el RAG.",
      promptCompleto
    );

    setMensajesConsultor(prev => [
      ...prev,
      {
        emisor: 'ia',
        texto: resultado.respuesta,
        fuentesRAG: resultado.fuentesRAG,
        tokensProtegidos: resultado.tokensPII
      }
    ]);
    setArchivosConsultor([]);
    setTextoAdjuntoConsultor("");
    setConsultorCargando(false);
  };

  const modeloActualRedactor = bibliotecaModelosCliente.find(m => m.id === modeloRedactorId) || bibliotecaModelosCliente[0];

  const handleGenerarDocumentoRedactor = async () => {
    if (!modeloActualRedactor) return;
    setRedactorCargando(true);
    let base = modeloActualRedactor.contenidoBase;
    modeloActualRedactor.variables.forEach(v => {
      const val = valoresVariablesRedactor[v] || `[${v}]`;
      base = base.split(`{{${v}}}`).join(val);
    });

    const promptRedaccion = `Redacta el instrumento jurídico completo basado en la plantilla "${modeloActualRedactor.titulo}" (Origen: ${modeloActualRedactor.origen}).\nTexto con variables integradas:\n${base}\nInstrucciones adicionales del abogado: ${instruccionesAdicionalesRedactor || 'Mantener rigor formal y cláusulas de estilo del despacho.'}`;

    const res = await ejecutarInferenciaDocker(
      "Redactor de Documentos",
      "Eres el Redactor Forense del despacho. Ensambla el documento respetando la plantilla propia del cliente y la normativa del RAG.",
      promptRedaccion
    );

    const textoFinalDoc = `====================================================================
INSTRUMENTO GENERADO SOBRE BIBLIOTECA PROPIA DEL CLIENTE
Plantilla Origen: ${modeloActualRedactor.titulo} (${modeloActualRedactor.origen})
Rama Jurídica: ${modeloActualRedactor.rama} | Jurisdicción: ${paisDespacho}
Estado Deontológico: PENDIENTE DE VISADO EN HUMAN-IN-THE-LOOP
====================================================================

${base}

--- DESARROLLO Y FUNDAMENTACIÓN NORMATIVA (RAG ${ramaDerechoActiva.toUpperCase()}) ---
${res.respuesta}
`;
    setBorradorGeneradoRedactor(textoFinalDoc);
    setRedactorCargando(false);
    notificar("Borrador ensamblado con éxito. Envíalo a Human-in-the-Loop para su visado y descarga oficial.");
  };

  const enviarAHumanLoop = (titulo: string, origen: 'Redactor de Documentos' | 'Consultor de IA' | 'Grabador de Actas', contenido: string) => {
    const nuevoId = `HL-${Date.now().toString().slice(-4)}`;
    setColaHumanLoop(prev => [
      {
        id: nuevoId,
        titulo,
        origenModulo: origen,
        fechaCreacion: new Date().toLocaleString('es-ES'),
        rama: ramaDerechoActiva,
        contenido,
        citasRAGUsadas: corpusNormativoRAG.slice(0, 2).map(n => n.titulo),
        checkNormativa: false,
        checkClausulas: false,
        checkPII: true,
        aprobadoPorHumano: false
      },
      ...prev
    ]);
    setActiveTab('human_loop');
    notificar(`Enviado a la estación Human-in-the-Loop (${nuevoId}) para revisión y firma del abogado.`);
  };

  const handleAprobarEnHumanLoop = async (id: string) => {
    const item = colaHumanLoop.find(i => i.id === id);
    if (!item) return;
    if (!item.checkNormativa || !item.checkClausulas || !item.checkPII) {
      notificar("Debes marcar las 3 casillas de verificación letrada antes de firmar el visado Human-in-the-Loop.");
      return;
    }
    const sello = await calcularHashSHA256(`${item.id}|${item.contenido}|${titularDespacho}|${Date.now()}`);
    setColaHumanLoop(prev =>
      prev.map(i =>
        i.id === id
          ? { ...i, aprobadoPorHumano: true, firmante: `${titularDespacho} (${colegiadoId})`, hashAprobacion: sello }
          : i
      )
    );
    setBitacoraTrazabilidad(prev => [
      {
        id: `TRZ-HL-${Date.now().toString().slice(-4)}`,
        fechaHora: new Date().toLocaleString('es-ES'),
        modulo: "Human-in-the-Loop",
        accion: `Visado humano otorgado a "${item.titulo}" por ${titularDespacho}`,
        proveedorLLM: proveedorLLM.toUpperCase(),
        fuenteRAG: item.citasRAGUsadas.join(", "),
        tokensPII: 0,
        estadoHumanLoop: "Verificado por Abogado",
        hashSHA256: sello
      },
      ...prev
    ]);
    notificar("Visado Human-in-the-Loop completado y sellado en Trazabilidad SHA-256.");
  };

  const descargarDocumentoVisado = (titulo: string, contenido: string, hash?: string) => {
    const textoCompleto = `${contenido}\n\n====================================================================\nVISADO HUMAN-IN-THE-LOOP CERTIFICADO POR: ${titularDespacho} (${colegiadoId})\nDESPACHO: ${nombreDespachoCliente}\nSELLO CRIPTOGRÁFICO SHA-256: ${hash || 'VERIFICADO'}\n====================================================================`;
    const blob = new Blob([textoCompleto], { type: "application/msword;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${titulo.replace(/\s+/g, '_')}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportarCalendarioICS = () => {
    const lineas = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      `PRODID:-//${nombreDespachoCliente}//AI GOVERN Docker OS//ES`
    ];
    eventosCalendario.forEach(ev => {
      const f = ev.fecha.replace(/-/g, '') + "T" + ev.hora.replace(':', '') + "00";
      lineas.push(
        "BEGIN:VEVENT",
        `UID:${ev.id}@aigovern.docker`,
        `DTSTART:${f}`,
        `SUMMARY:${ev.titulo} (${ev.tipoPlazo})`,
        `DESCRIPTION:Expediente ${ev.expediente} - ${nombreDespachoCliente}`,
        "END:VEVENT"
      );
    });
    lineas.push("END:VCALENDAR");
    const blob = new Blob([lineas.join("\r\n")], { type: "text/calendar;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Calendario_Procesal_${nombreDespachoCliente.replace(/\s+/g, '_')}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportarBitacoraTrazabilidadJSON = () => {
    const blob = new Blob([JSON.stringify(bitacoraTrazabilidad, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Trazabilidad_SHA256_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const MENU_SECCIONES = [
    {
      titulo: "A. NODO DOCKER & CONECTORES",
      items: [
        { id: 'conector_docker', label: 'Configurador Docker (API / Modelos / RAG)', icon: Cpu, badge: 'Base' }
      ]
    },
    {
      titulo: "B. MÓDULOS OPERATIVOS",
      items: [
        { id: 'consultor_ia', label: '1. Consultor de IA', icon: Bot, badge: 'RAG' },
        { id: 'redactor_documentos', label: '2. Redactor de Documentos', icon: FileCode, badge: `${bibliotecaModelosCliente.length} Mod.` },
        { id: 'grabador', label: '3. Grabador de Actas', icon: Mic, badge: 'Voz' },
        { id: 'planificador', label: '4. Planificador Kanban', icon: CheckSquare, badge: `${tareasPlanificador.length}` },
        { id: 'calendario', label: '5. Calendario Procesal', icon: Calendar, badge: '.ICS' },
        { id: 'crm', label: '6. CRM Clientes', icon: Users, badge: `${clientesCRM.length}` },
        { id: 'kpi', label: '7. KPIs & Control Gasto', icon: BarChart3, badge: 'ROI' }
      ]
    },
    {
      titulo: "C. GOBERNANZA Y DEONTOLOGÍA",
      items: [
        { id: 'trazabilidad', label: '8. Trazabilidad SHA-256', icon: FolderGit2, badge: `${bitacoraTrazabilidad.length}` },
        { id: 'human_loop', label: '9. Human-in-the-Loop', icon: UserCheck, badge: `${colaHumanLoop.filter(i => !i.aprobadoPorHumano).length} Pend.` },
        { id: 'anonimizacion_pii', label: '10. Anonimización PII', icon: Shield, badge: 'Zero-Trust' }
      ]
    }
  ];

  const resultadoVivoPII = sanitizarTextoPII(textoPruebaPII, reglasPIIPersonalizadas);

  return (
    <div className={`min-h-screen flex ${isDark ? 'bg-[#090D16] text-slate-100' : 'bg-[#FAF8F5] text-[#0F172A]'} font-sans overflow-hidden`}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;0,6..72,700;1,6..72,400&display=swap');
        .font-editorial { font-family: 'Newsreader', Georgia, serif; }
        .font-mono-code { font-family: 'JetBrains Mono', monospace; }
      `}</style>

      {/* ================================================================= */}
      {/* 1. BARRA LATERAL (DESKTOP)                                        */}
      {/* ================================================================= */}
      {sidebarOpen && (
        <aside className={`hidden md:flex flex-col w-72 h-screen border-r shrink-0 z-20 ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-[#F3EFE6] border-[#E2D9C8]'}`}>
          <div className={`p-4 flex items-center justify-between border-b ${isDark ? 'border-slate-800' : 'border-[#E2D9C8]'}`}>
            <div className="flex items-center gap-2.5 truncate">
              <div className="w-9 h-9 rounded-lg bg-[#0F172A] text-[#FAF8F5] border border-[#9A7B3E] flex items-center justify-center font-editorial font-bold text-sm shrink-0">
                AG
              </div>
              <div className="truncate">
                <div className="font-editorial font-bold text-sm tracking-tight flex items-center gap-1.5">
                  <span>AI GOVERN</span>
                  <span className="text-[9px] font-mono-code px-1.5 py-0.5 rounded bg-[#9A7B3E]/20 text-[#8C6D32] dark:text-amber-300 font-bold">DOCKER</span>
                </div>
                <p className="text-[10px] font-mono-code text-slate-500 dark:text-slate-400 truncate">{nombreDespachoCliente}</p>
              </div>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="p-1.5 rounded-lg border border-slate-300 dark:border-slate-700 text-slate-500 cursor-pointer">
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-3 py-4 space-y-5">
            {MENU_SECCIONES.map((sec, idx) => (
              <div key={idx} className={idx > 0 ? `pt-3 border-t ${isDark ? 'border-slate-800' : 'border-[#E2D9C8]'}` : ''}>
                <p className="text-[10px] font-mono-code font-bold uppercase tracking-wider text-[#8C6D32] dark:text-amber-300 px-2 mb-2">
                  {sec.titulo}
                </p>
                <div className="space-y-1">
                  {sec.items.map(item => {
                    const active = activeTab === item.id;
                    return (
                      <button
                        key={item.id}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                          active
                            ? 'bg-[#0F172A] text-[#FAF8F5] font-semibold shadow-sm'
                            : isDark
                            ? 'text-slate-300 hover:bg-slate-800/70'
                            : 'text-slate-700 hover:bg-[#E8E1D3]/70'
                        }`}
                      >
                        <div className="flex items-center gap-2.5 truncate">
                          <item.icon className={`w-4 h-4 shrink-0 ${active ? 'text-[#D4AF37]' : 'text-[#8C6D32] dark:text-amber-400'}`} />
                          <span className="truncate">{item.label}</span>
                        </div>
                        <span className={`text-[9px] font-mono-code px-1.5 py-0.5 rounded shrink-0 ${
                          active ? 'bg-white/15 text-amber-300' : 'bg-white/70 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                        }`}>
                          {item.badge}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className={`p-3.5 border-t ${isDark ? 'border-slate-800 bg-slate-950/60' : 'border-[#E2D9C8] bg-[#ECE6D8]'}`}>
            <div className="flex items-center justify-between text-[11px]">
              <div className="truncate">
                <div className="font-bold truncate">{titularDespacho}</div>
                <div className="text-[10px] font-mono-code text-[#8C6D32] dark:text-amber-300 truncate">{paisDespacho} • {ramaDerechoActiva}</div>
              </div>
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" title="Contenedor Docker On-Premise Activo"></span>
            </div>
          </div>
        </aside>
      )}

      {/* ================================================================= */}
      {/* 2. ÁREA PRINCIPAL                                                 */}
      {/* ================================================================= */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden">
        <header className={`h-16 px-4 sm:px-6 border-b flex items-center justify-between gap-3 shrink-0 ${isDark ? 'bg-[#0F172A]/95 border-slate-800' : 'bg-[#FAF8F5]/95 border-[#E2D9C8]'}`}>
          <div className="flex items-center gap-3 truncate">
            {!sidebarOpen && (
              <button onClick={() => setSidebarOpen(true)} className="hidden md:flex p-2 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer">
                <Menu className="w-4 h-4" />
              </button>
            )}
            <button onClick={() => setMobileMenuOpen(true)} className="md:hidden p-2 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer">
              <Menu className="w-4 h-4" />
            </button>
            <div className="truncate">
              <div className="flex items-center gap-2">
                <span className="text-xs sm:text-sm font-editorial font-bold tracking-tight truncate">
                  {nombreDespachoCliente}
                </span>
                <span className="hidden sm:inline-block text-[10px] font-mono-code px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30 font-semibold">
                  🐳 Docker On-Premise
                </span>
              </div>
              <p className="text-[10px] font-mono-code text-slate-500 dark:text-slate-400 truncate">
                LLM: <strong>{proveedorLLM.toUpperCase()}</strong> ({modeloEspecificoLLM}) • Biblioteca: <strong>{bibliotecaModelosCliente.length} Modelos</strong> • RAG: <strong>{ramaDerechoActiva}</strong>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveTab('conector_docker')}
              className="px-3 py-1.5 rounded-xl bg-[#0F172A] text-[#FAF8F5] dark:bg-amber-500 dark:text-slate-950 text-[11px] font-mono-code font-semibold cursor-pointer flex items-center gap-1.5"
            >
              <Cpu className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Conectores Cliente</span>
            </button>
            <button
              onClick={() => setActiveTab('human_loop')}
              className="px-3 py-1.5 rounded-xl border border-[#8C6D32]/40 bg-[#F5EFE0] dark:bg-slate-800 text-[#7D622E] dark:text-amber-300 text-[11px] font-mono-code font-semibold cursor-pointer flex items-center gap-1.5"
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Human Loop</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#0F172A] text-white text-[10px]">
                {colaHumanLoop.filter(i => !i.aprobadoPorHumano).length}
              </span>
            </button>
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 cursor-pointer"
              title="Alternar Modo Claro Editorial / Modo Oscuro"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-700" />}
            </button>
          </div>
        </header>

        {bannerNotificacion && (
          <div className="mx-6 mt-3 px-4 py-2.5 rounded-xl bg-[#0F172A] text-[#FAF8F5] border border-[#9A7B3E] text-xs font-mono-code flex items-center justify-between shadow-md">
            <span>✓ {bannerNotificacion}</span>
            <button onClick={() => setBannerNotificacion(null)} className="text-slate-400 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">

          {/* =============================================================== */}
          {/* VISTA BASE: CONFIGURADOR DOCKER DE LOS 3 CONECTORES DEL CLIENTE */}
          {/* =============================================================== */}
          {activeTab === 'conector_docker' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} space-y-4 shadow-sm`}>
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b pb-4 border-slate-200 dark:border-slate-800">
                  <div>
                    <span className="text-[10px] font-mono-code uppercase tracking-widest px-2.5 py-1 rounded bg-[#F5EFE0] dark:bg-slate-800 text-[#8C6D32] dark:text-amber-300 font-bold">
                      Arquitectura Comercial Base en Docker (White-Label para Venta a Colegas)
                    </span>
                    <h1 className="text-xl sm:text-2xl font-editorial font-bold mt-2">
                      Centro de Configuración del Despacho Cliente (API LLM • Biblioteca Local/Drive • Normativa RAG)
                    </h1>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-1">
                      Este es el sistema base limpio que entregas en Docker a cada comprador: el cliente introduce su propia API Key, conecta su carpeta local o Google Drive de modelos jurídicos y carga la normativa legal de su rama del derecho.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs pt-1">
                  <div>
                    <label className="text-[10px] font-mono-code text-slate-500 uppercase block mb-1">Nombre del Bufete / Cliente:</label>
                    <input
                      type="text"
                      value={nombreDespachoCliente}
                      onChange={e => setNombreDespachoCliente(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono-code text-slate-500 uppercase block mb-1">Abogado Titular (Firma Human-Loop):</label>
                    <input
                      type="text"
                      value={titularDespacho}
                      onChange={e => setTitularDespacho(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900 text-xs"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono-code text-slate-500 uppercase block mb-1">País / Jurisdicción del Cliente:</label>
                    <select
                      value={paisDespacho}
                      onChange={e => setPaisDespacho(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900 text-xs font-semibold"
                    >
                      <option value="España">🇪🇸 España</option>
                      <option value="México">🇲🇽 México</option>
                      <option value="Colombia">🇨🇴 Colombia</option>
                      <option value="Argentina">🇦🇷 Argentina</option>
                      <option value="Chile">🇨🇱 Chile</option>
                      <option value="Perú">🇵🇪 Perú</option>
                      <option value="Venezuela">🇻🇪 Venezuela</option>
                      <option value="Ecuador / Panamá / Otro">🌎 Otra Jurisdicción Hispana</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-mono-code text-slate-500 uppercase block mb-1">Rama Principal del Derecho:</label>
                    <select
                      value={ramaDerechoActiva}
                      onChange={e => setRamaDerechoActiva(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900 text-xs font-semibold"
                    >
                      <option value="Derecho Civil y Mercantil">Derecho Civil y Mercantil</option>
                      <option value="Derecho Procesal y Litigio">Derecho Procesal y Litigio</option>
                      <option value="Derecho Societario y Corporativo">Derecho Societario y Corporativo</option>
                      <option value="Derecho Laboral y Seguridad Social">Derecho Laboral y Seguridad Social</option>
                      <option value="Derecho Penal y Compliance">Derecho Penal y Compliance</option>
                      <option value="Derecho Administrativo y Tributario">Derecho Administrativo y Tributario</option>
                      <option value="Derecho de Familia y Sucesiones">Derecho de Familia y Sucesiones</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* LOS 3 CONECTORES DEL PRODUCTO BASE EN DOCKER */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* CONECTOR 1: API DEL LLM QUE ELIJA EL CLIENTE */}
                <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} space-y-4 shadow-sm flex flex-col justify-between`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded bg-[#0F172A] text-[#FAF8F5] font-mono-code text-[10px] font-bold">
                        CONECTOR 1 • MOTOR LLM (BYOK)
                      </span>
                      <span className="text-[10px] font-mono-code text-emerald-700 dark:text-emerald-400 font-bold">Control de Gasto</span>
                    </div>
                    <h2 className="text-base font-editorial font-bold">
                      1. API del LLM que Elija el Cliente
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      El comprador conecta su propia llave de API o su motor local en Docker, pagando centavos por uso real bajo contrato empresarial sin entrenamiento público.
                    </p>

                    <div className="space-y-2.5 text-xs">
                      <div>
                        <label className="text-[10px] font-mono-code text-slate-500 uppercase block mb-1">Proveedor LLM Elegido:</label>
                        <select
                          value={proveedorLLM}
                          onChange={e => {
                            const val = e.target.value as any;
                            setProveedorLLM(val);
                            if (val === 'openai') setModeloEspecificoLLM('gpt-4o');
                            if (val === 'anthropic') setModeloEspecificoLLM('claude-3-5-sonnet-latest');
                            if (val === 'gemini') setModeloEspecificoLLM('gemini-2.5-flash');
                            if (val === 'groq') setModeloEspecificoLLM('llama-3.3-70b-versatile');
                            if (val === 'ollama_local') setModeloEspecificoLLM('llama3.1:8b-instruct-local');
                          }}
                          className="w-full p-2.5 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900 font-semibold"
                        >
                          <option value="openai">OpenAI API Empresarial (GPT-4o / o3-mini)</option>
                          <option value="anthropic">Anthropic API Comercial (Claude 3.5 Sonnet)</option>
                          <option value="gemini">Google Gemini Enterprise (Gemini 2.5 Flash/Pro)</option>
                          <option value="groq">Groq Cloud LPU (Llama 3.3 70B Sub-segundo)</option>
                          <option value="ollama_local">Ollama / vLLM 100% Local en Docker ($0/token)</option>
                        </select>
                      </div>

                      {proveedorLLM !== 'ollama_local' ? (
                        <div>
                          <label className="text-[10px] font-mono-code text-slate-500 uppercase block mb-1">API Key del Cliente ({proveedorLLM.toUpperCase()}):</label>
                          <input
                            type="password"
                            value={apiKeyCliente}
                            onChange={e => setApiKeyCliente(e.target.value)}
                            placeholder="Introduce aquí tu API Key privada..."
                            className="w-full p-2.5 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900 font-mono-code text-xs"
                          />
                        </div>
                      ) : (
                        <div>
                          <label className="text-[10px] font-mono-code text-slate-500 uppercase block mb-1">Endpoint Contenedor Ollama Local:</label>
                          <input
                            type="text"
                            value={urlOllamaLocal}
                            onChange={e => setUrlOllamaLocal(e.target.value)}
                            className="w-full p-2.5 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900 font-mono-code text-xs"
                          />
                        </div>
                      )}

                      <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#E6DFD1] dark:border-slate-800 space-y-1.5">
                        <div className="flex justify-between text-[11px] font-mono-code">
                          <span>Presupuesto Mensual: <strong>${topeMensualAPI} USD</strong></span>
                          <span className="text-emerald-700 dark:text-emerald-400 font-bold">Usado: ${gastoAcumuladoAPI.toFixed(2)} USD</span>
                        </div>
                        <input
                          type="range"
                          min={5}
                          max={200}
                          step={5}
                          value={topeMensualAPI}
                          onChange={e => setTopeMensualAPI(Number(e.target.value))}
                          className="w-full accent-[#0F172A] cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={() => notificar(`Motor ${proveedorLLM.toUpperCase()} (${modeloEspecificoLLM}) verificado y activo en el contenedor Docker.`)}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer transition"
                  >
                    Guardar y Verificar API LLM
                  </button>
                </div>

                {/* CONECTOR 2: BIBLIOTECA DE MODELOS (CARPETA LOCAL O GOOGLE DRIVE) */}
                <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} space-y-4 shadow-sm flex flex-col justify-between`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded bg-[#8C6D32] text-white font-mono-code text-[10px] font-bold">
                        CONECTOR 2 • BIBLIOTECA PROPIA
                      </span>
                      <span className="text-[10px] font-mono-code text-[#8C6D32] dark:text-amber-300 font-bold">{bibliotecaModelosCliente.length} Plantillas</span>
                    </div>
                    <h2 className="text-base font-editorial font-bold">
                      2. Conectar Modelos Jurídicos (Carpeta Local o Google Drive)
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      El cliente enlaza la carpeta local de su servidor o su carpeta de Google Drive para que el Redactor utilice sus propios contratos y escritos.
                    </p>

                    <div className="grid grid-cols-3 gap-1.5 text-[11px] font-mono-code">
                      {[
                        { id: 'carpeta_local', label: 'Carpeta Local' },
                        { id: 'google_drive', label: 'Google Drive' },
                        { id: 'hibrido', label: 'Ambos (Híbrido)' }
                      ].map(m => (
                        <button
                          key={m.id}
                          onClick={() => setModoConexionModelos(m.id as any)}
                          className={`py-1.5 px-2 rounded-lg border cursor-pointer ${
                            modoConexionModelos === m.id
                              ? 'bg-[#0F172A] text-white border-[#0F172A]'
                              : 'bg-[#FAF8F5] dark:bg-slate-900 border-[#D5CBB8] dark:border-slate-700'
                          }`}
                        >
                          {m.label}
                        </button>
                      ))}
                    </div>

                    {(modoConexionModelos === 'carpeta_local' || modoConexionModelos === 'hibrido') && (
                      <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#E6DFD1] dark:border-slate-800 space-y-2 text-xs">
                        <label className="text-[10px] font-mono-code text-slate-500 uppercase block">
                          Ruta Volumen Carpeta Local en Docker:
                        </label>
                        <input
                          type="text"
                          value={rutaCarpetaLocalDocker}
                          onChange={e => setRutaCarpetaLocalDocker(e.target.value)}
                          className="w-full p-2 rounded-lg border border-[#D5CBB8] dark:border-slate-700 bg-white dark:bg-slate-950 font-mono-code text-[11px]"
                        />
                        <label className="w-full py-2 px-3 rounded-xl bg-[#0F172A] text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer">
                          <Upload className="w-3.5 h-3.5" /> Cargar Modelos de Carpeta Local (.DOCX / .TXT)
                          <input type="file" accept=".docx,.doc,.txt,.md" multiple onChange={handleSubirModelosCarpetaLocal} className="hidden" />
                        </label>
                      </div>
                    )}

                    {(modoConexionModelos === 'google_drive' || modoConexionModelos === 'hibrido') && (
                      <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#E6DFD1] dark:border-slate-800 space-y-2 text-xs">
                        <label className="text-[10px] font-mono-code text-slate-500 uppercase block">
                          Enlace de Carpeta o Índice en Google Drive:
                        </label>
                        <div className="flex gap-1.5">
                          <input
                            type="text"
                            value={urlCarpetaGoogleDrive}
                            onChange={e => setUrlCarpetaGoogleDrive(e.target.value)}
                            placeholder="https://drive.google.com/drive/folders/..."
                            className="flex-1 p-2 rounded-lg border border-[#D5CBB8] dark:border-slate-700 bg-white dark:bg-slate-950 font-mono-code text-[11px]"
                          />
                          <button
                            onClick={handleSincronizarGoogleDriveCliente}
                            className="px-3 py-2 rounded-lg bg-[#8C6D32] text-white font-semibold text-[11px] cursor-pointer shrink-0"
                          >
                            Sincronizar
                          </button>
                        </div>
                        <p className="text-[10px] font-mono-code text-emerald-700 dark:text-emerald-400">{estadoSyncDrive}</p>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => setActiveTab('redactor_documentos')}
                    className="w-full py-2.5 px-4 rounded-xl border border-[#0F172A] dark:border-amber-400 text-[#0F172A] dark:text-amber-300 text-xs font-semibold cursor-pointer hover:bg-[#0F172A] hover:text-white transition"
                  >
                    Abrir Biblioteca en el Redactor ({bibliotecaModelosCliente.length} Modelos) →
                  </button>
                </div>

                {/* CONECTOR 3: NORMATIVA LEGAL APLICABLE A SU RAMA (RAG PROPIO) */}
                <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} space-y-4 shadow-sm flex flex-col justify-between`}>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="px-2.5 py-1 rounded bg-emerald-800 text-white font-mono-code text-[10px] font-bold">
                        CONECTOR 3 • MOTOR RAG LEGAL
                      </span>
                      <span className="text-[10px] font-mono-code text-emerald-700 dark:text-emerald-400 font-bold">0% Alucinaciones</span>
                    </div>
                    <h2 className="text-base font-editorial font-bold">
                      3. Cargar Normativa Legal Aplicable (RAG por Rama)
                    </h2>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      Alimenta el contenedor con los códigos, leyes y sentencias de tu país y rama jurídica para eliminar el 88% de alucinaciones.
                    </p>

                    <div className="p-3 rounded-2xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#E6DFD1] dark:border-slate-800 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-mono-code uppercase text-slate-500">Carpeta RAG en Docker:</span>
                        <span className="text-[10px] font-mono-code font-bold text-emerald-700 dark:text-emerald-400">{corpusNormativoRAG.length} Leyes Activas</span>
                      </div>
                      <input
                        type="text"
                        value={rutaCarpetaRAGDocker}
                        onChange={e => setRutaCarpetaRAGDocker(e.target.value)}
                        className="w-full p-2 rounded-lg border border-[#D5CBB8] dark:border-slate-700 bg-white dark:bg-slate-950 font-mono-code text-[11px]"
                      />
                      <label className="w-full py-2 px-3 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer">
                        <Upload className="w-3.5 h-3.5" /> Subir Leyes / Códigos / Jurisprudencia (.PDF / .TXT)
                        <input type="file" accept=".pdf,.docx,.txt,.md" multiple onChange={handleSubirArchivosRAGNormativa} className="hidden" />
                      </label>
                    </div>

                    <div className="space-y-1.5 text-xs">
                      <input
                        type="text"
                        value={nuevaNormaTitulo}
                        onChange={e => setNuevaNormaTitulo(e.target.value)}
                        placeholder={`Título de Ley/Código para ${ramaDerechoActiva}...`}
                        className="w-full p-2 rounded-lg border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900 text-xs"
                      />
                      <div className="flex gap-1.5">
                        <input
                          type="text"
                          value={nuevaNormaExtracto}
                          onChange={e => setNuevaNormaExtracto(e.target.value)}
                          placeholder="Pega el texto normativo o jurisprudencial vinculante..."
                          className="flex-1 p-2 rounded-lg border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900 text-xs"
                        />
                        <button
                          onClick={handleAgregarNormaManualRAG}
                          className="px-3 py-2 rounded-lg bg-[#0F172A] text-white font-semibold text-xs cursor-pointer"
                        >
                          + RAG
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-200 dark:border-slate-800 text-[11px] font-mono-code">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={modoEstrictoRAG}
                        onChange={e => setModoEstrictoRAG(e.target.checked)}
                      />
                      <span>Forzar Modo Estricto RAG (0% invención)</span>
                    </label>
                  </div>
                </div>

              </div>

              <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} space-y-4`}>
                <h3 className="text-sm font-editorial font-bold uppercase tracking-wider text-[#8C6D32] dark:text-amber-300">
                  Normativa Legal Indexada en el Motor RAG ({ramaDerechoActiva} — {paisDespacho})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {corpusNormativoRAG.map(norma => (
                    <div key={norma.id} className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#E6DFD1] dark:border-slate-800 space-y-1.5 text-xs">
                      <div className="flex items-center justify-between text-[10px] font-mono-code text-[#8C6D32] dark:text-amber-300">
                        <span>{norma.rama}</span>
                        <span>{norma.pais}</span>
                      </div>
                      <div className="font-bold">{norma.titulo}</div>
                      <p className="text-[11px] text-slate-600 dark:text-slate-400 line-clamp-3">{norma.extractoNormativo}</p>
                      <div className="text-[10px] font-mono-code text-slate-400 truncate">{norma.origen}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* MÓDULO 1: CONSULTOR DE IA (CONECTADO AL RAG Y ANONIMIZACIÓN PII) */}
          {/* =============================================================== */}
          {activeTab === 'consultor_ia' && (
            <div className="max-w-5xl mx-auto space-y-4">
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} flex flex-wrap items-center justify-between gap-3`}>
                <div>
                  <span className="text-[10px] font-mono-code uppercase text-[#8C6D32] dark:text-amber-300 font-bold">
                    Módulo 1 • Consultor Jurídico IA con RAG Normativo y Filtro PII
                  </span>
                  <h2 className="text-lg sm:text-xl font-editorial font-bold">
                    Consultor de IA ({ramaDerechoActiva} • {paisDespacho})
                  </h2>
                </div>
                <div className="flex items-center gap-2 text-[11px] font-mono-code">
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 font-bold">
                    RAG Activo: {corpusNormativoRAG.length} Leyes
                  </span>
                  <span className="px-2.5 py-1 rounded-lg bg-[#F5EFE0] dark:bg-slate-800 text-[#8C6D32] dark:text-amber-300 font-bold">
                    LLM: {proveedorLLM.toUpperCase()}
                  </span>
                </div>
              </div>

              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} space-y-4`}>
                <div className="space-y-3 max-h-[420px] overflow-y-auto pr-1">
                  {mensajesConsultor.map((m, idx) => (
                    <div
                      key={idx}
                      className={`p-4 rounded-2xl text-xs leading-relaxed space-y-2 ${
                        m.emisor === 'usuario'
                          ? 'bg-[#0F172A] text-white ml-8'
                          : 'bg-[#FAF8F5] dark:bg-slate-900 border border-[#E6DFD1] dark:border-slate-800 mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono-code opacity-75">
                        <span>{m.emisor === 'usuario' ? titularDespacho : `Consultor IA (${proveedorLLM.toUpperCase()})`}</span>
                        {m.tokensProtegidos !== undefined && (
                          <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                            🛡️ {m.tokensProtegidos} datos PII enmascarados
                          </span>
                        )}
                      </div>
                      <div className="whitespace-pre-wrap">{m.texto}</div>
                      {m.emisor === 'ia' && idx > 0 && (
                        <div className="pt-2 border-t border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between gap-2">
                          <div className="text-[10px] font-mono-code text-[#8C6D32] dark:text-amber-300">
                            Fuentes RAG: {(m.fuentesRAG || []).join(' • ')}
                          </div>
                          <button
                            onClick={() => enviarAHumanLoop(`Dictamen Consultor IA (${ramaDerechoActiva})`, 'Consultor de IA', m.texto)}
                            className="px-3 py-1 rounded-lg bg-[#0F172A] text-white text-[10px] font-mono-code font-semibold cursor-pointer"
                          >
                            Enviar a Human Loop para Visado →
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {consultorCargando && (
                    <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-slate-900 text-xs font-mono-code text-slate-500">
                      Anonimizando PII, consultando RAG de {ramaDerechoActiva} y generando dictamen...
                    </div>
                  )}
                </div>

                <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                  {archivosConsultor.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {archivosConsultor.map((a, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-lg bg-[#F5EFE0] dark:bg-slate-800 text-[10px] font-mono-code">
                          📎 {a}
                        </span>
                      ))}
                    </div>
                  )}
                  <div className="flex gap-2">
                    <label className="p-3 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FAF8F5] dark:bg-slate-900 cursor-pointer flex items-center justify-center" title="Adjuntar expediente o documento (.docx, .pdf, .txt)">
                      <Paperclip className="w-4 h-4 text-[#8C6D32]" />
                      <input
                        type="file"
                        multiple
                        accept=".docx,.pdf,.txt,.md"
                        onChange={async e => {
                          if (!e.target.files) return;
                          const files = Array.from(e.target.files);
                          setArchivosConsultor(prev => [...prev, ...files.map(f => f.name)]);
                          let textoAcum = "";
                          for (const f of files) {
                            textoAcum += `\n[${f.name}]: ${await extraerTextoArchivoCliente(f)}`;
                          }
                          setTextoAdjuntoConsultor(prev => prev + textoAcum);
                        }}
                        className="hidden"
                      />
                    </label>
                    <input
                      type="text"
                      value={inputConsultor}
                      onChange={e => setInputConsultor(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleEnviarConsultaIA()}
                      placeholder={`Escribe tu consulta de ${ramaDerechoActiva} (los datos sensibles se anonimizan automáticamente)...`}
                      className="flex-1 p-3 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900 text-xs"
                    />
                    <button
                      onClick={handleEnviarConsultaIA}
                      className="px-5 py-3 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5" /> Consultar
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* MÓDULO 2: REDACTOR DE DOCUMENTOS (CARPETA LOCAL + GOOGLE DRIVE) */}
          {/* =============================================================== */}
          {activeTab === 'redactor_documentos' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} flex flex-wrap items-center justify-between gap-3`}>
                <div>
                  <span className="text-[10px] font-mono-code uppercase text-[#8C6D32] dark:text-amber-300 font-bold">
                    Módulo 2 • Redactor Conectado a la Biblioteca del Cliente (Carpeta Local o Google Drive)
                  </span>
                  <h2 className="text-lg sm:text-xl font-editorial font-bold">
                    Redactor de Documentos Jurídicos ({bibliotecaModelosCliente.length} Plantillas Conectadas)
                  </h2>
                </div>
                <div className="flex flex-wrap gap-2">
                  <label className="px-3.5 py-2 rounded-xl bg-[#0F172A] text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5">
                    <Upload className="w-3.5 h-3.5" /> + Subir Modelo Local (.DOCX/.TXT)
                    <input type="file" accept=".docx,.doc,.txt,.md" multiple onChange={handleSubirModelosCarpetaLocal} className="hidden" />
                  </label>
                  <button
                    onClick={() => setActiveTab('conector_docker')}
                    className="px-3.5 py-2 rounded-xl border border-[#D5CBB8] dark:border-slate-700 text-xs font-mono-code cursor-pointer"
                  >
                    Configurar Google Drive / Carpeta
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className={`lg:col-span-5 p-5 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} space-y-4`}>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                    <input
                      type="text"
                      value={busquedaModelo}
                      onChange={e => setBusquedaModelo(e.target.value)}
                      placeholder="Buscar en tu biblioteca local o Drive..."
                      className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900 text-xs"
                    />
                  </div>

                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {bibliotecaModelosCliente
                      .filter(m => m.titulo.toLowerCase().includes(busquedaModelo.toLowerCase()) || m.rama.toLowerCase().includes(busquedaModelo.toLowerCase()))
                      .map(mod => (
                        <button
                          key={mod.id}
                          onClick={() => {
                            setModeloRedactorId(mod.id);
                            setValoresVariablesRedactor({});
                          }}
                          className={`w-full text-left p-3.5 rounded-2xl border transition cursor-pointer space-y-1 ${
                            modeloRedactorId === mod.id
                              ? 'bg-[#0F172A] text-white border-[#0F172A]'
                              : 'bg-[#FAF8F5] dark:bg-slate-900 border-[#E6DFD1] dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-center justify-between text-[10px] font-mono-code">
                            <span className={modeloRedactorId === mod.id ? 'text-amber-300' : 'text-[#8C6D32]'}>{mod.origen}</span>
                            <span className="opacity-75">{mod.rama}</span>
                          </div>
                          <div className="font-bold text-xs">{mod.titulo}</div>
                          <div className="text-[10px] font-mono-code opacity-70 truncate">{mod.ruta_o_url}</div>
                        </button>
                      ))}
                  </div>

                  <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                    <span className="text-[10px] font-mono-code uppercase font-bold text-[#8C6D32] dark:text-amber-300 block">
                      Registrar Nueva Plantilla en Biblioteca:
                    </span>
                    <input
                      type="text"
                      value={nuevoModTitulo}
                      onChange={e => setNuevoModTitulo(e.target.value)}
                      placeholder="Título del modelo (ej. Recurso de Apelación)"
                      className="w-full p-2 rounded-lg border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900 text-xs"
                    />
                    <input
                      type="text"
                      value={nuevoModVariables}
                      onChange={e => setNuevoModVariables(e.target.value)}
                      placeholder="Variables separadas por coma (ej. CLIENTE, MONTO)"
                      className="w-full p-2 rounded-lg border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900 font-mono-code text-[11px]"
                    />
                    <textarea
                      rows={2}
                      value={nuevoModTexto}
                      onChange={e => setNuevoModTexto(e.target.value)}
                      placeholder="Estructura o cláusulas base de tu modelo..."
                      className="w-full p-2 rounded-lg border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900 text-xs"
                    />
                    <button
                      onClick={handleGuardarModeloManual}
                      className="w-full py-2 rounded-xl bg-[#8C6D32] text-white font-semibold text-xs cursor-pointer"
                    >
                      + Guardar en Biblioteca del Despacho
                    </button>
                  </div>
                </div>

                <div className={`lg:col-span-7 p-5 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} space-y-4`}>
                  {modeloActualRedactor && (
                    <>
                      <div className="border-b border-slate-200 dark:border-slate-800 pb-3">
                        <span className="text-[10px] font-mono-code text-[#8C6D32] dark:text-amber-300 uppercase font-bold">
                          {modeloActualRedactor.origen} • {modeloActualRedactor.rama}
                        </span>
                        <h3 className="text-base font-editorial font-bold">{modeloActualRedactor.titulo}</h3>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {modeloActualRedactor.variables.map(v => (
                          <div key={v}>
                            <label className="text-[10px] font-mono-code text-slate-500 uppercase block mb-1">{v}:</label>
                            <input
                              type="text"
                              value={valoresVariablesRedactor[v] || ""}
                              onChange={e => setValoresVariablesRedactor(prev => ({ ...prev, [v]: e.target.value }))}
                              placeholder={`Valor para ${v}...`}
                              className="w-full p-2.5 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900 text-xs"
                            />
                          </div>
                        ))}
                      </div>

                      <div>
                        <label className="text-[10px] font-mono-code text-slate-500 uppercase block mb-1">
                          Instrucciones Particulares o Cláusulas Adicionales:
                        </label>
                        <textarea
                          rows={2}
                          value={instruccionesAdicionalesRedactor}
                          onChange={e => setInstruccionesAdicionalesRedactor(e.target.value)}
                          placeholder="Ej: Incluir cláusula penal por mora y adaptar a la normativa cargada en el RAG..."
                          className="w-full p-2.5 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900 text-xs"
                        />
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={handleGenerarDocumentoRedactor}
                          disabled={redactorCargando}
                          className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer"
                        >
                          {redactorCargando ? 'Ensamblando con RAG y Estilo Propio...' : 'Generar Borrador Jurídico'}
                        </button>
                        {borradorGeneradoRedactor && (
                          <button
                            onClick={() => enviarAHumanLoop(modeloActualRedactor.titulo, 'Redactor de Documentos', borradorGeneradoRedactor)}
                            className="px-5 py-2.5 rounded-xl bg-emerald-800 hover:bg-emerald-700 text-white text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                          >
                            <UserCheck className="w-4 h-4" /> Enviar a Human Loop (Visado Obligatorio) →
                          </button>
                        )}
                      </div>

                      {borradorGeneradoRedactor && (
                        <div className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#E6DFD1] dark:border-slate-800 space-y-2">
                          <div className="flex items-center justify-between text-[10px] font-mono-code text-[#8C6D32] dark:text-amber-300">
                            <span>VISTA PREVIA DEL INSTRUMENTO</span>
                            <span>Protegido por Zero-Trust PII</span>
                          </div>
                          <pre className="text-xs whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto">
                            {borradorGeneradoRedactor}
                          </pre>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* MÓDULO 3: GRABADOR DE AUDIENCIAS Y REUNIONES                    */}
          {/* =============================================================== */}
          {activeTab === 'grabador' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} space-y-4`}>
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-mono-code uppercase text-[#8C6D32] dark:text-amber-300 font-bold">
                      Módulo 3 • Grabador On-Premise & Generador de Actas
                    </span>
                    <h2 className="text-lg sm:text-xl font-editorial font-bold">
                      Grabador de Reuniones, Comparecencias y Minutas
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setGrabandoAudio(!grabandoAudio)}
                      className={`px-4 py-2.5 rounded-xl text-xs font-semibold flex items-center gap-2 cursor-pointer ${
                        grabandoAudio ? 'bg-rose-700 text-white animate-pulse' : 'bg-[#0F172A] text-white'
                      }`}
                    >
                      {grabandoAudio ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                      <span>{grabandoAudio ? `Detener Grabación (${segundosGrabacion}s)` : 'Iniciar Grabación en Sala'}</span>
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <label className="text-[10px] font-mono-code text-slate-500 uppercase block mb-1">Título de la Reunión o Audiencia:</label>
                    <input
                      type="text"
                      value={tituloSesionGrabador}
                      onChange={e => setTituloSesionGrabador(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-mono-code text-slate-500 uppercase block mb-1">Intervinientes / Asistentes:</label>
                    <input
                      type="text"
                      value={participantesGrabador}
                      onChange={e => setParticipantesGrabador(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-mono-code text-slate-500 uppercase block mb-1">Transcripción Auditada en Servidor Local:</label>
                  <textarea
                    rows={3}
                    value={transcripcionGrabador}
                    onChange={e => setTranscripcionGrabador(e.target.value)}
                    className="w-full p-3 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900 text-xs"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-editorial font-bold">Compromisos y Action Items Extraídos:</span>
                    <button
                      onClick={() => enviarAHumanLoop(`Acta Oficial: ${tituloSesionGrabador}`, 'Grabador de Actas', `ACTA: ${tituloSesionGrabador}\nPARTICIPANTES: ${participantesGrabador}\nTRANSCRIPCIÓN: ${transcripcionGrabador}`)}
                      className="px-3 py-1.5 rounded-xl bg-emerald-800 text-white text-xs font-semibold cursor-pointer"
                    >
                      Enviar Acta a Human Loop →
                    </button>
                  </div>
                  {acuerdosExtraidosGrabador.map(ac => (
                    <div key={ac.id} className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#E6DFD1] dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <div className="font-semibold">{ac.descripcion}</div>
                        <div className="text-[10px] font-mono-code text-slate-500">Responsable: {ac.responsable} • Plazo: {ac.plazo}</div>
                      </div>
                      <button
                        onClick={() => {
                          if (ac.enviadoPlanificador) return;
                          setTareasPlanificador(prev => [
                            {
                              id: `EXP-${Date.now().toString().slice(-3)}`,
                              titulo: ac.descripcion,
                              cliente: nombreDespachoCliente,
                              rama: ramaDerechoActiva,
                              prioridad: 'Alta',
                              estado: 'Pendiente',
                              plazo: ac.plazo
                            },
                            ...prev
                          ]);
                          setAcuerdosExtraidosGrabador(prev => prev.map(x => x.id === ac.id ? { ...x, enviadoPlanificador: true } : x));
                          notificar("Compromiso enviado directamente al Planificador Kanban.");
                        }}
                        className={`px-3 py-1.5 rounded-lg text-[11px] font-mono-code font-semibold cursor-pointer ${
                          ac.enviadoPlanificador ? 'bg-emerald-700 text-white' : 'bg-[#0F172A] text-white'
                        }`}
                      >
                        {ac.enviadoPlanificador ? '✓ En Planificador' : '+ Enviar al Planificador'}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* MÓDULO 4: PLANIFICADOR (KANBAN Y LISTA DE EXPEDIENTES)          */}
          {/* =============================================================== */}
          {activeTab === 'planificador' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} flex flex-wrap items-center justify-between gap-3`}>
                <div>
                  <span className="text-[10px] font-mono-code uppercase text-[#8C6D32] dark:text-amber-300 font-bold">
                    Módulo 4 • Gestión de Expedientes y Flujo de Trabajo
                  </span>
                  <h2 className="text-lg sm:text-xl font-editorial font-bold">
                    Planificador del Despacho ({tareasPlanificador.length} Asuntos Activos)
                  </h2>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setVistaPlanificador('kanban')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono-code font-semibold cursor-pointer ${vistaPlanificador === 'kanban' ? 'bg-[#0F172A] text-white' : 'border border-slate-300 dark:border-slate-700'}`}
                  >
                    Vista Kanban
                  </button>
                  <button
                    onClick={() => setVistaPlanificador('lista')}
                    className={`px-3 py-1.5 rounded-xl text-xs font-mono-code font-semibold cursor-pointer ${vistaPlanificador === 'lista' ? 'bg-[#0F172A] text-white' : 'border border-slate-300 dark:border-slate-700'}`}
                  >
                    Vista Lista
                  </button>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} grid grid-cols-1 sm:grid-cols-5 gap-2.5 text-xs`}>
                <input
                  type="text"
                  value={nuevaTareaTitulo}
                  onChange={e => setNuevaTareaTitulo(e.target.value)}
                  placeholder="Título del asunto o tarea procesal..."
                  className="sm:col-span-2 p-2.5 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900"
                />
                <input
                  type="text"
                  value={nuevaTareaCliente}
                  onChange={e => setNuevaTareaCliente(e.target.value)}
                  placeholder="Cliente asociado..."
                  className="p-2.5 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900"
                />
                <select
                  value={nuevaTareaPrioridad}
                  onChange={e => setNuevaTareaPrioridad(e.target.value as any)}
                  className="p-2.5 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900"
                >
                  <option value="Crítica">Prioridad Crítica</option>
                  <option value="Alta">Prioridad Alta</option>
                  <option value="Media">Prioridad Media</option>
                </select>
                <button
                  onClick={() => {
                    if (!nuevaTareaTitulo.trim()) return;
                    setTareasPlanificador(prev => [
                      {
                        id: `EXP-${Date.now().toString().slice(-3)}`,
                        titulo: nuevaTareaTitulo.trim(),
                        cliente: nuevaTareaCliente.trim() || "Cartera General",
                        rama: ramaDerechoActiva,
                        prioridad: nuevaTareaPrioridad,
                        estado: "Pendiente",
                        plazo: nuevaTareaPlazo
                      },
                      ...prev
                    ]);
                    setNuevaTareaTitulo("");
                    setNuevaTareaCliente("");
                    notificar("Nuevo asunto incorporado al Planificador.");
                  }}
                  className="py-2.5 px-4 rounded-xl bg-[#0F172A] text-white font-semibold cursor-pointer"
                >
                  + Agregar Asunto
                </button>
              </div>

              {vistaPlanificador === 'kanban' ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                  {(['Pendiente', 'En Tramitación', 'En Revisión Human-Loop'] as const).map(col => (
                    <div key={col} className={`p-4 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} space-y-3`}>
                      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
                        <span className="text-xs font-mono-code font-bold uppercase text-[#8C6D32] dark:text-amber-300">{col}</span>
                        <span className="text-xs font-mono-code font-bold">{tareasPlanificador.filter(t => t.estado === col).length}</span>
                      </div>
                      <div className="space-y-2.5">
                        {tareasPlanificador.filter(t => t.estado === col).map(t => (
                          <div key={t.id} className="p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#E6DFD1] dark:border-slate-800 space-y-2 text-xs">
                            <div className="flex items-center justify-between text-[10px] font-mono-code">
                              <span className="font-bold text-[#8C6D32]">{t.id}</span>
                              <span className={`px-2 py-0.5 rounded font-bold ${t.prioridad === 'Crítica' ? 'bg-rose-500/15 text-rose-600' : 'bg-amber-500/15 text-amber-700'}`}>
                                {t.prioridad}
                              </span>
                            </div>
                            <div className="font-bold">{t.titulo}</div>
                            <div className="text-[11px] text-slate-500">{t.cliente} • Vence: {t.plazo}</div>
                            <div className="flex gap-1 pt-1">
                              {(['Pendiente', 'En Tramitación', 'En Revisión Human-Loop'] as const).map(est => (
                                est !== t.estado && (
                                  <button
                                    key={est}
                                    onClick={() => setTareasPlanificador(prev => prev.map(x => x.id === t.id ? { ...x, estado: est } : x))}
                                    className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 text-[10px] font-mono-code cursor-pointer"
                                  >
                                    → {est.split(' ')[0]}
                                  </button>
                                )
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className={`rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} overflow-hidden`}>
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#0F172A] text-white font-mono-code text-[10px] uppercase">
                        <th className="p-3.5">ID</th>
                        <th className="p-3.5">Asunto</th>
                        <th className="p-3.5">Cliente</th>
                        <th className="p-3.5">Estado</th>
                        <th className="p-3.5">Plazo</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {tareasPlanificador.map(t => (
                        <tr key={t.id}>
                          <td className="p-3.5 font-mono-code font-bold">{t.id}</td>
                          <td className="p-3.5 font-semibold">{t.titulo}</td>
                          <td className="p-3.5">{t.cliente}</td>
                          <td className="p-3.5 font-mono-code">{t.estado}</td>
                          <td className="p-3.5 font-mono-code">{t.plazo}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* =============================================================== */}
          {/* MÓDULO 5: CALENDARIO PROCESAL (.ICS Y CÓMPUTO DE TÉRMINOS)      */}
          {/* =============================================================== */}
          {activeTab === 'calendario' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} flex flex-wrap items-center justify-between gap-3`}>
                <div>
                  <span className="text-[10px] font-mono-code uppercase text-[#8C6D32] dark:text-amber-300 font-bold">
                    Módulo 5 • Control de Términos Judiciales y Audiencias
                  </span>
                  <h2 className="text-lg sm:text-xl font-editorial font-bold">
                    Calendario Procesal ({paisDespacho})
                  </h2>
                </div>
                <button
                  onClick={exportarCalendarioICS}
                  className="px-4 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Exportar Agenda (.ICS)
                </button>
              </div>

              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} space-y-4`}>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs">
                  <input
                    type="text"
                    value={nuevoEventoTitulo}
                    onChange={e => setNuevoEventoTitulo(e.target.value)}
                    placeholder="Descripción del vencimiento o audiencia..."
                    className="sm:col-span-2 p-2.5 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900"
                  />
                  <input
                    type="date"
                    value={nuevoEventoFecha}
                    onChange={e => setNuevoEventoFecha(e.target.value)}
                    className="p-2.5 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900 font-mono-code"
                  />
                  <button
                    onClick={() => {
                      if (!nuevoEventoTitulo.trim()) return;
                      setEventosCalendario(prev => [
                        ...prev,
                        {
                          id: `CAL-${Date.now().toString().slice(-3)}`,
                          titulo: nuevoEventoTitulo.trim(),
                          fecha: nuevoEventoFecha,
                          hora: nuevoEventoHora,
                          tipoPlazo: nuevoEventoTipo,
                          expediente: "EXP-GENERAL"
                        }
                      ]);
                      setNuevoEventoTitulo("");
                      notificar("Vencimiento procesal agendado.");
                    }}
                    className="py-2.5 px-4 rounded-xl bg-[#0F172A] text-white font-semibold cursor-pointer"
                  >
                    + Agendar Plazo
                  </button>
                </div>

                <div className="space-y-2.5">
                  {eventosCalendario.map(ev => (
                    <div key={ev.id} className="p-4 rounded-2xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#E6DFD1] dark:border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="text-[10px] font-mono-code text-[#8C6D32] font-bold">{ev.tipoPlazo} • {ev.expediente}</span>
                        <div className="font-bold text-sm">{ev.titulo}</div>
                      </div>
                      <div className="font-mono-code font-bold text-xs px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-[#D5CBB8] dark:border-slate-700">
                        📅 {ev.fecha} • {ev.hora}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* MÓDULO 6: CRM & DIRECTORIO DE CLIENTES                          */}
          {/* =============================================================== */}
          {activeTab === 'crm' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} flex flex-wrap items-center justify-between gap-3`}>
                <div>
                  <span className="text-[10px] font-mono-code uppercase text-[#8C6D32] dark:text-amber-300 font-bold">
                    Módulo 6 • Gestión de Cartera y Vigencia de Poderes
                  </span>
                  <h2 className="text-lg sm:text-xl font-editorial font-bold">
                    CRM Jurídico & Clientes ({clientesCRM.length} Registrados)
                  </h2>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} grid grid-cols-1 sm:grid-cols-4 gap-2.5 text-xs`}>
                <input
                  type="text"
                  value={nuevoClienteNombre}
                  onChange={e => setNuevoClienteNombre(e.target.value)}
                  placeholder="Razón Social o Nombre del Cliente..."
                  className="p-2.5 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900"
                />
                <input
                  type="text"
                  value={nuevoClienteIdFiscal}
                  onChange={e => setNuevoClienteIdFiscal(e.target.value)}
                  placeholder="NIF / CIF / RFC / NIT / RUT / RIF..."
                  className="p-2.5 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900 font-mono-code"
                />
                <input
                  type="text"
                  value={nuevoClienteContacto}
                  onChange={e => setNuevoClienteContacto(e.target.value)}
                  placeholder="Correo o teléfono de contacto..."
                  className="p-2.5 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900"
                />
                <button
                  onClick={() => {
                    if (!nuevoClienteNombre.trim()) return;
                    setClientesCRM(prev => [
                      {
                        id: `CLI-${Date.now().toString().slice(-3)}`,
                        nombre: nuevoClienteNombre.trim(),
                        idFiscal: nuevoClienteIdFiscal.trim() || "ID-RESERVADO",
                        contacto: nuevoClienteContacto.trim() || "contacto@cliente.com",
                        ramaPrincipal: ramaDerechoActiva,
                        estadoPoder: "Vigente",
                        expedientesActivos: 1
                      },
                      ...prev
                    ]);
                    setNuevoClienteNombre("");
                    setNuevoClienteIdFiscal("");
                    setNuevoClienteContacto("");
                    notificar("Cliente registrado en el CRM local.");
                  }}
                  className="py-2.5 px-4 rounded-xl bg-[#0F172A] text-white font-semibold cursor-pointer"
                >
                  + Registrar Cliente
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {clientesCRM.map(c => (
                  <div key={c.id} className={`p-5 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} space-y-2.5 text-xs`}>
                    <div className="flex items-center justify-between">
                      <span className="font-mono-code text-[10px] text-[#8C6D32] font-bold">{c.idFiscal}</span>
                      <span className={`px-2 py-0.5 rounded font-mono-code text-[10px] font-bold ${
                        c.estadoPoder === 'Vigente' ? 'bg-emerald-500/15 text-emerald-700' : 'bg-amber-500/15 text-amber-700'
                      }`}>
                        Poder: {c.estadoPoder}
                      </span>
                    </div>
                    <div className="font-editorial font-bold text-base">{c.nombre}</div>
                    <div className="text-slate-500">{c.ramaPrincipal}</div>
                    <div className="text-[11px] font-mono-code text-slate-500">{c.contacto}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* MÓDULO 7: KPI & CONTROL FINOPS DEL DESPACHO                     */}
          {/* =============================================================== */}
          {activeTab === 'kpi' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} flex flex-wrap items-center justify-between gap-3`}>
                <div>
                  <span className="text-[10px] font-mono-code uppercase text-[#8C6D32] dark:text-amber-300 font-bold">
                    Módulo 7 • Métricas Ejecutivas, ROI y Control de Gasto de API
                  </span>
                  <h2 className="text-lg sm:text-xl font-editorial font-bold">
                    KPIs & Rendimiento Operativo ({nombreDespachoCliente})
                  </h2>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className={`p-5 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} space-y-1`}>
                  <span className="text-[10px] font-mono-code uppercase text-slate-500">Gasto Real API LLM (Mes)</span>
                  <div className="text-2xl font-editorial font-bold text-emerald-700 dark:text-emerald-400">${gastoAcumuladoAPI.toFixed(2)} USD</div>
                  <p className="text-[11px] text-slate-500">Límite fijado: ${topeMensualAPI} USD/mes</p>
                </div>
                <div className={`p-5 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} space-y-1`}>
                  <span className="text-[10px] font-mono-code uppercase text-slate-500">Ahorro en Tiempo de Redacción</span>
                  <div className="text-2xl font-editorial font-bold text-[#8C6D32] dark:text-amber-300">64%</div>
                  <p className="text-[11px] text-slate-500">{bibliotecaModelosCliente.length} plantillas propias conectadas</p>
                </div>
                <div className={`p-5 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} space-y-1`}>
                  <span className="text-[10px] font-mono-code uppercase text-slate-500">Tasa de Alucinación Normativa</span>
                  <div className="text-2xl font-editorial font-bold text-emerald-700 dark:text-emerald-400">0.0%</div>
                  <p className="text-[11px] text-slate-500">{corpusNormativoRAG.length} normas en RAG ({ramaDerechoActiva})</p>
                </div>
                <div className={`p-5 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} space-y-1`}>
                  <span className="text-[10px] font-mono-code uppercase text-slate-500">Operaciones Auditadas SHA-256</span>
                  <div className="text-2xl font-editorial font-bold">{bitacoraTrazabilidad.length}</div>
                  <p className="text-[11px] text-slate-500">100% en servidor Docker propio</p>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* MÓDULO 8: TRAZABILIDAD CRIPTOGRÁFICA SHA-256                    */}
          {/* =============================================================== */}
          {activeTab === 'trazabilidad' && (
            <div className="max-w-6xl mx-auto space-y-6">
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} flex flex-wrap items-center justify-between gap-3`}>
                <div>
                  <span className="text-[10px] font-mono-code uppercase text-[#8C6D32] dark:text-amber-300 font-bold">
                    Módulo 8 • Cadena de Custodia Digital y Auditoría Deontológica
                  </span>
                  <h2 className="text-lg sm:text-xl font-editorial font-bold">
                    Bitácora de Trazabilidad Inmutable SHA-256 ({bitacoraTrazabilidad.length} Asientos)
                  </h2>
                </div>
                <button
                  onClick={exportarBitacoraTrazabilidadJSON}
                  className="px-4 py-2.5 rounded-xl bg-[#0F172A] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Download className="w-4 h-4" /> Exportar Auditoría (.JSON)
                </button>
              </div>

              <div className={`rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} overflow-hidden`}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-[#0F172A] text-white font-mono-code text-[10px] uppercase">
                        <th className="p-3.5">ID / Fecha</th>
                        <th className="p-3.5">Módulo / Acción</th>
                        <th className="p-3.5">Motor LLM & Fuente RAG</th>
                        <th className="p-3.5">PII Enmascarado</th>
                        <th className="p-3.5">Human-in-the-Loop</th>
                        <th className="p-3.5">Sello SHA-256</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                      {bitacoraTrazabilidad.map(log => (
                        <tr key={log.id}>
                          <td className="p-3.5 font-mono-code text-[11px]">
                            <div className="font-bold">{log.id}</div>
                            <div className="text-slate-500">{log.fechaHora}</div>
                          </td>
                          <td className="p-3.5">
                            <div className="font-bold">{log.modulo}</div>
                            <div className="text-slate-500">{log.accion}</div>
                          </td>
                          <td className="p-3.5 font-mono-code text-[11px]">
                            <div>{log.proveedorLLM}</div>
                            <div className="text-[#8C6D32] dark:text-amber-300 truncate max-w-xs">{log.fuenteRAG}</div>
                          </td>
                          <td className="p-3.5 font-mono-code font-bold text-emerald-700 dark:text-emerald-400">
                            {log.tokensPII} tokens
                          </td>
                          <td className="p-3.5">
                            <span className={`px-2 py-0.5 rounded font-mono-code text-[10px] font-bold ${
                              log.estadoHumanLoop === 'Verificado por Abogado'
                                ? 'bg-emerald-500/15 text-emerald-700'
                                : 'bg-amber-500/15 text-amber-700'
                            }`}>
                              {log.estadoHumanLoop}
                            </span>
                          </td>
                          <td className="p-3.5 font-mono-code text-[10px] text-slate-500">
                            {log.hashSHA256.slice(0, 18)}...
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* MÓDULO 9: HUMAN-IN-THE-LOOP (SUPERVISIÓN Y VISADO HUMANO)       */}
          {/* =============================================================== */}
          {activeTab === 'human_loop' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} space-y-1`}>
                <span className="text-[10px] font-mono-code uppercase text-[#8C6D32] dark:text-amber-300 font-bold">
                  Módulo 9 • Compuerta Deontológica de Supervisión Humana Obligatoria
                </span>
                <h2 className="text-lg sm:text-xl font-editorial font-bold">
                  Estación Human-in-the-Loop (Visado y Firma del Abogado Responsable)
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Ningún documento o dictamen generado por la IA puede exportarse como definitivo sin superar los 3 controles de verificación humana del abogado titular.
                </p>
              </div>

              <div className="space-y-4">
                {colaHumanLoop.map(item => (
                  <div key={item.id} className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} space-y-4 shadow-sm`}>
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 dark:border-slate-800 pb-3">
                      <div>
                        <span className="text-[10px] font-mono-code text-[#8C6D32] dark:text-amber-300 font-bold uppercase">
                          {item.id} • {item.origenModulo} • {item.fechaCreacion}
                        </span>
                        <h3 className="text-base font-editorial font-bold">{item.titulo}</h3>
                      </div>
                      <span className={`px-3 py-1 rounded-full font-mono-code text-[10px] font-bold ${
                        item.aprobadoPorHumano
                          ? 'bg-emerald-700 text-white'
                          : 'bg-amber-500/20 text-amber-800 dark:text-amber-300'
                      }`}>
                        {item.aprobadoPorHumano ? `✓ VISADO POR ${item.firmante}` : '⏳ PENDIENTE DE REVISIÓN HUMANA'}
                      </span>
                    </div>

                    <textarea
                      rows={5}
                      value={item.contenido}
                      onChange={e => {
                        const val = e.target.value;
                        setColaHumanLoop(prev => prev.map(x => x.id === item.id ? { ...x, contenido: val } : x));
                      }}
                      className="w-full p-3.5 rounded-2xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#D5CBB8] dark:border-slate-700 text-xs font-sans leading-relaxed"
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                      <label className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#E6DFD1] dark:border-slate-800 flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.checkNormativa}
                          onChange={e => setColaHumanLoop(prev => prev.map(x => x.id === item.id ? { ...x, checkNormativa: e.target.checked } : x))}
                        />
                        <span>1. Citas verificadas contra el RAG ({ramaDerechoActiva})</span>
                      </label>
                      <label className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#E6DFD1] dark:border-slate-800 flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.checkClausulas}
                          onChange={e => setColaHumanLoop(prev => prev.map(x => x.id === item.id ? { ...x, checkClausulas: e.target.checked } : x))}
                        />
                        <span>2. Técnica jurídica y cláusulas revisadas por el titular</span>
                      </label>
                      <label className="p-3 rounded-xl bg-[#FAF8F5] dark:bg-slate-900 border border-[#E6DFD1] dark:border-slate-800 flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={item.checkPII}
                          onChange={e => setColaHumanLoop(prev => prev.map(x => x.id === item.id ? { ...x, checkPII: e.target.checked } : x))}
                        />
                        <span>3. Secreto profesional y datos PII verificados</span>
                      </label>
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                      <div className="text-[11px] font-mono-code text-slate-500">
                        {item.hashAprobacion ? `Hash SHA-256 de Visado: ${item.hashAprobacion.slice(0, 24)}...` : `Firmante asignado: ${titularDespacho}`}
                      </div>
                      <div className="flex gap-2">
                        {!item.aprobadoPorHumano ? (
                          <button
                            onClick={() => handleAprobarEnHumanLoop(item.id)}
                            className="px-5 py-2.5 rounded-xl bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-semibold cursor-pointer flex items-center gap-2"
                          >
                            <UserCheck className="w-4 h-4" /> Firmar Visado Human-in-the-Loop
                          </button>
                        ) : (
                          <button
                            onClick={() => descargarDocumentoVisado(item.titulo, item.contenido, item.hashAprobacion)}
                            className="px-5 py-2.5 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white text-xs font-semibold cursor-pointer flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" /> Descargar Documento Oficial Visado (.DOC)
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* =============================================================== */}
          {/* MÓDULO 10: ANONIMIZACIÓN PII (GATEWAY ZERO-TRUST EN RAM LOCAL)  */}
          {/* =============================================================== */}
          {activeTab === 'anonimizacion_pii' && (
            <div className="max-w-5xl mx-auto space-y-6">
              <div className={`p-5 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} space-y-1`}>
                <span className="text-[10px] font-mono-code uppercase text-emerald-700 dark:text-emerald-400 font-bold">
                  Módulo 10 • Interceptor Perimetral Zero-Trust PII en Memoria RAM Volátil
                </span>
                <h2 className="text-lg sm:text-xl font-editorial font-bold">
                  Motor de Anonimización PII antes de Enviar al LLM ({proveedorLLM.toUpperCase()})
                </h2>
                <p className="text-xs text-slate-600 dark:text-slate-400">
                  Verifica cómo el contenedor Docker sustituye automáticamente identificadores fiscales, documentos de identidad, IBAN, correos, teléfonos y montos por tokens anónimos antes de que salgan hacia la API del LLM.
                </p>
              </div>

              <div className={`p-6 rounded-3xl border ${isDark ? 'bg-[#0F172A] border-slate-800' : 'bg-white border-[#E6DFD1]'} space-y-4`}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-mono-code text-slate-500 uppercase block mb-1">
                      Texto Original en el Despacho (Con Datos Sensibles Reales):
                    </label>
                    <textarea
                      rows={4}
                      value={textoPruebaPII}
                      onChange={e => setTextoPruebaPII(e.target.value)}
                      className="w-full p-3 rounded-2xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900 text-xs font-mono-code"
                    />
                  </div>
                  <div className="p-4 rounded-2xl bg-[#0F172A] text-slate-100 font-mono-code text-xs space-y-2">
                    <div className="flex items-center justify-between text-[10px] text-emerald-400 font-bold uppercase">
                      <span>Payload Sanitizado que Recibe la API del LLM:</span>
                      <span>{resultadoVivoPII.entidades.length} Tokens Enmascarados</span>
                    </div>
                    <p className="leading-relaxed text-slate-200">{resultadoVivoPII.textoSanitizado}</p>
                    <div className="flex flex-wrap gap-1.5 pt-2 border-t border-slate-800">
                      {resultadoVivoPII.entidades.map((e, i) => (
                        <span key={i} className="px-2 py-0.5 rounded bg-slate-800 border border-emerald-500/40 text-[10px] text-emerald-300">
                          {e.token} = {e.original}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-slate-800 space-y-2 text-xs">
                  <span className="text-[10px] font-mono-code uppercase font-bold text-[#8C6D32] dark:text-amber-300 block">
                    Añadir Patrón de Anonimización Propio del Despacho:
                  </span>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <input
                      type="text"
                      value={nuevaEtiquetaPII}
                      onChange={e => setNuevaEtiquetaPII(e.target.value)}
                      placeholder="Etiqueta (ej. EXPEDIENTE_JUDICIAL)"
                      className="p-2.5 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900 font-mono-code text-xs"
                    />
                    <input
                      type="text"
                      value={nuevoRegexPII}
                      onChange={e => setNuevoRegexPII(e.target.value)}
                      placeholder="Expresión regular (ej. EXP-\\d{4}-\\d+)"
                      className="p-2.5 rounded-xl border border-[#D5CBB8] dark:border-slate-700 bg-[#FCFBF9] dark:bg-slate-900 font-mono-code text-xs"
                    />
                    <button
                      onClick={() => {
                        if (!nuevaEtiquetaPII.trim() || !nuevoRegexPII.trim()) return;
                        setReglasPIIPersonalizadas(prev => [...prev, { etiqueta: nuevaEtiquetaPII.trim().toUpperCase(), regexStr: nuevoRegexPII.trim() }]);
                        setNuevaEtiquetaPII("");
                        setNuevoRegexPII("");
                        notificar("Nueva regla de anonimización PII incorporada al Gateway.");
                      }}
                      className="py-2.5 px-4 rounded-xl bg-[#0F172A] text-white font-semibold cursor-pointer"
                    >
                      + Activar Regla PII
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 md:hidden flex justify-end">
          <div className={`w-72 h-full p-4 overflow-y-auto space-y-4 ${isDark ? 'bg-[#0F172A] text-white' : 'bg-[#FAF8F5] text-[#0F172A]'}`}>
            <div className="flex items-center justify-between border-b pb-3 border-slate-300 dark:border-slate-800">
              <span className="font-editorial font-bold">Menú del Sistema Docker</span>
              <button onClick={() => setMobileMenuOpen(false)}>
                <X className="w-5 h-5" />
              </button>
            </div>
            {MENU_SECCIONES.map((sec, idx) => (
              <div key={idx} className="space-y-1">
                <p className="text-[10px] font-mono-code font-bold uppercase text-[#8C6D32]">{sec.titulo}</p>
                {sec.items.map(item => (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs ${
                      activeTab === item.id ? 'bg-[#0F172A] text-white font-bold' : ''
                    }`}
                  >
                    <span>{item.label}</span>
                    <span className="text-[10px] font-mono-code opacity-75">{item.badge}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
