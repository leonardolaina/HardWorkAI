'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import {
  AlertCircle,
  ArrowLeft,
  Cable,
  Check,
  CheckCircle2,
  ExternalLink,
  Globe,
  Languages,
  Loader2,
  Lock,
  LogIn,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import {
  getMcpDisplayName,
  MCP_CATALOG,
  type McpCatalogItem,
  type McpConnectionRecord,
  type McpNameLanguage,
} from '@/lib/mcpCatalog';
import type { McpTransport } from '@/lib/types';
import type { HardWorkUser } from './FirebaseAuthProvider';
import { REFERENCE_LINKS } from './ManageViews';

const MCP_LANG_STORAGE_KEY = 'hardworkai_mcp_name_lang_v1';

function ConnectorLogo({
  logoUrl,
  monogram,
  alt,
  size = 'md',
}: {
  logoUrl?: string;
  monogram: string;
  alt: string;
  size?: 'md' | 'lg';
}) {
  const [failed, setFailed] = useState(false);

  const boxClass =
    size === 'lg'
      ? 'w-11 h-11 rounded-xl p-2'
      : 'w-9 h-9 rounded-lg p-1.5';
  const imgPx = size === 'lg' ? 28 : 24;
  const imgClass = size === 'lg' ? 'w-7 h-7 object-contain' : 'w-6 h-6 object-contain';

  if (logoUrl && !failed) {
    return (
      <div
        className={`${boxClass} bg-white border border-[#E5E1D8] dark:border-[#3A3834] shadow-2xs flex items-center justify-center shrink-0 overflow-hidden`}
      >
        <Image
          src={logoUrl}
          alt={`Logo ${alt}`}
          width={imgPx}
          height={imgPx}
          referrerPolicy="no-referrer"
          className={imgClass}
          onError={() => setFailed(true)}
        />
      </div>
    );
  }

  return (
    <div
      className={`${
        size === 'lg' ? 'w-11 h-11 rounded-xl text-sm' : 'w-9 h-9 rounded-lg text-xs'
      } bg-[#F3F1EA] dark:bg-[#2B2926] border border-[#E5E1D8] dark:border-[#36342F] flex items-center justify-center font-semibold text-[#3F3D37] dark:text-[#DFDBD2] shrink-0 font-serif`}
    >
      {monogram}
    </div>
  );
}

interface McpConnectorsViewProps {
  user: HardWorkUser | null;
  authReady: boolean;
  signingIn: boolean;
  authError: string | null;
  connections: Record<string, McpConnectionRecord>;
  onSignIn: () => Promise<HardWorkUser | null>;
  onSaveConnection: (
    record: Omit<McpConnectionRecord, 'ownerUid' | 'accountEmail'>,
    targetUser?: HardWorkUser
  ) => Promise<void>;
  onDeleteConnection: (connectorId: string) => Promise<void>;
}

