'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Check,
  ChevronDown,
  ChevronRight,
  Cpu,
  Plus,
  Search,
  Settings2,
  Shuffle,
  X,
} from 'lucide-react';
import { FEATURED_PROVIDERS } from '@/lib/providers';
import { BUILTIN_AI_MODELS, type AiModelChoice } from '@/lib/types';

const QUICK_CONNECT_PROVIDER_IDS = [
  'openai',
  'anthropic',
  'openrouter',
  'deepseek',
  'mistral',
  'google',
];

interface ModelSelectorMenuProps {
  availableModels: AiModelChoice[];
  selectedModelId: string;
  onChangeModel: (modelId: string) => void;
  onOpenGateway: (providerId?: string) => void;
  placement?: 'top' | 'bottom';
  align?: 'left' | 'right';
  variant?: 'composer' | 'header';
}

export default function ModelSelectorMenu({
  availableModels,
  selectedModelId,
  onChangeModel,
  onOpenGateway,
  placement = 'top',
  align = 'right',
  variant = 'composer',
}: ModelSelectorMenuProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const activeModel =
    availableModels.find((m) => m.id === selectedModelId) ??
    availableModels[0] ??
    BUILTIN_AI_MODELS[0];

  const normalizedQuery = query.trim().toLowerCase();

  const {
    autoModels,
    builtinModels,
    gatewayGroups,
    unconfiguredProviders,
    hasAnyMatch,
  } = useMemo(() => {
    const matchesModel = (item: AiModelChoice) => {
      if (!normalizedQuery) return true;
      return (
        item.label.toLowerCase().includes(normalizedQuery) ||
        item.shortLabel.toLowerCase().includes(normalizedQuery) ||
        item.providerName.toLowerCase().includes(normalizedQuery) ||
        item.modelId.toLowerCase().includes(normalizedQuery) ||
        item.description.toLowerCase().includes(normalizedQuery) ||
        (item.source === 'builtin' && 'gemini'.includes(normalizedQuery))
      );
    };

    const auto = availableModels.filter(
      (m) => m.source === 'auto' && matchesModel(m)
    );
    const builtin = availableModels.filter(
      (m) => m.source === 'builtin' && matchesModel(m)
    );

    const configuredProviderIds = new Set<string>();
    const groupsMap = new Map<
      string,
      { providerName: string; items: AiModelChoice[] }
    >();

    for (const item of availableModels) {
      if (item.source !== 'gateway') continue;
      configuredProviderIds.add(item.providerId);
      if (!matchesModel(item)) continue;
      const existing = groupsMap.get(item.providerId);
      if (existing) {
        existing.items.push(item);
      } else {
        groupsMap.set(item.providerId, {
          providerName: item.providerName,
          items: [item],
        });
      }
    }

    const unconfigured = QUICK_CONNECT_PROVIDER_IDS.map((id) =>
      FEATURED_PROVIDERS.find((p) => p.id === id)
    )
      .filter((p): p is NonNullable<typeof p> => Boolean(p))
      .filter((p) => !configuredProviderIds.has(p.id))
      .filter((p) => {
        if (!normalizedQuery) return true;
        return (
          p.name.toLowerCase().includes(normalizedQuery) ||
          (p.subtitle?.toLowerCase().includes(normalizedQuery) ?? false) ||
          (p.sampleModels?.some((m) => m.toLowerCase().includes(normalizedQuery)) ??
            false)
        );
      });

    const groups = Array.from(groupsMap.entries());
    const anyMatch =
      auto.length > 0 ||
      builtin.length > 0 ||
      groups.length > 0 ||
      unconfigured.length > 0;

    return {
      autoModels: auto,
      builtinModels: builtin,
      gatewayGroups: groups,
      unconfiguredProviders: unconfigured,
      hasAnyMatch: anyMatch,
    };
  }, [availableModels, normalizedQuery]);

  useEffect(() => {
    if (!open) return;
    const handleOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleOutside);
    window.addEventListener('keydown', handleKey);

    if (typeof window !== 'undefined' && window.innerWidth >= 768) {
      window.requestAnimationFrame(() => searchInputRef.current?.focus());
    }

    return () => {
      document.removeEventListener('mousedown', handleOutside);
      window.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  const handleToggleOpen = () => {
    setOpen((prev) => {
      if (prev) setQuery('');
      return !prev;
    });
  };

  const closeMenu = () => {
    setOpen(false);
    setQuery('');
  };

  const isAuto = activeModel.source === 'auto';
  const positionClass =
    placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2';
  const alignClass = align === 'left' ? 'left-0' : 'right-0';

  return (
    <div ref={containerRef} className="relative min-w-0">
      <button
        type="button"
        onClick={handleToggleOpen}
        aria-expanded={open}
        aria-haspopup="listbox"
        title={`Modelo ativo: ${activeModel.label}`}
        className={
          variant === 'header'
            ? 'inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#32302C] bg-white/85 dark:bg-[#23221F] hover:bg-[#F3F1EA] dark:hover:bg-[#2B2926] text-xs font-medium text-[#2E2C28] dark:text-[#E8E4DB] transition-colors whitespace-nowrap shrink-0 cursor-pointer max-w-[195px] sm:max-w-[270px]'
            : 'inline-flex items-center gap-1.5 h-9 sm:h-8 px-2.5 rounded-lg border border-[#E5E1D8] dark:border-[#373530] bg-[#FAF9F5] dark:bg-[#1E1D1A] hover:bg-[#F1EEE6] dark:hover:bg-[#2D2B27] text-xs font-medium text-[#2E2C28] dark:text-[#E8E4DB] transition-colors whitespace-nowrap shrink-0 cursor-pointer max-w-[165px] sm:max-w-[245px]'
        }
      >
        {isAuto ? (
          <Shuffle className="w-3.5 h-3.5 text-[#C96442] dark:text-[#E28868] shrink-0" />
        ) : (
          <Cpu className="w-3.5 h-3.5 text-[#7D786E] dark:text-[#9E998F] shrink-0" />
        )}
        <span className="truncate sm:hidden">{activeModel.shortLabel}</span>
        <span className="hidden sm:inline truncate">{activeModel.label}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 opacity-70 shrink-0 transition-transform ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Selecionar modelo de IA"
          className={`absolute ${alignClass} ${positionClass} w-[min(23rem,calc(100vw-1.5rem))] rounded-xl border border-[#E2DDD2] dark:border-[#35332E] bg-white dark:bg-[#22211E] shadow-xl z-40 flex flex-col overflow-hidden`}
        >
          {/* Search input */}
          <div className="p-2 border-b border-[#ECE8DF] dark:border-[#2F2D29]">
            <div className="relative flex items-center">
              <Search className="w-3.5 h-3.5 text-[#8D887E] dark:text-[#7F7A70] absolute left-2.5 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Buscar modelo ou provedor (OpenAI, Claude, Gemini...)"
                aria-label="Buscar modelo ou provedor"
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

          <div className="max-h-[56dvh] overflow-y-auto p-1.5 space-y-1.5">
            {!hasAnyMatch && (
              <div className="px-3 py-6 text-center text-xs text-[#7D786E] dark:text-[#969187]">
                Nenhum modelo ou provedor encontrado para &ldquo;{query}&rdquo;.
              </div>
            )}

            {/* Automatic selection section */}
            {autoModels.length > 0 && (
              <div>
                <div className="px-2.5 py-1 text-[11px] font-medium text-[#7D786E] dark:text-[#8E897F]">
                  Seleção automática
                </div>
                {autoModels.map((item) => {
                  const selected = item.id === activeModel.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        onChangeModel(item.id);
                        closeMenu();
                      }}
                      className={`w-full flex items-start justify-between gap-2 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                        selected
                          ? 'bg-[#F3F1EA] dark:bg-[#2E2C28]'
                          : 'hover:bg-[#FAF9F5] dark:hover:bg-[#292724]'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-[#1F1E1C] dark:text-[#F2EFE9]">
                          <Shuffle className="w-3.5 h-3.5 text-[#C96442] dark:text-[#E28868] shrink-0" />
                          <span className="truncate">{item.label}</span>
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

            {/* Built-in Gemini (HardWorkAI) section */}
            {builtinModels.length > 0 && (
              <div className="pt-1.5 border-t border-[#ECE8DF] dark:border-[#2F2D29]">
                <div className="flex items-center justify-between px-2.5 py-1">
                  <span className="text-[11px] font-medium text-[#7D786E] dark:text-[#8E897F]">
                    Gemini · HardWorkAI integrado
                  </span>
                  <span className="text-[10px] font-medium text-emerald-700 dark:text-emerald-400">
                    Ativo
                  </span>
                </div>
                {builtinModels.map((item) => {
                  const selected = item.id === activeModel.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      role="option"
                      aria-selected={selected}
                      onClick={() => {
                        onChangeModel(item.id);
                        closeMenu();
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

            {/* Connected Gateway Providers */}
            {gatewayGroups.length > 0 && (
              <div className="pt-1.5 border-t border-[#ECE8DF] dark:border-[#2F2D29] space-y-1.5">
                {gatewayGroups.map(([providerId, group]) => (
                  <div key={providerId}>
                    <div className="flex items-center justify-between px-2.5 py-1">
                      <span className="text-[11px] font-medium text-[#7D786E] dark:text-[#8E897F] truncate">
                        {group.providerName}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          closeMenu();
                          onOpenGateway(providerId);
                        }}
                        title={`Configurar ${group.providerName}`}
                        className="inline-flex items-center gap-1 text-[10px] font-medium text-[#7D786E] hover:text-[#1F1E1C] dark:text-[#969187] dark:hover:text-[#F2EFE9] cursor-pointer"
                      >
                        <Settings2 className="w-3 h-3" />
                        <span>Editar</span>
                      </button>
                    </div>
                    {group.items.map((item) => {
                      const selected = item.id === activeModel.id;
                      return (
                        <button
                          key={item.id}
                          type="button"
                          role="option"
                          aria-selected={selected}
                          onClick={() => {
                            onChangeModel(item.id);
                            closeMenu();
                          }}
                          className={`w-full flex items-start justify-between gap-2 px-2.5 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                            selected
                              ? 'bg-[#F3F1EA] dark:bg-[#2E2C28]'
                              : 'hover:bg-[#FAF9F5] dark:hover:bg-[#292724]'
                          }`}
                        >
                          <div className="min-w-0">
                            <div className="text-xs font-medium text-[#1F1E1C] dark:text-[#F2EFE9] truncate">
                              {item.shortLabel}
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
                    })}
                  </div>
                ))}
              </div>
            )}

            {/* Quick-connect unconfigured flagship providers */}
            {unconfiguredProviders.length > 0 && (
              <div className="pt-1.5 border-t border-[#ECE8DF] dark:border-[#2F2D29]">
                <div className="px-2.5 py-1 text-[11px] font-medium text-[#7D786E] dark:text-[#8E897F]">
                  Conectar outros provedores
                </div>
                {unconfiguredProviders.map((provider) => (
                  <button
                    key={provider.id}
                    type="button"
                    onClick={() => {
                      closeMenu();
                      onOpenGateway(provider.id);
                    }}
                    className="w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-left hover:bg-[#FAF9F5] dark:hover:bg-[#292724] transition-colors cursor-pointer"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-medium text-[#3F3D37] dark:text-[#D5D0C6] truncate">
                        {provider.name}
                      </div>
                      <div className="text-[11px] text-[#8D887E] dark:text-[#8E897F] truncate">
                        {provider.subtitle}
                      </div>
                    </div>
                    <span className="inline-flex items-center gap-0.5 text-[11px] font-medium text-[#C96442] dark:text-[#E28868] shrink-0">
                      <span>Configurar</span>
                      <ChevronRight className="w-3 h-3" />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer link to full Gateway catalog */}
          <div className="p-1.5 border-t border-[#ECE8DF] dark:border-[#2F2D29] bg-[#FAF9F5]/70 dark:bg-[#1C1B19]/70">
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
                <span>Ver todos os provedores no Gateway</span>
              </span>
              <ChevronRight className="w-3.5 h-3.5 shrink-0 opacity-75" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
