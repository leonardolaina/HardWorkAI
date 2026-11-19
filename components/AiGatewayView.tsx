'use client';

import React, { useMemo, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronRight,
  Eye,
  EyeOff,
  Globe,
  Loader2,
  Lock,
  Network,
  Plus,
  Search,
  Trash2,
  User,
  Users,
  X,
} from 'lucide-react';
import {
  ALL_PROVIDERS,
  DIRECTORY_PROVIDERS,
  FEATURED_PROVIDERS,
  createDefaultProviderConfig,
  getSelectableModels,
  type ProviderConfig,
  type ProviderDefinition,
} from '@/lib/providers';
import { REFERENCE_LINKS } from './ManageViews';

interface AiGatewayViewProps {
  configs: Record<string, ProviderConfig>;
  initialProviderId?: string | null;
  onClearInitialProvider?: () => void;
  onSaveConfig: (config: ProviderConfig) => void;
  onDeleteConfig: (providerId: string) => void;
}

function formatModelsCount(count?: number): string {
  if (!count) return '';
  return count === 1 ? '1 modelo' : `${count} modelos`;
}

function ProviderConfigScreen({
  provider,
  initialConfig,
  hasExistingConfig,
  onSave,
  onDelete,
  onCancel,
}: {
  provider: ProviderDefinition;
  initialConfig: ProviderConfig;
  hasExistingConfig: boolean;
  onSave: (config: ProviderConfig) => void;
  onDelete: (providerId: string) => void;
  onCancel: () => void;
}) {
  const [keyMode, setKeyMode] = useState<'shared' | 'member'>(initialConfig.keyMode);
  const [apiKey, setApiKey] = useState(initialConfig.apiKey);
  const [showKey, setShowKey] = useState(false);

  const [everyoneInOrg, setEveryoneInOrg] = useState(initialConfig.everyoneInOrg);
  const [people, setPeople] = useState<string[]>(initialConfig.people);
  const [teams, setTeams] = useState<string[]>(initialConfig.teams);
  const [addingTarget, setAddingTarget] = useState<'person' | 'team' | null>(null);
  const [targetInput, setTargetInput] = useState('');

  const [modelSelection, setModelSelection] = useState<'all' | 'picked'>(
    initialConfig.modelSelection
  );
  const defaultModels = useMemo(() => getSelectableModels(provider), [provider]);
  const [customModels, setCustomModels] = useState<string[]>(() =>
    initialConfig.selectedModels.filter((m) => !defaultModels.includes(m))
  );
  const [selectedModels, setSelectedModels] = useState<string[]>(
    initialConfig.selectedModels.length > 0
      ? initialConfig.selectedModels
      : defaultModels.slice(0, 2)
  );
  const [newModelInput, setNewModelInput] = useState('');

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    ok: boolean;
    message: string;
  } | null>(
    initialConfig.lastTestStatus && initialConfig.lastTestMessage
      ? {
          ok: initialConfig.lastTestStatus === 'ok',
          message: initialConfig.lastTestMessage,
        }
      : null
  );

  const availableModels = useMemo(
    () => [...defaultModels, ...customModels],
    [defaultModels, customModels]
  );

  const buildConfig = (
    extra?: Partial<Pick<ProviderConfig, 'lastTestedAt' | 'lastTestStatus' | 'lastTestMessage'>>
  ): ProviderConfig => ({
    providerId: provider.id,
    keyMode,
    apiKey: apiKey.trim(),
    everyoneInOrg,
    people,
    teams,
    modelSelection,
    selectedModels: modelSelection === 'picked' ? selectedModels : [],
    enabled: true,
    ...extra,
  });

  const handleAddTarget = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = targetInput.trim();
    if (!cleaned || !addingTarget) return;
    if (addingTarget === 'person') {
      if (!people.includes(cleaned)) setPeople((prev) => [...prev, cleaned]);
    } else {
      if (!teams.includes(cleaned)) setTeams((prev) => [...prev, cleaned]);
    }
    setTargetInput('');
    setAddingTarget(null);
  };

  const handleToggleModel = (modelId: string) => {
    setSelectedModels((prev) =>
      prev.includes(modelId)
        ? prev.filter((m) => m !== modelId)
        : [...prev, modelId]
    );
  };

  const handleAddCustomModel = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = newModelInput.trim();
    if (!cleaned) return;
    if (!availableModels.includes(cleaned)) {
      setCustomModels((prev) => [...prev, cleaned]);
    }
    if (!selectedModels.includes(cleaned)) {
      setSelectedModels((prev) => [...prev, cleaned]);
    }
    setNewModelInput('');
  };

  const handleTestAndSave = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/gateway/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          providerId: provider.id,
          providerName: provider.name,
          keyMode,
          apiKey,
        }),
      });
      const data = (await res.json()) as { ok: boolean; message: string };
      setTestResult(data);

      if (data.ok) {
        onSave(
          buildConfig({
            lastTestedAt: Date.now(),
            lastTestStatus: 'ok',
            lastTestMessage: data.message,
          })
        );
      }
    } catch {
      setTestResult({
        ok: false,
        message: 'Não foi possível validar a conexão agora. Tente novamente.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleSaveOnly = () => {
    onSave(
      buildConfig({
        lastTestedAt: initialConfig.lastTestedAt,
        lastTestStatus: initialConfig.lastTestStatus,
        lastTestMessage: initialConfig.lastTestMessage,
      })
    );
    onCancel();
  };

  const modelsSummary =
    modelSelection === 'all'
      ? `Todos os modelos de ${provider.name}`
      : `${selectedModels.length} ${
          selectedModels.length === 1 ? 'modelo escolhido' : 'modelos escolhidos'
        }`;

  const audienceSummary = (() => {
    if (everyoneInOrg) return 'todos';
    const parts: string[] = [];
    if (people.length > 0) {
      parts.push(
        people.length === 1 ? '1 pessoa' : `${people.length} pessoas`
      );
    }
    if (teams.length > 0) {
      parts.push(teams.length === 1 ? '1 equipe' : `${teams.length} equipes`);
    }
    return parts.length > 0 ? parts.join(', ') : 'somente administradores';
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
            <span>Voltar para provedores</span>
          </button>
          <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
            <h1 className="font-serif text-2xl font-medium tracking-tight text-[#1F1E1C] dark:text-[#F2EFE9]">
              {provider.name}
            </h1>
            <span className="text-xs text-[#7D786E] dark:text-[#969187]">
              {provider.subtitle || formatModelsCount(provider.modelsCount)}
            </span>
          </div>
        </div>

        {hasExistingConfig && (
          <button
            type="button"
            onClick={() => {
              onDelete(provider.id);
              onCancel();
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-red-700 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors self-start sm:self-auto whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Remover provedor</span>
          </button>
        )}
      </div>

      {/* Card 1: Key */}
      <section className="rounded-xl border border-[#E5E1D8] dark:border-[#2E2C28] bg-white dark:bg-[#22211E] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[#1F1E1C] dark:text-[#F2EFE9]">
          Chave
        </h2>

        <div className="space-y-2.5">
          <div className="inline-flex items-center p-1 rounded-lg bg-[#F3F1EA] dark:bg-[#191816] border border-[#E8E4DA] dark:border-[#2C2A26]">
            <button
              type="button"
              onClick={() => setKeyMode('shared')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                keyMode === 'shared'
                  ? 'bg-white dark:bg-[#2D2B27] text-[#1F1E1C] dark:text-[#F2EFE9] shadow-xs'
                  : 'text-[#6B675E] dark:text-[#969187] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9]'
              }`}
            >
              Chave de API compartilhada
            </button>
            <button
              type="button"
              disabled={!provider.supportsMemberSignIn}
              onClick={() => {
                if (provider.supportsMemberSignIn) setKeyMode('member');
              }}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors whitespace-nowrap shrink-0 ${
                !provider.supportsMemberSignIn
                  ? 'text-[#A8A399] dark:text-[#635F57] cursor-not-allowed'
                  : keyMode === 'member'
                    ? 'bg-white dark:bg-[#2D2B27] text-[#1F1E1C] dark:text-[#F2EFE9] shadow-xs cursor-pointer'
                    : 'text-[#6B675E] dark:text-[#969187] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9] cursor-pointer'
              }`}
            >
              Cada membro faz login
            </button>
          </div>

          {!provider.supportsMemberSignIn && (
            <p className="flex items-center gap-1.5 text-xs text-[#7D786E] dark:text-[#8E897F]">
              <Lock className="w-3.5 h-3.5 shrink-0" />
              <span>
                Membros não podem entrar neste provedor com a própria conta.
              </span>
            </p>
          )}
        </div>

        {keyMode === 'shared' ? (
          <div className="space-y-1.5">
            <label
              htmlFor="provider-api-key"
              className="block text-xs font-medium text-[#3F3D37] dark:text-[#D5D0C6]"
            >
              Chave de API
            </label>
            <div className="relative">
              <input
                id="provider-api-key"
                type={showKey ? 'text' : 'password'}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="Cole a chave"
                autoComplete="off"
                spellCheck={false}
                className="w-full rounded-lg border border-[#DFDBD0] dark:border-[#36342F] bg-[#FAF9F5]/60 dark:bg-[#171614] pl-3.5 pr-10 py-2.5 text-sm font-mono text-[#1F1E1C] dark:text-[#F2EFE9] placeholder:text-[#9A958A] dark:placeholder:text-[#6E6A62] focus:outline-none focus:border-[#1F1E1C] dark:focus:border-[#D97757] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowKey((s) => !s)}
                aria-label={showKey ? 'Ocultar chave' : 'Mostrar chave'}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 rounded-md text-[#8D887E] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9] transition-colors cursor-pointer"
              >
                {showKey ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        ) : (
          <div className="rounded-lg border border-[#E6E2D8] dark:border-[#32302C] bg-[#FAF9F5] dark:bg-[#191816] px-4 py-3 text-xs text-[#55524A] dark:text-[#BFB9AE] leading-relaxed">
            Cada membro autenticará sua própria conta de{' '}
            <strong className="font-medium text-[#1F1E1C] dark:text-[#F2EFE9]">
              {provider.name}
            </strong>{' '}
            ao utilizar modelos deste provedor na organização.
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
                Todos os membros da organização podem usar estes modelos.
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
                  : 'Digite o nome da equipe (ex: Engenharia)'
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
              aria-label="Cancelar adição"
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
                    setPeople((prev) => prev.filter((item) => item !== person))
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
                    setTeams((prev) => prev.filter((item) => item !== team))
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

      {/* Card 3: Models */}
      <section className="rounded-xl border border-[#E5E1D8] dark:border-[#2E2C28] bg-white dark:bg-[#22211E] p-5 space-y-4">
        <h2 className="text-sm font-semibold text-[#1F1E1C] dark:text-[#F2EFE9]">
          Modelos
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            role="radio"
            aria-checked={modelSelection === 'all'}
            onClick={() => setModelSelection('all')}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
              modelSelection === 'all'
                ? 'border-[#1F1E1C] dark:border-[#D97757] bg-[#FAF9F5] dark:bg-[#292724]'
                : 'border-[#E5E1D8] dark:border-[#32302C] hover:border-[#CBC5B8] dark:hover:border-[#45423D]'
            }`}
          >
            <span
              aria-hidden="true"
              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                modelSelection === 'all'
                  ? 'border-[#1F1E1C] dark:border-[#D97757]'
                  : 'border-[#A8A399] dark:border-[#6E6A62]'
              }`}
            >
              {modelSelection === 'all' && (
                <span className="w-2 h-2 rounded-full bg-[#1F1E1C] dark:bg-[#D97757]" />
              )}
            </span>
            <span className="text-sm text-[#1F1E1C] dark:text-[#F2EFE9] truncate">
              Todos os modelos de {provider.name}
            </span>
          </button>

          <button
            type="button"
            role="radio"
            aria-checked={modelSelection === 'picked'}
            onClick={() => setModelSelection('picked')}
            className={`flex items-center gap-3 px-4 py-3.5 rounded-xl border text-left transition-colors cursor-pointer ${
              modelSelection === 'picked'
                ? 'border-[#1F1E1C] dark:border-[#D97757] bg-[#FAF9F5] dark:bg-[#292724]'
                : 'border-[#E5E1D8] dark:border-[#32302C] hover:border-[#CBC5B8] dark:hover:border-[#45423D]'
            }`}
          >
            <span
              aria-hidden="true"
              className={`w-4 h-4 rounded-full border flex items-center justify-center shrink-0 ${
                modelSelection === 'picked'
                  ? 'border-[#1F1E1C] dark:border-[#D97757]'
                  : 'border-[#A8A399] dark:border-[#6E6A62]'
              }`}
            >
              {modelSelection === 'picked' && (
                <span className="w-2 h-2 rounded-full bg-[#1F1E1C] dark:bg-[#D97757]" />
              )}
            </span>
            <span className="text-sm text-[#1F1E1C] dark:text-[#F2EFE9] truncate">
              Apenas os que eu escolher
            </span>
          </button>
        </div>

        {modelSelection === 'picked' && (
          <div className="pt-2 space-y-3 border-t border-[#EFECE3] dark:border-[#2C2A26]">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {availableModels.map((modelId) => {
                const checked = selectedModels.includes(modelId);
                return (
                  <button
                    key={modelId}
                    type="button"
                    onClick={() => handleToggleModel(modelId)}
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
                    <span className="truncate">{modelId}</span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={handleAddCustomModel} className="flex items-center gap-2">
              <input
                type="text"
                value={newModelInput}
                onChange={(e) => setNewModelInput(e.target.value)}
                placeholder="Adicionar ID de modelo específico (ex: deepseek-r1)"
                className="flex-1 px-3 py-2 rounded-lg border border-[#DFDBD0] dark:border-[#35332E] bg-[#FAF9F5] dark:bg-[#171614] text-xs font-mono text-[#1F1E1C] dark:text-[#F2EFE9] placeholder:font-sans placeholder:text-[#8D887E] focus:outline-none focus:border-[#C96442]"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-lg border border-[#DFDBD0] dark:border-[#35332E] text-xs font-medium text-[#3F3D37] dark:text-[#DFDBD2] hover:bg-[#F3F1EA] dark:hover:bg-[#2B2926] whitespace-nowrap shrink-0 cursor-pointer"
              >
                Adicionar modelo
              </button>
            </form>
          </div>
        )}
      </section>

      {testResult && (
        <div
          className={`flex items-start gap-2.5 rounded-xl border px-4 py-3 text-xs leading-relaxed ${
            testResult.ok
              ? 'border-emerald-300/80 dark:border-emerald-900/60 bg-emerald-50/70 dark:bg-emerald-950/30 text-emerald-800 dark:text-emerald-300'
              : 'border-red-300/80 dark:border-red-900/60 bg-red-50/70 dark:bg-red-950/30 text-red-800 dark:text-red-300'
          }`}
        >
          {testResult.ok ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      {/* Bottom Summary & Action Bar */}
      <footer className="rounded-xl border border-[#E5E1D8] dark:border-[#2E2C28] bg-white dark:bg-[#22211E] px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <p className="text-xs text-[#6B675E] dark:text-[#A19C92] truncate">
          {modelsSummary} · {audienceSummary}
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
            onClick={handleSaveOnly}
            className="px-4 py-2 rounded-lg border border-[#DFDBD0] dark:border-[#35332E] bg-[#FAF9F5] dark:bg-[#262522] hover:bg-[#EFECE3] dark:hover:bg-[#312F2B] text-xs font-medium text-[#1F1E1C] dark:text-[#F2EFE9] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            Salvar
          </button>

          <button
            type="button"
            onClick={handleTestAndSave}
            disabled={testing}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#141720] hover:bg-[#232836] dark:bg-[#F2EFE9] dark:hover:bg-[#DFDBD2] text-white dark:text-[#141720] text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-60"
          >
            {testing && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
            <span>Testar {provider.name}</span>
          </button>
        </div>
      </footer>
    </div>
  );
}

export default function AiGatewayView({
  configs,
  initialProviderId = null,
  onClearInitialProvider,
  onSaveConfig,
  onDeleteConfig,
}: AiGatewayViewProps) {
  const [selectedProviderId, setSelectedProviderId] = useState<string | null>(
    initialProviderId
  );
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'featured' | 'configured'>('all');

  const selectedProvider = useMemo(
    () => ALL_PROVIDERS.find((p) => p.id === selectedProviderId) ?? null,
    [selectedProviderId]
  );

  const configuredIds = useMemo(() => Object.keys(configs), [configs]);

  const filteredFeatured = useMemo(() => {
    const q = search.trim().toLowerCase();
    return FEATURED_PROVIDERS.filter((p) => {
      if (filter === 'configured' && !configs[p.id]) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        (p.subtitle?.toLowerCase().includes(q) ?? false)
      );
    });
  }, [configs, filter, search]);

  const filteredDirectory = useMemo(() => {
    if (filter === 'featured') return [];
    const q = search.trim().toLowerCase();
    return DIRECTORY_PROVIDERS.filter((p) => {
      if (filter === 'configured' && !configs[p.id]) return false;
      if (!q) return true;
      return p.name.toLowerCase().includes(q);
    });
  }, [configs, filter, search]);

  if (selectedProvider) {
    const existing = configs[selectedProvider.id];
    return (
      <ProviderConfigScreen
        key={selectedProvider.id}
        provider={selectedProvider}
        initialConfig={existing ?? createDefaultProviderConfig(selectedProvider.id)}
        hasExistingConfig={Boolean(existing)}
        onSave={onSaveConfig}
        onDelete={onDeleteConfig}
        onCancel={() => {
          setSelectedProviderId(null);
          onClearInitialProvider?.();
        }}
      />
    );
  }

  return (
    <div className="w-full max-w-[1040px] mx-auto px-4 sm:px-8 py-8 space-y-7">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#E6E2D8] dark:border-[#2C2A26]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <Network className="w-5 h-5 text-[#C96442] dark:text-[#D97757]" />
            <h1 className="font-serif text-2xl font-medium tracking-tight text-[#1F1E1C] dark:text-[#F2EFE9]">
              Adicionar provedores
            </h1>
          </div>
          <p className="text-sm text-[#6B675E] dark:text-[#A19C92] max-w-2xl leading-relaxed">
            Conecte chaves de API de outras IAs ao Gateway da HardWorkAI, defina quem pode usar e selecione os modelos liberados.{' '}
            <span className="tabular-nums">
              {configuredIds.length}{' '}
              {configuredIds.length === 1 ? 'configurado' : 'configurados'} ·{' '}
              {ALL_PROVIDERS.length} provedores disponíveis.
            </span>
          </p>
        </div>

        <a
          href={REFERENCE_LINKS.gateway}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#5C584F] dark:text-[#B5B0A6] hover:bg-[#EFECE3] dark:hover:bg-[#262522] transition-colors whitespace-nowrap shrink-0 self-start"
        >
          <span>Referência</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </a>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-[#8D887E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar provedor (ex: OpenRouter, Anthropic, DeepSeek...)"
            aria-label="Buscar provedor de IA"
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

        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#EFECE3] dark:bg-[#242320] w-fit">
          {(
            [
              { id: 'all', label: 'Todos' },
              { id: 'featured', label: 'Principais' },
              {
                id: 'configured',
                label: `Configurados (${configuredIds.length})`,
              },
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

      {filteredFeatured.length === 0 && filteredDirectory.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E1D8] dark:border-[#2C2A26] bg-white/70 dark:bg-[#21201D] p-10 text-center space-y-2">
          <p className="text-sm font-medium text-[#1F1E1C] dark:text-[#F2EFE9]">
            {filter === 'configured'
              ? 'Nenhum provedor configurado ainda'
              : 'Nenhum provedor encontrado'}
          </p>
          <p className="text-xs text-[#6B675E] dark:text-[#9E998F]">
            {filter === 'configured'
              ? 'Selecione qualquer provedor na aba Todos para adicionar sua chave de API.'
              : 'Tente buscar por outro nome ou limpe o filtro.'}
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {filteredFeatured.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xs font-semibold text-[#6B675E] dark:text-[#9E998F]">
                  Principais provedores
                </h2>
                <span className="text-xs text-[#8D887E] tabular-nums">
                  {filteredFeatured.length}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredFeatured.map((provider) => {
                  const cfg = configs[provider.id];
                  return (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => setSelectedProviderId(provider.id)}
                      className={`group flex items-start justify-between gap-3 rounded-xl border p-4 text-left transition-colors cursor-pointer ${
                        provider.recommended
                          ? 'border-[#C96442]/45 dark:border-[#D97757]/50 bg-white dark:bg-[#22211E] hover:border-[#C96442] dark:hover:border-[#D97757]'
                          : 'border-[#E5E1D8] dark:border-[#2E2C28] bg-white dark:bg-[#22211E] hover:border-[#C96442]/60 dark:hover:border-[#D97757]/60'
                      }`}
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
                          <span className="text-[0.94rem] font-semibold text-[#1F1E1C] dark:text-[#F2EFE9]">
                            {provider.name}
                          </span>
                          {provider.recommended && (
                            <span className="text-xs font-medium text-[#C96442] dark:text-[#E28868]">
                              Comece aqui
                            </span>
                          )}
                          {cfg && (
                            <span
                              className={`inline-flex items-center gap-1 text-xs font-medium ${
                                cfg.apiKey.trim() || cfg.keyMode === 'member'
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : 'text-amber-700 dark:text-amber-400'
                              }`}
                            >
                              {cfg.apiKey.trim() || cfg.keyMode === 'member' ? (
                                <>
                                  <Check className="w-3 h-3" />
                                  <span>Conectado</span>
                                </>
                              ) : (
                                <span>Sem chave</span>
                              )}
                            </span>
                          )}
                        </div>
                        {provider.subtitle && (
                          <p className="text-xs text-[#6B675E] dark:text-[#A19C92] leading-relaxed">
                            {provider.subtitle}
                          </p>
                        )}
                      </div>

                      <ChevronRight className="w-4 h-4 text-[#A8A399] group-hover:text-[#1F1E1C] dark:group-hover:text-[#F2EFE9] shrink-0 mt-0.5 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {filteredDirectory.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-baseline justify-between">
                <h2 className="text-xs font-semibold text-[#6B675E] dark:text-[#9E998F]">
                  Catálogo completo de provedores
                </h2>
                <span className="text-xs text-[#8D887E] tabular-nums">
                  {filteredDirectory.length} provedores
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredDirectory.map((provider) => {
                  const cfg = configs[provider.id];
                  return (
                    <button
                      key={provider.id}
                      type="button"
                      onClick={() => setSelectedProviderId(provider.id)}
                      className="group flex items-center justify-between gap-3 rounded-xl border border-[#E5E1D8] dark:border-[#2E2C28] bg-white dark:bg-[#22211E] hover:border-[#C96442]/60 dark:hover:border-[#D97757]/60 px-4 py-3 text-left transition-colors cursor-pointer"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-sm font-medium text-[#1F1E1C] dark:text-[#F2EFE9] truncate">
                            {provider.name}
                          </span>
                          {cfg && (cfg.apiKey.trim() || cfg.keyMode === 'member') && (
                            <Check
                              aria-label="Conectado"
                              className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0"
                            />
                          )}
                        </div>
                        <p className="text-xs text-[#7D786E] dark:text-[#969187] tabular-nums mt-0.5">
                          {formatModelsCount(provider.modelsCount)}
                        </p>
                      </div>

                      <ChevronRight className="w-4 h-4 text-[#B5B0A6] group-hover:text-[#1F1E1C] dark:group-hover:text-[#F2EFE9] shrink-0 transition-colors" />
                    </button>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
}
