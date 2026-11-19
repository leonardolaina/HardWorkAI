import type { McpTransport } from './types';

export interface McpCatalogItem {
  id: string;
  name: string;
  description: string;
  approvedAppsOnly?: boolean;
  defaultEndpoint: string;
  defaultTransport: McpTransport;
  monogram: string;
  sampleTools: string[];
}

export interface McpConnectionRecord {
  connectorId: string;
  name: string;
  description: string;
  endpoint: string;
  transport: McpTransport;
  approvedAppsOnly: boolean;
  custom: boolean;
  ownerUid: string;
  accountEmail: string;
  everyoneInOrg: boolean;
  people: string[];
  teams: string[];
  toolsSelection: 'all' | 'picked';
  selectedTools: string[];
  connected: boolean;
}

export const MCP_CATALOG: McpCatalogItem[] = [
  {
    id: 'google-workspace',
    name: 'Google Workspace',
    description: 'Gmail, Drive, Agenda, Planilhas e Chat',
    defaultEndpoint: 'https://mcp.hardworkai.app/google-workspace',
    defaultTransport: 'streamable-http',
    monogram: 'G',
    sampleTools: ['gmail_search', 'drive_read', 'calendar_events', 'sheets_query', 'chat_post'],
  },
  {
    id: 'microsoft-365',
    name: 'Microsoft 365',
    description: 'Outlook, Calendário, OneDrive e Teams',
    defaultEndpoint: 'https://mcp.hardworkai.app/microsoft-365',
    defaultTransport: 'streamable-http',
    monogram: 'M',
    sampleTools: ['outlook_mail', 'calendar_schedule', 'onedrive_files', 'teams_channels'],
  },
  {
    id: 'github',
    name: 'GitHub',
    description: 'PRs, problemas, código e CI',
    approvedAppsOnly: true,
    defaultEndpoint: 'https://api.githubcopilot.com/mcp/',
    defaultTransport: 'streamable-http',
    monogram: 'GH',
    sampleTools: ['list_pull_requests', 'list_issues', 'search_code', 'get_workflow_runs'],
  },
  {
    id: 'notion',
    name: 'Noção',
    description: 'Páginas, bancos de dados e documentos do projeto sincronizados',
    defaultEndpoint: 'https://mcp.notion.com/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'N',
    sampleTools: ['search_pages', 'query_database', 'create_page', 'update_blocks'],
  },
  {
    id: 'linear',
    name: 'Linear',
    description: 'Planeje sprints e envie tickets mais rapidamente',
    defaultEndpoint: 'https://mcp.linear.app/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'L',
    sampleTools: ['list_issues', 'create_issue', 'update_cycle', 'list_projects'],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    description: 'Inspecionar pagamentos, faturas e assinaturas.',
    defaultEndpoint: 'https://mcp.stripe.com/',
    defaultTransport: 'streamable-http',
    monogram: 'S',
    sampleTools: ['list_charges', 'get_invoice', 'list_subscriptions', 'get_customer'],
  },
  {
    id: 'sentry',
    name: 'Sentinela',
    description: 'Acompanhar lançamentos e resolver erros de produção',
    defaultEndpoint: 'https://mcp.sentry.dev/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'Se',
    sampleTools: ['list_issues', 'get_event_stacktrace', 'list_releases', 'resolve_issue'],
  },
  {
    id: 'granola',
    name: 'Granola',
    description: 'Pesquise suas anotações e transcrições de reuniões.',
    defaultEndpoint: 'https://mcp.granola.ai/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'G',
    sampleTools: ['search_meetings', 'get_transcript', 'list_notes'],
  },
  {
    id: 'polar',
    name: 'Polar',
    description: 'Produtos, assinaturas, pedidos e faturamento de clientes',
    defaultEndpoint: 'https://mcp.polar.sh/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'P',
    sampleTools: ['list_products', 'list_orders', 'list_subscriptions', 'get_metrics'],
  },
  {
    id: 'slack',
    name: 'Slack',
    description: 'Canais, mensagens diretas e pesquisa',
    approvedAppsOnly: true,
    defaultEndpoint: 'https://mcp.slack.com/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'Sl',
    sampleTools: ['list_channels', 'search_messages', 'read_thread', 'post_message'],
  },
  {
    id: 'exa',
    name: 'Exa',
    description: 'Busca na Web, contexto do código e pesquisa',
    defaultEndpoint: 'https://mcp.exa.ai/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'Ex',
    sampleTools: ['web_search', 'code_context', 'find_similar'],
  },
  {
    id: 'render',
    name: 'Renderizar',
    description: 'Implantar e gerenciar serviços, bancos de dados e registros.',
    approvedAppsOnly: true,
    defaultEndpoint: 'https://mcp.render.com/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'R',
    sampleTools: ['list_services', 'list_deploys', 'query_logs', 'inspect_postgres'],
  },
  {
    id: 'context7',
    name: 'Contexto7',
    description: 'Documentação da biblioteca atualizada e exemplos de código.',
    defaultEndpoint: 'https://mcp.context7.com/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'C7',
    sampleTools: ['resolve_library_id', 'get_library_docs'],
  },
  {
    id: 'airtable',
    name: 'Airtable',
    description: 'Leia e atualize bases, tabelas e registros do Airtable.',
    defaultEndpoint: 'https://mcp.airtable.com/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'At',
    sampleTools: ['list_bases', 'list_records', 'create_record', 'update_record'],
  },
  {
    id: 'amplitude',
    name: 'Amplitude',
    description: 'Analise as métricas, eventos e insights de produtos do Amplitude.',
    defaultEndpoint: 'https://mcp.amplitude.com/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'Am',
    sampleTools: ['query_events', 'get_funnel', 'list_charts', 'get_cohort'],
  },
  {
    id: 'cal-com',
    name: 'Cal.com',
    description: 'Gerencie o agendamento, os tipos de eventos e as reservas do Cal.com.',
    defaultEndpoint: 'https://mcp.cal.com/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'Ca',
    sampleTools: ['list_event_types', 'list_bookings', 'create_booking', 'check_availability'],
  },
  {
    id: 'canva',
    name: 'Canva',
    description: 'Pesquise e crie designs, pastas e recursos no Canva.',
    defaultEndpoint: 'https://mcp.canva.com/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'Cv',
    sampleTools: ['search_designs', 'create_design', 'list_folders', 'export_asset'],
  },
  {
    id: 'figma',
    name: 'Figma',
    description: 'Leia os arquivos Figma, os designs e os detalhes do modo de desenvolvimento.',
    approvedAppsOnly: true,
    defaultEndpoint: 'https://mcp.figma.com/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'Fg',
    sampleTools: ['get_file', 'get_design_context', 'list_variables', 'get_comments'],
  },
  {
    id: 'fireflies',
    name: 'Vaga-lumes',
    description: 'Pesquise suas anotações e transcrições de reuniões dos Fireflies.',
    defaultEndpoint: 'https://api.fireflies.ai/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'Ff',
    sampleTools: ['search_transcripts', 'get_meeting_summary', 'list_action_items'],
  },
  {
    id: 'grafana-cloud',
    name: 'Grafana Cloud',
    description:
      'Consulte métricas, registros, rastreamentos e perfis, e revise painéis, alertas e incidentes.',
    defaultEndpoint: 'https://mcp.grafana.net/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'Gr',
    sampleTools: ['query_prometheus', 'query_loki', 'list_dashboards', 'list_alerts'],
  },
  {
    id: 'hugging-face',
    name: 'Rosto de Abraço',
    description: 'Navegue pelos modelos, conjuntos de dados e Espaços do Hugging Face.',
    defaultEndpoint: 'https://huggingface.co/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'HF',
    sampleTools: ['search_models', 'search_datasets', 'inspect_space', 'run_space'],
  },
  {
    id: 'honeycomb',
    name: 'Favo de mel',
    description: 'Consultar rastreamentos, eventos e SLOs do Honeycomb',
    defaultEndpoint: 'https://mcp.honeycomb.io/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'Hc',
    sampleTools: ['run_query', 'list_slos', 'get_trace', 'list_triggers'],
  },
  {
    id: 'klaviyo',
    name: 'Piano',
    description: 'Analise as campanhas, fluxos e dados de contato do Klaviyo.',
    defaultEndpoint: 'https://mcp.klaviyo.com/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'Kl',
    sampleTools: ['list_campaigns', 'list_flows', 'search_profiles', 'get_metrics'],
  },
  {
    id: 'lucid',
    name: 'Lúcido',
    description: 'Abra e atualize os documentos do Lucidchart e do Lucidspark.',
    defaultEndpoint: 'https://mcp.lucid.co/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'Lu',
    sampleTools: ['list_documents', 'get_diagram', 'update_board'],
  },
  {
    id: 'monday-com',
    name: 'monday.com',
    description: 'Gerencie quadros, itens e espaços de trabalho do monday.com',
    defaultEndpoint: 'https://mcp.monday.com/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'Mo',
    sampleTools: ['list_boards', 'get_items', 'create_item', 'update_status'],
  },
  {
    id: 'mural',
    name: 'Mural',
    description: 'Leia e atualize telas de murais, salas e espaços de trabalho.',
    defaultEndpoint: 'https://mcp.mural.co/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'Mu',
    sampleTools: ['list_murals', 'read_widgets', 'create_sticky_note'],
  },
  {
    id: 'posthog',
    name: 'PostHog',
    description: 'Analise os eventos, pessoas e insights do PostHog.',
    defaultEndpoint: 'https://mcp.posthog.com/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'PH',
    sampleTools: ['query_hogql', 'list_insights', 'list_feature_flags', 'get_persons'],
  },
  {
    id: 'semgrep',
    name: 'Semgrep',
    description: 'Execute verificações de segurança com o Semgrep e revise os resultados.',
    defaultEndpoint: 'https://mcp.semgrep.ai/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'Sg',
    sampleTools: ['scan_code', 'list_findings', 'explain_rule'],
  },
  {
    id: 'tavily',
    name: 'Tavily',
    description: 'Pesquisa e busca na web por agentes',
    defaultEndpoint: 'https://mcp.tavily.com/mcp',
    defaultTransport: 'streamable-http',
    monogram: 'Tv',
    sampleTools: ['tavily_search', 'tavily_extract', 'tavily_crawl'],
  },
  {
    id: 'vercel',
    name: 'Vercel',
    description: 'Gerenciar projetos, implantações e registros do Vercel.',
    defaultEndpoint: 'https://mcp.vercel.com/',
    defaultTransport: 'streamable-http',
    monogram: 'Vc',
    sampleTools: ['list_projects', 'list_deployments', 'get_build_logs', 'get_domains'],
  },
];
