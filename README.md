<div align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Inter&size=24&pause=1000&color=3B82F6&center=true&vCenter=true&width=600&lines=Regulation-as-Code+Compiler;Turning+Regulatory+Text+Into+Enforceable+Policy;GDPR+%E2%86%92+Structured+JSON+%E2%86%92+Enforceable+API;Compliance+in+Minutes%2C+Not+Months" alt="Typing SVG" />
</div>

<div align="center">
  <img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" />
  <img src="https://github.com/raghul-cyber/regulation-compiler/actions/workflows/ci.yml/badge.svg" alt="Build Status" />
  <img src="https://img.shields.io/github/v/release/raghul-cyber/regulation-compiler" alt="Latest Release" />
  <img src="https://img.shields.io/github/issues/raghul-cyber/regulation-compiler" alt="Open Issues" />
  <img src="https://img.shields.io/github/stars/raghul-cyber/regulation-compiler" alt="Stars" />
  <img src="https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square" alt="PRs Welcome" />
</div>

<div align="center">
  <br />
  <img src="https://skillicons.dev/icons?i=svelte,ts,tailwind,threejs,python,fastapi,postgres,redis,docker" alt="Tech Stack" />
</div>

<div align="center">
  <h3><em>An autonomous AI pipeline that translates raw legal text into programmatic, enforceable compliance rules.</em></h3>
</div>

<img src="https://capsule-render.vercel.app/api?type=waving&color=0f1115&height=120&section=header" width="100%" />

