'use client';

import React, { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import {
  ArrowUp,
  Check,
  FileText,
  Globe,
  Paperclip,
  Sliders,
  Square,
  X,
} from 'lucide-react';
import ModelSelector from './ModelSelector';
import { useModelPreference } from './ModelPreferenceProvider';
import {
  RESPONSE_STYLES,
  type AiModelChoice,
  type Attachment,
  type ResponseStyle,
} from '@/lib/types';

interface ComposerProps {
  value: string;
  attachments: Attachment[];
  style: ResponseStyle;
  webSearch: boolean;
  isStreaming: boolean;
  placeholder?: string;
  autoFocus?: boolean;
  onChange: (value: string) => void;
  onAddAttachments: (files: FileList | File[]) => void;
  onRemoveAttachment: (id: string) => void;
  onModelSelected?: (choice: AiModelChoice) => void;
  onChangeStyle: (style: ResponseStyle) => void;
  onToggleWebSearch: () => void;
  onOpenGateway: (providerId?: string) => void;
  onSend: () => void;
  onStop: () => void;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function Composer({
  value,
  attachments,
  style,
  webSearch,
  isStreaming,
  placeholder = 'Como posso ajudar hoje?',
  autoFocus = false,
  onChange,
  onAddAttachments,
  onRemoveAttachment,
  onModelSelected,
  onChangeStyle,
  onToggleWebSearch,
  onOpenGateway,
  onSend,
  onStop,
}: ComposerProps) {
  const { activeModel } = useModelPreference();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const styleMenuRef = useRef<HTMLDivElement>(null);

  const [styleOpen, setStyleOpen] = useState(false);

  const activeStyle =
    RESPONSE_STYLES.find((s) => s.id === style) ?? RESPONSE_STYLES[0];
  const canSend = (value.trim().length > 0 || attachments.length > 0) && !isStreaming;

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [value]);

  useEffect(() => {
    if (autoFocus && typeof window !== 'undefined' && window.innerWidth >= 768) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  useEffect(() => {
    if (!styleOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (styleMenuRef.current && !styleMenuRef.current.contains(e.target as Node)) {
        setStyleOpen(false);
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setStyleOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('keydown', handleEscape);
    };
  }, [styleOpen]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        onSend();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const imageFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const f = items[i].getAsFile();
        if (f) imageFiles.push(f);
      }
    }
    if (imageFiles.length > 0) {
      e.preventDefault();
      onAddAttachments(imageFiles);
    }
  };

  const supportsWebSearch =
    activeModel.source === 'auto' ||
    activeModel.source === 'builtin' ||
    activeModel.providerId === 'google';

  return (
    <div className="relative rounded-2xl border border-[#DFDBD0] dark:border-[#34322E] bg-white dark:bg-[#252421] shadow-[0_2px_12px_rgba(31,30,28,0.05)] dark:shadow-[0_2px_16px_rgba(0,0,0,0.28)] focus-within:border-[#C96442]/65 dark:focus-within:border-[#D97757]/65 transition-colors">
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 px-3.5 sm:px-4 pt-3.5 pb-1">
          {attachments.map((att) => (
            <div
              key={att.id}
              className="group relative flex items-center gap-2.5 pl-2 pr-2.5 py-1.5 rounded-xl border border-[#E5E1D8] dark:border-[#35332E] bg-[#FAF9F5] dark:bg-[#1C1B19] max-w-[230px]"
            >
              {att.kind === 'image' && att.previewUrl ? (
                <Image
                  src={att.previewUrl}
                  alt={att.name}
                  width={36}
                  height={36}
                  referrerPolicy="no-referrer"
                  className="w-9 h-9 rounded-lg object-cover shrink-0 border border-[#E5E1D8] dark:border-[#35332E]"
                />
              ) : (
                <div className="w-9 h-9 rounded-lg bg-[#EFECE3] dark:bg-[#2A2825] flex items-center justify-center shrink-0">
                  <FileText className="w-4 h-4 text-[#6B675E] dark:text-[#A19C92]" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="text-xs font-medium text-[#1F1E1C] dark:text-[#F2EFE9] truncate">
                  {att.name}
                </p>
                <p className="text-[11px] text-[#7D786E] dark:text-[#8E897F] tabular-nums">
                  {formatBytes(att.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onRemoveAttachment(att.id)}
                aria-label={`Remover ${att.name}`}
                className="p-1 rounded-md text-[#7D786E] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9] hover:bg-[#E7E3D8] dark:hover:bg-[#2F2D29] transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="px-3.5 sm:px-4 pt-3.5 pb-2">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder={placeholder}
          rows={1}
          aria-label="Mensagem para a HardWorkAI"
          className="w-full bg-transparent text-base sm:text-[0.96875rem] leading-relaxed text-[#1F1E1C] dark:text-[#F2EFE9] placeholder:text-[#8D887E] dark:placeholder:text-[#78746B] resize-none focus:outline-none min-h-[28px] max-h-[220px]"
        />
      </div>

      <div className="flex items-center justify-between gap-1.5 sm:gap-2 px-2.5 sm:px-3 pb-2.5 sm:pb-3 pt-1">
        <div className="flex items-center gap-0.5 sm:gap-1 min-w-0">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*,.txt,.md,.json,.csv,.ts,.tsx,.js,.jsx,.py,.html,.css,.sql,.xml,.yaml,.yml"
            onChange={(e) => {
              if (e.target.files && e.target.files.length > 0) {
                onAddAttachments(e.target.files);
                e.target.value = '';
              }
            }}
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            title="Anexar imagem ou arquivo de texto"
            aria-label="Anexar arquivo"
            className="inline-flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-lg text-[#6B675E] dark:text-[#A19C92] hover:bg-[#F3F1EA] dark:hover:bg-[#312F2B] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9] transition-colors cursor-pointer shrink-0"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          {supportsWebSearch && (
            <button
              type="button"
              onClick={onToggleWebSearch}
              aria-pressed={webSearch}
              title="Usar busca na web em tempo real"
              className={`inline-flex items-center justify-center sm:justify-start gap-1.5 h-9 sm:h-8 px-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                webSearch
                  ? 'bg-[#C96442]/12 dark:bg-[#D97757]/18 text-[#B55433] dark:text-[#EC9A7E]'
                  : 'text-[#6B675E] dark:text-[#A19C92] hover:bg-[#F3F1EA] dark:hover:bg-[#312F2B] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9]'
              }`}
            >
              <Globe className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="hidden sm:inline">Buscar na web</span>
            </button>
          )}

          <div ref={styleMenuRef} className="relative">
            <button
              type="button"
              onClick={() => setStyleOpen((prev) => !prev)}
              aria-expanded={styleOpen}
              title="Estilo de resposta"
              className={`inline-flex items-center justify-center sm:justify-start gap-1.5 h-9 sm:h-8 px-2.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                style !== 'normal'
                  ? 'bg-[#EFECE3] dark:bg-[#312F2B] text-[#1F1E1C] dark:text-[#F2EFE9]'
                  : 'text-[#6B675E] dark:text-[#A19C92] hover:bg-[#F3F1EA] dark:hover:bg-[#312F2B] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9]'
              }`}
            >
              <Sliders className="w-4 h-4 sm:w-3.5 sm:h-3.5 shrink-0" />
              <span className="hidden sm:inline">{activeStyle.label}</span>
            </button>

            {styleOpen && (
              <div className="absolute left-0 bottom-full mb-2 w-[min(17rem,calc(100vw-2rem))] rounded-xl border border-[#E2DDD2] dark:border-[#35332E] bg-white dark:bg-[#22211E] shadow-lg p-1.5 z-30">
                <div className="px-2.5 py-1.5 text-[11px] font-medium text-[#7D786E] dark:text-[#8E897F]">
                  Estilo de resposta
                </div>
                {RESPONSE_STYLES.map((item) => {
                  const selected = item.id === style;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => {
                        onChangeStyle(item.id);
                        setStyleOpen(false);
                      }}
                      className={`w-full flex items-start justify-between gap-2 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#F3F1EA] dark:bg-[#2E2C28]'
                          : 'hover:bg-[#FAF9F5] dark:hover:bg-[#292724]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-[#1F1E1C] dark:text-[#F2EFE9]">
                          {item.label}
                        </div>
                        <div className="text-[11px] text-[#7D786E] dark:text-[#969187] leading-snug mt-0.5">
                          {item.description}
                        </div>
                      </div>
                      {selected && (
                        <Check className="w-3.5 h-3.5 text-[#C96442] dark:text-[#D97757] shrink-0 mt-0.5" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
          <ModelSelector
            onOpenGateway={onOpenGateway}
            onAfterSelect={onModelSelected}
            placement="top"
            align="right"
            variant="composer"
          />

          {isStreaming ? (
            <button
              type="button"
              onClick={onStop}
              aria-label="Interromper resposta"
              title="Interromper resposta"
              className="inline-flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-lg bg-[#1F1E1C] dark:bg-[#F2EFE9] text-[#FAF9F5] dark:text-[#1B1A18] hover:opacity-90 transition-opacity cursor-pointer shrink-0"
            >
              <Square className="w-3.5 h-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onSend}
              disabled={!canSend}
              aria-label="Enviar mensagem"
              title="Enviar mensagem (Enter)"
              className={`inline-flex items-center justify-center w-9 h-9 sm:w-8 sm:h-8 rounded-lg transition-colors shrink-0 ${
                canSend
                  ? 'bg-[#C96442] hover:bg-[#B85737] dark:bg-[#D97757] dark:hover:bg-[#C96442] text-white cursor-pointer'
                  : 'bg-[#E8E4DA] dark:bg-[#32302C] text-[#A8A399] dark:text-[#635F57] cursor-not-allowed'
              }`}
            >
              <ArrowUp className="w-4 h-4" strokeWidth={2.3} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
