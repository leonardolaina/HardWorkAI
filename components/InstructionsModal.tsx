'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  initialValue: string;
  onSave: (value: string) => void;
  onClose: () => void;
}

const PRESETS = [
  {
    label: 'Engenharia de Software',
    text: 'Atue como engenheiro sênior. Priorize código limpo, tipado, seguro e com boas práticas modernas. Evite explicações óbvias e destaque trade-offs arquiteturais quando relevante.',
  },
  {
    label: 'Escrita Editorial',
    text: 'Escreva com clareza, fluidez e precisão vocabular. Evite clichês corporativos, frases excessivamente longas e repetições. Estruture textos longos com ritmo agradável.',
  },
  {
    label: 'Estudo & Didática',
    text: 'Explique conceitos complexos partindo dos primeiros princípios, use exemplos cotidianos e, ao final, sugira 2 perguntas rápidas para testar minha compreensão.',
  },
];

export default function InstructionsModal({
  isOpen,
  initialValue,
  onSave,
  onClose,
}: InstructionsModalProps) {
  const [draft, setDraft] = useState(initialValue);

  useEffect(() => {
    if (!isOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [isOpen, onClose]);

  if (!isOpen || typeof document === 'undefined') return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="instructions-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/40 backdrop-blur-[2px]"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl border border-[#E5E1D8] dark:border-[#32302C] bg-[#FAF9F5] dark:bg-[#1F1E1C] shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#E5E1D8] dark:border-[#2C2A26]">
          <div>
            <h2
              id="instructions-title"
              className="font-serif text-lg font-medium text-[#1F1E1C] dark:text-[#F2EFE9]"
            >
              Instruções personalizadas
            </h2>
            <p className="text-xs text-[#6B675E] dark:text-[#A19C92] mt-0.5">
              Defina preferências permanentes de tom, contexto ou formato para todas as conversas.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Fechar"
            className="p-2 rounded-lg text-[#6B675E] dark:text-[#A19C92] hover:bg-[#EFECE3] dark:hover:bg-[#2C2A26] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => setDraft(preset.text)}
                className="px-3 py-1.5 text-xs font-medium rounded-lg border border-[#E2DDD2] dark:border-[#35332E] bg-white dark:bg-[#262522] text-[#3F3D37] dark:text-[#DFDBD2] hover:border-[#C96442] dark:hover:border-[#D97757] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                {preset.label}
              </button>
            ))}
          </div>

          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={5}
            placeholder="Ex: Sou designer de produto. Prefiro respostas diretas com exemplos práticos e listas objetivas..."
            className="w-full rounded-xl border border-[#DFDBD0] dark:border-[#35332E] bg-white dark:bg-[#171614] px-3.5 py-3 text-sm text-[#1F1E1C] dark:text-[#F2EFE9] placeholder:text-[#9A958A] dark:placeholder:text-[#6E6A62] focus:outline-none focus:border-[#C96442] dark:focus:border-[#D97757] resize-none leading-relaxed"
          />

          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={() => setDraft('')}
              className="px-3 py-2 text-xs font-medium text-[#6B675E] dark:text-[#A19C92] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9] transition-colors cursor-pointer"
            >
              Limpar
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-[#E2DDD2] dark:border-[#35332E] text-[#3F3D37] dark:text-[#DFDBD2] hover:bg-[#EFECE3] dark:hover:bg-[#2A2825] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => {
                  onSave(draft.trim());
                  onClose();
                }}
                className="px-4 py-2 text-xs font-medium rounded-lg bg-[#C96442] hover:bg-[#B85737] dark:bg-[#D97757] dark:hover:bg-[#C96442] text-white transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Salvar instruções
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