## Table of Contents
- [Overview](#overview)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Features](#features)
- [Data Model](#data-model)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Project Structure](#project-structure)
- [Roadmap](#roadmap)
- [Security & Compliance Posture](#security--compliance-posture)
- [Contributing](#contributing)
- [License](#license)

## Overview

Modern software teams spend countless hours mapping ambiguous legal text (GDPR, SOC 2, HIPAA) to engineering constraints. This manual translation chain—from lawyers to product managers to engineers—is slow, error-prone, and impossible to scale. When regulations update, the entire mapping process restarts.

The **Regulation-as-Code Compiler** eliminates this translation layer. It ingests official regulatory documents (PDFs, URLs), utilizes advanced NLP and Large Language Models to extract specific obligations, and compiles them into a structured, enforceable **Policy AST (Abstract Syntax Tree)**. 

> *"Stop reading PDFs. Start querying policies. We turn the law into an API so your engineering team can build compliant software by default."*

## Architecture

### System Flow
```mermaid
flowchart TD
    A[Official Regulations] --> B[Document Ingestion]
    B --> C[OCR/Text Extraction]
    C --> D[Legal NLP Pipeline]
    D --> E[Requirement Extraction]
    E --> F[Knowledge Graph]
    F --> G[Rule Compiler]
    G --> H[Policy AST]
    H --> I[Validation Engine]
    I --> J[(Policy Database)]
    J --> K[Developer API]
    K --> L[Enterprise Integrations]
```

### Layered Architecture
```mermaid
flowchart TB
    subgraph Client [Client Layer]
        UI[SvelteKit Web App]
    end

    subgraph API [API Layer]
        FastAPI[FastAPI Gateway]
    end

    subgraph Background [Background Workers]
        Celery[Celery Task Queue]
    end

    subgraph Data [Data Layer]
        PG[(PostgreSQL + pgvector)]
        Redis[(Redis Cache/Broker)]
    end

    subgraph External [External Services]
        LLM[Google Gemini LLM]
    end

    UI -- "Upload PDF" --> FastAPI
    FastAPI -- "Enqueue Job" --> Redis
    Redis -- "Consume" --> Celery
    Celery -- "Extract Policies" --> LLM
    Celery -- "Store Embeddings/Rules" --> PG
```

### Data Model ER Diagram
```mermaid
erDiagram
    organizations ||--o{ users : "has"
    organizations ||--o{ regulations : "manages"
    regulations ||--o{ regulation_versions : "has"
    regulation_versions ||--o{ source_documents : "derived from"
    source_documents ||--o{ document_sections : "contains"
    document_sections ||--o{ requirements : "generates"
    requirements ||--o{ policies : "mapped to"
    requirements ||--o{ requirement_embeddings : "vectorizes"
    policies ||--o{ compliance_checks : "validates"
    system_mappings }|--|| requirements : "links to"
```

**How a document flows:**
1. A user uploads a regulation via the **Client Layer** (`source_documents`).
2. The **API Layer** enqueues a parsing job to the **Background Workers**.
3. PyMuPDF extracts `document_sections`. The **LLM** extracts `requirements`.
4. The system compiles `policies` and generates `requirement_embeddings`.
5. Developers hit the API to run `compliance_checks` against their system configurations.

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | SvelteKit, TypeScript, TailwindCSS, shadcn-svelte, Threlte/Three.js* |
| **Backend** | Python, FastAPI, Pydantic |
| **Database** | PostgreSQL, pgvector (Semantic Search), SQLAlchemy, Alembic |
| **Workers** | Celery, Redis |
| **AI / NLP** | Google Gemini (via SDK), PyMuPDF |
| **Hosting** | Vercel (Frontend), Docker/Railway (Backend) |
| **Observability** | Sentry, Python JSON Logger |

*\*Note: The originally drafted Next.js stack was replaced with SvelteKit + Threlte to achieve higher performance 3D rendering natively inside Svelte components.*

### Deployment Tiers

| Component | Free Tier Path | Self-Hosted / Paid Path |
| :--- | :--- | :--- |
| **Database** | Supabase Free (PG15 + pgvector) | AWS RDS PostgreSQL |
| **Redis** | Upstash Free Tier | ElastiCache / Redis Enterprise |
| **Hosting (API)** | Render / Railway Free Tier | AWS ECS / Fargate |
| **Hosting (Web)** | Vercel Hobby | Vercel Pro / Self-hosted Node |
| **LLM Provider** | Gemini API (Free Tier) | Gemini Advanced / Anthropic |

## Features

### MVP Scope (Phase 1)
- [x] **Project Scaffolding**: Monorepo setup with SvelteKit & FastAPI.
- [x] **Database & ORM**: PostgreSQL schemas, Alembic migrations, pgvector setup.
- [x] **Authentication**: NextAuth/Clerk integration with JWT validation.
- [x] **Document Upload**: S3-compatible presigned uploads for PDFs.
- [x] **Parsing Pipeline**: Synchronous text extraction using PyMuPDF.
- [x] **NLP Extraction**: Basic chunking and LLM-driven requirement isolation.
- [x] **Semantic Search**: Vector indexing of requirements for "similar rules" lookups.
- [x] **API Endpoints**: CRUD endpoints for regulations and requirements.
- [x] **Dashboard UI**: Basic SvelteKit dashboard for viewing processed text.
- [x] **Compliance Checker**: Simple POST endpoint to validate JSON payloads against rules.

### Roadmap Features (Phase 2+)
- [x] **Async Workers**: Moved heavy NLP pipelines into Celery.
- [x] **Webhooks**: Event-driven architecture for rule updates.
- [x] **Observability**: Sentry and correlation IDs.
- [x] **3D Premium UI**: Scroll-driven Threlte data-pipeline visualization.
- [x] **CI/CD**: Fully automated Vercel & Docker GHCR deployments.

## Data Model

The compiler outputs highly structured JSON designed to be programmatically validated by software systems.

```json
{
  "rule_id": "REQ-104",
  "source_text": "Personal data cannot be retained longer than necessary.",
  "category": "Data Retention",
  "severity": "HIGH",
  "policy_ast": {
    "condition": "MAX_RETENTION",
    "operator": "LESS_THAN_OR_EQUAL",
    "value": 30,
    "unit": "DAYS"
  }
}
```

<details>
<summary><b>Click to expand full Database Schema</b></summary>

- `organizations`: Tenant isolation.
- `users`: Clerk-synced profiles.
- `regulations`: High-level policies (e.g., GDPR).
- `regulation_versions`: Immutable version snapshots.
- `document_sections`: Chunked PDF text.
- `requirements`: LLM-extracted legal obligations.
- `requirement_embeddings`: `pgvector` arrays.
- `compliance_checks`: Audit logs of validation runs.
- `webhooks`: Outbound event destinations.

</details>

## API Reference

The Developer API exposes the compiled rules engine.

| Method | Path | Auth | Purpose |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/regulations/upload` | Yes | Upload raw regulatory documents. |
| `GET` | `/api/v1/regulations/{id}` | Yes | Fetch regulation details. |
| `GET` | `/api/v1/regulations/{id}/requirements` | Yes | List extracted requirements. |
| `GET` | `/api/v1/regulations/{id}/diff` | Yes | Compare two regulation versions. |
| `POST` | `/api/v1/check-compliance` | Yes | Validate a JSON payload against rules. |
| `GET` | `/api/v1/reports` | Yes | Generate compliance impact reports. |
| `POST` | `/api/v1/webhooks` | Yes | Register endpoints for rule-change events. |

### Quickstart cURL

**Get Policy Requirements:**
```bash
curl -X GET "https://api.antigravity-rac.com/api/v1/regulations/reg_123/requirements" \
  -H "Authorization: Bearer <YOUR_API_KEY>"
```

**Validate a System Configuration:**
```bash
curl -X POST "https://api.antigravity-rac.com/api/v1/check-compliance" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "Content-Type: application/json" \
  -d '{
    "regulation_id": "reg_123",
    "payload": {
      "encryption": "AES-256",
      "retention_days": 15
    }
  }'
```
```json
{
  "status": "PASS",
  "violations": []
}
```

## Getting Started

### Prerequisites
- Node.js 20+
- Python 3.12+
- Docker & Docker Compose

### 1. Clone & Infrastructure
```bash
git clone https://github.com/raghul-cyber/regulation-compiler.git
cd regulation-compiler

# Start Postgres (with pgvector) and Redis
cd infra
docker-compose up -d
```

### 2. Backend Setup
```bash
cd ../apps/api
python -m venv .venv
# Windows: .venv\Scripts\activate | Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt

# Run migrations to initialize the database
alembic upgrade head

# Start the API server
uvicorn app.main:app --host 127.0.0.1 --port 8080 --reload
```

### 3. Frontend Setup
```bash
cd ../../apps/web
npm install
npm run dev -- --port 3000
```

### 4. Environment Variables
Create `.env` files based on `.env.example`. Required keys:
- `DATABASE_URL`: `postgresql+asyncpg://postgres:postgres@localhost:5432/rac_dev`
- `REDIS_URL`: `redis://localhost:6379/0`
- `GEMINI_API_KEY`: Your Google Gemini API Key
- `PUBLIC_API_URL`: `http://localhost:8080`
- `CLERK_SECRET_KEY` & `PUBLIC_CLERK_PUBLISHABLE_KEY`: From your Clerk dashboard.

## Project Structure

```text
regulation-compiler/
├── apps/
│   ├── api/                 # FastAPI Backend & Celery Workers
│   │   ├── alembic/         # Database migrations
│   │   ├── app/             # Application source (routers, services, pipelines)
│   │   └── requirements.txt
│   └── web/                 # SvelteKit Frontend
│       ├── src/
│       │   ├── lib/         # Reusable Svelte components (Threlte scenes)
│       │   └── routes/      # File-based routing
│       └── vite.config.ts
├── infra/                   # Docker & Deployment configuration
│   ├── docker-compose.yml   
│   ├── Dockerfile.api
│   └── Dockerfile.worker
├── packages/
│   └── shared/              # Shared types/schemas (Future expansion)
├── .github/
│   └── workflows/           # CI/CD Pipelines
└── README.md
```

## Roadmap

```mermaid
gantt
    title Regulation-as-Code Evolution
    dateFormat  YYYY-MM-DD
    section MVP
    Phase 1 (Data & UI) :done, 2026-07-01, 30d
    section Advanced
    Phase 2 (Async Pipelines) :done, 2026-08-01, 15d
    Phase 3 (Webhooks & Search) :done, 2026-08-15, 15d
    section Production
    Phase 4 (Observability) :active, 2026-09-01, 10d
    Phase 5 (Autonomous Agents) :2026-09-10, 30d
```

## Security & Compliance Posture

- **Row-Level Security (RLS)**: PostgreSQL RLS policies guarantee strict multi-tenant data isolation by `organization_id` at the database layer.
- **Encryption**: Enforced TLS in transit. Sensitive fields are hashed or encrypted at rest.
- **Audit Logging**: Every mutating action (`POST`, `PATCH`, `DELETE`) is immutably written to an `audit_logs` table.
- **Dependency Scanning**: Integrated Dependabot CI for continuous vulnerability scanning.
- **Zero-Downtime**: Expand/Contract migration patterns ensure backward compatibility during deployments.

## Contributing

We welcome contributions! Please follow the standard flow:
1. Fork the repository.
2. Create your feature branch (`git checkout -b feature/AmazingFeature`).
3. Commit your changes.
4. Ensure the CI pipeline passes (Lint → Type-Check → Unit Tests → Build).
5. Open a Pull Request.

*(Note: We will be adding a full `CONTRIBUTING.md` shortly).*

## License

This project is licensed under the **MIT License**.

<img src="https://capsule-render.vercel.app/api?type=waving&color=0f1115&height=120&section=footer" width="100%" />

<div align="center">
  <sub>Built by <a href="https://github.com/raghul-cyber">AhixLight / Raghul RC</a></sub>
</div>
