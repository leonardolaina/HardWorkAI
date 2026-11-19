export type ReasoningMode = 'fast' | 'balanced' | 'deep';

export type ResponseStyle = 'normal' | 'concise' | 'explanatory' | 'formal';

export interface Attachment {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  kind: 'image' | 'text';
  /** Base64 data (without data: prefix) for images, or raw UTF-8 text for text/code files */
  content: string;
  /** Optional data URL for previewing images in the UI */
  previewUrl?: string;
}

export interface GroundingSource {
  title: string;
  uri: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
  sources?: GroundingSource[];
  modelLabel?: string;
  routingReason?: string;
  createdAt: number;
  error?: string;
}

export interface Conversation {
  id: string;
  title: string;
  pinned?: boolean;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
}

export interface ArtifactData {
  id: string;
  title: string;
  language: string;
  code: string;
  previewable: boolean;
}

export const REASONING_MODES: Array<{
  id: ReasoningMode;
  label: string;
  description: string;
}> = [
  {
    id: 'fast',
    label: 'HardWorkAI Rápido',
    description: 'Respostas diretas para tarefas ágeis do dia a dia',
  },
  {
    id: 'balanced',
    label: 'HardWorkAI Equilibrado',
    description: 'Equilíbrio entre clareza, profundidade e velocidade',
  },
  {
    id: 'deep',
    label: 'HardWorkAI Profundo',
    description: 'Raciocínio estendido para código, análise e escrita complexa',
  },
];

export interface AiModelChoice {
  id: string;
  source: 'auto' | 'builtin' | 'gateway';
  providerId: string;
  providerName: string;
  modelId: string;
  label: string;
  shortLabel: string;
  description: string;
  reasoningMode?: ReasoningMode;
}

export const AUTO_ALL_AI_MODEL: AiModelChoice = {
  id: 'auto:all',
  source: 'auto',
  providerId: 'auto-all',
  providerName: 'Automático',
  modelId: 'auto-all',
  label: 'Automático · Todas as IAs',
  shortLabel: 'Auto (Todas)',
  description: 'Escolhe automaticamente entre HardWorkAI e seus provedores do Gateway',
};

export const BUILTIN_AI_MODELS: AiModelChoice[] = [
  {
    id: 'auto:builtin',
    source: 'auto',
    providerId: 'auto-builtin',
    providerName: 'Automático',
    modelId: 'auto-builtin',
    label: 'Automático (Inteligente)',
    shortLabel: 'Automático',
    description: 'Escolhe o melhor modelo automaticamente conforme sua pergunta',
  },
  {
    id: 'builtin:balanced',
    source: 'builtin',
    providerId: 'hardwork-builtin',
    providerName: 'HardWorkAI',
    modelId: 'gemini-4-hydrogen',
    label: 'HardWorkAI 4 · Equilibrado',
    shortLabel: 'Equilibrado',
    description: 'Equilíbrio entre clareza, profundidade e velocidade',
    reasoningMode: 'balanced',
  },
  {
    id: 'builtin:deep',
    source: 'builtin',
    providerId: 'hardwork-builtin',
    providerName: 'HardWorkAI',
    modelId: 'gemini-4-hydrogen',
    label: 'HardWorkAI 4 · Profundo',
    shortLabel: 'Profundo',
    description: 'Raciocínio estendido para código, análise e tarefas complexas',
    reasoningMode: 'deep',
  },
  {
    id: 'builtin:fast',
    source: 'builtin',
    providerId: 'hardwork-builtin',
    providerName: 'HardWorkAI',
    modelId: 'gemini-4-hydrogen',
    label: 'HardWorkAI 4 · Rápido',
    shortLabel: 'Rápido',
    description: 'Respostas diretas e ágeis para o dia a dia',
    reasoningMode: 'fast',
  },
  {
    id: 'builtin:lite',
    source: 'builtin',
    providerId: 'hardwork-builtin',
    providerName: 'HardWorkAI',
    modelId: 'gemini-3.1-flash-lite',
    label: 'HardWorkAI Lite · Veloz',
    shortLabel: 'Lite Veloz',
    description: 'Modelo leve de alta velocidade e baixa latência',
    reasoningMode: 'fast',
  },
];

export const RESPONSE_STYLES: Array<{
  id: ResponseStyle;
  label: string;
  description: string;
}> = [
  {
    id: 'normal',
    label: 'Natural',
    description: 'Tom claro, humano e equilibrado',
  },
  {
    id: 'concise',
    label: 'Conciso',
    description: 'Direto ao ponto, sem rodeios',
  },
  {
    id: 'explanatory',
    label: 'Explicativo',
    description: 'Didático, com exemplos e passo a passo',
  },
  {
    id: 'formal',
    label: 'Formal',
    description: 'Profissional e estruturado para trabalho',
  },
];

export type ActiveSection = 'chat' | 'plugins' | 'mcp' | 'gateway';

export interface PluginItem {
  id: string;
  name: string;
  category: string;
  description: string;
  instruction: string;
  enabled: boolean;
  custom?: boolean;
}

export type McpTransport = 'streamable-http' | 'sse' | 'stdio';

export interface McpConnector {
  id: string;
  name: string;
  endpoint: string;
  transport: McpTransport;
  authType: 'none' | 'bearer' | 'oauth';
  description: string;
  toolsCount: number;
  connected: boolean;
}

export interface GatewayRoute {
  id: string;
  name: string;
  mode: ReasoningMode;
  targetLabel: string;
  priority: number;
  timeoutMs: number;
  enabled: boolean;
  custom?: boolean;
}

export interface GatewaySettings {
  autoFallback: boolean;
  injectActivePlugins: boolean;
  defaultWebSearch: boolean;
}

