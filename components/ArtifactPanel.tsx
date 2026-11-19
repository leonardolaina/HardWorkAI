'use client';

import React, { useMemo, useState } from 'react';
import { Check, Code2, Copy, Download, Eye, RotateCw, X } from 'lucide-react';
import type { ArtifactData } from '@/lib/types';

interface ArtifactPanelProps {
  artifact: ArtifactData;
  onClose: () => void;
}

const EXTENSION_MAP: Record<string, string> = {
  html: 'html',
  htm: 'html',
  svg: 'svg',
  tsx: 'tsx',
  jsx: 'jsx',
  ts: 'ts',
  typescript: 'ts',
  js: 'js',
  javascript: 'js',
  python: 'py',
  py: 'py',
  css: 'css',
  json: 'json',
  sql: 'sql',
  markdown: 'md',
  md: 'md',
  bash: 'sh',
  sh: 'sh',
};

function buildPreviewDocument(artifact: ArtifactData): string {
  if (artifact.language === 'svg') {
    return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<style>
  html, body {
    margin: 0;
    padding: 24px;
    min-height: 100vh;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    background: #ffffff;
    font-family: system-ui, -apple-system, sans-serif;
  }
  svg {
    max-width: 100%;
    height: auto;
  }
</style>
</head>
<body>${artifact.code}</body>
</html>`;
  }
  return artifact.code;
}

export default function ArtifactPanel({ artifact, onClose }: ArtifactPanelProps) {
  const [tab, setTab] = useState<'preview' | 'code'>(
    artifact.previewable ? 'preview' : 'code'
  );
  const [copied, setCopied] = useState(false);
  const [reloadNonce, setReloadNonce] = useState(0);

  const lines = useMemo(() => artifact.code.split('\n'), [artifact.code]);
  const srcDoc = useMemo(() => buildPreviewDocument(artifact), [artifact]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(artifact.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard unavailable
    }
  };

  const handleDownload = () => {
    const ext = EXTENSION_MAP[artifact.language.toLowerCase()] || 'txt';
    const safeName =
      artifact.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/gi, '-')
        .replace(/^-|-$/g, '') || 'artefato';
    const blob = new Blob([artifact.code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${safeName}.${ext}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <aside
      aria-label="Painel de artefato"
      className="flex flex-col h-full w-full lg:w-[46%] xl:w-[48%] shrink-0 border-l border-[#E6E2D8] dark:border-[#2C2A26] bg-[#FAF9F5] dark:bg-[#181715]"
    >
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[#E6E2D8] dark:border-[#2C2A26]">
        <div className="min-w-0">
          <h2 className="text-sm font-semibold text-[#1F1E1C] dark:text-[#F2EFE9] truncate">
            {artifact.title}
          </h2>
          <p className="text-xs text-[#6B675E] dark:text-[#A19C92] font-mono tabular-nums">
            {artifact.language} · {lines.length} linhas
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {artifact.previewable && (
            <div className="flex items-center p-0.5 rounded-lg bg-[#EFECE3] dark:bg-[#252421] border border-[#E5E1D8] dark:border-[#32302C]">
              <button
                type="button"
                onClick={() => setTab('preview')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  tab === 'preview'
                    ? 'bg-white dark:bg-[#34322E] text-[#1F1E1C] dark:text-[#F2EFE9] shadow-xs'
                    : 'text-[#6B675E] dark:text-[#A19C92] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9]'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Prévia</span>
              </button>
              <button
                type="button"
                onClick={() => setTab('code')}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  tab === 'code'
                    ? 'bg-white dark:bg-[#34322E] text-[#1F1E1C] dark:text-[#F2EFE9] shadow-xs'
                    : 'text-[#6B675E] dark:text-[#A19C92] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9]'
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
                <span>Código</span>
              </button>
            </div>
          )}

          {artifact.previewable && tab === 'preview' && (
            <button
              type="button"
              onClick={() => setReloadNonce((n) => n + 1)}
              title="Recarregar pré-visualização"
              aria-label="Recarregar pré-visualização"
              className="p-2 rounded-lg text-[#5C584F] dark:text-[#A8A399] hover:bg-[#EFECE3] dark:hover:bg-[#252421] transition-colors cursor-pointer"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleCopy}
            title="Copiar conteúdo"
            aria-label="Copiar conteúdo"
            className="p-2 rounded-lg text-[#5C584F] dark:text-[#A8A399] hover:bg-[#EFECE3] dark:hover:bg-[#252421] transition-colors cursor-pointer"
          >
            {copied ? (
              <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={handleDownload}
            title="Baixar arquivo"
            aria-label="Baixar arquivo"
            className="p-2 rounded-lg text-[#5C584F] dark:text-[#A8A399] hover:bg-[#EFECE3] dark:hover:bg-[#252421] transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={onClose}
            title="Fechar painel"
            aria-label="Fechar painel"
            className="p-2 rounded-lg text-[#5C584F] dark:text-[#A8A399] hover:bg-[#EFECE3] dark:hover:bg-[#252421] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-hidden">
        {artifact.previewable && tab === 'preview' ? (
          <iframe
            key={`${artifact.id}-${reloadNonce}`}
            title={artifact.title}
            sandbox="allow-scripts"
            srcDoc={srcDoc}
            className="w-full h-full border-0 bg-white"
          />
        ) : (
          <div className="h-full overflow-auto p-4 bg-[#F5F3EC] dark:bg-[#141312]">
            <table className="w-full border-collapse font-mono text-[0.82rem] leading-[1.65] tabular-nums">
              <tbody>
                {lines.map((line, idx) => (
                  <tr key={idx}>
                    <td className="pr-4 text-right select-none text-[#9B9589] dark:text-[#66625B] w-10 align-top">
                      {idx + 1}
                    </td>
                    <td className="whitespace-pre text-[#1F1E1C] dark:text-[#E9E6DF]">
                      {line || ' '}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </aside>
  );
}
