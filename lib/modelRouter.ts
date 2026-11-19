import type { Attachment, ReasoningMode } from './types';

export interface RouterMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
}

export interface GatewayCandidate {
  providerId: string;
  providerName: string;
  modelId: string;
  apiKey: string;
}

export interface RoutedModelDecision {
  source: 'builtin' | 'gateway';
  providerId: string;
  modelId: string;
  apiKey?: string;
  reasoningMode: ReasoningMode;
  modelLabel: string;
  reason: string;
}

type TaskIntent = 'code' | 'deep_analysis' | 'vision_web' | 'quick' | 'balanced';

const CODE_REGEX =
  /```|\b(código|codigo|programar|função|funcao|componente|typescript|javascript|python|react|next\.?js|sql|postgres|firestore|api|endpoint|bug|erro|stack\s*trace|refator|algoritmo|regex|docker|css|tailwind|html|svg|dashboard|interface|aplicativo|script|json|webhook|mcp)\b/i;

const DEEP_ANALYSIS_REGEX =
  /\b(arquitetura|estratégia|estrategia|auditoria|segurança|seguranca|vulnerabilidade|compare|comparação|comparacao|prós e contras|pros e contras|plano completo|plano de ação|plano de acao|relatório|relatorio|análise|analise|profund|detalhad|passo a passo|matemática|matematica|equação|equacao|cálculo|calculo|prova|contrato|jurídic|juridic|financeir|diagnóstico|diagnostico|otimiz)\b/i;

const QUICK_REGEX =
  /^(oi|olá|ola|bom dia|boa tarde|boa noite|tudo bem|valeu|obrigad[oa]|o que é|o que e|quem é|quem e|qual é|qual e|como dizer|traduza|traduzir|sinônimo|sinonimo|defina|resuma em \d|quanto é|quanto e|data de|hora)\b/i;

const CODE_FILE_EXT_REGEX = /\.(ts|tsx|js|jsx|py|sql|json|html|css|yml|yaml|xml|sh|go|rs|java|cs|cpp|c)$/i;

function classifyIntent(
  messages: RouterMessage[],
  webSearch: boolean
): { intent: TaskIntent; reason: string } {
  const lastUser = [...messages].reverse().find((m) => m.role === 'user');
  const text = (lastUser?.content || '').trim();
  const attachments = lastUser?.attachments ?? [];

  const hasImage = attachments.some((a) => a.kind === 'image');
  const hasCodeFile = attachments.some(
    (a) => a.kind === 'text' && CODE_FILE_EXT_REGEX.test(a.name)
  );
  const totalAttachedChars = attachments.reduce(
    (acc, a) => acc + (a.kind === 'text' ? a.content.length : 0),
    0
  );

  if (hasImage || webSearch) {
    return {
      intent: 'vision_web',
      reason: hasImage
        ? 'Análise visual de imagem'
        : 'Pesquisa na web em tempo real',
    };
  }

  if (hasCodeFile || CODE_REGEX.test(text)) {
    return {
      intent: 'code',
      reason: 'Código, engenharia ou interface',
    };
  }

  if (
    text.length >= 500 ||
    totalAttachedChars >= 3000 ||
    DEEP_ANALYSIS_REGEX.test(text)
  ) {
    return {
      intent: 'deep_analysis',
      reason: 'Análise e raciocínio aprofundado',
    };
  }

  if (
    text.length > 0 &&
    text.length <= 115 &&
    attachments.length === 0 &&
    (QUICK_REGEX.test(text) || text.split(/\s+/).length <= 12)
  ) {
    return {
      intent: 'quick',
      reason: 'Pergunta rápida e direta',
    };
  }

  return {
    intent: 'balanced',
    reason: 'Uso geral e redação equilibrada',
  };
}

const DIRECT_SUPPORTED_GATEWAYS = new Set([
  'openrouter',
  'openai',
  'anthropic',
  'deepseek',
  'mistral',
  'google',
]);

function pickGatewayCandidate(
  intent: TaskIntent,
  candidates: GatewayCandidate[]
): GatewayCandidate | null {
  const supported = candidates.filter(
    (c) => DIRECT_SUPPORTED_GATEWAYS.has(c.providerId) && c.apiKey.trim().length > 0
  );
  if (supported.length === 0) return null;

  const findByPattern = (patterns: RegExp[]) => {
    for (const pattern of patterns) {
      const match = supported.find(
        (c) => pattern.test(c.modelId) || pattern.test(`${c.providerId}:${c.modelId}`)
      );
      if (match) return match;
    }
    return null;
  };

  if (intent === 'code') {
    return (
      findByPattern([
        /claude-sonnet|claude-opus|claude-3-7/i,
        /codestral|deepseek-reasoner|o3|gpt-4\.1(?!-mini)/i,
        /gemini-2\.5-pro|deepseek-chat/i,
      ]) ?? supported[0]
    );
  }

  if (intent === 'deep_analysis') {
    return (
      findByPattern([
        /o3|deepseek-reasoner|deepseek-r1|claude-opus|claude-sonnet/i,
        /gemini-2\.5-pro|gpt-4\.1(?!-mini)|mistral-large/i,
      ]) ?? supported[0]
    );
  }

  if (intent === 'quick') {
    return (
      findByPattern([
        /flash-lite|haiku|mini|ministral|flash/i,
        /deepseek-chat|gpt-4o/i,
      ]) ?? supported[0]
    );
  }

  return (
    findByPattern([
      /claude-sonnet|gpt-4\.1|gpt-4o|gemini-2\.5-flash|mistral-large|deepseek-chat/i,
    ]) ?? supported[0]
  );
}

export function routeRequestModel(params: {
  messages: RouterMessage[];
  webSearch: boolean;
  includeGateway: boolean;
  gatewayCandidates?: GatewayCandidate[];
}): RoutedModelDecision {
  const { messages, webSearch, includeGateway, gatewayCandidates = [] } = params;
  const { intent, reason } = classifyIntent(messages, webSearch);

  // If user opted into Auto across Gateway providers (and not requiring Gemini web search grounding)
  if (includeGateway && !webSearch && gatewayCandidates.length > 0) {
    const picked = pickGatewayCandidate(intent, gatewayCandidates);
    if (picked) {
      const cleanShort = picked.modelId.includes('/')
        ? picked.modelId.split('/').pop() || picked.modelId
        : picked.modelId;
      return {
        source: 'gateway',
        providerId: picked.providerId,
        modelId: picked.modelId,
        apiKey: picked.apiKey,
        reasoningMode:
          intent === 'code' || intent === 'deep_analysis'
            ? 'deep'
            : intent === 'quick'
              ? 'fast'
              : 'balanced',
        modelLabel: `Automático → ${picked.providerName} · ${cleanShort}`,
        reason,
      };
    }
  }

  // Built-in HardWorkAI smart routing
  if (intent === 'code' || intent === 'deep_analysis') {
    return {
      source: 'builtin',
      providerId: 'hardwork-builtin',
      modelId: 'gemini-4-hydrogen',
      reasoningMode: 'deep',
      modelLabel: 'Automático → HardWorkAI 4 · Profundo',
      reason,
    };
  }

  if (intent === 'quick') {
    return {
      source: 'builtin',
      providerId: 'hardwork-builtin',
      modelId: 'gemini-3.1-flash-lite',
      reasoningMode: 'fast',
      modelLabel: 'Automático → HardWorkAI Lite · Veloz',
      reason,
    };
  }

  return {
    source: 'builtin',
    providerId: 'hardwork-builtin',
    modelId: 'gemini-4-hydrogen',
    reasoningMode: 'balanced',
    modelLabel: 'Automático → HardWorkAI 4 · Equilibrado',
    reason,
  };
}
