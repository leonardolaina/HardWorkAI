'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  BookOpen,
  Code2,
  Download,
  FileEdit,
  Layout,
  PanelLeftOpen,
  Plus,
} from 'lucide-react';
import { BrandLogo, BrandWordmark } from './BrandLogo';
import Sidebar from './Sidebar';
import Composer from './Composer';
import MessageThread from './MessageThread';
import ArtifactPanel from './ArtifactPanel';
import InstructionsModal from './InstructionsModal';
import {
  DEFAULT_MCP_CONNECTORS,
  DEFAULT_PLUGINS,
  McpConnectorsView,
  PluginsView,
} from './ManageViews';
import AiGatewayView from './AiGatewayView';
import type { ProviderConfig } from '@/lib/providers';
import type {
  ActiveSection,
  ArtifactData,
  Attachment,
  ChatMessage,
  Conversation,
  GroundingSource,
  McpConnector,
  PluginItem,
  ReasoningMode,
  ResponseStyle,
} from '@/lib/types';

const STORAGE_KEYS = {
  conversations: 'lume_conversations_v1',
  theme: 'lume_theme_v1',
  instructions: 'lume_instructions_v1',
  mode: 'lume_mode_v1',
  style: 'lume_style_v1',
  plugins: 'hardworkai_plugins_v1',
  mcp: 'hardworkai_mcp_v1',
  providerConfigs: 'hardworkai_provider_configs_v1',
};

const QUICK_STARTERS = [
  {
    label: 'Escrever',
    icon: FileEdit,
    prompt:
      'Ajude-me a redigir um e-mail claro e cordial apresentando uma proposta de projeto para um novo cliente, destacando prazo, entregas e próximos passos.',
  },
  {
    label: 'Programar',
    icon: Code2,
    prompt:
      'Explique de forma prática como implementar debounce e cancelamento de requisições em TypeScript com um exemplo limpo e reutilizável.',
  },
  {
    label: 'Criar interface',
    icon: Layout,
    prompt:
      'Crie um aplicativo HTML completo e autocontido de temporizador Pomodoro minimalista com ciclos de foco, pausa curta e estatísticas da sessão.',
  },
  {
    label: 'Aprender',
    icon: BookOpen,
    prompt:
      'Explique como funciona a arquitetura de Transformers em inteligência artificial de forma intuitiva, com uma analogia simples e um resumo em tópicos.',
  },
];

function createId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Bom dia.';
  if (hour >= 12 && hour < 18) return 'Boa tarde.';
  return 'Boa noite.';
}

async function readAttachmentFile(file: File): Promise<Attachment | null> {
  if (file.size > 12 * 1024 * 1024) {
    return null;
  }

  if (file.type.startsWith('image/')) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = typeof reader.result === 'string' ? reader.result : '';
        const base64 = dataUrl.includes(',') ? dataUrl.split(',')[1] : '';
        if (!base64) {
          resolve(null);
          return;
        }
        resolve({
          id: createId(),
          name: file.name || 'imagem.png',
          mimeType: file.type,
          size: file.size,
          kind: 'image',
          content: base64,
          previewUrl: dataUrl,
        });
      };
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(file);
    });
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === 'string' ? reader.result : '';
      resolve({
        id: createId(),
        name: file.name,
        mimeType: file.type || 'text/plain',
        size: file.size,
        kind: 'text',
        content: text,
      });
    };
    reader.onerror = () => resolve(null);
    reader.readAsText(file);
  });
}

