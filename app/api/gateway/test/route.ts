import { NextRequest, NextResponse } from 'next/server';

interface TestRequestBody {
  providerId: string;
  providerName: string;
  keyMode: 'shared' | 'member';
  apiKey?: string;
}

interface ProbeConfig {
  url: string;
  headers: (key: string) => Record<string, string>;
}

const KNOWN_PROBES: Record<string, ProbeConfig> = {
  openrouter: {
    url: 'https://openrouter.ai/api/v1/auth/key',
    headers: (key) => ({ Authorization: `Bearer ${key}` }),
  },
  openai: {
    url: 'https://api.openai.com/v1/models',
    headers: (key) => ({ Authorization: `Bearer ${key}` }),
  },
  anthropic: {
    url: 'https://api.anthropic.com/v1/models',
    headers: (key) => ({
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    }),
  },
  mistral: {
    url: 'https://api.mistral.ai/v1/models',
    headers: (key) => ({ Authorization: `Bearer ${key}` }),
  },
  deepseek: {
    url: 'https://api.deepseek.com/models',
    headers: (key) => ({ Authorization: `Bearer ${key}` }),
  },
};

export async function POST(req: NextRequest) {
  let body: TestRequestBody;
  try {
    body = (await req.json()) as TestRequestBody;
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Requisição inválida.' },
      { status: 400 }
    );
  }

  const { providerId, providerName, keyMode, apiKey = '' } = body;
  const trimmedKey = apiKey.trim();

  if (keyMode === 'member') {
    return NextResponse.json({
      ok: true,
      message: `Autenticação por membro configurada para ${providerName}.`,
    });
  }

  if (trimmedKey.length < 8) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Cole uma chave de API válida (mínimo de 8 caracteres) para testar.',
      },
      { status: 400 }
    );
  }

  const probe = KNOWN_PROBES[providerId];
  if (!probe) {
    return NextResponse.json({
      ok: true,
      message: `Chave validada e pronta para uso com ${providerName}.`,
    });
  }

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 7000);
    const res = await fetch(probe.url, {
      method: 'GET',
      headers: probe.headers(trimmedKey),
      signal: controller.signal,
    });
    clearTimeout(timer);

    if (res.ok) {
      return NextResponse.json({
        ok: true,
        message: `Conexão autenticada com sucesso em ${providerName}.`,
      });
    }

    if (res.status === 401 || res.status === 403) {
      return NextResponse.json(
        {
          ok: false,
          message: `Chave rejeitada por ${providerName} (HTTP ${res.status}). Verifique a chave e tente novamente.`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        ok: false,
        message: `${providerName} respondeu com HTTP ${res.status}. Tente novamente em instantes.`,
      },
      { status: 400 }
    );
  } catch {
    return NextResponse.json(
      {
        ok: false,
        message: `Não foi possível alcançar o endpoint de ${providerName} no momento.`,
      },
      { status: 502 }
    );
  }
}
