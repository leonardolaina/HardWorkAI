'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  ExternalLink,
  Plus,
  Puzzle,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type { PluginItem } from '@/lib/types';

export const REFERENCE_LINKS = {
  plugins: 'https://app.openworklabs.com/dashboard/plugins',
  mcp: 'https://app.openworklabs.com/dashboard/mcp-connections',
  gateway: 'https://app.openworklabs.com/dashboard/ai-gateway',
} as const;

export const DEFAULT_PLUGINS: PluginItem[] = [
  {
    id: 'plugin-code-review',
    name: 'Revisão de Código',
    category: 'Engenharia',
    description:
      'Analisa pull requests e trechos de código apontando bugs, segurança, legibilidade e melhorias de performance.',
    instruction:
      'Ao analisar código, destaque primeiro riscos de segurança ou bugs, depois melhorias de arquitetura e sugestões enxutas de refatoração.',
    enabled: true,
  },
  {
    id: 'plugin-exec-summary',
    name: 'Resumo Executivo',
    category: 'Produtividade',
    description:
      'Transforma atas, relatórios extensos e artigos em sínteses objetivas com decisões e próximos passos.',
    instruction:
      'Quando resumir documentos longos, organize em Contexto, Pontos-chave e Próximas Ações.',
    enabled: false,
  },
  {
    id: 'plugin-sql-architect',
    name: 'Arquiteto SQL',
    category: 'Dados',
    description:
      'Escreve consultas SQL otimizadas, sugere índices e explica planos de execução com clareza.',
    instruction:
      'Para pedidos de banco de dados, forneça SQL padrão bem formatado, indique índices recomendados e alerte sobre consultas custosas.',
    enabled: false,
  },
  {
    id: 'plugin-tech-writer',
    name: 'Documentação Técnica',
    category: 'Escrita',
    description:
      'Gera guias de API, READMEs estruturados e notas de versão com linguagem precisa e exemplos prontos.',
    instruction:
      'Ao criar documentação técnica, inclua pré-requisitos, exemplos executáveis e tratamento de erros comuns.',
    enabled: false,
  },
  {
    id: 'plugin-data-analyst',
    name: 'Analisador de Planilhas e CSV',
    category: 'Dados',
    description:
      'Interpreta tabelas e arquivos CSV anexados para extrair tendências, anomalias e comparativos.',
    instruction:
      'Ao receber dados tabulares ou CSV, apresente os principais indicadores em tabela Markdown com alinhamento numérico claro.',
    enabled: false,
  },
];

function createLocalId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/* =========================== PLUGINS VIEW =========================== */

interface PluginsViewProps {
  plugins: PluginItem[];
  onTogglePlugin: (id: string) => void;
  onAddPlugin: (plugin: PluginItem) => void;
  onDeletePlugin: (id: string) => void;
  onReturnToChat: () => void;
}

