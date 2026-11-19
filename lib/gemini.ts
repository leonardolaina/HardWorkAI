import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type { ReasoningMode, ResponseStyle } from './types';

export function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'Chave de API não configurada. Verifique a variável GEMINI_API_KEY nas configurações do projeto.'
    );
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export function resolveModelConfig(mode: ReasoningMode): {
  model: string;
  thinkingLevel: ThinkingLevel;
} {
  switch (mode) {
    case 'fast':
      return {
        model: 'gemini-4-hydrogen',
        thinkingLevel: ThinkingLevel.LOW,
      };
    case 'deep':
      return {
        model: 'gemini-4-hydrogen',
        thinkingLevel: ThinkingLevel.HIGH,
      };
    case 'balanced':
    default:
      return {
        model: 'gemini-4-hydrogen',
        thinkingLevel: ThinkingLevel.MEDIUM,
      };
  }
}

const STYLE_INSTRUCTIONS: Record<ResponseStyle, string> = {
  normal:
    'Responda de forma clara, ponderada e natural, adaptando a extensão à complexidade da pergunta.',
  concise:
    'Seja extremamente objetivo e conciso. Vá direto à resposta essencial com frases curtas e listas enxutas quando útil.',
  explanatory:
    'Explique de maneira didática, passo a passo, usando analogias claras e exemplos práticos para facilitar o entendimento.',
  formal:
    'Adote um registro profissional, preciso e bem estruturado, adequado para documentação executiva ou comunicação corporativa.',
};

export function buildSystemInstruction(
  style: ResponseStyle,
  customInstructions?: string
): string {
  const parts = [
    'Você é HardWorkAI, um assistente de inteligência artificial atencioso, claro, honesto e altamente capaz.',
    'Responda no mesmo idioma do usuário (por padrão em português do Brasil).',
    'Formate suas respostas com Markdown limpo e bem legível: use títulos apenas quando organizarem textos longos, tabelas para comparações e blocos de código com a linguagem explicitada (ex: ```html, ```tsx, ```python, ```svg).',
    'Quando o usuário pedir uma página, componente visual, calculadora, gráfico ou interface interativa em HTML, forneça um único bloco ```html completo e autocontido (com CSS e JS embutidos) para que possa ser pré-visualizado imediatamente no painel lateral.',
    STYLE_INSTRUCTIONS[style] ?? STYLE_INSTRUCTIONS.normal,
  ];

  const trimmedCustom = customInstructions?.trim();
  if (trimmedCustom) {
    parts.push(`Instruções personalizadas do usuário:\n${trimmedCustom}`);
  }

  return parts.join('\n\n');
}
