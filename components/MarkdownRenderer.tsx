'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Check, Copy, Eye, PanelRightOpen } from 'lucide-react';
import type { ArtifactData } from '@/lib/types';

interface MarkdownRendererProps {
  content: string;
  onOpenArtifact: (artifact: ArtifactData) => void;
}

const PREVIEWABLE_LANGS = new Set(['html', 'htm', 'svg']);

function inferArtifactTitle(language: string, code: string): string {
  const titleMatch = code.match(/<title>([^<]+)<\/title>/i);
  if (titleMatch?.[1]) {
    return titleMatch[1].trim().slice(0, 60);
  }
  const headingMatch = code.match(/<h1[^>]*>([^<]+)<\/h1>/i);
  if (headingMatch?.[1]) {
    return headingMatch[1].trim().slice(0, 60);
  }
  const fnMatch = code.match(/(?:export\s+(?:default\s+)?)?(?:function|class|const)\s+([A-Za-z0-9_]+)/);
  if (fnMatch?.[1]) {
    return fnMatch[1];
  }
  const langMap: Record<string, string> = {
    html: 'Documento HTML',
    htm: 'Documento HTML',
    svg: 'Ilustração SVG',
    tsx: 'Componente React',
    jsx: 'Componente React',
    ts: 'Código TypeScript',
    typescript: 'Código TypeScript',
    js: 'Código JavaScript',
    javascript: 'Código JavaScript',
    python: 'Script Python',
    py: 'Script Python',
    css: 'Folha de Estilos',
    json: 'Dados JSON',
    sql: 'Consulta SQL',
    bash: 'Comandos Shell',
    sh: 'Comandos Shell',
  };
  return langMap[language.toLowerCase()] || 'Trecho de código';
}

function CodeBlock({
  language,
  code,
  onOpenArtifact,
}: {
  language: string;
  code: string;
  onOpenArtifact: (artifact: ArtifactData) => void;
}) {
  const [copied, setCopied] = useState(false);
  const normalizedLang = (language || 'texto').toLowerCase();
  const isPreviewable = PREVIEWABLE_LANGS.has(normalizedLang);
  const lineCount = code.split('\n').length;
  const showArtifactButton = isPreviewable || lineCount >= 6;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      // Clipboard API unavailable
    }
  };

  const handleOpen = () => {
    onOpenArtifact({
      id: `${normalizedLang}-${code.length}-${code.slice(0, 24)}`,
      title: inferArtifactTitle(normalizedLang, code),
      language: normalizedLang,
      code,
      previewable: isPreviewable,
    });
  };

  return (
    <div className="my-4 rounded-xl border border-[#E5E1D8] dark:border-[#32302C] bg-[#F5F3EC] dark:bg-[#141312] overflow-hidden">
      <div className="flex items-center justify-between gap-4 px-3.5 py-2 border-b border-[#E5E1D8] dark:border-[#2C2A26] bg-[#EFECE3]/70 dark:bg-[#1A1917]">
        <span className="text-xs font-mono text-[#6B675E] dark:text-[#A19C92] select-none">
          {normalizedLang}
        </span>
        <div className="flex items-center gap-1.5 shrink-0">
          {showArtifactButton && (
            <button
              type="button"
              onClick={handleOpen}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md text-[#4A4740] dark:text-[#D5D0C6] hover:bg-[#E5E1D8]/70 dark:hover:bg-[#2C2A26] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              {isPreviewable ? (
                <>
                  <Eye className="w-3.5 h-3.5 text-[#C96442] dark:text-[#D97757]" />
                  <span>Visualizar</span>
                </>
              ) : (
                <>
                  <PanelRightOpen className="w-3.5 h-3.5" />
                  <span>Abrir painel</span>
                </>
              )}
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md text-[#4A4740] dark:text-[#D5D0C6] hover:bg-[#E5E1D8]/70 dark:hover:bg-[#2C2A26] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar</span>
              </>
            )}
          </button>
        </div>
      </div>
      <div className="overflow-x-auto p-4">
        <pre className="m-0 font-mono text-[0.83rem] leading-[1.6] text-[#1F1E1C] dark:text-[#E9E6DF] tabular-nums">
          <code>{code}</code>
        </pre>
      </div>
    </div>
  );
}

export default function MarkdownRenderer({
  content,
  onOpenArtifact,
}: MarkdownRendererProps) {
  return (
    <div className="lume-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          pre({ children }) {
            return <>{children}</>;
          },
          code({ className, children, ...props }) {
            const match = /language-([\w-]+)/.exec(className || '');
            const text = String(children).replace(/\n$/, '');
            const isBlock = Boolean(match) || text.includes('\n');

            if (isBlock) {
              return (
                <CodeBlock
                  language={match?.[1] || 'texto'}
                  code={text}
                  onOpenArtifact={onOpenArtifact}
                />
              );
            }

            return (
              <code
                className="font-mono text-[0.84em] px-1.5 py-0.5 rounded bg-[#EFECE3] dark:bg-[#2A2825] text-[#2A2824] dark:text-[#EDEAE2]"
                {...props}
              >
                {children}
              </code>
            );
          },
          a({ href, children, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                {...props}
              >
                {children}
              </a>
            );
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
