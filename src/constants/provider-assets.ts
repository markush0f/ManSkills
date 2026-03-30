export type ProviderAsset = {
  assetPath: string;
  label: string;
  slug: string;
  aliases: string[];
};

export type FolderAsset = {
  assetPath: string;
  label: string;
  slug: string;
  aliases: string[];
};

export const SPECIAL_FOLDER_ASSETS: FolderAsset[] = [
  {
    assetPath: "/robot.svg",
    label: "Agents",
    slug: "agents",
    aliases: ["agent", "agents"],
  },
];

export const PROVIDER_ASSETS: ProviderAsset[] = [
  {
    assetPath: "/providers/claude.svg",
    label: "Claude",
    slug: "claude",
    aliases: ["anthropic", "claude", "claude-code", "claude-desktop"],
  },
  {
    assetPath: "/providers/codex.svg",
    label: "Codex",
    slug: "codex",
    aliases: ["chatgpt", "codex", "gpt", "openai", "oai"],
  },
  {
    assetPath: "/providers/gemini.svg",
    label: "Gemini",
    slug: "gemini",
    aliases: [
      "gemini",
      "google",
      "google-ai",
      "google-ai-studio",
      "google-generative-ai",
      "google-genai",
      "vertex",
      "vertex-ai",
    ],
  },
  {
    assetPath: "/providers/azure-openai.svg",
    label: "Azure OpenAI",
    slug: "azure-openai",
    aliases: ["azure", "azure-ai", "azure-openai", "azureai"],
  },
  {
    assetPath: "/providers/bedrock.svg",
    label: "Amazon Bedrock",
    slug: "bedrock",
    aliases: ["amazon", "aws", "bedrock"],
  },
  {
    assetPath: "/providers/cohere.svg",
    label: "Cohere",
    slug: "cohere",
    aliases: ["cohere"],
  },
  {
    assetPath: "/providers/cursor.svg",
    label: "Cursor",
    slug: "cursor",
    aliases: ["cursor"],
  },
  {
    assetPath: "/providers/deepseek.svg",
    label: "DeepSeek",
    slug: "deepseek",
    aliases: ["deepseek"],
  },
  {
    assetPath: "/providers/fireworks.svg",
    label: "Fireworks",
    slug: "fireworks",
    aliases: ["fireworks", "fireworks-ai"],
  },
  {
    assetPath: "/providers/groq.svg",
    label: "Groq",
    slug: "groq",
    aliases: ["groq"],
  },
  {
    assetPath: "/providers/huggingface.svg",
    label: "Hugging Face",
    slug: "huggingface",
    aliases: ["hf", "huggingface"],
  },
  {
    assetPath: "/providers/ollama.svg",
    label: "Ollama",
    slug: "ollama",
    aliases: ["ollama"],
  },
  {
    assetPath: "/providers/openrouter.svg",
    label: "OpenRouter",
    slug: "openrouter",
    aliases: ["openrouter"],
  },
  {
    assetPath: "/providers/perplexity.svg",
    label: "Perplexity",
    slug: "perplexity",
    aliases: ["perplexity"],
  },
  {
    assetPath: "/providers/meta.svg",
    label: "Meta",
    slug: "meta",
    aliases: ["llama", "meta"],
  },
  {
    assetPath: "/providers/mistral.svg",
    label: "Mistral",
    slug: "mistral",
    aliases: ["mistral", "mistralai"],
  },
  {
    assetPath: "/providers/moonshot.svg",
    label: "Moonshot",
    slug: "moonshot",
    aliases: ["kimi", "moonshot"],
  },
  {
    assetPath: "/providers/nvidia.svg",
    label: "NVIDIA",
    slug: "nvidia",
    aliases: ["nim", "nvidia"],
  },
  {
    assetPath: "/providers/qwen.svg",
    label: "Qwen",
    slug: "qwen",
    aliases: ["alibaba", "alibabacloud", "dashscope", "qwen"],
  },
  {
    assetPath: "/providers/replicate.svg",
    label: "Replicate",
    slug: "replicate",
    aliases: ["replicate"],
  },
  {
    assetPath: "/providers/sambanova.svg",
    label: "SambaNova",
    slug: "sambanova",
    aliases: ["sambanova"],
  },
  {
    assetPath: "/providers/together.svg",
    label: "Together AI",
    slug: "together",
    aliases: ["together", "together-ai"],
  },
  {
    assetPath: "/providers/xai.svg",
    label: "xAI",
    slug: "xai",
    aliases: ["grok", "xai"],
  },
  {
    assetPath: "/providers/ai21.svg",
    label: "AI21",
    slug: "ai21",
    aliases: ["ai21"],
  },
  {
    assetPath: "/providers/anyscale.svg",
    label: "Anyscale",
    slug: "anyscale",
    aliases: ["anyscale"],
  },
  {
    assetPath: "/providers/cerebras.svg",
    label: "Cerebras",
    slug: "cerebras",
    aliases: ["cerebras"],
  },
  {
    assetPath: "/providers/lepton.svg",
    label: "Lepton",
    slug: "lepton",
    aliases: ["lepton", "lepton-ai"],
  },
  {
    assetPath: "/providers/lmstudio.svg",
    label: "LM Studio",
    slug: "lmstudio",
    aliases: ["lm-studio", "lmstudio"],
  },
  {
    assetPath: "/providers/novita.svg",
    label: "Novita",
    slug: "novita",
    aliases: ["novita"],
  },
  {
    assetPath: "/providers/voyage.svg",
    label: "Voyage",
    slug: "voyage",
    aliases: ["voyage", "voyage-ai", "voyageai"],
  },
];

function normalizeProviderSegment(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/^[./\\]+/, "")
    .replace(/[_\s]+/g, "-");
}

function matchesProviderAlias(segment: string, alias: string) {
  return (
    segment === alias ||
    segment.startsWith(`${alias}-`) ||
    segment.endsWith(`-${alias}`)
  );
}

function findMatchingAsset<T extends { aliases: string[] }>(assets: T[], name?: string, path?: string) {
  const segment = normalizeProviderSegment(name ?? path ?? "");

  if (!segment) {
    return null;
  }

  for (const asset of assets) {
    if (asset.aliases.some((alias) => matchesProviderAlias(segment, alias))) {
      return asset;
    }
  }

  return null;
}

export function findSpecialFolderAsset(name?: string, path?: string) {
  return findMatchingAsset(SPECIAL_FOLDER_ASSETS, name, path);
}

export function findProviderAsset(name?: string, path?: string) {
  return findMatchingAsset(PROVIDER_ASSETS, name, path);
}
