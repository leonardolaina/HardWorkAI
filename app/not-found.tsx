import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-dvh w-screen flex flex-col items-center justify-center px-6 bg-[#FAF9F5] dark:bg-[#1B1A18] text-[#1F1E1C] dark:text-[#F2EFE9]">
      <div className="max-w-md w-full text-center space-y-5">
        <p className="text-xs font-semibold uppercase tracking-widest text-[#C96442] dark:text-[#D97757]">
          Erro 404
        </p>
        <h1 className="font-serif text-3xl font-normal tracking-tight">
          Página não encontrada
        </h1>
        <p className="text-sm text-[#6B675E] dark:text-[#9E998F] leading-relaxed">
          O endereço que você tentou acessar não existe ou foi movido. Volte ao
          workspace do HardWorkAI para continuar sua conversa.
        </p>
        <div className="pt-2">
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#C96442] hover:bg-[#B85737] dark:bg-[#D97757] dark:hover:bg-[#C96442] text-white text-sm font-medium transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Voltar para o HardWorkAI</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
