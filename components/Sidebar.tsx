'use client';

import React, { useMemo, useState } from 'react';
import {
  Cable,
  Check,
  ChevronDown,
  ChevronRight,
  Loader2,
  LogIn,
  LogOut,
  Moon,
  Network,
  PanelLeftClose,
  Pencil,
  Pin,
  Plus,
  Puzzle,
  Search,
  SlidersHorizontal,
  Sun,
  Trash2,
  X,
} from 'lucide-react';
import { BrandLogo, BrandWordmark } from './BrandLogo';
import PWAInstallButton from './PWAInstallButton';
import type { HardWorkUser } from './FirebaseAuthProvider';
import type { ActiveSection, Conversation } from '@/lib/types';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string | null;
  activeSection: ActiveSection;
  activePluginsCount: number;
  connectedMcpCount: number;
  configuredProvidersCount: number;
  user: HardWorkUser | null;
  signingIn: boolean;
  isOpen: boolean;
  isDark: boolean;
  hasCustomInstructions: boolean;
  onSelect: (id: string) => void;
  onSelectSection: (section: ActiveSection) => void;
  onNewChat: () => void;
  onDelete: (id: string) => void;
  onRename: (id: string, title: string) => void;
  onTogglePin: (id: string) => void;
  onClose: () => void;
  onToggleTheme: () => void;
  onOpenInstructions: () => void;
  onSignIn: () => void;
  onLogout: () => void;
}

function groupConversations(items: Conversation[]) {
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;
  const sevenDays = 7 * oneDay;

  const pinned: Conversation[] = [];
  const today: Conversation[] = [];
  const week: Conversation[] = [];
  const older: Conversation[] = [];

  for (const conv of items) {
    if (conv.pinned) {
      pinned.push(conv);
      continue;
    }
    const diff = now - conv.updatedAt;
    if (diff < oneDay) {
      today.push(conv);
    } else if (diff < sevenDays) {
      week.push(conv);
    } else {
      older.push(conv);
    }
  }

  return [
    { label: 'Fixadas', items: pinned },
    { label: 'Hoje', items: today },
    { label: 'Últimos 7 dias', items: week },
    { label: 'Anteriores', items: older },
  ].filter((g) => g.items.length > 0);
}

