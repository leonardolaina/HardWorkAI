'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Cable,
  Check,
  ExternalLink,
  Network,
  Plus,
  Puzzle,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react';
import type {
  GatewayRoute,
  GatewaySettings,
  McpConnector,
  McpTransport,
  PluginItem,
  ReasoningMode,
} from '@/lib/types';

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

export const DEFAULT_MCP_CONNECTORS: McpConnector[] = [
  {
    id: 'mcp-filesystem',
    name: 'Repositório & Documentos',
    endpoint: 'https://mcp.hardworkai.local/docs',
    transport: 'streamable-http',
    authType: 'bearer',
    description:
      'Permite consultar documentação interna, especificações técnicas e arquivos de projeto via MCP.',
    toolsCount: 6,
    connected: true,
  },
  {
    id: 'mcp-github',
    name: 'GitHub Workspace',
    endpoint: 'https://api.githubcopilot.com/mcp/',
    transport: 'streamable-http',
    authType: 'oauth',
    description:
      'Acesso a issues, pull requests, commits e busca de código em repositórios autorizados.',
    toolsCount: 12,
    connected: false,
  },
  {
    id: 'mcp-postgres',
    name: 'PostgreSQL Read-Only',
    endpoint: 'stdio://npx -y @modelcontextprotocol/server-postgres',
    transport: 'stdio',
    authType: 'none',
    description:
      'Inspeção de esquemas de tabelas e consultas analíticas somente leitura via servidor MCP local.',
    toolsCount: 4,
    connected: false,
  },
  {
    id: 'mcp-notion',
    name: 'Base de Conhecimento',
    endpoint: 'https://mcp.notion.com/sse',
    transport: 'sse',
    authType: 'oauth',
    description:
      'Pesquisa e leitura de páginas, wikis de equipe e bancos de notas estruturados.',
    toolsCount: 8,
    connected: false,
  },
];

export const DEFAULT_GATEWAY_ROUTES: GatewayRoute[] = [
  {
    id: 'route-fast',
    name: 'Rota Ágil',
    mode: 'fast',
    targetLabel: 'HardWorkAI Rápido · Baixa latência',
    priority: 1,
    timeoutMs: 15000,
    enabled: true,
  },
  {
    id: 'route-balanced',
    name: 'Rota Padrão',
    mode: 'balanced',
    targetLabel: 'HardWorkAI Equilibrado · Uso diário',
    priority: 2,
    timeoutMs: 30000,
    enabled: true,
  },
  {
    id: 'route-deep',
    name: 'Rota Raciocínio Profundo',
    mode: 'deep',
    targetLabel: 'HardWorkAI Profundo · Análise avançada',
    priority: 3,
    timeoutMs: 60000,
    enabled: true,
  },
];

export const DEFAULT_GATEWAY_SETTINGS: GatewaySettings = {
  autoFallback: true,
  injectActivePlugins: true,
  defaultWebSearch: false,
};

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

/* =========================== MCP CONNECTORS VIEW =========================== */

interface McpViewProps {
  connectors: McpConnector[];
  onToggleConnector: (id: string) => void;
  onAddConnector: (connector: McpConnector) => void;
  onDeleteConnector: (id: string) => void;
}

const TRANSPORT_LABELS: Record<McpTransport, string> = {
  'streamable-http': 'Streamable HTTP',
  sse: 'SSE',
  stdio: 'Stdio',
};

const AUTH_LABELS: Record<McpConnector['authType'], string> = {
  none: 'Sem autenticação',
  bearer: 'Bearer Token',
  oauth: 'OAuth 2.0',
};