function sanitizeId(raw: string): string {
  const slug = raw
    .toLowerCase()
    .replace(/[^a-z0-9_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
  return slug || `mcp-${Date.now()}`;
}

/* ================= CONNECTOR CONFIG SCREEN ================= */

function McpConfigScreen({
  item,
  existing,
  isCustom,
  nameLang,
  user,
  signingIn,
  onSignIn,
  onSave,
  onDelete,
  onCancel,
}: {
  item: McpCatalogItem;
  existing?: McpConnectionRecord;
  isCustom: boolean;
  nameLang: McpNameLanguage;
  user: HardWorkUser | null;
  signingIn: boolean;
  onSignIn: () => Promise<HardWorkUser | null>;
  onSave: (
    record: Omit<McpConnectionRecord, 'ownerUid' | 'accountEmail'>,
    targetUser?: HardWorkUser
  ) => Promise<void>;
  onDelete: (connectorId: string) => Promise<void>;
  onCancel: () => void;
}) {
  const displayName = getMcpDisplayName(item, nameLang);
  const [name, setName] = useState(
    isCustom ? existing?.name || item.name : displayName
  );
  const [description, setDescription] = useState(
    existing?.description || item.description
  );
  const [endpoint, setEndpoint] = useState(
    existing?.endpoint || item.defaultEndpoint
  );
  const [transport, setTransport] = useState<McpTransport>(
    existing?.transport || item.defaultTransport
  );

  const [everyoneInOrg, setEveryoneInOrg] = useState(
    existing ? existing.everyoneInOrg : true
  );
  const [people, setPeople] = useState<string[]>(existing?.people || []);
  const [teams, setTeams] = useState<string[]>(existing?.teams || []);
  const [addingTarget, setAddingTarget] = useState<'person' | 'team' | null>(null);
  const [targetInput, setTargetInput] = useState('');

  const [toolsSelection, setToolsSelection] = useState<'all' | 'picked'>(
    existing?.toolsSelection || 'all'
  );
  const [customTools, setCustomTools] = useState<string[]>(() =>
    (existing?.selectedTools || []).filter((t) => !item.sampleTools.includes(t))
  );
  const [selectedTools, setSelectedTools] = useState<string[]>(
    existing && existing.selectedTools.length > 0
      ? existing.selectedTools
      : item.sampleTools.slice(0, 2)
  );
  const [newToolInput, setNewToolInput] = useState('');

  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{
    ok: boolean;
    message: string;
  } | null>(null);

  const availableTools = useMemo(
    () => [...item.sampleTools, ...customTools],
    [item.sampleTools, customTools]
  );

  const handleAddTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = targetInput.trim().slice(0, 120);
    if (!cleaned || !addingTarget) return;
    if (addingTarget === 'person') {
      if (!people.includes(cleaned) && people.length < 50) {
        setPeople((prev) => [...prev, cleaned]);
      }
    } else if (!teams.includes(cleaned) && teams.length < 50) {
      setTeams((prev) => [...prev, cleaned]);
    }
    setTargetInput('');
    setAddingTarget(null);
  };

  const handleToggleTool = (toolName: string) => {
    setSelectedTools((prev) =>
      prev.includes(toolName)
        ? prev.filter((t) => t !== toolName)
        : prev.length < 50
          ? [...prev, toolName]
          : prev
    );
  };

  const handleAddCustomTool = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newToolInput.trim().slice(0, 120);
    if (!cleaned) return;
    if (!availableTools.includes(cleaned)) {
      setCustomTools((prev) => [...prev, cleaned]);
    }
    if (!selectedTools.includes(cleaned) && selectedTools.length < 50) {
      setSelectedTools((prev) => [...prev, cleaned]);
    }
    setNewToolInput('');
  };

  const handleConnect = async () => {
    setFeedback(null);
    const cleanName = name.trim().slice(0, 120);
    const cleanEndpoint = endpoint.trim().slice(0, 500);
    if (!cleanName || !cleanEndpoint) {
      setFeedback({
        ok: false,
        message: 'Preencha o nome e o endpoint do conector MCP.',
      });
      return;
    }

    if (
      (transport === 'streamable-http' || transport === 'sse') &&
      !/^https:\/\/[^\s]+$/.test(cleanEndpoint)
    ) {
      setFeedback({
        ok: false,
        message:
          'Para transporte Streamable HTTP ou SSE, informe um endpoint HTTPS válido (ex: https://mcp.exemplo.com/mcp).',
      });
      return;
    }

    if (
      transport === 'stdio' &&
      !/^(stdio:\/\/)?[a-zA-Z0-9._\-/ @:]+$/.test(cleanEndpoint)
    ) {
      setFeedback({
        ok: false,
        message:
          'O comando Stdio contém caracteres não permitidos por segurança.',
      });
      return;
    }

    let activeUser = user;
    if (!activeUser) {
      activeUser = await onSignIn();
      if (!activeUser) return;
    }

    setSaving(true);
    try {
      const connectorId = existing?.connectorId || (isCustom ? sanitizeId(cleanName) : item.id);
      await onSave(
        {
          connectorId,
          name: cleanName,
          description: description.trim().slice(0, 500),
          endpoint: cleanEndpoint,
          transport,
          approvedAppsOnly: Boolean(item.approvedAppsOnly),
          custom: isCustom,
          everyoneInOrg,
          people: people.slice(0, 50),
          teams: teams.slice(0, 50),
          toolsSelection,
          selectedTools: toolsSelection === 'picked' ? selectedTools.slice(0, 50) : [],
          connected: true,
        },
        activeUser
      );
      setFeedback({
        ok: true,
        message: `${cleanName} conectado com a conta ${activeUser.email}.`,
      });
    } catch (err) {
      setFeedback({
        ok: false,
        message:
          err instanceof Error
            ? err.message
            : 'Não foi possível salvar a conexão MCP.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (!existing) return;
    setSaving(true);
    try {
      await onDelete(existing.connectorId);
      onCancel();
    } catch (err) {
      setFeedback({
        ok: false,
        message:
          err instanceof Error
            ? err.message
            : 'Não foi possível desconectar este MCP.',
      });
    } finally {
      setSaving(false);
    }
  };

  const toolsSummary =
    toolsSelection === 'all'
      ? `Todas as ferramentas de ${name || item.name}`
      : `${selectedTools.length} ${
          selectedTools.length === 1
            ? 'ferramenta escolhida'
            : 'ferramentas escolhidas'
        }`;

  const audienceSummary = (() => {
    if (everyoneInOrg) return 'todos';
    const parts: string[] = [];
    if (people.length > 0) {
      parts.push(people.length === 1 ? '1 pessoa' : `${people.length} pessoas`);
    }
    if (teams.length > 0) {
      parts.push(teams.length === 1 ? '1 equipe' : `${teams.length} equipes`);
    }
    return parts.length > 0 ? parts.join(', ') : 'somente sua conta';
  })();

  return (
    <div className="w-full max-w-[860px] mx-auto px-4 sm:px-8 py-7 space-y-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <button
            type="button"
            onClick={onCancel}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#6B675E] dark:text-[#9E998F] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9] transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Voltar para conectores</span>
          </button>
          <div className="flex items-center gap-3 pt-1">
            {!isCustom && (
              <ConnectorLogo
                logoUrl={item.logoUrl}
                monogram={item.monogram}
                alt={displayName}
                size="lg"
              />
            )}
            <div className="space-y-0.5 min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                <h1 className="font-serif text-2xl font-medium tracking-tight text-[#1F1E1C] dark:text-[#F2EFE9]">
                  {isCustom && !existing ? 'Adicionar outro MCP' : name}
                </h1>
                {item.approvedAppsOnly && (
                  <span className="inline-flex items-center gap-1 text-xs text-[#7D786E] dark:text-[#969187]">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#C96442] dark:text-[#D97757]" />
                    <span>Somente aplicativos aprovados</span>
                  </span>
                )}
              </div>
              {!isCustom && (
                <p className="text-xs text-[#6B675E] dark:text-[#A19C92]">
                  {item.description}
                </p>
              )}
            </div>
          </div>
        </div>

        {existing && (
          <button
            type="button"
            disabled={saving}
            onClick={handleDisconnect}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors self-start sm:self-auto whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remover conector</span>
          </button>
        )}
      </div>

      {/* Card 1: Account Connection (Same HardWorkAI Account) */}
      <section className="rounded-xl border border-[#E5E1D8] dark:border-[#2E2C28] bg-white dark:bg-[#22211E] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[#1F1E1C] dark:text-[#F2EFE9]">
          Conta de conexão
        </h2>

        <div className="space-y-2.5">
          <div className="inline-flex items-center p-1 rounded-lg bg-[#F3F1EA] dark:bg-[#191816] border border-[#E8E4DA] dark:border-[#2C2A26]">
            <span className="px-3 py-1.5 rounded-md text-xs font-medium bg-white dark:bg-[#2D2B27] text-[#1F1E1C] dark:text-[#F2EFE9] shadow-xs whitespace-nowrap">
              Mesma conta da HardWorkAI
            </span>
            <span className="px-3 py-1.5 rounded-md text-xs font-medium text-[#A8A399] dark:text-[#635F57] select-none whitespace-nowrap">
              Conta separada
            </span>
          </div>

          <p className="flex items-center gap-1.5 text-xs text-[#7D786E] dark:text-[#8E897F]">
            <Lock className="w-3.5 h-3.5 shrink-0" />
            <span>
              Este conector MCP vincula-se automaticamente à conta autenticada da HardWorkAI.
            </span>
          </p>
        </div>

        {user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#E6E2D8] dark:border-[#32302C] bg-[#FAF9F5] dark:bg-[#191816] px-4 py-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-full bg-[#C96442]/15 dark:bg-[#D97757]/20 text-[#C96442] dark:text-[#E28868] flex items-center justify-center text-xs font-semibold shrink-0">
                {user.displayName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-[#1F1E1C] dark:text-[#F2EFE9] truncate">
                  {user.displayName}
                </p>
                <p className="text-xs font-mono text-[#6B675E] dark:text-[#9E998F] truncate">
                  {user.email}
                </p>
              </div>
            </div>
            <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 shrink-0">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Conta HardWorkAI ativa</span>
            </span>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-[#DFDBD0] dark:border-[#35332E] bg-[#FAF9F5] dark:bg-[#191816] px-4 py-3.5">
            <div className="space-y-0.5">
              <p className="text-sm font-medium text-[#1F1E1C] dark:text-[#F2EFE9]">
                Crie ou entre na sua conta HardWorkAI
              </p>
              <p className="text-xs text-[#6B675E] dark:text-[#9E998F]">
                É necessário estar conectado para vincular este MCP à sua conta.
              </p>
            </div>
            <button
              type="button"
              disabled={signingIn}
              onClick={() => void onSignIn()}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#141720] hover:bg-[#232836] dark:bg-[#F2EFE9] dark:hover:bg-[#DFDBD2] text-white dark:text-[#141720] text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
            >
              {signingIn ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <LogIn className="w-3.5 h-3.5" />
              )}
              <span>Entrar com Google</span>
            </button>
          </div>
        )}

        {isCustom ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#3F3D37] dark:text-[#D5D0C6]">
                Nome do conector MCP
              </span>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Servidor ERP Interno"
                className="w-full rounded-lg border border-[#DFDBD0] dark:border-[#36342F] bg-[#FAF9F5]/60 dark:bg-[#171614] px-3 py-2 text-sm text-[#1F1E1C] dark:text-[#F2EFE9] focus:outline-none focus:border-[#C96442]"
              />
            </label>

            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#3F3D37] dark:text-[#D5D0C6]">
                Transporte
              </span>
              <select
                value={transport}
                onChange={(e) => setTransport(e.target.value as McpTransport)}
                className="w-full rounded-lg border border-[#DFDBD0] dark:border-[#36342F] bg-[#FAF9F5]/60 dark:bg-[#171614] px-3 py-2 text-sm text-[#1F1E1C] dark:text-[#F2EFE9] focus:outline-none focus:border-[#C96442]"
              >
                <option value="streamable-http">Streamable HTTP</option>
                <option value="sse">SSE</option>
                <option value="stdio">Stdio</option>
              </select>
            </label>

            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-xs font-medium text-[#3F3D37] dark:text-[#D5D0C6]">
                URL ou comando do servidor MCP
              </span>
              <input
                type="text"
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://mcp.suaempresa.com/mcp"
                className="w-full rounded-lg border border-[#DFDBD0] dark:border-[#36342F] bg-[#FAF9F5]/60 dark:bg-[#171614] px-3 py-2 text-sm font-mono text-[#1F1E1C] dark:text-[#F2EFE9] focus:outline-none focus:border-[#C96442]"
              />
            </label>

            <label className="block space-y-1.5 sm:col-span-2">
              <span className="text-xs font-medium text-[#3F3D37] dark:text-[#D5D0C6]">
                Descrição
              </span>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="O que este servidor MCP disponibiliza para a HardWorkAI"
                className="w-full rounded-lg border border-[#DFDBD0] dark:border-[#36342F] bg-[#FAF9F5]/60 dark:bg-[#171614] px-3 py-2 text-sm text-[#1F1E1C] dark:text-[#F2EFE9] focus:outline-none focus:border-[#C96442]"
              />
            </label>
          </div>
        ) : (
          <div className="space-y-1.5 pt-1">
            <label
              htmlFor="mcp-endpoint"
              className="block text-xs font-medium text-[#3F3D37] dark:text-[#D5D0C6]"
            >
              Endpoint MCP
            </label>
            <input
              id="mcp-endpoint"
              type="text"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="w-full rounded-lg border border-[#DFDBD0] dark:border-[#36342F] bg-[#FAF9F5]/60 dark:bg-[#171614] px-3.5 py-2.5 text-sm font-mono text-[#1F1E1C] dark:text-[#F2EFE9] focus:outline-none focus:border-[#1F1E1C] dark:focus:border-[#D97757]"
            />
          </div>
        )}
      </section>

      {/* Card 2: Who can use it */}
      <section className="rounded-xl border border-[#E5E1D8] dark:border-[#2E2C28] bg-white dark:bg-[#22211E] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[#1F1E1C] dark:text-[#F2EFE9]">
          Quem pode usar
        </h2>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-full bg-[#F3F1EA] dark:bg-[#2B2926] flex items-center justify-center shrink-0">
              <Globe className="w-4 h-4 text-[#5C584F] dark:text-[#B5B0A6]" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[#1F1E1C] dark:text-[#F2EFE9]">
                Todos na organização
              </p>
              <p className="text-xs text-[#6B675E] dark:text-[#969187]">
                Todos os membros da organização podem usar este conector MCP.
              </p>
            </div>
          </div>

          <button
            type="button"
            role="switch"
            aria-checked={everyoneInOrg}
            aria-label="Permitir para todos na organização"
            onClick={() => setEveryoneInOrg((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
              everyoneInOrg
                ? 'bg-[#18181B] dark:bg-[#D97757]'
                : 'bg-[#DDD8CD] dark:bg-[#3A3834]'
            }`}
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                everyoneInOrg ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              setAddingTarget('person');
              setTargetInput('');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DFDBD0] dark:border-[#35332E] bg-white dark:bg-[#1D1C1A] hover:bg-[#F3F1EA] dark:hover:bg-[#2A2825] text-xs font-medium text-[#3F3D37] dark:text-[#DFDBD2] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar pessoa</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setAddingTarget('team');
              setTargetInput('');
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#DFDBD0] dark:border-[#35332E] bg-white dark:bg-[#1D1C1A] hover:bg-[#F3F1EA] dark:hover:bg-[#2A2825] text-xs font-medium text-[#3F3D37] dark:text-[#DFDBD2] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar equipe</span>
          </button>
        </div>

        {addingTarget && (
          <form onSubmit={handleAddTarget} className="flex items-center gap-2 pt-1">
            <input
              type="text"
              autoFocus
              value={targetInput}
              onChange={(e) => setTargetInput(e.target.value)}
              placeholder={
                addingTarget === 'person'
                  ? 'Digite o nome ou e-mail da pessoa'
                  : 'Digite o nome da equipe'
              }
              className="flex-1 px-3 py-2 rounded-lg border border-[#DFDBD0] dark:border-[#35332E] bg-[#FAF9F5] dark:bg-[#171614] text-xs text-[#1F1E1C] dark:text-[#F2EFE9] focus:outline-none focus:border-[#C96442]"
            />
            <button
              type="submit"
              className="px-3.5 py-2 rounded-lg text-xs font-medium bg-[#18181B] dark:bg-[#D97757] text-white hover:opacity-90 whitespace-nowrap shrink-0 cursor-pointer"
            >
              Adicionar
            </button>
            <button
              type="button"
              onClick={() => setAddingTarget(null)}
              aria-label="Cancelar"
              className="p-2 rounded-lg text-[#7D786E] hover:bg-[#F3F1EA] dark:hover:bg-[#2A2825] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </form>
        )}

        {(people.length > 0 || teams.length > 0) && (
          <div className="pt-2 border-t border-[#EFECE3] dark:border-[#2C2A26] space-y-2">
            {people.map((person) => (
              <div
                key={`p-${person}`}
                className="flex items-center justify-between gap-2 text-xs text-[#3F3D37] dark:text-[#D5D0C6] py-1"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <User className="w-3.5 h-3.5 text-[#7D786E] shrink-0" />
                  <span className="truncate">{person}</span>
                  <span className="text-[#8D887E]">· Pessoa</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setPeople((prev) => prev.filter((p) => p !== person))
                  }
                  aria-label={`Remover ${person}`}
                  className="p-1 rounded text-[#8D887E] hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
            {teams.map((team) => (
              <div
                key={`t-${team}`}
                className="flex items-center justify-between gap-2 text-xs text-[#3F3D37] dark:text-[#D5D0C6] py-1"
              >
                <span className="flex items-center gap-2 min-w-0">
                  <Users className="w-3.5 h-3.5 text-[#7D786E] shrink-0" />
                  <span className="truncate">{team}</span>
                  <span className="text-[#8D887E]">· Equipe</span>
                </span>
                <button
                  type="button"
                  onClick={() =>
                    setTeams((prev) => prev.filter((t) => t !== team))
                  }
                  aria-label={`Remover ${team}`}
                  className="p-1 rounded text-[#8D887E] hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Card 3: Tools Selection */}
      <section className="rounded-xl border border-[#E5E1D8] dark:border-[#2E2C28] bg-white dark:bg-[#22211E] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[#1F1E1C] dark:text-[#F2EFE9]">
          Ferramentas MCP
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            role="radio"
            aria-checked={toolsSelection === 'all'}
            onClick={() => setToolsSelection('all')}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
              toolsSelection === 'all'
                ? 'border-[#1F1E1C] dark:border-[#D97757] bg-[#FAF9F5] dark:bg-[#292724]'
                : 'border-[#E5E1D8] dark:border-[#32302C] hover:border-[#CBC5B8] dark:hover:border-[#45423D]'
            }`}
          >
            <span
              aria-hidden="true"
              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                toolsSelection === 'all'
                  ? 'border-[#1F1E1C] dark:border-[#D97757]'
                  : 'border-[#A8A399] dark:border-[#6E6A62]'
              }`}
            >
              {toolsSelection === 'all' && (
                <span className="w-2 h-2 rounded-full bg-[#1F1E1C] dark:bg-[#D97757]" />
              )}
            </span>
            <span className="text-sm text-[#1F1E1C] dark:text-[#F2EFE9] truncate">
              Todas as ferramentas de {name || item.name}
            </span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={toolsSelection === 'picked'}
            onClick={() => setToolsSelection('picked')}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
              toolsSelection === 'picked'
                ? 'border-[#1F1E1C] dark:border-[#D97757] bg-[#FAF9F5] dark:bg-[#292724]'
                : 'border-[#E5E1D8] dark:border-[#32302C] hover:border-[#CBC5B8] dark:hover:border-[#45423D]'
            }`}
          >
            <span
              aria-hidden="true"
              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                toolsSelection === 'picked'
                  ? 'border-[#1F1E1C] dark:border-[#D97757]'
                  : 'border-[#A8A399] dark:border-[#6E6A62]'
              }`}
            >
              {toolsSelection === 'picked' && (
                <span className="w-2 h-2 rounded-full bg-[#1F1E1C] dark:bg-[#D97757]" />
              )}
            </span>
            <span className="text-sm text-[#1F1E1C] dark:text-[#F2EFE9] truncate">
              Apenas as que eu escolher
            </span>
          </button>
        </div>

        {toolsSelection === 'picked' && (
          <div className="pt-2 space-y-3 border-t border-[#EFECE3] dark:border-[#2C2A26]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableTools.map((toolId) => {
                const checked = selectedTools.includes(toolId);
                return (
                  <button
                    key={toolId}
                    type="button"
                    onClick={() => handleToggleTool(toolId)}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded-lg border text-left text-xs font-mono transition-colors cursor-pointer ${
                      checked
                        ? 'border-[#C96442]/60 dark:border-[#D97757]/60 bg-[#FAF9F5] dark:bg-[#292724] text-[#1F1E1C] dark:text-[#F2EFE9]'
                        : 'border-[#E6E2D8] dark:border-[#2F2D29] text-[#6B675E] dark:text-[#969187] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9]'
                    }`}
                  >
                    <span
                      className={`w-4 h-4 rounded flex items-center justify-center border shrink-0 ${
                        checked
                          ? 'bg-[#C96442] dark:bg-[#D97757] border-transparent text-white'
                          : 'border-[#CBC5B8] dark:border-[#4A4741]'
                      }`}
                    >
                      {checked && <Check className="w-3 h-3" strokeWidth={2.6} />}
                    </span>
                    <span className="truncate">{toolId}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleAddCustomTool} className="flex items-center gap-2">
              <input
                type="text"
                value={newToolInput}
                onChange={(e) => setNewToolInput(e.target.value)}
                placeholder="Adicionar ferramenta específica (ex: search_docs)"
                className="flex-1 px-3 py-2 rounded-lg border border-[#DFDBD0] dark:border-[#35332E] bg-[#FAF9F5] dark:bg-[#171614] text-xs font-mono text-[#1F1E1C] dark:text-[#F2EFE9] placeholder:font-sans placeholder:text-[#8D887E] focus:outline-none focus:border-[#C96442]"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-lg border border-[#DFDBD0] dark:border-[#35332E] text-xs font-medium text-[#3F3D37] dark:text-[#DFDBD2] hover:bg-[#F3F1EA] dark:hover:bg-[#2B2926] whitespace-nowrap shrink-0 cursor-pointer"
              >
                Adicionar
              </button>
            </form>
          </div>
        )}
      </section>

      {feedback && (
        <div
          className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-xs leading-relaxed ${
            feedback.ok
              ? 'border-emerald-300/80 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
              : 'border-red-300/80 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 text-red-800 dark:text-red-300'
          }`}
        >
          {feedback.ok ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Bottom Summary & Action Bar */}
      <footer className="rounded-xl border border-[#E5E1D8] dark:border-[#2E2C28] bg-white dark:bg-[#22211E] px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-[#6B675E] dark:text-[#A19C92] truncate">
          {toolsSummary} · {audienceSummary}
          {user ? ` · ${user.email}` : ''}
        </p>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg border border-[#DFDBD0] dark:border-[#35332E] bg-white dark:bg-[#1D1C1A] hover:bg-[#F3F1EA] dark:hover:bg-[#2B2926] text-xs font-medium text-[#3F3D37] dark:text-[#DFDBD2] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={saving || signingIn}
            onClick={() => void handleConnect()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#141720] hover:bg-[#232836] dark:bg-[#F2EFE9] dark:hover:bg-[#DFDBD2] text-white dark:text-[#141720] text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            {(saving || signingIn) && (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            )}
            <span>
              {existing
                ? `Salvar ${name}`
                : user
                  ? `Conectar ${name || 'MCP'}`
                  : `Entrar e conectar ${name || 'MCP'}`}
            </span>
          </button>
        </div>
      </footer>
    </div>
  );
}

/* ================= MAIN MCP CATALOG VIEW ================= */

export default function McpConnectorsView({
  user,
  authReady,
  signingIn,
  authError,
  connections,
  onSignIn,
  onSaveConnection,
  onDeleteConnection,
}: McpConnectorsViewProps) {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'connected'>('all');
  const [nameLang, setNameLang] = useState<McpNameLanguage>(() => {
    if (typeof window === 'undefined') return 'en';
    try {
      const saved = window.localStorage.getItem(MCP_LANG_STORAGE_KEY);
      if (saved === 'en' || saved === 'pt') return saved;
    } catch {
      // ignore storage errors
    }
    return 'en';
  });
  const [activeSelection, setActiveSelection] = useState<{
    item: McpCatalogItem;
    isCustom: boolean;
  } | null>(null);

  const handleChangeNameLang = (next: McpNameLanguage) => {
    setNameLang(next);
    try {
      window.localStorage.setItem(MCP_LANG_STORAGE_KEY, next);
    } catch {
      // ignore storage errors
    }
  };

  const connectedList = useMemo(
    () => Object.values(connections).filter((c) => c.connected),
    [connections]
  );

  const customConnections = useMemo(
    () => connectedList.filter((c) => c.custom),
    [connectedList]
  );

  const filteredCatalog = useMemo(() => {
    const q = search.trim().toLowerCase();
    return MCP_CATALOG.filter((item) => {
      if (filter === 'connected' && !connections[item.id]?.connected) {
        return false;
      }
      if (!q) return true;
      return (
        item.nameEn.toLowerCase().includes(q) ||
        item.namePt.toLowerCase().includes(q) ||
        item.id.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
  }, [connections, filter, search]);

  const filteredCustom = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customConnections;
    return customConnections.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
    );
  }, [customConnections, search]);

  if (activeSelection) {
    const existing = connections[activeSelection.item.id];
    return (
      <McpConfigScreen
        key={`${activeSelection.item.id}-${nameLang}`}
        item={activeSelection.item}
        existing={existing}
        isCustom={activeSelection.isCustom}
        nameLang={nameLang}
        user={user}
        signingIn={signingIn}
        onSignIn={onSignIn}
        onSave={onSaveConnection}
        onDelete={onDeleteConnection}
        onCancel={() => setActiveSelection(null)}
      />
    );
  }

  return (
    <div className="w-full max-w-[1040px] mx-auto px-4 sm:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#E6E2D8] dark:border-[#2C2A26]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <Cable className="w-5 h-5 text-[#C96442] dark:text-[#D97757]" />
            <h1 className="font-serif text-2xl font-medium tracking-tight text-[#1F1E1C] dark:text-[#F2EFE9]">
              Adicionar um conector
            </h1>
          </div>
          <p className="text-sm text-[#6B675E] dark:text-[#A19C92] max-w-2xl leading-relaxed">
            Conecte serviços externos via MCP usando a mesma conta criada para acesso à HardWorkAI.{' '}
            <span className="tabular-nums">
              {connectedList.length}{' '}
              {connectedList.length === 1 ? 'conectado' : 'conectados'} ·{' '}
              {MCP_CATALOG.length} integrações disponíveis.
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <a
            href={REFERENCE_LINKS.mcp}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#5C584F] dark:text-[#B5B0A6] hover:bg-[#EFECE3] dark:hover:bg-[#262522] transition-colors whitespace-nowrap shrink-0"
          >
            <span>Referência</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={() =>
              setActiveSelection({
                item: {
                  id: `custom-${Date.now()}`,
                  name: '',
                  nameEn: '',
                  namePt: '',
                  description: '',
                  defaultEndpoint: '',
                  defaultTransport: 'streamable-http',
                  monogram: 'M',
                  sampleTools: ['query', 'read_resource', 'execute_action'],
                },
                isCustom: true,
              })
            }
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-[#C96442] hover:bg-[#B85737] dark:bg-[#D97757] dark:hover:bg-[#C96442] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Adicionar outro MCP</span>
          </button>
        </div>
      </div>

      {/* HardWorkAI Account Identity Strip */}
      {authReady && (
        <div className="rounded-xl border border-[#E5E1D8] dark:border-[#2E2C28] bg-white dark:bg-[#22211E] px-4 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {user ? (
            <>
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-full bg-[#C96442]/14 dark:bg-[#D97757]/20 text-[#C96442] dark:text-[#E28868] flex items-center justify-center text-xs font-semibold shrink-0">
                  {user.displayName.slice(0, 2).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-[#1F1E1C] dark:text-[#F2EFE9] truncate">
                    Conectando MCPs com sua conta HardWorkAI: {user.email}
                  </p>
                  <p className="text-[11px] text-[#7D786E] dark:text-[#969187]">
                    Todas as conexões adicionadas abaixo ficam vinculadas e sincronizadas nesta conta.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-700 dark:text-emerald-400 shrink-0">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Autenticado</span>
              </span>
            </>
          ) : (
            <>
              <div className="space-y-0.5">
                <p className="text-xs font-medium text-[#1F1E1C] dark:text-[#F2EFE9]">
                  Entre com sua conta da HardWorkAI para conectar os MCPs
                </p>
                <p className="text-[11px] text-[#7D786E] dark:text-[#969187]">
                  Cada conector MCP utiliza a mesma conta de acesso à HardWorkAI.
                </p>
              </div>
              <button
                type="button"
                disabled={signingIn}
                onClick={() => void onSignIn()}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#141720] hover:bg-[#232836] dark:bg-[#F2EFE9] dark:hover:bg-[#DFDBD2] text-white dark:text-[#141720] text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
              >
                {signingIn ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <LogIn className="w-3.5 h-3.5" />
                )}
                <span>Criar / Entrar na conta</span>
              </button>
            </>
          )}
        </div>
      )}

      {authError && (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-300/80 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 px-4 py-3 text-xs text-red-800 dark:text-red-300">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{authError}</span>
        </div>
      )}

      {/* Search, Name Language Toggle & Filter Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8D887E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filtrar por nome (EN ou PT)"
            aria-label="Filtrar conectores MCP por nome"
            className="w-full pl-9 pr-8 py-2 rounded-lg border border-[#E2DDD2] dark:border-[#32302C] bg-white dark:bg-[#22211E] text-sm text-[#1F1E1C] dark:text-[#F2EFE9] placeholder:text-[#8D887E] focus:outline-none focus:border-[#C96442]"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Limpar busca"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8D887E] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9] cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div
            role="group"
            aria-label="Idioma dos nomes das aplicações"
            className="inline-flex items-center gap-1 p-1 rounded-lg bg-[#EFECE3] dark:bg-[#242320] w-fit"
          >
            <span className="inline-flex items-center gap-1 pl-2 pr-1 text-[11px] font-medium text-[#7D786E] dark:text-[#969187] select-none">
              <Languages className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Nomes:</span>
            </span>
            {(
              [
                { id: 'en', label: 'Inglês' },
                { id: 'pt', label: 'Português' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                aria-pressed={nameLang === opt.id}
                onClick={() => handleChangeNameLang(opt.id)}
                className={`px-2.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  nameLang === opt.id
                    ? 'bg-white dark:bg-[#34322E] text-[#1F1E1C] dark:text-[#F2EFE9] shadow-xs'
                    : 'text-[#6B675E] dark:text-[#A19C92] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 p-1 rounded-lg bg-[#EFECE3] dark:bg-[#242320] w-fit">
            {(
              [
                { id: 'all', label: 'Todos' },
                { id: 'connected', label: `Conectados (${connectedList.length})` },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setFilter(tab.id)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  filter === tab.id
                    ? 'bg-white dark:bg-[#34322E] text-[#1F1E1C] dark:text-[#F2EFE9] shadow-xs'
                    : 'text-[#6B675E] dark:text-[#A19C92] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Custom MCP Connectors Added by User */}
      {filteredCustom.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold text-[#6B675E] dark:text-[#9E998F]">
            Outros MCPs adicionados
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredCustom.map((conn) => (
              <div
                key={conn.connectorId}
                className="flex items-start justify-between gap-4 rounded-xl border border-[#E5E1D8] dark:border-[#2E2C28] bg-white dark:bg-[#22211E] p-4"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-lg bg-[#F3F1EA] dark:bg-[#2B2926] border border-[#E5E1D8] dark:border-[#36342F] flex items-center justify-center text-xs font-semibold text-[#4A4740] dark:text-[#D5D0C6] shrink-0">
                    {conn.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <h3 className="text-[0.94rem] font-semibold text-[#1F1E1C] dark:text-[#F2EFE9]">
                        {conn.name}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                        <Check className="w-3 h-3" />
                        <span>Conectado</span>
                      </span>
                    </div>
                    <p className="text-xs text-[#6B675E] dark:text-[#A19C92] leading-relaxed">
                      {conn.description || conn.endpoint}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setActiveSelection({
                      item: {
                        id: conn.connectorId,
                        name: conn.name,
                        nameEn: conn.name,
                        namePt: conn.name,
                        description: conn.description,
                        defaultEndpoint: conn.endpoint,
                        defaultTransport: conn.transport,
                        monogram: conn.name.slice(0, 2).toUpperCase(),
                        sampleTools: conn.selectedTools,
                      },
                      isCustom: true,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg border border-[#DFDBD0] dark:border-[#35332E] hover:bg-[#F3F1EA] dark:hover:bg-[#2B2926] text-xs font-medium text-[#1F1E1C] dark:text-[#F2EFE9] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  Gerenciar
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Main 30-Connector Catalog */}
      {filteredCatalog.length === 0 && filteredCustom.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E1D8] dark:border-[#2C2A26] bg-white/70 dark:bg-[#21201D] p-10 text-center space-y-2">
          <p className="text-sm font-medium text-[#1F1E1C] dark:text-[#F2EFE9]">
            {filter === 'connected'
              ? 'Nenhum conector MCP conectado ainda'
              : 'Nenhum conector encontrado'}
          </p>
          <p className="text-xs text-[#6B675E] dark:text-[#9E998F]">
            {filter === 'connected'
              ? 'Clique em Adicionar em qualquer integração para conectar usando sua conta HardWorkAI.'
              : 'Tente outro termo ou use Adicionar outro MCP.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filteredCatalog.map((item) => {
            const isConnected = Boolean(connections[item.id]?.connected);
            const displayName = getMcpDisplayName(item, nameLang);
            return (
              <div
                key={item.id}
                className="flex items-start justify-between gap-4 rounded-xl border border-[#E5E1D8] dark:border-[#2E2C28] bg-white dark:bg-[#22211E] hover:border-[#CBC5B8] dark:hover:border-[#423F39] p-4 transition-colors"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <ConnectorLogo
                    logoUrl={item.logoUrl}
                    monogram={item.monogram}
                    alt={displayName}
                  />
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                      <h3 className="text-[0.94rem] font-semibold text-[#1F1E1C] dark:text-[#F2EFE9]">
                        {displayName}
                      </h3>
                      {isConnected && (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400">
                          <Check className="w-3 h-3" />
                          <span>Conectado</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-[#6B675E] dark:text-[#A19C92] leading-relaxed">
                      {item.description}
                    </p>
                    {item.approvedAppsOnly && (
                      <p className="text-[11px] font-medium text-[#8A8478] dark:text-[#8E897F] pt-0.5">
                        Somente aplicativos aprovados
                      </p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setActiveSelection({ item, isCustom: false })
                  }
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    isConnected
                      ? 'border border-[#DFDBD0] dark:border-[#35332E] text-[#1F1E1C] dark:text-[#F2EFE9] hover:bg-[#F3F1EA] dark:hover:bg-[#2B2926]'
                      : 'border border-[#DFDBD0] dark:border-[#35332E] bg-[#FAF9F5] dark:bg-[#1B1A18] hover:border-[#C96442] dark:hover:border-[#D97757] text-[#1F1E1C] dark:text-[#F2EFE9]'
                  }`}
                >
                  {isConnected ? 'Configurar' : 'Adicionar'}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
