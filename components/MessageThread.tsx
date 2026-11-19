'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import {
  AlertCircle,
  Check,
  Copy,
  ExternalLink,
  FileText,
  Pencil,
  RotateCcw,
} from 'lucide-react';
import { BrandLogo } from './BrandLogo';
import MarkdownRenderer from './MarkdownRenderer';
import type { ArtifactData, ChatMessage } from '@/lib/types';

interface MessageThreadProps {
  messages: ChatMessage[];
  isStreaming: boolean;
  onOpenArtifact: (artifact: ArtifactData) => void;
  onRegenerate: () => void;
  onEditMessage: (messageId: string, newContent: string) => void;
}

export default function MessageThread({
  messages,
  isStreaming,
  onOpenArtifact,
  onRegenerate,
  onEditMessage,
}: MessageThreadProps) {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState('');

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId((prev) => (prev === id ? null : prev)), 1800);
    } catch {
      // Clipboard unavailable
    }
  };

  const startEdit = (msg: ChatMessage) => {
    setEditingId(msg.id);
    setEditDraft(msg.content);
  };

  const saveEdit = () => {
    if (!editingId) return;
    const trimmed = editDraft.trim();
    if (trimmed) {
      onEditMessage(editingId, trimmed);
    }
    setEditingId(null);
    setEditDraft('');
  };

  return (
    <div className="w-full max-w-[740px] mx-auto px-4 sm:px-6 pt-6 pb-8 space-y-8">
      {messages.map((msg, index) => {
        const isLast = index === messages.length - 1;
        const isAssistantStreaming = isLast && msg.role === 'assistant' && isStreaming;

        if (msg.role === 'user') {
          const isEditing = editingId === msg.id;

          return (
            <article key={msg.id} className="group flex flex-col items-end">
              {isEditing ? (
                <div className="w-full rounded-2xl border border-[#C96442]/60 dark:border-[#D97757]/60 bg-white dark:bg-[#252421] p-3.5 space-y-3">
                  <textarea
                    value={editDraft}
                    onChange={(e) => setEditDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Escape') {
                        e.preventDefault();
                        setEditingId(null);
                        setEditDraft('');
                      } else if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                        e.preventDefault();
                        saveEdit();
                      }
                    }}
                    rows={3}
                    autoFocus
                    className="w-full bg-transparent text-[0.95rem] leading-relaxed text-[#1F1E1C] dark:text-[#F2EFE9] resize-none focus:outline-none"
                  />
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingId(null);
                        setEditDraft('');
                      }}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg text-[#6B675E] dark:text-[#A19C92] hover:bg-[#F3F1EA] dark:hover:bg-[#312F2B] transition-colors cursor-pointer"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={saveEdit}
                      className="px-3.5 py-1.5 text-xs font-medium rounded-lg bg-[#C96442] hover:bg-[#B85737] dark:bg-[#D97757] text-white transition-colors cursor-pointer"
                    >
                      Salvar e reenviar
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="max-w-[88%] sm:max-w-[82%] rounded-2xl bg-[#EFECE3] dark:bg-[#2A2825] px-4 py-3 text-[0.96875rem] leading-relaxed text-[#1F1E1C] dark:text-[#F2EFE9]">
                    {msg.attachments && msg.attachments.length > 0 && (
                      <div className="flex flex-wrap gap-2 mb-2.5">
                        {msg.attachments.map((att) =>
                          att.kind === 'image' && att.previewUrl ? (
                            <Image
                              key={att.id}
                              src={att.previewUrl}
                              alt={att.name}
                              width={220}
                              height={176}
                              referrerPolicy="no-referrer"
                              className="max-h-44 w-auto max-w-[220px] rounded-xl object-cover border border-[#DFDBD0] dark:border-[#3A3834]"
                            />
                          ) : (
                            <div
                              key={att.id}
                              className="inline-flex items-center gap-1.5 text-xs text-[#55524A] dark:text-[#C5C0B6] bg-[#FAF9F5]/80 dark:bg-[#1E1D1B] px-2.5 py-1.5 rounded-lg border border-[#E2DDD2] dark:border-[#35332E]"
                            >
                              <FileText className="w-3.5 h-3.5 shrink-0" />
                              <span className="truncate max-w-[180px]">{att.name}</span>
                            </div>
                          )
                        )}
                      </div>
                    )}
                    {msg.content && (
                      <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    )}
                  </div>

                  {!isStreaming && (
                    <div className="flex items-center gap-1 mt-1.5 opacity-75 sm:opacity-0 sm:group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => handleCopy(msg.id, msg.content)}
                        title="Copiar mensagem"
                        aria-label="Copiar mensagem"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-[#7D786E] dark:text-[#8E897F] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9] hover:bg-[#EFECE3] dark:hover:bg-[#2A2825] transition-colors cursor-pointer"
                      >
                        {copiedId === msg.id ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => startEdit(msg)}
                        title="Editar e reenviar"
                        aria-label="Editar e reenviar"
                        className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs text-[#7D786E] dark:text-[#8E897F] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9] hover:bg-[#EFECE3] dark:hover:bg-[#2A2825] transition-colors cursor-pointer"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </article>
          );
        }

        return (
          <article key={msg.id} className="group flex items-start gap-3.5">
            <div className="mt-0.5 shrink-0">
              <BrandLogo size="sm" active={isAssistantStreaming} />
            </div>

            <div className="flex-1 min-w-0">
              {msg.error ? (
                <div className="rounded-xl border border-red-300/80 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 px-4 py-3.5 space-y-2.5">
                  <div className="flex items-start gap-2.5 text-sm text-red-800 dark:text-red-300">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{msg.error}</p>
                  </div>
                  {!isStreaming && (
                    <button
                      type="button"
                      onClick={onRegenerate}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-[#252421] border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-950/50 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Tentar novamente</span>
                    </button>
                  )}
                </div>
              ) : msg.content ? (
                <>
                  <MarkdownRenderer
                    content={msg.content}
                    onOpenArtifact={onOpenArtifact}
                  />
                  {isAssistantStreaming && (
                    <span
                      aria-hidden="true"
                      className="inline-block w-1.5 h-4 ml-1 align-middle rounded-xs bg-[#C96442] dark:bg-[#D97757] animate-pulse"
                    />
                  )}
                </>
              ) : isAssistantStreaming ? (
                <p className="text-sm text-[#7D786E] dark:text-[#969187] pt-0.5">
                  Elaborando resposta...
                </p>
              ) : null}

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-4 pt-3 border-t border-[#E6E2D8] dark:border-[#2C2A26]">
                  <p className="text-xs font-medium text-[#6B675E] dark:text-[#9E998F] mb-2">
                    Fontes consultadas
                  </p>
                  <ul className="flex flex-wrap gap-x-4 gap-y-1.5">
                    {msg.sources.map((src, sIdx) => (
                      <li key={src.uri}>
                        <a
                          href={src.uri}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-xs text-[#55524A] dark:text-[#C5C0B6] hover:text-[#C96442] dark:hover:text-[#E28868] transition-colors"
                        >
                          <span className="font-mono text-[11px] text-[#8D887E] tabular-nums">
                            {sIdx + 1}.
                          </span>
                          <span className="underline underline-offset-2 decoration-[#D5D0C6] dark:decoration-[#3C3934] max-w-[260px] truncate">
                            {src.title}
                          </span>
                          <ExternalLink className="w-3 h-3 shrink-0 opacity-60" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {!isAssistantStreaming && msg.content && !msg.error && (
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-3 opacity-80 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={() => handleCopy(msg.id, msg.content)}
                    className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-[#7D786E] dark:text-[#8E897F] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9] hover:bg-[#EFECE3] dark:hover:bg-[#2A2825] transition-colors cursor-pointer"
                  >
                    {copiedId === msg.id ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                        <span>Copiado</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Copiar</span>
                      </>
                    )}
                  </button>

                  {isLast && (
                    <button
                      type="button"
                      onClick={onRegenerate}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs text-[#7D786E] dark:text-[#8E897F] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9] hover:bg-[#EFECE3] dark:hover:bg-[#2A2825] transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Regenerar</span>
                    </button>
                  )}

                  {msg.modelLabel && (
                    <span
                      title={
                        msg.routingReason
                          ? `${msg.modelLabel} — ${msg.routingReason}`
                          : msg.modelLabel
                      }
                      className="ml-auto text-[11px] text-[#8D887E] dark:text-[#78746B] truncate max-w-[260px] sm:max-w-[360px]"
                    >
                      {msg.modelLabel}
                      {msg.routingReason ? ` · ${msg.routingReason}` : ''}
                    </span>
                  )}
                </div>
              )}
            </div>
          </article>
        );
      })}
    </div>
  );
}