export function McpConnectorsView({
  connectors,
  onToggleConnector,
  onAddConnector,
  onDeleteConnector,
}: McpViewProps) {
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'connected' | 'disconnected'>('all');
  const [showForm, setShowForm] = useState(false);
  const [verifiedId, setVerifiedId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [endpoint, setEndpoint] = useState('');
  const [transport, setTransport] = useState<McpTransport>('streamable-http');
  const [authType, setAuthType] = useState<McpConnector['authType']>('bearer');
  const [description, setDescription] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return connectors.filter((c) => {
      if (filter === 'connected' && !c.connected) return false;
      if (filter === 'disconnected' && c.connected) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.endpoint.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q)
      );
    });
  }, [connectors, query, filter]);

  const connectedCount = connectors.filter((c) => c.connected).length;

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !endpoint.trim()) return;
    onAddConnector({
      id: createLocalId('mcp'),
      name: name.trim(),
      endpoint: endpoint.trim(),
      transport,
      authType,
      description:
        description.trim() || 'Servidor Model Context Protocol configurado manualmente.',
      toolsCount: 3,
      connected: true,
    });
    setName('');
    setEndpoint('');
    setDescription('');
    setShowForm(false);
  };

  const handleCheck = (id: string) => {
    setVerifiedId(id);
    setTimeout(() => setVerifiedId((curr) => (curr === id ? null : curr)), 2000);
  };

  return (
    <div className="w-full max-w-[960px] mx-auto px-4 sm:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#E6E2D8] dark:border-[#2C2A26]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <Cable className="w-5 h-5 text-[#C96442] dark:text-[#D97757]" />
            <h1 className="font-serif text-2xl font-medium tracking-tight text-[#1F1E1C] dark:text-[#F2EFE9]">
              Conectores (MCP&apos;s)
            </h1>
          </div>
          <p className="text-sm text-[#6B675E] dark:text-[#A19C92] max-w-xl leading-relaxed">
            Configure conexões Model Context Protocol para integrar ferramentas, repositórios e bases externas.{' '}
            <span className="tabular-nums">
              {connectedCount} {connectedCount === 1 ? 'conectado' : 'conectados'} de {connectors.length}.
            </span>
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
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
            onClick={() => setShowForm((s) => !s)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-[#C96442] hover:bg-[#B85737] dark:bg-[#D97757] dark:hover:bg-[#C96442] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Novo conector</span>
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
              Adicionar servidor MCP
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
                Nome da conexão
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Linear Issues"
                className="w-full px-3 py-2 rounded-lg border border-[#DFDBD0] dark:border-[#35332E] bg-[#FAF9F5] dark:bg-[#171614] text-sm text-[#1F1E1C] dark:text-[#F2EFE9] focus:outline-none focus:border-[#C96442]"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#4A4740] dark:text-[#CFCAC0]">
                URL ou comando do servidor
              </span>
              <input
                type="text"
                required
                value={endpoint}
                onChange={(e) => setEndpoint(e.target.value)}
                placeholder="https://mcp.exemplo.com/sse"
                className="w-full px-3 py-2 rounded-lg border border-[#DFDBD0] dark:border-[#35332E] bg-[#FAF9F5] dark:bg-[#171614] text-sm font-mono text-[#1F1E1C] dark:text-[#F2EFE9] focus:outline-none focus:border-[#C96442]"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#4A4740] dark:text-[#CFCAC0]">
                Transporte
              </span>
              <select
                value={transport}
                onChange={(e) => setTransport(e.target.value as McpTransport)}
                className="w-full px-3 py-2 rounded-lg border border-[#DFDBD0] dark:border-[#35332E] bg-[#FAF9F5] dark:bg-[#171614] text-sm text-[#1F1E1C] dark:text-[#F2EFE9] focus:outline-none focus:border-[#C96442]"
              >
                <option value="streamable-http">Streamable HTTP</option>
                <option value="sse">SSE</option>
                <option value="stdio">Stdio</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#4A4740] dark:text-[#CFCAC0]">
                Autenticação
              </span>
              <select
                value={authType}
                onChange={(e) =>
                  setAuthType(e.target.value as McpConnector['authType'])
                }
                className="w-full px-3 py-2 rounded-lg border border-[#DFDBD0] dark:border-[#35332E] bg-[#FAF9F5] dark:bg-[#171614] text-sm text-[#1F1E1C] dark:text-[#F2EFE9] focus:outline-none focus:border-[#C96442]"
              >
                <option value="bearer">Bearer Token</option>
                <option value="oauth">OAuth 2.0</option>
                <option value="none">Sem autenticação</option>
              </select>
            </label>
          </div>

          <label className="block space-y-1.5">
            <span className="text-xs font-medium text-[#4A4740] dark:text-[#CFCAC0]">
              Descrição
            </span>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descreva que recursos este servidor MCP expõe"
              className="w-full px-3 py-2 rounded-lg border border-[#DFDBD0] dark:border-[#35332E] bg-[#FAF9F5] dark:bg-[#171614] text-sm text-[#1F1E1C] dark:text-[#F2EFE9] focus:outline-none focus:border-[#C96442]"
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
              Salvar conector
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
            placeholder="Buscar conectores ou endpoints"
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-[#E2DDD2] dark:border-[#32302C] bg-white dark:bg-[#22211E] text-sm text-[#1F1E1C] dark:text-[#F2EFE9] placeholder:text-[#8D887E] focus:outline-none focus:border-[#C96442]"
          />
        </div>

        <div className="flex items-center gap-1 p-1 rounded-lg bg-[#EFECE3] dark:bg-[#242320] w-fit">
          {(
            [
              { id: 'all', label: 'Todos' },
              { id: 'connected', label: 'Conectados' },
              { id: 'disconnected', label: 'Desconectados' },
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

      <div className="rounded-xl border border-[#E5E1D8] dark:border-[#2E2C28] bg-white dark:bg-[#22211E] divide-y divide-[#EFECE3] dark:divide-[#2C2A26]">
        {filtered.length === 0 ? (
          <div className="p-10 text-center space-y-1">
            <p className="text-sm font-medium text-[#1F1E1C] dark:text-[#F2EFE9]">
              Nenhum conector encontrado
            </p>
            <p className="text-xs text-[#6B675E] dark:text-[#9E998F]">
              Adicione um novo servidor MCP ou limpe os filtros acima.
            </p>
          </div>
        ) : (
          filtered.map((conn) => (
            <div
              key={conn.id}
              className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
                  <h3 className="text-[0.95rem] font-semibold text-[#1F1E1C] dark:text-[#F2EFE9]">
                    {conn.name}
                  </h3>
                  <span className="text-xs text-[#7D786E] dark:text-[#969187]">
                    {TRANSPORT_LABELS[conn.transport]} · {AUTH_LABELS[conn.authType]} ·{' '}
                    <span className="tabular-nums">{conn.toolsCount} ferramentas</span>
                  </span>
                </div>
                <p className="text-xs font-mono text-[#6B675E] dark:text-[#A8A399] truncate">
                  {conn.endpoint}
                </p>
                <p className="text-xs text-[#55524A] dark:text-[#BFB9AE] leading-relaxed">
                  {conn.description}
                </p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => handleCheck(conn.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-[#E2DDD2] dark:border-[#35332E] text-xs font-medium text-[#4A4740] dark:text-[#CFCAC0] hover:bg-[#F3F1EA] dark:hover:bg-[#2B2926] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {verifiedId === conn.id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                      <span>Validado</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Testar</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => onToggleConnector(conn.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    conn.connected
                      ? 'bg-[#EFECE3] dark:bg-[#2E2C28] text-[#1F1E1C] dark:text-[#F2EFE9] hover:bg-[#E5E0D4] dark:hover:bg-[#383530]'
                      : 'bg-[#C96442] hover:bg-[#B85737] dark:bg-[#D97757] text-white'
                  }`}
                >
                  {conn.connected ? 'Desconectar' : 'Conectar'}
                </button>

                <button
                  type="button"
                  onClick={() => onDeleteConnector(conn.id)}
                  title="Remover conector"
                  aria-label={`Remover ${conn.name}`}
                  className="p-1.5 rounded-lg text-[#7D786E] hover:text-red-600 dark:hover:text-red-400 hover:bg-[#F3F1EA] dark:hover:bg-[#2C2A26] cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

/* =========================== AI GATEWAY VIEW =========================== */

interface GatewayViewProps {
  routes: GatewayRoute[];
  settings: GatewaySettings;
  activeMode: ReasoningMode;
  totalMessages: number;
  onSelectDefaultMode: (mode: ReasoningMode) => void;
  onToggleRoute: (id: string) => void;
  onAddRoute: (route: GatewayRoute) => void;
  onDeleteRoute: (id: string) => void;
  onUpdateSettings: (patch: Partial<GatewaySettings>) => void;
}

export function AiGatewayView({
  routes,
  settings,
  activeMode,
  totalMessages,
  onSelectDefaultMode,
  onToggleRoute,
  onAddRoute,
  onDeleteRoute,
  onUpdateSettings,
}: GatewayViewProps) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [mode, setMode] = useState<ReasoningMode>('balanced');
  const [timeoutMs, setTimeoutMs] = useState('30000');

  const activeRoutes = routes.filter((r) => r.enabled).length;

  const handleCreateRoute = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const modeMap: Record<ReasoningMode, string> = {
      fast: 'HardWorkAI Rápido · Baixa latência',
      balanced: 'HardWorkAI Equilibrado · Uso diário',
      deep: 'HardWorkAI Profundo · Análise avançada',
    };
    onAddRoute({
      id: createLocalId('route'),
      name: name.trim(),
      mode,
      targetLabel: modeMap[mode],
      priority: routes.length + 1,
      timeoutMs: Math.max(5000, Number(timeoutMs) || 30000),
      enabled: true,
      custom: true,
    });
    setName('');
    setShowForm(false);
  };

  return (
    <div className="w-full max-w-[960px] mx-auto px-4 sm:px-8 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[#E6E2D8] dark:border-[#2C2A26]">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <Network className="w-5 h-5 text-[#C96442] dark:text-[#D97757]" />
            <h1 className="font-serif text-2xl font-medium tracking-tight text-[#1F1E1C] dark:text-[#F2EFE9]">
              Gateway de IA&apos;s
            </h1>
          </div>
          <p className="text-sm text-[#6B675E] dark:text-[#A19C92] max-w-xl leading-relaxed">
            Centralize rotas de inferência, perfil padrão de raciocínio e políticas de resiliência da HardWorkAI.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <a
            href={REFERENCE_LINKS.gateway}
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
            <span>Nova rota</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-[#E5E1D8] dark:border-[#2E2C28] bg-white dark:bg-[#22211E] p-4 space-y-1">
          <p className="text-xs text-[#7D786E] dark:text-[#969187]">Rotas ativas</p>
          <p className="font-mono text-2xl font-medium text-[#1F1E1C] dark:text-[#F2EFE9] tabular-nums">
            {activeRoutes} / {routes.length}
          </p>
        </div>
        <div className="rounded-xl border border-[#E5E1D8] dark:border-[#2E2C28] bg-white dark:bg-[#22211E] p-4 space-y-1">
          <p className="text-xs text-[#7D786E] dark:text-[#969187]">
            Mensagens no histórico local
          </p>
          <p className="font-mono text-2xl font-medium text-[#1F1E1C] dark:text-[#F2EFE9] tabular-nums">
            {totalMessages}
          </p>
        </div>
        <div className="rounded-xl border border-[#E5E1D8] dark:border-[#2E2C28] bg-white dark:bg-[#22211E] p-4 space-y-1">
          <p className="text-xs text-[#7D786E] dark:text-[#969187]">
            Fallback automático
          </p>
          <p className="text-lg font-medium text-[#1F1E1C] dark:text-[#F2EFE9] pt-1">
            {settings.autoFallback ? 'Ativado' : 'Desativado'}
          </p>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreateRoute}
          className="rounded-2xl border border-[#DFDBD0] dark:border-[#34322E] bg-white dark:bg-[#22211E] p-5 space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold text-[#1F1E1C] dark:text-[#F2EFE9]">
              Nova rota no Gateway
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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#4A4740] dark:text-[#CFCAC0]">
                Nome da rota
              </span>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Produção Código"
                className="w-full px-3 py-2 rounded-lg border border-[#DFDBD0] dark:border-[#35332E] bg-[#FAF9F5] dark:bg-[#171614] text-sm text-[#1F1E1C] dark:text-[#F2EFE9] focus:outline-none focus:border-[#C96442]"
              />
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#4A4740] dark:text-[#CFCAC0]">
                Perfil de destino
              </span>
              <select
                value={mode}
                onChange={(e) => setMode(e.target.value as ReasoningMode)}
                className="w-full px-3 py-2 rounded-lg border border-[#DFDBD0] dark:border-[#35332E] bg-[#FAF9F5] dark:bg-[#171614] text-sm text-[#1F1E1C] dark:text-[#F2EFE9] focus:outline-none focus:border-[#C96442]"
              >
                <option value="fast">HardWorkAI Rápido</option>
                <option value="balanced">HardWorkAI Equilibrado</option>
                <option value="deep">HardWorkAI Profundo</option>
              </select>
            </label>
            <label className="block space-y-1.5">
              <span className="text-xs font-medium text-[#4A4740] dark:text-[#CFCAC0]">
                Timeout (ms)
              </span>
              <input
                type="number"
                min={5000}
                step={1000}
                value={timeoutMs}
                onChange={(e) => setTimeoutMs(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-[#DFDBD0] dark:border-[#35332E] bg-[#FAF9F5] dark:bg-[#171614] text-sm font-mono tabular-nums text-[#1F1E1C] dark:text-[#F2EFE9] focus:outline-none focus:border-[#C96442]"
              />
            </label>
          </div>

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
              Criar rota
            </button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-[#1F1E1C] dark:text-[#F2EFE9]">
          Rotas de modelos
        </h2>
        <div className="rounded-xl border border-[#E5E1D8] dark:border-[#2E2C28] bg-white dark:bg-[#22211E] overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[#EFECE3] dark:border-[#2C2A26] text-xs text-[#7D786E] dark:text-[#969187]">
                <th className="py-3 px-4 font-medium">Rota</th>
                <th className="py-3 px-4 font-medium">Destino</th>
                <th className="py-3 px-4 font-medium text-right">Timeout</th>
                <th className="py-3 px-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#EFECE3] dark:divide-[#2C2A26] text-sm">
              {routes.map((route) => {
                const isDefault = route.mode === activeMode;
                return (
                  <tr key={route.id} className="hover:bg-[#FAF9F5]/70 dark:hover:bg-[#272522]/60">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-[#1F1E1C] dark:text-[#F2EFE9]">
                        {route.name}
                      </div>
                      <div className="text-xs text-[#7D786E] dark:text-[#969187]">
                        Prioridade {route.priority} · {route.enabled ? 'Ativa' : 'Pausada'}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-[#55524A] dark:text-[#BFB9AE]">
                      {route.targetLabel}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-xs text-[#55524A] dark:text-[#BFB9AE] tabular-nums">
                      {(route.timeoutMs / 1000).toFixed(0)}s
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => onSelectDefaultMode(route.mode)}
                          disabled={isDefault}
                          className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors ${
                            isDefault
                              ? 'text-[#C96442] dark:text-[#E28868] cursor-default'
                              : 'text-[#55524A] dark:text-[#CFCAC0] hover:bg-[#EFECE3] dark:hover:bg-[#2F2D29] cursor-pointer'
                          }`}
                        >
                          {isDefault ? 'Padrão no chat' : 'Usar no chat'}
                        </button>

                        <button
                          type="button"
                          role="switch"
                          aria-checked={route.enabled}
                          aria-label={`Alternar rota ${route.name}`}
                          onClick={() => onToggleRoute(route.id)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                            route.enabled
                              ? 'bg-[#C96442] dark:bg-[#D97757]'
                              : 'bg-[#DDD8CD] dark:bg-[#3A3834]'
                          }`}
                        >
                          <span
                            className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                              route.enabled ? 'translate-x-4.5' : 'translate-x-1'
                            }`}
                          />
                        </button>

                        {route.custom && (
                          <button
                            type="button"
                            onClick={() => onDeleteRoute(route.id)}
                            aria-label={`Excluir ${route.name}`}
                            className="p-1 rounded text-[#7D786E] hover:text-red-600 dark:hover:text-red-400 cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold text-[#1F1E1C] dark:text-[#F2EFE9]">
          Políticas de roteamento
        </h2>
        <div className="rounded-xl border border-[#E5E1D8] dark:border-[#2E2C28] bg-white dark:bg-[#22211E] divide-y divide-[#EFECE3] dark:divide-[#2C2A26]">
          <div className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-sm font-medium text-[#1F1E1C] dark:text-[#F2EFE9]">
                Fallback automático de resiliência
              </p>
              <p className="text-xs text-[#6B675E] dark:text-[#9E998F] mt-0.5">
                Redireciona automaticamente para a rota ágil caso ocorra falha transitória.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.autoFallback}
              onClick={() =>
                onUpdateSettings({ autoFallback: !settings.autoFallback })
              }
              className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                settings.autoFallback
                  ? 'bg-[#C96442] dark:bg-[#D97757]'
                  : 'bg-[#DDD8CD] dark:bg-[#3A3834]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoFallback ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-sm font-medium text-[#1F1E1C] dark:text-[#F2EFE9]">
                Aplicar plugins ativos no contexto do chat
              </p>
              <p className="text-xs text-[#6B675E] dark:text-[#9E998F] mt-0.5">
                Envia automaticamente as diretrizes dos plugins habilitados em cada conversa.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.injectActivePlugins}
              onClick={() =>
                onUpdateSettings({
                  injectActivePlugins: !settings.injectActivePlugins,
                })
              }
              className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                settings.injectActivePlugins
                  ? 'bg-[#C96442] dark:bg-[#D97757]'
                  : 'bg-[#DDD8CD] dark:bg-[#3A3834]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.injectActivePlugins ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 p-4">
            <div>
              <p className="text-sm font-medium text-[#1F1E1C] dark:text-[#F2EFE9]">
                Busca na web ativa por padrão
              </p>
              <p className="text-xs text-[#6B675E] dark:text-[#9E998F] mt-0.5">
                Mantém o aterramento em busca na web habilitado ao iniciar novas conversas.
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={settings.defaultWebSearch}
              onClick={() =>
                onUpdateSettings({
                  defaultWebSearch: !settings.defaultWebSearch,
                })
              }
              className={`relative inline-flex h-6 w-10 items-center rounded-full transition-colors cursor-pointer shrink-0 ${
                settings.defaultWebSearch
                  ? 'bg-[#C96442] dark:bg-[#D97757]'
                  : 'bg-[#DDD8CD] dark:bg-[#3A3834]'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.defaultWebSearch ? 'translate-x-5' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
