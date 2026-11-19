import { NextRequest } from 'next/server';
import { GoogleGenAI, ThinkingLevel, type Content, type Part } from '@google/genai';
import { buildSystemInstruction, getGeminiClient, resolveModelConfig } from '@/lib/gemini';
import { routeRequestModel, type GatewayCandidate } from '@/lib/modelRouter';
import type { Attachment, GroundingSource, ReasoningMode, ResponseStyle } from '@/lib/types';

interface IncomingMessage {
  role: 'user' | 'assistant';
  content: string;
  attachments?: Attachment[];
}

interface SelectedModelPayload {
  source: 'auto' | 'builtin' | 'gateway';
  providerId: string;
  modelId: string;
  apiKey?: string;
}

interface ChatRequestBody {
  messages: IncomingMessage[];
  mode?: ReasoningMode;
  style?: ResponseStyle;
  webSearch?: boolean;
  customInstructions?: string;
  selectedModel?: SelectedModelPayload;
  gatewayCandidates?: GatewayCandidate[];
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

function normalizeProviderModelId(providerId: string, modelId: string): string {
  const trimmed = modelId.trim();
  if (providerId === 'deepseek') {
    return trimmed.replace(/\s*\([^)]*\)\s*$/, '').trim();
  }
  return trimmed;
}

function isTransientError(err: unknown): boolean {
  const raw = err instanceof Error ? err.message : String(err);
  const status =
    (err as { status?: number; code?: number })?.status ??
    (err as { code?: number })?.code;
  if (status === 500 || status === 502 || status === 503 || status === 504) {
    return true;
  }
  return /503|502|504|500|UNAVAILABLE|Service Unavailable|high demand|overloaded|INTERNAL|ECONNRESET|ETIMEDOUT|fetch failed/i.test(
    raw
  );
}

function extractReadableErrorMessage(raw: string): string {
  let current = raw.trim();
  for (let i = 0; i < 3; i++) {
    if (!current.startsWith('{')) break;
    try {
      const parsed = JSON.parse(current) as {
        error?: { message?: string } | string;
        message?: string;
      };
      const next =
        typeof parsed.error === 'string'
          ? parsed.error
          : parsed.error?.message || parsed.message;
      if (typeof next === 'string' && next.trim()) {
        current = next.trim();
      } else {
        break;
      }
    } catch {
      break;
    }
  }
  return current;
}

function formatApiError(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  if (
    raw.includes('API_KEY_INVALID') ||
    raw.includes('PERMISSION_DENIED') ||
    raw.includes('401') ||
    raw.includes('403') ||
    /invalid.*api.?key|authentication|unauthorized/i.test(raw)
  ) {
    return 'Não foi possível autenticar na API do provedor escolhido. Verifique a chave de API configurada.';
  }
  if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('429')) {
    return 'Limite de requisições atingido temporariamente. Aguarde alguns instantes e tente novamente.';
  }
  if (/503|UNAVAILABLE|Service Unavailable|high demand|overloaded/i.test(raw)) {
    return 'O modelo de IA está passando por um pico temporário de demanda. Aguarde alguns segundos e clique em "Tentar novamente".';
  }
  if (/500|502|504|INTERNAL/i.test(raw)) {
    return 'Ocorreu uma instabilidade temporária no serviço de IA. Tente novamente em instantes.';
  }
  if (raw.includes('NOT_FOUND') || raw.includes('404')) {
    return 'Modelo indisponível ou não encontrado neste provedor. Escolha outro modelo ou tente novamente.';
  }
  const readable = extractReadableErrorMessage(raw);
  return readable || 'Ocorreu um erro ao gerar a resposta. Tente novamente.';
}

function sleepWithAbort(ms: number, signal: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal.aborted) {
      reject(new Error('Aborted'));
      return;
    }
    const timer = setTimeout(() => {
      signal.removeEventListener('abort', onAbort);
      resolve();
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      reject(new Error('Aborted'));
    };
    signal.addEventListener('abort', onAbort, { once: true });
  });
}

function toOpenAiMessages(
  messages: IncomingMessage[],
  systemInstruction: string
): Array<{ role: string; content: string | Array<Record<string, unknown>> }> {
  const formatted: Array<{ role: string; content: string | Array<Record<string, unknown>> }> = [
    { role: 'system', content: systemInstruction },
  ];

  for (const m of messages) {
    const hasImages = m.attachments?.some((a) => a.kind === 'image' && a.content);
    const textBlocks: string[] = [];

    if (m.attachments) {
      for (const att of m.attachments) {
        if (att.kind === 'text') {
          textBlocks.push(
            `[Arquivo anexado: ${att.name}]\n\`\`\`\n${att.content.slice(0, 60000)}\n\`\`\``
          );
        }
      }
    }
    if (m.content.trim()) {
      textBlocks.push(m.content);
    }

    if (hasImages && m.role === 'user') {
      const contentParts: Array<Record<string, unknown>> = [];
      if (textBlocks.length > 0) {
        contentParts.push({ type: 'text', text: textBlocks.join('\n\n') });
      }
      for (const att of m.attachments ?? []) {
        if (att.kind === 'image' && att.content) {
          contentParts.push({
            type: 'image_url',
            image_url: {
              url: `data:${att.mimeType || 'image/png'};base64,${att.content}`,
            },
          });
        }
      }
      formatted.push({ role: 'user', content: contentParts });
    } else if (textBlocks.length > 0) {
      formatted.push({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: textBlocks.join('\n\n'),
      });
    }
  }

  return formatted;
}

