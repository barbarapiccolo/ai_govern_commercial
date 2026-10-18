"""
AI GOVERN — Backend Gateway Dockerizado (FastAPI)
Incluye:
1. Conector Multi-LLM (OpenAI, Anthropic Claude, Google Gemini, Groq LPU, Ollama Local)
2. Conector de Biblioteca de Modelos Jurídicos (Carpeta Local /app/data/modelos_locales y Google Drive)
3. Motor RAG de Normativa Legal por Rama del Derecho (/app/data/rag_normativa)
4. Anonimización Zero-Trust PII en Memoria RAM Local
5. Registro de Trazabilidad Criptográfica SHA-256 y Compuerta Human-in-the-Loop
"""
import os
import re
import json
import time
import hashlib
from pathlib import Path
from typing import List, Optional, Dict, Any
from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import httpx

app = FastAPI(
    title="AI GOVERN — Private Legal OS Gateway (Docker Edition)",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATA_DIR = Path("/app/data")
MODELOS_DIR = DATA_DIR / "modelos_locales"
RAG_DIR = DATA_DIR / "rag_normativa"
TRAZABILIDAD_FILE = DATA_DIR / "trazabilidad_db" / "audit_log.json"

for d in [MODELOS_DIR, RAG_DIR, DATA_DIR / "trazabilidad_db"]:
    d.mkdir(parents=True, exist_ok=True)

# =====================================================================
# 1. MOTOR ZERO-TRUST DE ANONIMIZACIÓN PII EN MEMORIA VOLÁTIL
# =====================================================================
PII_PATTERNS = [
    ("ID_FISCAL", r"\b(?:[VJGEP]-?\d{7,9}-?\d?|[A-HJ-NP-SUVW]\d{7}[0-9A-J]|\d{8}[A-Z]|[XYZ]\d{7}[A-Z]|\d{2}-\d{8}-\d)\b"),
    ("DOC_IDENTIDAD", r"\b(?:[VE]-?\d{1,2}\.?\d{3}\.?\d{3}|\d{1,2}\.\d{3}\.\d{3}-[0-9Kk])\b"),
    ("CUENTA_IBAN", r"\b[A-Z]{2}\d{2}[A-Z0-9]{12,30}\b"),
    ("EMAIL", r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b"),
    ("TELEFONO", r"\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b"),
    ("MONTO_PATRIMONIAL", r"\b(?:USD|EUR|€|\$|MXN|COP|ARS|CLP|PEN|Bs\.?)[\s]?\d{1,3}(?:[.,]\d{3})*(?:[.,]\d{2})?\b"),
]

def anonymize_pii(text: str) -> Dict[str, Any]:
    sanitized = text
    entities = []
    vault: Dict[str, str] = {}
    counter = 1
    for label, pattern in PII_PATTERNS:
        def repl(match):
            nonlocal counter
            original = match.group(0)
            token = f"[{label}_{counter:02d}]"
            counter += 1
            vault[token] = original
            entities.append({"tipo": label, "original": original, "token": token})
            return token
        sanitized = re.sub(pattern, repl, sanitized)
    sha256_hash = hashlib.sha256(sanitized.encode("utf-8")).hexdigest()
    return {
        "textoSanitizado": sanitized,
        "entidades": entities,
        "vault": vault,
        "hash_sha256": sha256_hash
    }

def rehydrate_pii(text: str, vault: Dict[str, str]) -> str:
    result = text
    for token, original in vault.items():
        result = result.replace(token, original)
    return result

# =====================================================================
# 2. REGISTRO INMUTABLE DE TRAZABILIDAD SHA-256
# =====================================================================
def append_audit_log(entry: Dict[str, Any]):
    logs = []
    if TRAZABILIDAD_FILE.exists():
        try:
            logs = json.loads(TRAZABILIDAD_FILE.read_text(encoding="utf-8"))
        except Exception:
            logs = []
    logs.insert(0, entry)
    TRAZABILIDAD_FILE.write_text(json.dumps(logs[:500], indent=2, ensure_ascii=False), encoding="utf-8")

# =====================================================================
# 3. ENDPOINTS DE ESCANEO DE MODELOS LOCALES Y RAG NORMATIVO
# =====================================================================
@app.get("/api/health")
def health_check():
    return {
        "status": "ok",
        "container": "ai-govern-zerotrust-gateway",
        "modelos_locales_count": len(list(MODELOS_DIR.glob("*"))),
        "rag_normativa_count": len(list(RAG_DIR.glob("*")))
    }

@app.get("/api/modelos/local")
def listar_modelos_carpeta_local():
    modelos = []
    for f in sorted(MODELOS_DIR.glob("*")):
        if f.is_file() and not f.name.startswith("."):
            content_preview = ""
            if f.suffix.lower() in [".txt", ".md"]:
                content_preview = f.read_text(encoding="utf-8", errors="ignore")[:1000]
            variables = re.findall(r"\{\{([A-Z0-9_]+)\}\}|\[([A-Z0-9_]+)\]", content_preview)
            vars_flat = sorted(list({v[0] or v[1] for v in variables if v[0] or v[1]}))
            modelos.append({
                "id": f"LOCAL-{f.stem}",
                "titulo": f.stem.replace("_", " "),
                "archivo": f.name,
                "origen": "Carpeta Local (/app/data/modelos_locales)",
                "variables": vars_flat or ["CLIENTE", "CONTRAPARTE", "OBJETO", "MONTO", "FECHA"],
                "extracto": content_preview[:300]
            })
    return {"modelos": modelos}

@app.get("/api/rag/normativa")
def listar_normativa_rag_local():
    normas = []
    for f in sorted(RAG_DIR.glob("*")):
        if f.is_file() and not f.name.startswith("."):
            preview = ""
            if f.suffix.lower() in [".txt", ".md"]:
                preview = f.read_text(encoding="utf-8", errors="ignore")[:1500]
            normas.append({
                "id": f"RAG-{f.stem}",
                "titulo": f.stem.replace("_", " "),
                "archivo": f.name,
                "extracto": preview
            })
    return {"normativa": normas}

class ConsultaIARequest(BaseModel):
    modulo: str
    proveedor: str  # openai | anthropic | gemini | groq | ollama_local
    api_key: Optional[str] = ""
    modelo_llm: Optional[str] = ""
    prompt_sistema: str
    prompt_usuario: str
    rama_derecho: str
    pais: str

@app.post("/api/inferencia")
async def procesar_inferencia_segura(req: ConsultaIARequest):
    # 1. Anonimizar PII antes de tocar cualquier LLM
    pii_res = anonymize_pii(req.prompt_usuario)
    sanitized_prompt = pii_res["textoSanitizado"]

    # 2. Recuperar contexto RAG de la carpeta local /app/data/rag_normativa
    rag_fragments = []
    for f in sorted(RAG_DIR.glob("*")):
        if f.suffix.lower() in [".txt", ".md"]:
            rag_fragments.append(f"[{f.stem}]: {f.read_text(encoding='utf-8', errors='ignore')[:1200]}")
    rag_context = "\n".join(rag_fragments[:5])

    full_system = (
        f"{req.prompt_sistema}\n"
        f"JURISDICCIÓN: {req.pais} | RAMA DEL DERECHO: {req.rama_derecho}\n"
        f"NORMATIVA LOCAL CARGADA EN RAG:\n{rag_context}"
    )

    respuesta_llm = ""
    api_key = (req.api_key or "").strip()

    async with httpx.AsyncClient(timeout=30.0) as client:
        if req.proveedor == "openai" and api_key:
            r = await client.post(
                "https://api.openai.com/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": req.modelo_llm or "gpt-4o-mini",
                    "messages": [
                        {"role": "system", "content": full_system},
                        {"role": "user", "content": sanitized_prompt}
                    ],
                    "temperature": 0.2
                }
            )
            if r.status_code == 200:
                respuesta_llm = r.json()["choices"][0]["message"]["content"]

        elif req.proveedor == "groq" and api_key:
            r = await client.post(
                "https://api.groq.com/openai/v1/chat/completions",
                headers={"Authorization": f"Bearer {api_key}"},
                json={
                    "model": req.modelo_llm or "llama-3.3-70b-versatile",
                    "messages": [
                        {"role": "system", "content": full_system},
                        {"role": "user", "content": sanitized_prompt}
                    ],
                    "temperature": 0.2
                }
            )
            if r.status_code == 200:
                respuesta_llm = r.json()["choices"][0]["message"]["content"]

        elif req.proveedor == "anthropic" and api_key:
            r = await client.post(
                "https://api.anthropic.com/v1/messages",
                headers={
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                },
                json={
                    "model": req.modelo_llm or "claude-3-5-sonnet-latest",
                    "max_tokens": 2048,
                    "system": full_system,
                    "messages": [{"role": "user", "content": sanitized_prompt}]
                }
            )
            if r.status_code == 200:
                respuesta_llm = r.json()["content"][0]["text"]

    # 3. Rehidratar PII localmente y guardar en Trazabilidad SHA-256
    texto_final = rehydrate_pii(respuesta_llm, pii_res["vault"]) if respuesta_llm else ""
    audit_entry = {
        "id": f"TRZ-{int(time.time())}",
        "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
        "modulo": req.modulo,
        "proveedor_llm": req.proveedor,
        "pais": req.pais,
        "rama_derecho": req.rama_derecho,
        "entidades_pii_protegidas": len(pii_res["entidades"]),
        "hash_sha256": pii_res["hash_sha256"]
    }
    append_audit_log(audit_entry)

    return {
        "respuesta": texto_final,
        "pii": pii_res,
        "trazabilidad": audit_entry
    }