export function PluginsView({
  plugins,
  onTogglePlugin,
  onAddPlugin,
  onDeletePlugin,
  onReturnToChat,
}: PluginsViewProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'active' | 'available'>('all');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Produtividade');
  const [description, setDescription] = useState('');
  const [instruction, setInstruction] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return plugins.filter((p) => {
      if (filter === 'active' && !p.enabled) return false;
      if (filter === 'available' && p.enabled) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [plugins, query, filter]);

  const activeCount = plugins.filter((p) => p.enabled).length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !instruction.trim()) return;
    onAddPlugin({
      id: createLocalId('plugin'),
      name: name.trim(),
      category: category.trim() || 'Personalizado',
      description:
        description.trim() || 'Plugin personalizado configurado para suas conversas.',
      instruction: instruction.trim(),
      enabled: true,
      custom: true,
    });
    setName('');
    setDescription('');
    setInstruction('');
    setShowForm(false);
  };

  return (
    <div className="w-full max-w-[960px] mx-auto px-4 sm:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#E6E2D8] dark:border-[#2C2A26]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <Puzzle className="w-5 h-5 text-[#C96442] dark:text-[#D97757]" />
            <h1 className="font-serif text-2xl font-medium tracking-tight text-[#1F1E1C] dark:text-[#F2EFE9]">
              Plugins
            </h1>
          </div>
          <p className="text-sm text-[#6B675E] dark:text-[#A19C92] max-w-xl leading-relaxed">
            Ative habilidades especializadas para orientar as respostas da HardWorkAI.{' '}
            <span className="tabular-nums">
              {activeCount} {activeCount === 1 ? 'ativo' : 'ativos'} de {plugins.length}.
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href={REFERENCE_LINKS.plugins}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium text-[#5C584F] dark:text-[#B5B0A6] hover:bg-[#EFECE3] dark:hover:bg-[#262522] transition-colors whitespace-nowrap shrink-0"
          >
            <span>Referência</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button
            type="button"
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-[#C96442] hover:bg-[#B85737] dark:bg-[#D97757] dark:hover:bg-[#C96442] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo plugin</span>
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="rounded-2xl border border-[#DFDBD0] dark:border-[#34322E] bg-white dark:bg-[#22211E] p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#1F1E1C] dark:text-[#F2EFE9]">
              Criar plugin personalizado
            </h2>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              aria-label="Fechar formulário"
              className="p-1.5 rounded-lg text-[#7D786E] hover:bg-[#F3F1EA] dark:hover:bg-[#2C2A26] cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#4A4740] dark:text-[#CFCAC0]">
                Nome do plugin
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Revisor Jurídico"
                className="w-full px-3 py-2 rounded-lg border border-[#DFDBD0] dark:border-[#35332E] bg-[#FAF9F5] dark:bg-[#171614] text-sm text-[#1F1E1C] dark:text-[#F2EFE9] focus:outline-none focus:border-[#C96442]"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#4A4740] dark:text-[#CFCAC0]">
                Categoria
              </span>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Engenharia, Escrita, Dados"
                className="w-full px-3 py-2 rounded-lg border border-[#DFDBD0] dark:border-[#35332E] bg-[#FAF9F5] dark:bg-[#171614] text-sm text-[#1F1E1C] dark:text-[#F2EFE9] focus:outline-none focus:border-[#C96442]"
              />
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#4A4740] dark:text-[#CFCAC0]">
              Descrição curta
            </span>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="O que este plugin faz na prática"
              className="w-full px-3 py-2 rounded-lg border border-[#DFDBD0] dark:border-[#35332E] bg-[#FAF9F5] dark:bg-[#171614] text-sm text-[#1F1E1C] dark:text-[#F2EFE9] focus:outline-none focus:border-[#C96442]"
            />
          </label>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#4A4740] dark:text-[#CFCAC0]">
              Diretriz aplicada ao assistente
            </span>
            <textarea
              required
              rows={3}
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="Ex: Sempre valide cláusulas ambíguas e sugira redações alternativas objetivas."
              className="w-full px-3 py-2 rounded-lg border border-[#DFDBD0] dark:border-[#35332E] bg-[#FAF9F5] dark:bg-[#171614] text-sm text-[#1F1E1C] dark:text-[#F2EFE9] focus:outline-none focus:border-[#C96442] resize-none"
            />
          </label>

          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 text-xs font-medium rounded-lg border border-[#DFDBD0] dark:border-[#35332E] text-[#4A4740] dark:text-[#CFCAC0] hover:bg-[#F3F1EA] dark:hover:bg-[#2B2926] cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-xs font-medium rounded-lg bg-[#C96442] hover:bg-[#B85737] dark:bg-[#D97757] text-white cursor-pointer"
            >
              Adicionar plugin
            </button>
          </div>
        </form>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="w-4 h-4 text-[#8D887E] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar plugins por nome ou categoria"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E2DDD2] dark:border-[#32302C] bg-white dark:bg-[#22211E] text-sm text-[#1F1E1C] dark:text-[#F2EFE9] placeholder:text-[#8D887E] focus:outline-none focus:border-[#C96442]"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#EFECE3] dark:bg-[#242320] w-fit">
          {(
            [
              { id: 'all', label: 'Todos' },
              { id: 'active', label: 'Ativos' },
              { id: 'available', label: 'Disponíveis' },
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

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-[#E5E1D8] dark:border-[#2C2A26] bg-white/60 dark:bg-[#21201D] p-10 text-center space-y-2">
          <p className="text-sm font-medium text-[#1F1E1C] dark:text-[#F2EFE9]">
            Nenhum plugin encontrado
          </p>
          <p className="text-xs text-[#6B675E] dark:text-[#9E998F]">
            Ajuste o filtro de busca ou crie um novo plugin personalizado.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((plugin) => (
            <div
              key={plugin.id}
              className="flex flex-col justify-between gap-4 rounded-xl border border-[#E5E1D8] dark:border-[#2E2C28] bg-white dark:bg-[#22211E] p-5"
            >
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="text-[0.95rem] font-semibold text-[#1F1E1C] dark:text-[#F2EFE9]">
                      {plugin.name}
                    </h3>
                    <p className="text-xs text-[#7D786E] dark:text-[#969187] mt-0.5">
                      {plugin.category} · {plugin.enabled ? 'Ativo no chat' : 'Inativo'}
                    </p>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {plugin.custom && (
                      <button
                        type="button"
                        onClick={() => onDeletePlugin(plugin.id)}
                        title="Remover plugin"
                        aria-label={`Remover ${plugin.name}`}
                        className="p-1.5 rounded-lg text-[#7D786E] hover:text-red-600 dark:hover:text-red-400 hover:bg-[#F3F1EA] dark:hover:bg-[#2C2A26] cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={plugin.enabled}
                      aria-label={`Alternar plugin ${plugin.name}`}
                      onClick={() => onTogglePlugin(plugin.id)}
                      className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                        plugin.enabled
                          ? 'bg-[#C96442] dark:bg-[#D97757]'
                          : 'bg-[#DDD8CD] dark:bg-[#3A3834]'
                      }`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                          plugin.enabled ? 'translate-x-5' : 'translate-x-1'
                        }`}
                      />
                    </button>
                  </div>
                </div>

                <p className="text-xs text-[#55524A] dark:text-[#BFB9AE] leading-relaxed">
                  {plugin.description}
                </p>
              </div>

              <div className="pt-3 border-t border-[#EFECE3] dark:border-[#2C2A26] flex items-center justify-between gap-2">
                <span className="text-[11px] text-[#7D786E] dark:text-[#8E897F] truncate">
                  {plugin.custom ? 'Plugin personalizado' : 'Plugin integrado'}
                </span>
                {plugin.enabled && (
                  <button
                    type="button"
                    onClick={onReturnToChat}
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#C96442] dark:text-[#E28868] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                  >
                    <span>Testar no chat</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
