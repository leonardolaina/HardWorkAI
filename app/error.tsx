'use client';

import React from 'react';
import { RotateCcw } from 'lucide-react';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-dvh w-screen flex flex-col items-center justify-center px-6 bg-[#FAF9F5] dark:bg-[#1B1A18] text-[#1F1E1C] dark:text-[#F2EFE9]">
      <div className="max-w-md w-full text-center space-y-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C96442] dark:text-[#D97757]">
          Algo deu errado
        </p>
        <h1 className="font-serif text-3xl font-normal tracking-tight">
          Erro inesperado na interface
        </h1>
        <p className="text-sm text-[#6B675E] dark:text-[#9E998F] leading-relaxed">
          Ocorreu uma falha temporária ao carregar esta tela. Tente recarregar
          para retomar de onde você parou.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C96442] hover:bg-[#B85737] dark:bg-[#D97757] dark:hover:bg-[#C96442] text-white text-sm font-medium transition-colors cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Tentar novamente</span>
          </button>
        </div>
      </div>
    </div>
  );
}
