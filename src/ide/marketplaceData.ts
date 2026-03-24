import type { MarketplaceSkill } from "../types";

type SkillSeed = {
  id: string;
  slug: string;
  name: string;
  category: string;
  summary: string;
  author: string;
  downloads: string;
  rating: string;
  focus: string[];
  workflow: string[];
};

function createMarketplaceSkill(seed: SkillSeed): MarketplaceSkill {
  return {
    id: seed.id,
    slug: seed.slug,
    name: seed.name,
    category: seed.category,
    summary: seed.summary,
    author: seed.author,
    downloads: seed.downloads,
    rating: seed.rating,
    files: [
      {
        idSuffix: "skill",
        path: "SKILL.md",
        language: "md",
        content: `# ${seed.name}

## Purpose
${seed.summary}

## Focus
${seed.focus.map((item) => `- ${item}`).join("\n")}

## Workflow
${seed.workflow.map((item, index) => `${index + 1}. ${item}`).join("\n")}
`,
      },
      {
        idSuffix: "prompt",
        path: "prompt.md",
        language: "md",
        content: `# ${seed.name} Prompt

## Required input
- task context
- target output
- constraints

## Review points
${seed.focus.map((item) => `- ${item}`).join("\n")}
`,
      },
      {
        idSuffix: "config",
        path: "config.json",
        language: "json",
        content: `{
  "name": "${seed.slug}",
  "category": "${seed.category.toLowerCase().split(" ").join("-")}",
  "owner": "${seed.author}",
  "rating": ${seed.rating},
  "focus": ${JSON.stringify(seed.focus)}
}
`,
      },
    ],
  };
}

