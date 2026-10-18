# Arquitectura y Guía de Despliegue en Docker — AI GOVERN (Edición Comercial Base para Venta a Colegas)

## 1. Estructura del Producto Base Comercial (`ai-govern-commercial-docker`)

Esta versión ha sido construida como el **código básico limpio (White-Label)** que entregas o instalas a otros abogados y bufetes hispanohablantes. No contiene datos personales ni los modelos privados de tu despacho personal, y viene empaquetada en **Docker** con los **3 Conectores de Personalización del Cliente** y los **10 Módulos Operativos y de Gobernanza**:

```text
ai-govern-commercial-docker/
├── docker-compose.yml               # Orquesta Frontend (Next.js :3000) + Backend Gateway (FastAPI :8000)
├── .env.example                     # Variables de entorno para API LLM, Carpeta Local/Drive y RAG
├── ARQUITECTURA_DOCKER_AI_GOVERN.md # Manual técnico y comercial de instalación para el cliente
├── data/
│   ├── modelos_locales/             # Volumen local montado: aquí el cliente coloca sus plantillas (.docx, .txt, .md)
│   ├── rag_normativa/               # Volumen local montado: aquí el cliente coloca las leyes/códigos de su rama
│   └── trazabilidad_db/             # Base de datos local de bitácora SHA-256 y visados Human-in-the-Loop
├── backend/
│   ├── Dockerfile                   # Contenedor Python 3.11 FastAPI Zero-Trust Gateway
│   ├── requirements.txt             # Dependencias (FastAPI, Uvicorn, HTTPX, python-docx, pypdf)
│   └── main.py                      # API de Anonimización PII, Enrutador Multi-LLM, Escáner de Modelos y RAG
└── frontend/
    ├── Dockerfile                   # Contenedor Node 20 Alpine para la interfaz Next.js
    ├── package.json
    └── src/app/page.tsx             # Interfaz completa con el Configurador Docker y los 10 Módulos
```

## 2. Los 3 Conectores de Personalización Incluidos para el Cliente Comprador

| Conector del Sistema Base | Cómo funciona en el contenedor Docker del cliente | Beneficio Comercial y Deontológico |
| :--- | :--- | :--- |
| **1. Conector de API del LLM a Elección del Cliente** | El cliente selecciona en pantalla (o en `.env`) **OpenAI (GPT-4o)**, **Anthropic (Claude 3.5 Sonnet)**, **Google Gemini**, **Groq LPU** u **Ollama Local**, pega su propia API Key y fija su tope mensual en USD/EUR. | Paga centavos por uso real directamente a su proveedor sin licencias infladas y bajo contratos empresariales *Zero-Training*. |
| **2. Conector de Biblioteca de Modelos Jurídicos (Carpeta Local o Google Drive)** | Permite montar la carpeta local `./data/modelos_locales` del servidor/PC del abogado, subir archivos `.docx`/`.txt` directamente o pegar el enlace de su carpeta de **Google Drive** para indexar sus contratos y demandas con detección automática de variables (`{{CLIENTE}}`, `{{MONTO}}`, etc.). | El sistema redacta con las plantillas, el léxico y la estructura procesal exacta del despacho comprador. |
| **3. Conector de Normativa Legal Aplicable (Motor RAG por Rama del Derecho)** | El cliente elige su país y su rama del derecho (*Civil y Mercantil*, *Procesal y Litigio*, *Societario*, *Laboral*, *Penal*, *Administrativo/Tributario*, *Familia*) y sube sus códigos, leyes y sentencias a `./data/rag_normativa`. | Activa el **Modo Estricto Cero Alucinaciones (0% invención de citas)**, evitando multas judiciales y sanciones colegiales. |

## 3. Los 10 Módulos de la Estructura Funcional

1. **Consultor de IA**: Asistente jurídico conectado al LLM elegido por el cliente y forzado a fundamentar sus respuestas en la normativa cargada en el RAG de su rama del derecho.
2. **Redactor de Documentos**: Ensamblador documental conectado a la carpeta local `/app/data/modelos_locales` y a Google Drive, con formulario dinámico de variables.
3. **Grabador**: Grabación de reuniones, comparecencias y audiencias con transcripción local, generación de acta y envío directo de compromisos al Planificador.
4. **Planificador**: Tablero Kanban (`Pendiente`, `En Tramitación`, `En Revisión Human-Loop`) y vista Lista para el control de expedientes.
5. **Calendario**: Cómputo de plazos distinguiendo días hábiles de despacho judicial vs. días continuos, con exportación estándar `.ICS`.
6. **CRM**: Directorio de clientes, vinculación de expedientes activos y semáforo de vigencia de poderes de representación.
7. **KPI**: Panel de retorno de inversión, ahorro de tiempo letrado y control en tiempo real del gasto de API en centavos frente al presupuesto mensual.
8. **Trazabilidad**: Registro inmutable con sello criptográfico **SHA-256** de cada consulta, documento, fuente RAG invocada y tokens PII protegidos, exportable en `.json`.
9. **Human Loop (Human-in-the-Loop)**: Compuerta de supervisión humana obligatoria. Ningún borrador del Redactor o dictamen del Consultor IA se descarga como definitivo hasta que el abogado titular marca los 3 controles deontológicos y estampa su visado humano.
10. **Anonimización PII**: Interceptor Zero-Trust en memoria RAM local que sustituye DNI/NIE/NIF/RFC/RUT/NIT/CUIT/C.I./RIF, cuentas IBAN, correos, teléfonos y montos por variables anónimas antes de enviar el payload a la API del LLM.

## 4. Comandos de Despliegue Rápido en el Servidor o PC del Cliente

```bash
# 1. Copiar el archivo de configuración base
cp .env.example .env

# 2. Levantar el ecosistema completo (Frontend + Backend Gateway + Volúmenes Locales)
docker compose up -d --build

# 3. Abrir en el navegador del despacho:
# Interfaz Principal: http://localhost:3000
# API Gateway FastAPI: http://localhost:8000/docs
```