async function streamOpenAiCompatible(
  endpoint: string,
  apiKey: string,
  modelId: string,
  messages: IncomingMessage[],
  systemInstruction: string,
  signal: AbortSignal,
  sendEvent: (payload: Record<string, unknown>) => void,
  extraHeaders: Record<string, string> = {}
) {
  const res = await fetch(endpoint, {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model: modelId,
      stream: true,
      messages: toOpenAiMessages(messages, systemInstruction),
    }),
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => '');
    throw new Error(`${res.status} ${errText || res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done || signal.aborted) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith('data:')) continue;
      const dataStr = line.slice(5).trim();
      if (!dataStr || dataStr === '[DONE]') continue;

      try {
        const parsed = JSON.parse(dataStr) as {
          choices?: Array<{ delta?: { content?: string } }>;
        };
        const deltaText = parsed.choices?.[0]?.delta?.content;
        if (deltaText) {
          sendEvent({ type: 'delta', text: deltaText });
        }
      } catch {
        // ignore partial keepalive frames
      }
    }
  }
}

async function streamAnthropic(
  apiKey: string,
  modelId: string,
  messages: IncomingMessage[],
  systemInstruction: string,
  signal: AbortSignal,
  sendEvent: (payload: Record<string, unknown>) => void
) {
  const anthropicMessages = messages
    .filter((m) => m.content.trim().length > 0 || (m.attachments && m.attachments.length > 0))
    .map((m) => {
      const blocks: Array<Record<string, unknown>> = [];
      for (const att of m.attachments ?? []) {
        if (att.kind === 'image' && att.content) {
          blocks.push({
            type: 'image',
            source: {
              type: 'base64',
              media_type: att.mimeType || 'image/png',
              data: att.content,
            },
          });
        } else if (att.kind === 'text') {
          blocks.push({
            type: 'text',
            text: `[Arquivo anexado: ${att.name}]\n\`\`\`\n${att.content.slice(0, 60000)}\n\`\`\``,
          });
        }
      }
      if (m.content.trim()) {
        blocks.push({ type: 'text', text: m.content });
      }
      return {
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: blocks,
      };
    })
    .filter((m) => m.content.length > 0);

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    signal,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: modelId,
      max_tokens: 4096,
      stream: true,
      system: systemInstruction,
      messages: anthropicMessages,
    }),
  });

  if (!res.ok || !res.body) {
    const errText = await res.text().catch(() => '');
    throw new Error(`${res.status} ${errText || res.statusText}`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done || signal.aborted) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() ?? '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line.startsWith('data:')) continue;
      const dataStr = line.slice(5).trim();
      if (!dataStr) continue;

      try {
        const parsed = JSON.parse(dataStr) as {
          type?: string;
          delta?: { type?: string; text?: string };
        };
        if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
          sendEvent({ type: 'delta', text: parsed.delta.text });
        }
      } catch {
        // ignore non-JSON SSE lines
      }
    }
  }
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
    selectedModel,
    gatewayCandidates = [],
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
        const systemInstruction = buildSystemInstruction(style, customInstructions);

        // Resolve automatic routing when selectedModel is 'auto'
        let effectiveSource: 'builtin' | 'gateway' =
          selectedModel?.source === 'gateway' ? 'gateway' : 'builtin';
        let effectiveProviderId = selectedModel?.providerId || 'hardwork-builtin';
        let effectiveModelId = selectedModel?.modelId || '';
        let effectiveApiKey = selectedModel?.apiKey?.trim() || '';
        let effectiveMode: ReasoningMode = mode;

        if (!selectedModel || selectedModel.source === 'auto') {
          const decision = routeRequestModel({
            messages,
            webSearch,
            includeGateway: selectedModel?.modelId === 'auto-all',
            gatewayCandidates,
          });
          effectiveSource = decision.source;
          effectiveProviderId = decision.providerId;
          effectiveModelId = decision.modelId;
          effectiveApiKey = decision.apiKey?.trim() || '';
          effectiveMode = decision.reasoningMode;

          sendEvent({
            type: 'model',
            modelLabel: decision.modelLabel,
            reason: decision.reason,
          });
        }

        // Route to an external provider configured in Gateway de IA's
        if (effectiveSource === 'gateway') {
          const apiKey = effectiveApiKey;
          const providerId = effectiveProviderId;
          const modelId = normalizeProviderModelId(providerId, effectiveModelId);

          if (!apiKey) {
            throw new Error(
              'Nenhuma chave de API configurada para este provedor. Abra Gerenciar → Gateway de IA\'s para adicionar sua chave.'
            );
          }

          if (providerId === 'openai') {
            await streamOpenAiCompatible(
              'https://api.openai.com/v1/chat/completions',
              apiKey,
              modelId,
              messages,
              systemInstruction,
              req.signal,
              sendEvent
            );
          } else if (providerId === 'openrouter') {
            await streamOpenAiCompatible(
              'https://openrouter.ai/api/v1/chat/completions',
              apiKey,
              modelId,
              messages,
              systemInstruction,
              req.signal,
              sendEvent,
              {
                'HTTP-Referer': process.env.APP_URL || 'https://hardworkai.app',
                'X-Title': 'HardWorkAI',
              }
            );
          } else if (providerId === 'deepseek') {
            await streamOpenAiCompatible(
              'https://api.deepseek.com/chat/completions',
              apiKey,
              modelId,
              messages,
              systemInstruction,
              req.signal,
              sendEvent
            );
          } else if (providerId === 'mistral') {
            await streamOpenAiCompatible(
              'https://api.mistral.ai/v1/chat/completions',
              apiKey,
              modelId,
              messages,
              systemInstruction,
              req.signal,
              sendEvent
            );
          } else if (providerId === 'anthropic') {
            await streamAnthropic(
              apiKey,
              modelId,
              messages,
              systemInstruction,
              req.signal,
              sendEvent
            );
          } else if (providerId === 'google') {
            const customAi = new GoogleGenAI({
              apiKey,
              httpOptions: { headers: { 'User-Agent': 'aistudio-build' } },
            });
            const contents = toGeminiContents(messages);
            const responseStream = await customAi.models.generateContentStream({
              model: modelId,
              contents,
              config: {
                systemInstruction,
                ...(webSearch ? { tools: [{ googleSearch: {} }] } : {}),
              },
            });
            for await (const chunk of responseStream) {
              if (req.signal.aborted) break;
              if (chunk.text) {
                sendEvent({ type: 'delta', text: chunk.text });
              }
            }
          } else {
            throw new Error(
              `O provedor "${providerId}" ainda não possui endpoint direto configurado. Use OpenRouter, OpenAI, Anthropic, Google, DeepSeek ou Mistral no Gateway de IA's.`
            );
          }

          sendEvent({ type: 'done' });
          return;
        }

        // Built-in HardWorkAI models (server-side Gemini with retry + automatic fallback)
        const ai = getGeminiClient();
        const resolved = resolveModelConfig(effectiveMode);
        const requestedBuiltinModel = effectiveModelId || resolved.model;
        const primaryModel =
          requestedBuiltinModel === 'gemini-3.1-flash-lite'
            ? 'gemini-3.1-flash-lite'
            : resolved.model;
        const fallbackModel =
          primaryModel === 'gemini-3.1-flash-lite'
            ? 'gemini-4-hydrogen'
            : 'gemini-3.1-flash-lite';
        const thinkingLevel: ThinkingLevel = resolved.thinkingLevel;

        const contents = toGeminiContents(messages);

        const attempts: Array<{ model: string; delayMs: number }> = [
          { model: primaryModel, delayMs: 0 },
          { model: primaryModel, delayMs: 900 },
          { model: fallbackModel, delayMs: 1200 },
        ];

        const seenUris = new Set<string>();
        const sources: GroundingSource[] = [];
        let emittedAnyText = false;
        let lastError: unknown = null;

        for (let i = 0; i < attempts.length; i++) {
          const attempt = attempts[i];
          if (req.signal.aborted) break;

          if (attempt.delayMs > 0) {
            const jitter = Math.floor(Math.random() * 350);
            try {
              await sleepWithAbort(attempt.delayMs + jitter, req.signal);
            } catch {
              break;
            }
          }

          try {
            const responseStream = await ai.models.generateContentStream({
              model: attempt.model,
              contents,
              config: {
                systemInstruction,
                thinkingConfig: { thinkingLevel },
                ...(webSearch ? { tools: [{ googleSearch: {} }] } : {}),
              },
            });

            for await (const chunk of responseStream) {
              if (req.signal.aborted) {
                break;
              }

              const text = chunk.text;
              if (text) {
                emittedAnyText = true;
                sendEvent({ type: 'delta', text });
              }

              const groundingChunks =
                chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
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

            lastError = null;
            break;
          } catch (err) {
            lastError = err;
            const hasMoreAttempts = i < attempts.length - 1;
            if (
              !emittedAnyText &&
              hasMoreAttempts &&
              isTransientError(err) &&
              !req.signal.aborted
            ) {
              continue;
            }
            throw err;
          }
        }

        if (lastError && !emittedAnyText && !req.signal.aborted) {
          throw lastError;
        }

        if (sources.length > 0) {
          sendEvent({ type: 'sources', sources });
        }

        sendEvent({ type: 'done' });
      } catch (err) {
        if (!req.signal.aborted) {
          sendEvent({ type: 'error', message: formatApiError(err) });
        }
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