function extractPreviewableArtifact(markdown: string): ArtifactData | null {
  const regex = /```(html|htm|svg)\n([\s\S]*?)```/gi;
  let lastMatch: RegExpExecArray | null = null;
  let current: RegExpExecArray | null;
  while ((current = regex.exec(markdown)) !== null) {
    lastMatch = current;
  }
  if (!lastMatch) return null;

  const lang = lastMatch[1].toLowerCase();
  const code = lastMatch[2].trim();
  if (code.length < 40) return null;

  const titleMatch = code.match(/<title>([^<]+)<\/title>/i);
  const title =
    titleMatch?.[1]?.trim().slice(0, 60) ||
    (lang === 'svg' ? 'Ilustração SVG' : 'Pré-visualização interativa');

  return {
    id: `${lang}-${code.length}-${code.slice(0, 24)}`,
    title,
    language: lang,
    code,
    previewable: true,
  };
}

export default function LumeWorkspace() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<ActiveSection>('chat');
  const [plugins, setPlugins] = useState<PluginItem[]>(DEFAULT_PLUGINS);
  const [mcpConnectors, setMcpConnectors] =
    useState<McpConnector[]>(DEFAULT_MCP_CONNECTORS);
  const [providerConfigs, setProviderConfigs] = useState<
    Record<string, ProviderConfig>
  >({});
  const [input, setInput] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [mode, setMode] = useState<ReasoningMode>('balanced');
  const [style, setStyle] = useState<ResponseStyle>('normal');
  const [webSearch, setWebSearch] = useState(false);
  const [customInstructions, setCustomInstructions] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [instructionsOpen, setInstructionsOpen] = useState(false);
  const [activeArtifact, setActiveArtifact] = useState<ArtifactData | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [greeting, setGreeting] = useState('Como posso ajudar hoje?');
  const [hydrated, setHydrated] = useState(false);

  const abortControllerRef = useRef<AbortController | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const frame = window.requestAnimationFrame(() => {
      setGreeting(`${getGreeting()} Como posso ajudar?`);

      try {
        const savedConvs = localStorage.getItem(STORAGE_KEYS.conversations);
        if (savedConvs) {
          const parsed = JSON.parse(savedConvs) as Conversation[];
          if (Array.isArray(parsed)) {
            setConversations(parsed);
          }
        }

        const savedInstructions = localStorage.getItem(STORAGE_KEYS.instructions);
        if (savedInstructions) setCustomInstructions(savedInstructions);

        const savedMode = localStorage.getItem(STORAGE_KEYS.mode) as ReasoningMode | null;
        if (savedMode && ['fast', 'balanced', 'deep'].includes(savedMode)) {
          setMode(savedMode);
        }

        const savedStyle = localStorage.getItem(STORAGE_KEYS.style) as ResponseStyle | null;
        if (
          savedStyle &&
          ['normal', 'concise', 'explanatory', 'formal'].includes(savedStyle)
        ) {
          setStyle(savedStyle);
        }

        const savedPlugins = localStorage.getItem(STORAGE_KEYS.plugins);
        if (savedPlugins) {
          const parsed = JSON.parse(savedPlugins) as PluginItem[];
          if (Array.isArray(parsed) && parsed.length > 0) setPlugins(parsed);
        }

        const savedMcp = localStorage.getItem(STORAGE_KEYS.mcp);
        if (savedMcp) {
          const parsed = JSON.parse(savedMcp) as McpConnector[];
          if (Array.isArray(parsed)) setMcpConnectors(parsed);
        }

        const savedProviderConfigs = localStorage.getItem(
          STORAGE_KEYS.providerConfigs
        );
        if (savedProviderConfigs) {
          const parsed = JSON.parse(savedProviderConfigs) as Record<
            string,
            ProviderConfig
          >;
          if (parsed && typeof parsed === 'object') {
            setProviderConfigs(parsed);
          }
        }

        const savedTheme = localStorage.getItem(STORAGE_KEYS.theme);
        const prefersDark =
          savedTheme === 'dark' ||
          (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches);
        setIsDark(prefersDark);
        document.documentElement.classList.toggle('dark', prefersDark);

        if (window.innerWidth < 1024) {
          setSidebarOpen(false);
        }
      } catch {
        // Ignore storage read issues
      } finally {
        setHydrated(true);
      }
    });

    return () => window.cancelAnimationFrame(frame);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      // Store conversations without overly large base64 preview URLs if quota is tight
      localStorage.setItem(STORAGE_KEYS.conversations, JSON.stringify(conversations));
    } catch {
      try {
        const slim = conversations.map((c) => ({
          ...c,
          messages: c.messages.map((m) => ({
            ...m,
            attachments: m.attachments?.map((a) =>
              a.kind === 'image' ? { ...a, content: '', previewUrl: undefined } : a
            ),
          })),
        }));
        localStorage.setItem(STORAGE_KEYS.conversations, JSON.stringify(slim));
      } catch {
        // Storage quota exceeded
      }
    }
  }, [conversations, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEYS.plugins, JSON.stringify(plugins));
      localStorage.setItem(STORAGE_KEYS.mcp, JSON.stringify(mcpConnectors));
      localStorage.setItem(
        STORAGE_KEYS.providerConfigs,
        JSON.stringify(providerConfigs)
      );
    } catch {
      // ignore storage errors
    }
  }, [plugins, mcpConnectors, providerConfigs, hydrated]);

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeId) ?? null,
    [conversations, activeId]
  );

  const effectiveInstructions = useMemo(() => {
    const blocks: string[] = [];
    if (customInstructions.trim()) {
      blocks.push(customInstructions.trim());
    }
    const enabledPlugins = plugins.filter((p) => p.enabled);
    if (enabledPlugins.length > 0) {
      blocks.push(
        'Plugins ativos:\n' +
          enabledPlugins.map((p) => `- ${p.name}: ${p.instruction}`).join('\n')
      );
    }
    return blocks.join('\n\n');
  }, [customInstructions, plugins]);

  const scrollToBottom = useCallback(() => {
    const el = scrollContainerRef.current;
    if (el) {
      el.scrollTop = el.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [activeConversation?.messages.length, scrollToBottom]);

  const handleToggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem(STORAGE_KEYS.theme, next ? 'dark' : 'light');
    } catch {
      // ignore
    }
  };

  const handleSaveInstructions = (value: string) => {
    setCustomInstructions(value);
    try {
      localStorage.setItem(STORAGE_KEYS.instructions, value);
    } catch {
      // ignore
    }
  };

  const handleChangeMode = (nextMode: ReasoningMode) => {
    setMode(nextMode);
    try {
      localStorage.setItem(STORAGE_KEYS.mode, nextMode);
    } catch {
      // ignore
    }
  };

  const handleChangeStyle = (nextStyle: ResponseStyle) => {
    setStyle(nextStyle);
    try {
      localStorage.setItem(STORAGE_KEYS.style, nextStyle);
    } catch {
      // ignore
    }
  };

  const handleNewChat = useCallback(() => {
    if (isStreaming) {
      abortControllerRef.current?.abort();
      setIsStreaming(false);
    }
    setActiveSection('chat');
    setActiveId(null);
    setActiveArtifact(null);
    setInput('');
    setAttachments([]);
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  }, [isStreaming]);

  useEffect(() => {
    const handleShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        handleNewChat();
      }
    };
    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, [handleNewChat]);

  const handleAddAttachments = async (files: FileList | File[]) => {
    const list = Array.from(files).slice(0, 5);
    const parsed = await Promise.all(list.map(readAttachmentFile));
    const valid = parsed.filter((item): item is Attachment => item !== null);
    if (valid.length > 0) {
      setAttachments((prev) => [...prev, ...valid].slice(0, 6));
    }
  };

  const requestAutoTitle = useCallback(
    async (convId: string, userMsg: string, assistantMsg: string) => {
      try {
        const res = await fetch('/api/title', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userMessage: userMsg,
            assistantMessage: assistantMsg,
          }),
        });
        if (!res.ok) return;
        const data = (await res.json()) as { title?: string };
        if (data.title) {
          setConversations((prev) =>
            prev.map((c) => (c.id === convId ? { ...c, title: data.title! } : c))
          );
        }
      } catch {
        // Keep fallback title
      }
    },
    []
  );

  const streamAssistantReply = useCallback(
    async (
      convId: string,
      historyForApi: ChatMessage[],
      assistantMessageId: string,
      shouldAutoTitle: boolean,
      firstUserText: string
    ) => {
      const controller = new AbortController();
      abortControllerRef.current = controller;
      setIsStreaming(true);

      let accumulatedText = '';
      let collectedSources: GroundingSource[] = [];

      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          signal: controller.signal,
          body: JSON.stringify({
            messages: historyForApi.map((m) => ({
              role: m.role,
              content: m.content,
              attachments: m.attachments,
            })),
            mode,
            style,
            webSearch,
            customInstructions: effectiveInstructions,
          }),
        });

        if (!response.ok || !response.body) {
          let errMessage = 'Não foi possível conectar ao serviço de IA.';
          try {
            const errBody = (await response.json()) as { error?: string };
            if (errBody.error) errMessage = errBody.error;
          } catch {
            // default message
          }
          throw new Error(errMessage);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const events = buffer.split('\n\n');
          buffer = events.pop() ?? '';

          for (const rawEvent of events) {
            const line = rawEvent
              .split('\n')
              .find((l) => l.startsWith('data: '));
            if (!line) continue;

            let payload: {
              type: string;
              text?: string;
              sources?: GroundingSource[];
              message?: string;
            };
            try {
              payload = JSON.parse(line.slice(6));
            } catch {
              continue;
            }

            if (payload.type === 'delta' && payload.text) {
              accumulatedText += payload.text;
              const currentText = accumulatedText;
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === convId
                    ? {
                        ...c,
                        updatedAt: Date.now(),
                        messages: c.messages.map((m) =>
                          m.id === assistantMessageId
                            ? { ...m, content: currentText }
                            : m
                        ),
                      }
                    : c
                )
              );
              scrollToBottom();
            } else if (payload.type === 'sources' && payload.sources) {
              collectedSources = payload.sources;
              setConversations((prev) =>
                prev.map((c) =>
                  c.id === convId
                    ? {
                        ...c,
                        messages: c.messages.map((m) =>
                          m.id === assistantMessageId
                            ? { ...m, sources: collectedSources }
                            : m
                        ),
                      }
                    : c
                )
              );
            } else if (payload.type === 'error') {
              throw new Error(payload.message || 'Erro ao gerar resposta.');
            }
          }
        }

        if (accumulatedText) {
          const previewArtifact = extractPreviewableArtifact(accumulatedText);
          if (previewArtifact) {
            setActiveArtifact(previewArtifact);
          }
          if (shouldAutoTitle) {
            requestAutoTitle(convId, firstUserText, accumulatedText);
          }
        }
      } catch (err) {
        if ((err as Error)?.name === 'AbortError') {
          if (!accumulatedText) {
            setConversations((prev) =>
              prev.map((c) =>
                c.id === convId
                  ? {
                      ...c,
                      messages: c.messages.map((m) =>
                        m.id === assistantMessageId
                          ? { ...m, content: '*Geração interrompida.*' }
                          : m
                      ),
                    }
                  : c
              )
            );
          }
        } else {
          const message =
            err instanceof Error
              ? err.message
              : 'Ocorreu um erro inesperado ao gerar a resposta.';
          setConversations((prev) =>
            prev.map((c) =>
              c.id === convId
                ? {
                    ...c,
                    messages: c.messages.map((m) =>
                      m.id === assistantMessageId ? { ...m, error: message } : m
                    ),
                  }
                : c
            )
          );
        }
      } finally {
        setIsStreaming(false);
        abortControllerRef.current = null;
      }
    },
    [effectiveInstructions, mode, requestAutoTitle, scrollToBottom, style, webSearch]
  );

  const handleSend = useCallback(
    async (overridePrompt?: string) => {
      const textToSend = (overridePrompt ?? input).trim();
      const filesToSend = overridePrompt ? [] : attachments;
      if ((!textToSend && filesToSend.length === 0) || isStreaming) return;

      const userMessage: ChatMessage = {
        id: createId(),
        role: 'user',
        content: textToSend,
        attachments: filesToSend.length > 0 ? filesToSend : undefined,
        createdAt: Date.now(),
      };

      const assistantPlaceholder: ChatMessage = {
        id: createId(),
        role: 'assistant',
        content: '',
        createdAt: Date.now() + 1,
      };

      let targetConvId = activeId;
      let nextHistory: ChatMessage[] = [];
      let isFirstExchange = false;

      if (!targetConvId) {
        targetConvId = createId();
        isFirstExchange = true;
        const fallbackTitle =
          textToSend.slice(0, 48) || filesToSend[0]?.name || 'Nova conversa';

        const newConv: Conversation = {
          id: targetConvId,
          title: fallbackTitle,
          messages: [userMessage, assistantPlaceholder],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        setConversations((prev) => [newConv, ...prev]);
        setActiveId(targetConvId);
        nextHistory = [userMessage];
      } else {
        const existing = conversations.find((c) => c.id === targetConvId);
        const priorMessages = existing?.messages ?? [];
        isFirstExchange = priorMessages.length === 0;
        nextHistory = [...priorMessages, userMessage];

        setConversations((prev) =>
          prev.map((c) =>
            c.id === targetConvId
              ? {
                  ...c,
                  updatedAt: Date.now(),
                  messages: [...c.messages, userMessage, assistantPlaceholder],
                }
              : c
          )
        );
      }

      if (!overridePrompt) {
        setInput('');
        setAttachments([]);
      }

      await streamAssistantReply(
        targetConvId,
        nextHistory,
        assistantPlaceholder.id,
        isFirstExchange,
        textToSend || filesToSend[0]?.name || ''
      );
    },
    [activeId, attachments, conversations, input, isStreaming, streamAssistantReply]
  );

  const handleStop = () => {
    abortControllerRef.current?.abort();
  };

  const handleRegenerate = async () => {
    if (!activeConversation || isStreaming) return;
    const msgs = activeConversation.messages;
    if (msgs.length === 0) return;

    const trimmedHistory =
      msgs[msgs.length - 1].role === 'assistant' ? msgs.slice(0, -1) : msgs;
    if (trimmedHistory.length === 0) return;

    const assistantPlaceholder: ChatMessage = {
      id: createId(),
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              updatedAt: Date.now(),
              messages: [...trimmedHistory, assistantPlaceholder],
            }
          : c
      )
    );

    await streamAssistantReply(
      activeConversation.id,
      trimmedHistory,
      assistantPlaceholder.id,
      false,
      ''
    );
  };

  const handleEditMessage = async (messageId: string, newContent: string) => {
    if (!activeConversation || isStreaming) return;
    const idx = activeConversation.messages.findIndex((m) => m.id === messageId);
    if (idx === -1) return;

    const updatedUserMsg: ChatMessage = {
      ...activeConversation.messages[idx],
      content: newContent,
    };

    const nextHistory = [...activeConversation.messages.slice(0, idx), updatedUserMsg];
    const assistantPlaceholder: ChatMessage = {
      id: createId(),
      role: 'assistant',
      content: '',
      createdAt: Date.now(),
    };

    setConversations((prev) =>
      prev.map((c) =>
        c.id === activeConversation.id
          ? {
              ...c,
              updatedAt: Date.now(),
              messages: [...nextHistory, assistantPlaceholder],
            }
          : c
      )
    );

    await streamAssistantReply(
      activeConversation.id,
      nextHistory,
      assistantPlaceholder.id,
      idx === 0,
      newContent
    );
  };

  const handleExportMarkdown = () => {
    if (!activeConversation) return;
    const lines = [
      `# ${activeConversation.title}`,
      '',
      ...activeConversation.messages.flatMap((m) => [
        m.role === 'user' ? '## Você' : '## HardWorkAI',
        '',
        m.content,
        '',
      ]),
    ];
    const blob = new Blob([lines.join('\n')], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const safeName =
      activeConversation.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '') || 'conversa-hardworkai';
    a.href = url;
    a.download = `${safeName}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleAddAttachments(e.dataTransfer.files);
    }
  };

  const isEmptyState = !activeConversation || activeConversation.messages.length === 0;

  return (
    <div
      className="flex h-dvh w-screen overflow-hidden bg-[#FAF9F5] dark:bg-[#1B1A18] text-[#1F1E1C] dark:text-[#F2EFE9]"
      onDragOver={(e) => {
        e.preventDefault();
        if (!isDragging) setIsDragging(true);
      }}
      onDragLeave={(e) => {
        if (e.currentTarget === e.target) setIsDragging(false);
      }}
      onDrop={handleDrop}
    >
      <Sidebar
        conversations={conversations}
        activeId={activeId}
        activeSection={activeSection}
        activePluginsCount={plugins.filter((p) => p.enabled).length}
        connectedMcpCount={mcpConnectors.filter((c) => c.connected).length}
        configuredProvidersCount={Object.keys(providerConfigs).length}
        isOpen={sidebarOpen}
        isDark={isDark}
        hasCustomInstructions={customInstructions.trim().length > 0}
        onSelect={(id) => {
          if (isStreaming) {
            abortControllerRef.current?.abort();
            setIsStreaming(false);
          }
          setActiveSection('chat');
          setActiveId(id);
          setActiveArtifact(null);
          if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setSidebarOpen(false);
          }
        }}
        onSelectSection={(section) => {
          setActiveSection(section);
          setActiveArtifact(null);
          if (typeof window !== 'undefined' && window.innerWidth < 1024) {
            setSidebarOpen(false);
          }
        }}
        onNewChat={handleNewChat}
        onDelete={(id) => {
          setConversations((prev) => prev.filter((c) => c.id !== id));
          if (activeId === id) {
            setActiveId(null);
            setActiveArtifact(null);
          }
        }}
        onRename={(id, title) => {
          setConversations((prev) =>
            prev.map((c) => (c.id === id ? { ...c, title } : c))
          );
        }}
        onTogglePin={(id) => {
          setConversations((prev) =>
            prev.map((c) => (c.id === id ? { ...c, pinned: !c.pinned } : c))
          );
        }}
        onClose={() => setSidebarOpen(false)}
        onToggleTheme={handleToggleTheme}
        onOpenInstructions={() => setInstructionsOpen(true)}
      />

      <div className="flex-1 flex min-w-0 h-full overflow-hidden">
        <main className="flex-1 flex flex-col min-w-0 h-full relative">
          <header className="flex items-center justify-between gap-4 px-4 sm:px-6 h-14 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {!sidebarOpen && (
                <button
                  type="button"
                  onClick={() => setSidebarOpen(true)}
                  title="Abrir barra lateral"
                  aria-label="Abrir barra lateral"
                  className="p-2 rounded-lg text-[#6B675E] dark:text-[#9E998F] hover:bg-[#EFECE3] dark:hover:bg-[#262522] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9] transition-colors cursor-pointer shrink-0"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>
              )}

              {!sidebarOpen && (isEmptyState || activeSection !== 'chat') && (
                <div className="flex items-center gap-2 shrink-0">
                  <BrandLogo size="sm" />
                  <BrandWordmark className="text-[1.05rem]" />
                </div>
              )}

              {activeSection === 'chat' && !isEmptyState && activeConversation && (
                <h1 className="text-sm font-medium text-[#3F3D37] dark:text-[#D5D0C6] truncate">
                  {activeConversation.title}
                </h1>
              )}

              {activeSection !== 'chat' && (
                <span className="text-xs text-[#7D786E] dark:text-[#969187] truncate">
                  Gerenciar ·{' '}
                  {activeSection === 'plugins'
                    ? 'Plugins'
                    : activeSection === 'mcp'
                      ? "Conectores (MCP's)"
                      : "Gateway de IA's"}
                </span>
              )}
            </div>

            {activeSection === 'chat' && !isEmptyState && activeConversation && (
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  title="Exportar conversa em Markdown"
                  aria-label="Exportar conversa em Markdown"
                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium text-[#6B675E] dark:text-[#A19C92] hover:bg-[#EFECE3] dark:hover:bg-[#262522] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Exportar</span>
                </button>

                {!sidebarOpen && (
                  <button
                    type="button"
                    onClick={handleNewChat}
                    title="Nova conversa (Ctrl+K)"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#EFECE3] dark:bg-[#262522] hover:bg-[#E5E1D6] dark:hover:bg-[#312F2B] text-[#1F1E1C] dark:text-[#F2EFE9] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5 text-[#C96442] dark:text-[#D97757]" />
                    <span>Nova</span>
                  </button>
                )}
              </div>
            )}

            {activeSection !== 'chat' && (
              <button
                type="button"
                onClick={() => setActiveSection('chat')}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[#EFECE3] dark:bg-[#262522] hover:bg-[#E5E1D6] dark:hover:bg-[#312F2B] text-[#1F1E1C] dark:text-[#F2EFE9] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <span>Voltar ao chat</span>
              </button>
            )}
          </header>

          {activeSection === 'plugins' ? (
            <div className="flex-1 overflow-y-auto">
              <PluginsView
                plugins={plugins}
                onTogglePlugin={(id) =>
                  setPlugins((prev) =>
                    prev.map((p) => (p.id === id ? { ...p, enabled: !p.enabled } : p))
                  )
                }
                onAddPlugin={(plugin) => setPlugins((prev) => [plugin, ...prev])}
                onDeletePlugin={(id) =>
                  setPlugins((prev) => prev.filter((p) => p.id !== id))
                }
                onReturnToChat={() => setActiveSection('chat')}
              />
            </div>
          ) : activeSection === 'mcp' ? (
            <div className="flex-1 overflow-y-auto">
              <McpConnectorsView
                connectors={mcpConnectors}
                onToggleConnector={(id) =>
                  setMcpConnectors((prev) =>
                    prev.map((c) =>
                      c.id === id ? { ...c, connected: !c.connected } : c
                    )
                  )
                }
                onAddConnector={(conn) => setMcpConnectors((prev) => [conn, ...prev])}
                onDeleteConnector={(id) =>
                  setMcpConnectors((prev) => prev.filter((c) => c.id !== id))
                }
              />
            </div>
          ) : activeSection === 'gateway' ? (
            <div className="flex-1 overflow-y-auto">
              <AiGatewayView
                configs={providerConfigs}
                onSaveConfig={(cfg) =>
                  setProviderConfigs((prev) => ({
                    ...prev,
                    [cfg.providerId]: cfg,
                  }))
                }
                onDeleteConfig={(providerId) =>
                  setProviderConfigs((prev) => {
                    const next = { ...prev };
                    delete next[providerId];
                    return next;
                  })
                }
              />
            </div>
          ) : isEmptyState ? (
            <div className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 pb-16 overflow-y-auto">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="w-full max-w-[700px] space-y-6"
              >
                <div className="flex flex-col items-center text-center space-y-3.5">
                  <BrandLogo size="lg" />
                  <h1 className="font-serif text-[clamp(1.85rem,3.4vw,2.65rem)] font-normal tracking-tight text-[#1F1E1C] dark:text-[#F2EFE9] leading-tight text-balance">
                    {greeting}
                  </h1>
                </div>

                <Composer
                  value={input}
                  attachments={attachments}
                  mode={mode}
                  style={style}
                  webSearch={webSearch}
                  isStreaming={isStreaming}
                  autoFocus
                  onChange={setInput}
                  onAddAttachments={handleAddAttachments}
                  onRemoveAttachment={(id) =>
                    setAttachments((prev) => prev.filter((a) => a.id !== id))
                  }
                  onChangeMode={handleChangeMode}
                  onChangeStyle={handleChangeStyle}
                  onToggleWebSearch={() => setWebSearch((w) => !w)}
                  onSend={() => handleSend()}
                  onStop={handleStop}
                />

                <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                  {QUICK_STARTERS.map((starter) => {
                    const Icon = starter.icon;
                    return (
                      <button
                        key={starter.label}
                        type="button"
                        onClick={() => handleSend(starter.prompt)}
                        className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-[#E5E1D8] dark:border-[#2F2D29] bg-[#FAF9F5] dark:bg-[#21201D] hover:bg-[#F1EEE6] dark:hover:bg-[#292724] hover:border-[#D5CFC3] dark:hover:border-[#3E3C37] text-xs font-medium text-[#4A4740] dark:text-[#CFCAC0] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        <Icon className="w-3.5 h-3.5 text-[#7D786E] dark:text-[#969187]" />
                        <span>{starter.label}</span>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            </div>
          ) : (
            <>
              <div
                ref={scrollContainerRef}
                className="flex-1 overflow-y-auto scroll-smooth"
              >
                <MessageThread
                  messages={activeConversation.messages}
                  isStreaming={isStreaming}
                  onOpenArtifact={(art) => setActiveArtifact(art)}
                  onRegenerate={handleRegenerate}
                  onEditMessage={handleEditMessage}
                />
              </div>

              <div className="shrink-0 px-4 sm:px-6 pb-4 pt-2 bg-gradient-to-t from-[#FAF9F5] via-[#FAF9F5] to-transparent dark:from-[#1B1A18] dark:via-[#1B1A18]">
                <div className="w-full max-w-[740px] mx-auto">
                  <Composer
                    value={input}
                    attachments={attachments}
                    mode={mode}
                    style={style}
                    webSearch={webSearch}
                    isStreaming={isStreaming}
                    placeholder="Responder para a HardWorkAI..."
                    onChange={setInput}
                    onAddAttachments={handleAddAttachments}
                    onRemoveAttachment={(id) =>
                      setAttachments((prev) => prev.filter((a) => a.id !== id))
                    }
                    onChangeMode={handleChangeMode}
                    onChangeStyle={handleChangeStyle}
                    onToggleWebSearch={() => setWebSearch((w) => !w)}
                    onSend={() => handleSend()}
                    onStop={handleStop}
                  />
                  <p className="text-center text-[11px] text-[#8D887E] dark:text-[#757067] mt-2">
                    A HardWorkAI pode cometer erros. Verifique informações importantes.
                  </p>
                </div>
              </div>
            </>
          )}

          {isDragging && (
            <div className="absolute inset-3 z-40 rounded-2xl border-2 border-dashed border-[#C96442] dark:border-[#D97757] bg-[#FAF9F5]/90 dark:bg-[#1B1A18]/90 flex items-center justify-center pointer-events-none">
              <div className="text-center space-y-1">
                <p className="font-serif text-xl text-[#1F1E1C] dark:text-[#F2EFE9]">
                  Solte para anexar à conversa
                </p>
                <p className="text-xs text-[#6B675E] dark:text-[#A19C92]">
                  Imagens, código ou arquivos de texto até 12 MB
                </p>
              </div>
            </div>
          )}
        </main>

        {activeArtifact && (
          <ArtifactPanel
            artifact={activeArtifact}
            onClose={() => setActiveArtifact(null)}
          />
        )}
      </div>

      {instructionsOpen && (
        <InstructionsModal
          isOpen={instructionsOpen}
          initialValue={customInstructions}
          onSave={handleSaveInstructions}
          onClose={() => setInstructionsOpen(false)}
        />
      )}
    </div>
  );
}
