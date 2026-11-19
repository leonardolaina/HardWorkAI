import { NextRequest } from 'next/server';
import type { Content, Part } from '@google/genai';
import { buildSystemInstruction, getGeminiClient, resolveModelConfig } from '@/lib/gemini';
import type { Attachment, GroundingSource, ReasoningMode, ResponseStyle } from '@/lib/types';

interface IncomingMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
}

interface ChatRequestBody {
  messages: IncomingMessage[];
  mode?: ReasoningMode;
  style?: ResponseStyle;
  webSearch?: boolean;
  customInstructions?: string;
}

function toGeminiContents(messages: IncomingMessage[]): Content[] {
  return messages
    .filter((m) => m.content.trim().length > 0 || (m.attachments && m.attachments.length > 0))
    .map((m) => {
      const parts: Part[] = [];

      if (m.attachments && m.attachments.length > 0) {
        for (const att of m.attachments) {
          if (att.kind === 'image') {
            parts.push({
              inlineData: {
                mimeType: att.mimeType || 'image/png',
                data: att.content,
              },
            });
          } else if (att.kind === 'text') {
            parts.push({
              text: `[Arquivo anexado: ${att.name}]\n\`\`\`\n${att.content.slice(0, 60000)}\n\`\`\``,
            });
          }
        }
      }

      if (m.content.trim().length > 0) {
        parts.push({ text: m.content });
      }

      return {
        role: m.role === 'assistant' ? 'model' : 'user',
        parts,
      };
    });
}

function formatApiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (raw.includes('API_KEY_INVALID') || raw.includes('PERMISSION_DENIED') || raw.includes('403')) {
    return 'Não foi possível autenticar na API. Verifique a chave configurada em Settings > Secrets.';
  }
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429')) {
    return 'Limite de requisições atingido temporariamente. Aguarde alguns instantes e tente novamente.';
  }
  if (raw.includes('NOT_FOUND') || raw.includes('404')) {
    return 'Modelo indisponível no momento. Tente novamente em instantes.';
  }
  return raw || 'Ocorreu um erro ao gerar a resposta. Tente novamente.';
}

export async function POST(req: NextRequest) {
  let body: ChatRequestBody;
  try {
    body = (await req.json()) as ChatRequestBody;
  } catch {
    return new Response(JSON.stringify({ error: 'Corpo da requisição inválido.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const {
    messages = [],
    mode = 'balanced',
    style = 'normal',
    webSearch = false,
    customInstructions = '',
  } = body;

  if (!Array.isArray(messages) || messages.length === 0) {
    return new Response(JSON.stringify({ error: 'Envie ao menos uma mensagem.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendEvent = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`));
      };

      try {
        const ai = getGeminiClient();
        const { model, thinkingLevel } = resolveModelConfig(mode);
        const systemInstruction = buildSystemInstruction(style, customInstructions);
        const contents = toGeminiContents(messages);

        const responseStream = await ai.models.generateContentStream({
          model,
          contents,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel },
            ...(webSearch ? { tools: [{ googleSearch: {} }] } : {}),
          },
        });

        const seenUris = new Set<string>();
        const sources: GroundingSource[] = [];

        for await (const chunk of responseStream) {
          if (req.signal.aborted) {
            break;
          }

          const text = chunk.text;
          if (text) {
            sendEvent({ type: 'delta', text });
          }

          const groundingChunks = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
          if (Array.isArray(groundingChunks)) {
            for (const gChunk of groundingChunks) {
              const uri = gChunk.web?.uri;
              const title = gChunk.web?.title;
              if (uri && !seenUris.has(uri)) {
                seenUris.add(uri);
                sources.push({
                  uri,
                  title: title || new URL(uri).hostname.replace(/^www\./, ''),
                });
              }
            }
          }
        }

        if (sources.length > 0) {
          sendEvent({ type: 'sources', sources });
        }

        sendEvent({ type: 'done' });
      } catch (err) {
        sendEvent({ type: 'error', message: formatApiError(err) });
      } finally {
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
