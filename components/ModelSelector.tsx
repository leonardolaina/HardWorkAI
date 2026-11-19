'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Cpu,
  KeyRound,
  Plus,
  Search,
  Settings2,
  Shuffle,
  X,
} from 'lucide-react';
import { type AiModelChoice } from '@/lib/types';
import {
  useModelPreference,
  type ProviderOptionGroup,
} from './ModelPreferenceProvider';

export interface ModelSelectorProps {
  onOpenGateway?: (providerId?: string) => void;
  onAfterSelect?: (choice: AiModelChoice) => void;
  placement?: 'top' | 'bottom';
  align?: 'left' | 'right';
  variant?: 'header' | 'composer';
}

export default function ModelSelector({
  onOpenGateway,
  onAfterSelect,
  placement = 'bottom',
  variant = 'header',
}: ModelSelectorProps) {
  const { providerGroups, availableModels, activeModel, setModelPreference } =
    useModelPreference();

  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [focusedProviderId, setFocusedProviderId] = useState<string>(
    activeModel.source === 'auto' ? 'auto' : activeModel.providerId
  );

  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleToggle = () => {
    if (open) {
      setOpen(false);
      setQuery('');
      return;
    }
    const currentGroupId =
      activeModel.source === 'auto' ? 'auto' : activeModel.providerId;
    setFocusedProviderId(currentGroupId);
    setQuery('');
    setOpen(true);
  };

  const closeMenu = useCallback(() => {
    setOpen(false);
    setQuery('');
  }, []);

  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeMenu();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      window.requestAnimationFrame(() => searchInputRef.current?.focus());
    }

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeMenu, open]);

  const normalizedQuery = query.trim().toLowerCase();

  const activeProviderGroup: ProviderOptionGroup = useMemo(() => {
    return (
      providerGroups.find((g) => g.id === focusedProviderId) ??
      providerGroups[0]
    );
  }, [focusedProviderId, providerGroups]);

  const searchMatches = useMemo(() => {
    if (!normalizedQuery) return [];
    return availableModels.filter((item) => {
      return (
        item.label.toLowerCase().includes(normalizedQuery) ||
        item.shortLabel.toLowerCase().includes(normalizedQuery) ||
        item.providerName.toLowerCase().includes(normalizedQuery) ||
        item.modelId.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery) ||
        (item.source === 'builtin' && 'gemini'.includes(normalizedQuery))
      );
    });
  }, [availableModels, normalizedQuery]);

  const handleSelectModel = (item: AiModelChoice) => {
    setModelPreference(item.id);
    onAfterSelect?.(item);
    closeMenu();
  };

  const isAuto = activeModel.source === 'auto';
  const needsKey = activeModel.source === 'gateway' && !activeModel.configured;

  const panelPositionClass =
    placement === 'top'
      ? 'bottom-20 sm:bottom-24'
      : 'top-14 sm:top-16';

  const popoverContent =
    open && typeof document !== 'undefined'
      ? createPortal(
          <>
            <div
              aria-hidden="true"
              onClick={closeMenu}
              className="fixed inset-0 z-[90] bg-black/15 dark:bg-black/35 backdrop-blur-[1px]"
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Selecionar provedor e modelo de IA"
              className={`fixed ${panelPositionClass} inset-x-3 sm:inset-x-auto sm:left-1/2 sm:-translate-x-1/2 sm:w-[540px] max-w-[calc(100vw-1.5rem)] z-[100] rounded-xl border border-[#E2DDD2] dark:border-[#35332E] bg-white dark:bg-[#22211E] shadow-2xl flex flex-col overflow-hidden`}
            >
              {/* Header + Search */}
              <div className="p-2.5 border-b border-[#ECE8DF] dark:border-[#2F2D29] space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-xs font-semibold text-[#1F1E1C] dark:text-[#F2EFE9]">
                    Escolher provedor e modelo
                  </span>
                  <button
                    type="button"
                    onClick={closeMenu}
                    aria-label="Fechar seletor de modelo"
                    className="p-1 rounded-md text-[#8D887E] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9] hover:bg-[#F3F1EA] dark:hover:bg-[#2B2926] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="relative flex items-center">
                  <Search className="w-3.5 h-3.5 text-[#8D887E] dark:text-[#7F7A70] absolute left-2.5 pointer-events-none" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Buscar provedor ou modelo (OpenAI, Claude, Gemini, GPT...)"
                    aria-label="Buscar provedor ou modelo"
                    className="w-full h-8 pl-8 pr-7 rounded-lg bg-[#FAF9F5] dark:bg-[#1B1A18] border border-[#E5E1D8] dark:border-[#32302C] text-xs text-[#1F1E1C] dark:text-[#F2EFE9] placeholder:text-[#8D887E] dark:placeholder:text-[#757067] focus:outline-none focus:border-[#C96442]/60 dark:focus:border-[#D97757]/60"
                  />
                  {query && (
                    <button
                      type="button"
                      onClick={() => setQuery('')}
                      aria-label="Limpar busca"
                      className="absolute right-2 p-0.5 text-[#8D887E] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9] cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              </div>

              {normalizedQuery ? (
                <div className="max-h-[55dvh] overflow-y-auto p-2 space-y-1">
                  {searchMatches.length === 0 ? (
                    <div className="px-3 py-8 text-center text-xs text-[#7D786E] dark:text-[#969187]">
                      Nenhum provedor ou modelo encontrado para &ldquo;{query}
                      &rdquo;.
                    </div>
                  ) : (
                    searchMatches.map((item) => {
                      const selected = item.id === activeModel.id;
                      const itemNeedsKey =
                        item.source === 'gateway' && !item.configured;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          onClick={() => handleSelectModel(item)}
                          className={`w-full flex items-start justify-between gap-2 px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                            selected
                              ? 'bg-[#F3F1EA] dark:bg-[#2E2C28]'
                              : 'hover:bg-[#FAF9F5] dark:hover:bg-[#292724]'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-[#1F1E1C] dark:text-[#F2EFE9]">
                              {item.source === 'auto' ? (
                                <Shuffle className="w-3.5 h-3.5 text-[#C96442] dark:text-[#E28868] shrink-0" />
                              ) : (
                                <Cpu className="w-3.5 h-3.5 text-[#7D786E] dark:text-[#9E998F] shrink-0" />
                              )}
                              <span className="truncate">{item.label}</span>
                              {itemNeedsKey && (
                                <span className="text-[10px] font-medium text-amber-700 dark:text-amber-400 shrink-0">
                                  · Chave pendente
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#7D786E] dark:text-[#969187] truncate mt-0.5">
                              {item.description}
                            </div>
                          </div>
                          {selected && (
                            <Check className="w-3.5 h-3.5 text-[#C96442] dark:text-[#D97757] shrink-0 mt-0.5" />
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              ) : (
                <div className="flex flex-col sm:flex-row max-h-[60dvh] sm:h-[340px] overflow-hidden">
                  {/* Column 1: Providers */}
                  <div className="sm:w-[205px] shrink-0 border-b sm:border-b-0 sm:border-r border-[#ECE8DF] dark:border-[#2F2D29] bg-[#FAF9F5]/70 dark:bg-[#1B1A18]/70 p-1.5 overflow-x-auto sm:overflow-y-auto">
                    <div className="hidden sm:block px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#8D887E] dark:text-[#8E897F]">
                      1. Provedor
                    </div>
                    <div className="flex sm:flex-col gap-1">
                      {providerGroups.map((group) => {
                        const isFocused = group.id === activeProviderGroup?.id;
                        const containsActive = group.models.some(
                          (m) => m.id === activeModel.id
                        );
                        return (
                          <button
                            key={group.id}
                            type="button"
                            onClick={() => setFocusedProviderId(group.id)}
                            className={`flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left text-xs transition-colors whitespace-nowrap sm:whitespace-normal shrink-0 cursor-pointer ${
                              isFocused
                                ? 'bg-white dark:bg-[#2B2926] text-[#1F1E1C] dark:text-[#F2EFE9] font-medium shadow-xs border border-[#E5E1D8] dark:border-[#3A3834]'
                                : 'text-[#55524A] dark:text-[#B5B0A6] hover:bg-[#EFECE3]/70 dark:hover:bg-[#262522] border border-transparent'
                            }`}
                          >
                            <span className="flex items-center gap-1.5 min-w-0">
                              {group.id === 'auto' ? (
                                <Shuffle className="w-3.5 h-3.5 text-[#C96442] dark:text-[#E28868] shrink-0" />
                              ) : (
                                <span
                                  className={`w-2 h-2 rounded-full shrink-0 ${
                                    group.configured
                                      ? 'bg-emerald-500'
                                      : 'bg-amber-400/90 dark:bg-amber-500/80'
                                  }`}
                                />
                              )}
                              <span className="truncate">{group.name}</span>
                            </span>
                            {containsActive && (
                              <Check className="w-3 h-3 text-[#C96442] dark:text-[#D97757] shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Column 2: Models of focused provider */}
                  <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                    {activeProviderGroup && (
                      <>
                        <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-[#F0ECE3] dark:border-[#2C2A26] shrink-0">
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-[#8D887E] dark:text-[#8E897F] truncate">
                            2. Modelo · {activeProviderGroup.name}
                          </span>
                          {activeProviderGroup.isExternal && onOpenGateway && (
                            <button
                              type="button"
                              onClick={() => {
                                closeMenu();
                                onOpenGateway(activeProviderGroup.id);
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-medium text-[#C96442] dark:text-[#E28868] hover:underline shrink-0 cursor-pointer"
                            >
                              <Settings2 className="w-3 h-3" />
                              <span>
                                {activeProviderGroup.configured
                                  ? 'Editar chave'
                                  : 'Conectar chave'}
                              </span>
                            </button>
                          )}
                        </div>

                        <div className="flex-1 overflow-y-auto p-1.5 space-y-1">
                          {activeProviderGroup.models.map((item) => {
                            const selected = item.id === activeModel.id;
                            return (
                              <button
                                key={item.id}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                onClick={() => handleSelectModel(item)}
                                className={`w-full flex items-start justify-between gap-2 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                                  selected
                                    ? 'bg-[#F3F1EA] dark:bg-[#2E2C28]'
                                    : 'hover:bg-[#FAF9F5] dark:hover:bg-[#292724]'
                                }`}
                              >
                                <div className="min-w-0">
                                  <div className="text-xs font-medium text-[#1F1E1C] dark:text-[#F2EFE9] truncate">
                                    {item.source === 'gateway'
                                      ? item.shortLabel
                                      : item.label}
                                  </div>
                                  <div className="text-[11px] text-[#7D786E] dark:text-[#969187] leading-snug mt-0.5 truncate">
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

                        {activeProviderGroup.isExternal &&
                          !activeProviderGroup.configured &&
                          onOpenGateway && (
                            <div className="px-3 py-2 border-t border-[#ECE8DF] dark:border-[#2F2D29] bg-amber-50/75 dark:bg-amber-950/25 flex items-center justify-between gap-2 shrink-0">
                              <span className="flex items-center gap-1.5 text-[11px] text-amber-800 dark:text-amber-300 min-w-0">
                                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                                <span className="truncate">
                                  Adicione a chave de {activeProviderGroup.name}{' '}
                                  para responder
                                </span>
                              </span>
                              <button
                                type="button"
                                onClick={() => {
                                  closeMenu();
                                  onOpenGateway(activeProviderGroup.id);
                                }}
                                className="px-2.5 py-1 rounded-md bg-[#1F1E1C] dark:bg-[#F2EFE9] text-white dark:text-[#1F1E1C] text-[11px] font-medium whitespace-nowrap shrink-0 cursor-pointer"
                              >
                                Configurar
                              </button>
                            </div>
                          )}
                      </>
                    )}
                  </div>
                </div>
              )}

              {onOpenGateway && (
                <div className="p-1.5 border-t border-[#ECE8DF] dark:border-[#2F2D29] bg-[#FAF9F5]/80 dark:bg-[#1C1B19]/80">
                  <button
                    type="button"
                    onClick={() => {
                      closeMenu();
                      onOpenGateway();
                    }}
                    className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-[#C96442] dark:text-[#E28868] hover:bg-[#F3F1EA] dark:hover:bg-[#292724] transition-colors cursor-pointer"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Plus className="w-3.5 h-3.5 shrink-0" />
                      <span>Gerenciar todos os provedores no Gateway</span>
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-75" />
                  </button>
                </div>
              )}
            </div>
          </>,
          document.body
        )
      : null;

  return (
    <div className="relative min-w-0">
      <button
        type="button"
        onClick={handleToggle}
        aria-expanded={open}
        aria-haspopup="dialog"
        title={`Modelo ativo: ${activeModel.label}`}
        className={
          variant === 'header'
            ? 'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[#E2DDD2] dark:border-[#34322E] bg-white/95 dark:bg-[#23221F] hover:bg-[#F3F1EA] dark:hover:bg-[#2B2926] text-xs font-medium text-[#1F1E1C] dark:text-[#F2EFE9] shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors whitespace-nowrap shrink-0 cursor-pointer max-w-[215px] sm:max-w-[320px]'
            : 'inline-flex items-center gap-1.5 h-9 sm:h-8 px-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#373530] bg-[#FAF9F5] dark:bg-[#1E1D1A] hover:bg-[#F1EEE6] dark:hover:bg-[#2D2B27] text-xs font-medium text-[#2E2C28] dark:text-[#E8E4DB] transition-colors whitespace-nowrap shrink-0 cursor-pointer max-w-[165px] sm:max-w-[245px]'
        }
      >
        {isAuto ? (
          <Shuffle className="w-3.5 h-3.5 text-[#C96442] dark:text-[#E28868] shrink-0" />
        ) : (
          <Cpu
            className={`w-3.5 h-3.5 shrink-0 ${
              needsKey
                ? 'text-amber-600 dark:text-amber-400'
                : 'text-[#7D786E] dark:text-[#9E998F]'
            }`}
          />
        )}
        {variant === 'header' && (
          <span className="hidden lg:inline text-[#7D786E] dark:text-[#8E897F] font-normal">
            Modelo:
          </span>
        )}
        <span className="truncate sm:hidden">{activeModel.shortLabel}</span>
        <span className="hidden sm:inline truncate">{activeModel.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 opacity-70 shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {popoverContent}
    </div>
  );
}