export default function Sidebar({
  conversations,
  activeId,
  activeSection,
  activePluginsCount,
  connectedMcpCount,
  configuredProvidersCount,
  user,
  signingIn,
  isOpen,
  isDark,
  hasCustomInstructions,
  onSelect,
  onSelectSection,
  onNewChat,
  onDelete,
  onRename,
  onTogglePin,
  onClose,
  onToggleTheme,
  onOpenInstructions,
  onSignIn,
  onLogout,
}: SidebarProps) {
  const [search, setSearch] = useState('');
  const [manageExpanded, setManageExpanded] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');

  const manageItems: Array<{
    id: Exclude<ActiveSection, 'chat'>;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    count?: number;
  }> = [
    { id: 'plugins', label: 'Plugins', icon: Puzzle, count: activePluginsCount },
    {
      id: 'mcp',
      label: "Conectores (MCP's)",
      icon: Cable,
      count: connectedMcpCount,
    },
    {
      id: 'gateway',
      label: "Gateway de IA's",
      icon: Network,
      count: configuredProvidersCount,
    },
  ];

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const sorted = [...conversations].sort((a, b) => b.updatedAt - a.updatedAt);
    if (!q) return sorted;
    return sorted.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.messages.some((m) => m.content.toLowerCase().includes(q))
    );
  }, [conversations, search]);

  const groups = useMemo(() => groupConversations(filtered), [filtered]);

  const startEditing = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditingTitle(conv.title);
  };

  const commitRename = () => {
    if (editingId) {
      const cleaned = editingTitle.trim();
      if (cleaned) {
        onRename(editingId, cleaned);
      }
      setEditingId(null);
      setEditingTitle('');
    }
  };

  return (
    <>
      {isOpen && (
        <div
          aria-hidden="true"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-black/30 lg:hidden"
        />
      )}

      <aside
        aria-label="Histórico de conversas"
        className={`fixed lg:static inset-y-0 left-0 z-40 flex flex-col w-[268px] shrink-0 bg-[#F3F1EA] dark:bg-[#141312] border-r border-[#E6E2D8] dark:border-[#262522] transition-transform duration-200 ease-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:hidden'
        }`}
      >
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <button
            type="button"
            onClick={onNewChat}
            className="flex items-center gap-2.5 text-left group cursor-pointer"
          >
            <BrandLogo
              size="md"
              className="transition-transform duration-200 group-hover:scale-[1.04]"
            />
            <BrandWordmark className="text-[1.15rem]" />
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Recolher barra lateral"
            aria-label="Recolher barra lateral"
            className="p-2 rounded-lg text-[#6B675E] dark:text-[#9E998F] hover:bg-[#E7E3D8] dark:hover:bg-[#23221F] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9] transition-colors cursor-pointer"
          >
            <PanelLeftClose className="w-4 h-4" />
          </button>
        </div>

        <div className="px-3 pb-3 space-y-3">
          <button
            type="button"
            onClick={onNewChat}
            className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl bg-[#FAF9F5] dark:bg-[#21201D] border border-[#E2DDD2] dark:border-[#2F2D29] hover:border-[#C96442]/60 dark:hover:border-[#D97757]/60 text-sm font-medium text-[#1F1E1C] dark:text-[#F2EFE9] transition-colors cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 text-[#C96442] dark:text-[#D97757] shrink-0" />
            <span>Nova conversa</span>
          </button>

          <div className="pt-0.5 space-y-1">
            <button
              type="button"
              onClick={() => setManageExpanded((prev) => !prev)}
              aria-expanded={manageExpanded}
              className="w-full flex items-center justify-between px-2 py-1 rounded-md text-[11px] font-medium text-[#7D786E] dark:text-[#8E897F] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9] transition-colors cursor-pointer"
            >
              <span>Gerenciar</span>
              {manageExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </button>

            {manageExpanded && (
              <ul className="space-y-0.5 pl-1">
                {manageItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeSection === item.id;
                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => onSelectSection(item.id)}
                        className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg text-[13px] transition-colors cursor-pointer whitespace-nowrap ${
                          isActive
                            ? 'bg-[#E6E2D7] dark:bg-[#262522] text-[#1F1E1C] dark:text-[#F2EFE9] font-medium'
                            : 'text-[#4A4740] dark:text-[#C5C0B6] hover:bg-[#EAE6DC]/75 dark:hover:bg-[#1E1D1B]'
                        }`}
                      >
                        <span className="flex items-center gap-2.5 min-w-0">
                          <Icon
                            className={`w-3.5 h-3.5 shrink-0 ${
                              isActive
                                ? 'text-[#C96442] dark:text-[#D97757]'
                                : 'text-[#7D786E] dark:text-[#969187]'
                            }`}
                          />
                          <span className="truncate">{item.label}</span>
                        </span>
                        {typeof item.count === 'number' && item.count > 0 && (
                          <span className="text-[11px] font-mono tabular-nums text-[#7D786E] dark:text-[#8E897F] shrink-0">
                            {item.count}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {conversations.length > 0 && (
            <div className="pt-2 border-t border-[#E6E2D8] dark:border-[#262522]">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[#8A857B] dark:text-[#757067] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Buscar conversas"
                  aria-label="Buscar conversas"
                  className="w-full pl-8 pr-7 py-1.5 rounded-lg bg-[#EAE6DC]/70 dark:bg-[#1C1B19] text-xs text-[#1F1E1C] dark:text-[#EAE6DF] placeholder:text-[#8A857B] dark:placeholder:text-[#757067] focus:outline-none focus:ring-1 focus:ring-[#C96442]/50"
                />
                {search && (
                  <button
                    type="button"
                    onClick={() => setSearch('')}
                    aria-label="Limpar busca"
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-[#8A857B] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9] cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        <nav className="flex-1 overflow-y-auto px-2 pb-3 space-y-4">
          {groups.length === 0 ? (
            <div className="px-3 py-8 text-center">
              <p className="text-xs text-[#7D786E] dark:text-[#847F76] leading-relaxed">
                {search
                  ? 'Nenhuma conversa encontrada para esta busca.'
                  : 'Suas conversas aparecerão aqui automaticamente.'}
              </p>
            </div>
          ) : (
            groups.map((group) => (
              <div key={group.label}>
                <div className="px-2.5 pb-1.5 text-[11px] font-medium text-[#7D786E] dark:text-[#847F76]">
                  {group.label}
                </div>
                <ul className="space-y-0.5">
                  {group.items.map((conv) => {
                    const isActive = activeSection === 'chat' && conv.id === activeId;
                    const isEditing = editingId === conv.id;

                    return (
                      <li key={conv.id} className="group relative">
                        {isEditing ? (
                          <div className="flex items-center gap-1 px-2 py-1.5 rounded-lg bg-white dark:bg-[#252421] border border-[#C96442]/60">
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={(e) => setEditingTitle(e.target.value)}
                              onBlur={commitRename}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') commitRename();
                                if (e.key === 'Escape') {
                                  setEditingId(null);
                                  setEditingTitle('');
                                }
                              }}
                              autoFocus
                              className="w-full bg-transparent text-[13px] text-[#1F1E1C] dark:text-[#F2EFE9] focus:outline-none"
                            />
                            <button
                              type="button"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                commitRename();
                              }}
                              aria-label="Salvar título"
                              className="p-0.5 text-[#C96442] cursor-pointer"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            className={`flex items-center justify-between gap-1 rounded-lg transition-colors ${
                              isActive
                                ? 'bg-[#E6E2D7] dark:bg-[#262522] text-[#1F1E1C] dark:text-[#F2EFE9]'
                                : 'text-[#4A4740] dark:text-[#C5C0B6] hover:bg-[#EAE6DC]/75 dark:hover:bg-[#1E1D1B]'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() => onSelect(conv.id)}
                              className="flex-1 min-w-0 text-left px-2.5 py-2 text-[13px] truncate cursor-pointer"
                              title={conv.title}
                            >
                              {conv.title}
                            </button>

                            <div className="flex items-center pr-1.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onTogglePin(conv.id);
                                }}
                                title={conv.pinned ? 'Desafixar' : 'Fixar conversa'}
                                aria-label={conv.pinned ? 'Desafixar' : 'Fixar conversa'}
                                className={`p-1 rounded hover:bg-[#DBD6C9] dark:hover:bg-[#32302C] cursor-pointer ${
                                  conv.pinned
                                    ? 'text-[#C96442] dark:text-[#D97757]'
                                    : 'text-[#757067] dark:text-[#969187]'
                                }`}
                              >
                                <Pin className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditing(conv);
                                }}
                                title="Renomear"
                                aria-label="Renomear conversa"
                                className="p-1 rounded text-[#757067] dark:text-[#969187] hover:bg-[#DBD6C9] dark:hover:bg-[#32302C] cursor-pointer"
                              >
                                <Pencil className="w-3 h-3" />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  onDelete(conv.id);
                                }}
                                title="Excluir"
                                aria-label="Excluir conversa"
                                className="p-1 rounded text-[#757067] dark:text-[#969187] hover:text-red-600 dark:hover:text-red-400 hover:bg-[#DBD6C9] dark:hover:bg-[#32302C] cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))
          )}
        </nav>

        <div className="p-3 border-t border-[#E6E2D8] dark:border-[#262522] space-y-1.5">
          {user ? (
            <div className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-[#EAE6DC]/65 dark:bg-[#1E1D1B]">
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-7 h-7 rounded-full bg-[#C96442]/18 dark:bg-[#D97757]/22 text-[#C96442] dark:text-[#E28868] flex items-center justify-center text-[11px] font-semibold shrink-0">
                  {user.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#1F1E1C] dark:text-[#F2EFE9] truncate">
                    {user.displayName}
                  </p>
                  <p className="text-[11px] text-[#7D786E] dark:text-[#969187] truncate">
                    {user.email}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onLogout}
                title="Sair da conta"
                aria-label="Sair da conta HardWorkAI"
                className="p-1.5 rounded-md text-[#7D786E] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9] hover:bg-[#DFDBD0] dark:hover:bg-[#2C2A26] transition-colors cursor-pointer shrink-0"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              disabled={signingIn}
              onClick={onSignIn}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[#141720] hover:bg-[#232836] dark:bg-[#F2EFE9] dark:hover:bg-[#DFDBD2] text-white dark:text-[#141720] text-xs font-medium transition-colors cursor-pointer whitespace-nowrap disabled:opacity-60"
            >
              {signingIn ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogIn className="w-3.5 h-3.5" />
              )}
              <span>Entrar na HardWorkAI</span>
            </button>
          )}

          <PWAInstallButton variant="sidebar" />

          <button
            type="button"
            onClick={onOpenInstructions}
            className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-medium text-[#4A4740] dark:text-[#C5C0B6] hover:bg-[#E7E3D8] dark:hover:bg-[#22211E] transition-colors cursor-pointer"
          >
            <span className="flex items-center gap-2 whitespace-nowrap">
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Instruções personalizadas</span>
            </span>
            {hasCustomInstructions && (
              <span className="text-[11px] text-[#C96442] dark:text-[#D97757]">Ativo</span>
            )}
          </button>

          <button
            type="button"
            onClick={onToggleTheme}
            className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-xs font-medium text-[#4A4740] dark:text-[#C5C0B6] hover:bg-[#E7E3D8] dark:hover:bg-[#22211E] transition-colors cursor-pointer whitespace-nowrap"
          >
            {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{isDark ? 'Tema claro' : 'Tema escuro'}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