export const marketplaceSkills: MarketplaceSkill[] = [
  createMarketplaceSkill({
    id: "prompt-optimizer",
    slug: "prompt-optimizer",
    name: "Prompt Optimizer",
    category: "Prompt Engineering",
    summary: "Analiza prompts y los reescribe con mejor estructura, restricciones y formato de salida.",
    author: "Open Skill Lab",
    downloads: "18.4k",
    rating: "4.9",
    focus: ["Reducir ambiguedad", "Agregar constraints", "Mejorar formato final"],
    workflow: ["Inspeccionar el prompt actual", "Detectar huecos de contexto", "Entregar una version optimizada"],
  }),
  createMarketplaceSkill({
    id: "rag-auditor",
    slug: "rag-auditor",
    name: "RAG Auditor",
    category: "Evaluation",
    summary: "Revisa pipelines RAG para medir grounding, calidad de retrieval y cobertura de evidencia.",
    author: "Vector Forge",
    downloads: "9.7k",
    rating: "4.8",
    focus: ["Retrieval relevante", "Citas suficientes", "Claims soportados"],
    workflow: ["Revisar consulta", "Validar fuentes recuperadas", "Puntuar calidad de respuesta"],
  }),
  createMarketplaceSkill({
    id: "workflow-router",
    slug: "workflow-router",
    name: "Workflow Router",
    category: "Automation",
    summary: "Decide qué skill o agente conviene ejecutar según complejidad, riesgo y herramientas necesarias.",
    author: "Agent Harbor",
    downloads: "12.1k",
    rating: "4.7",
    focus: ["Clasificacion de tareas", "Enrutado a skills", "Fallback seguro"],
    workflow: ["Clasificar la tarea", "Asignar skill principal", "Escalar a orquestacion si hace falta"],
  }),
  createMarketplaceSkill({
    id: "tool-contract-writer",
    slug: "tool-contract-writer",
    name: "Tool Contract Writer",
    category: "Tooling",
    summary: "Define contratos claros para herramientas, inputs, outputs y errores esperados.",
    author: "Protocol Works",
    downloads: "6.3k",
    rating: "4.6",
    focus: ["Schemas robustos", "Errores tipados", "Documentacion de herramientas"],
    workflow: ["Extraer capacidades", "Definir contrato", "Validar casos borde"],
  }),
  createMarketplaceSkill({
    id: "eval-runner",
    slug: "eval-runner",
    name: "Eval Runner",
    category: "Evaluation",
    summary: "Ejecuta baterias de evaluacion para comparar prompts, agentes y configuraciones.",
    author: "Bench Studio",
    downloads: "14.2k",
    rating: "4.8",
    focus: ["Benchmarks rapidos", "Comparacion entre variantes", "Resumir resultados"],
    workflow: ["Preparar dataset", "Lanzar evaluaciones", "Resumir diferencias clave"],
  }),
  createMarketplaceSkill({
    id: "support-triage",
    slug: "support-triage",
    name: "Support Triage",
    category: "Operations",
    summary: "Clasifica tickets, detecta urgencia y propone respuesta inicial para soporte asistido por IA.",
    author: "Ops Grid",
    downloads: "8.9k",
    rating: "4.5",
    focus: ["Priorizar incidencias", "Extraer contexto", "Sugerir siguiente accion"],
    workflow: ["Leer ticket", "Asignar prioridad", "Proponer respuesta inicial"],
  }),
  createMarketplaceSkill({
    id: "meeting-synthesizer",
    slug: "meeting-synthesizer",
    name: "Meeting Synthesizer",
    category: "Productivity",
    summary: "Convierte notas o transcripciones en resumen ejecutivo, tareas y decisiones.",
    author: "Signal Office",
    downloads: "11.5k",
    rating: "4.7",
    focus: ["Resumen ejecutivo", "Action items", "Decisiones capturadas"],
    workflow: ["Procesar notas", "Agrupar temas", "Emitir resumen estructurado"],
  }),
  createMarketplaceSkill({
    id: "sql-analyst",
    slug: "sql-analyst",
    name: "SQL Analyst",
    category: "Data",
    summary: "Ayuda a traducir preguntas de negocio en consultas SQL y revisa riesgos de rendimiento.",
    author: "Warehouse Guild",
    downloads: "16.8k",
    rating: "4.8",
    focus: ["Consultas claras", "Riesgo de joins", "Validacion de metricas"],
    workflow: ["Entender la pregunta", "Proponer consulta", "Revisar performance y exactitud"],
  }),
  createMarketplaceSkill({
    id: "docs-translator",
    slug: "docs-translator",
    name: "Docs Translator",
    category: "Documentation",
    summary: "Traduce documentacion tecnica manteniendo tono, estructura y terminos del dominio.",
    author: "Docs Relay",
    downloads: "7.8k",
    rating: "4.4",
    focus: ["Terminologia consistente", "Formato preservado", "Notas de ambiguedad"],
    workflow: ["Analizar el texto", "Traducir por bloques", "Marcar terminos sensibles"],
  }),
  createMarketplaceSkill({
    id: "ui-critic",
    slug: "ui-critic",
    name: "UI Critic",
    category: "Design",
    summary: "Evalua interfaces con foco en jerarquia visual, claridad y riesgo de UX.",
    author: "Canvas Review",
    downloads: "10.4k",
    rating: "4.6",
    focus: ["Jerarquia visual", "Problemas de UX", "Recomendaciones concretas"],
    workflow: ["Leer interfaz", "Detectar fricciones", "Emitir hallazgos priorizados"],
  }),
  createMarketplaceSkill({
    id: "compliance-checker",
    slug: "compliance-checker",
    name: "Compliance Checker",
    category: "Governance",
    summary: "Revisa salidas de agentes frente a politicas internas, tono y restricciones operativas.",
    author: "Policy Layer",
    downloads: "5.9k",
    rating: "4.5",
    focus: ["Reglas internas", "Restricciones de salida", "Escalado humano"],
    workflow: ["Leer politica", "Comparar salida", "Marcar incumplimientos"],
  }),
  createMarketplaceSkill({
    id: "incident-commander",
    slug: "incident-commander",
    name: "Incident Commander",
    category: "Operations",
    summary: "Organiza incidentes, timeline, impacto y comunicaciones durante una respuesta operativa.",
    author: "Red Signal",
    downloads: "13.3k",
    rating: "4.7",
    focus: ["Timeline del incidente", "Impacto", "Comunicacion clara"],
    workflow: ["Recopilar hechos", "Construir timeline", "Coordinar actualizaciones"],
  }),
  createMarketplaceSkill({
    id: "migration-planner",
    slug: "migration-planner",
    name: "Migration Planner",
    category: "Architecture",
    summary: "Define pasos, riesgos y checkpoints para migraciones tecnicas de bajo y alto impacto.",
    author: "Infra Path",
    downloads: "8.1k",
    rating: "4.6",
    focus: ["Riesgos de migracion", "Secuencia de rollout", "Rollback plan"],
    workflow: ["Mapear sistema actual", "Proponer fases", "Definir rollback"],
  }),
  createMarketplaceSkill({
    id: "data-extractor",
    slug: "data-extractor",
    name: "Data Extractor",
    category: "Data",
    summary: "Extrae entidades, campos y estructuras desde texto libre para convertirlas en datos utilizables.",
    author: "Struct AI",
    downloads: "15.0k",
    rating: "4.7",
    focus: ["Extraccion de entidades", "Normalizacion", "Salida estructurada"],
    workflow: ["Leer input", "Identificar campos", "Emitir estructura final"],
  }),
  createMarketplaceSkill({
    id: "release-notes-generator",
    slug: "release-notes-generator",
    name: "Release Notes Generator",
    category: "Documentation",
    summary: "Genera release notes legibles a partir de cambios tecnicos, fixes y mejoras de producto.",
    author: "Ship Log",
    downloads: "9.2k",
    rating: "4.6",
    focus: ["Cambios visibles", "Fixes agrupados", "Tono consistente"],
    workflow: ["Leer cambios", "Agrupar por impacto", "Redactar release notes"],
  }),
];
