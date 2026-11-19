'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import {
  Check,
  Copy,
  Download,
  MoreVertical,
  PlusSquare,
  Share,
  Smartphone,
  X,
} from 'lucide-react';
import { usePWAInstall } from '@/lib/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'sidebar';
}

export default function PWAInstallButton({
  variant = 'header',
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, isIOS, isAndroid, install } =
    usePWAInstall();

  const [modalOpen, setModalOpen] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [platformTab, setPlatformTab] = useState<'android' | 'ios'>('android');
  const [shareUrl, setShareUrl] = useState('');

  useEffect(() => {
    if (!modalOpen) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setModalOpen(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [modalOpen]);

  // Automatically suppress button when already running as an installed standalone mobile app
  if (isInstalled) {
    return null;
  }

  const openGuideModal = () => {
    setPlatformTab(isIOS ? 'ios' : 'android');
    if (typeof window !== 'undefined') {
      setShareUrl(window.location.origin);
    }
    setModalOpen(true);
  };

  const handleTriggerClick = async () => {
    if (isInstallable) {
      setInstalling(true);
      const outcome = await install();
      setInstalling(false);
      if (outcome === 'unavailable') {
        openGuideModal();
      }
      return;
    }
    openGuideModal();
  };

  const handleCopyUrl = async () => {
    const urlToCopy =
      shareUrl ||
      (typeof window !== 'undefined' ? window.location.origin : '');
    if (!urlToCopy) return;
    try {
      await navigator.clipboard.writeText(urlToCopy);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    } catch {
      // Fallback ignored if clipboard blocked
    }
  };

  const modal =
    modalOpen && typeof document !== 'undefined'
      ? createPortal(
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div
              aria-hidden="true"
              onClick={() => setModalOpen(false)}
              className="fixed inset-0 bg-black/40 backdrop-blur-[2px]"
            />

            <div
              role="dialog"
              aria-modal="true"
              aria-label="Baixar HardWorkAI Mobile"
              className="relative z-[120] w-full max-w-md rounded-2xl border border-[#E2DDD2] dark:border-[#35332E] bg-[#FAF9F5] dark:bg-[#1E1D1A] shadow-2xl overflow-hidden"
            >
              {/* Header */}
              <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4 border-b border-[#ECE8DF] dark:border-[#2C2A26]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#C96442] dark:bg-[#D97757] text-[#FAF9F5] flex items-center justify-center shrink-0 shadow-xs">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-medium text-[#1F1E1C] dark:text-[#F2EFE9] leading-tight">
                      Baixar versão Mobile
                    </h2>
                    <p className="text-xs text-[#6B675E] dark:text-[#9E998F] mt-0.5">
                      Instale o HardWorkAI na tela inicial do seu celular
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  aria-label="Fechar janela"
                  className="p-1.5 rounded-lg text-[#7D786E] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9] hover:bg-[#EFECE3] dark:hover:bg-[#2B2926] transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {isInstallable && (
                  <button
                    type="button"
                    disabled={installing}
                    onClick={async () => {
                      setInstalling(true);
                      const outcome = await install();
                      setInstalling(false);
                      if (outcome === 'accepted') setModalOpen(false);
                    }}
                    className="w-full inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-[#C96442] hover:bg-[#B85737] dark:bg-[#D97757] dark:hover:bg-[#C96442] text-white text-sm font-medium transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <Download className="w-4 h-4" />
                    <span>
                      {installing
                        ? 'Instalando aplicativo...'
                        : 'Instalar agora neste dispositivo'}
                    </span>
                  </button>
                )}

                {/* Platform switcher */}
                <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[#EFECE3] dark:bg-[#272622]">
                  <button
                    type="button"
                    onClick={() => setPlatformTab('android')}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      platformTab === 'android'
                        ? 'bg-white dark:bg-[#35332E] text-[#1F1E1C] dark:text-[#F2EFE9] shadow-xs'
                        : 'text-[#6B675E] dark:text-[#A19C92] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9]'
                    }`}
                  >
                    Android (Chrome)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPlatformTab('ios')}
                    className={`py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                      platformTab === 'ios'
                        ? 'bg-white dark:bg-[#35332E] text-[#1F1E1C] dark:text-[#F2EFE9] shadow-xs'
                        : 'text-[#6B675E] dark:text-[#A19C92] hover:text-[#1F1E1C] dark:hover:text-[#F2EFE9]'
                    }`}
                  >
                    iPhone / iPad (Safari)
                  </button>
                </div>

                {platformTab === 'android' ? (
                  <ol className="space-y-2.5 text-xs text-[#3F3D37] dark:text-[#D5D0C6]">
                    <li className="flex items-start gap-2.5 rounded-xl border border-[#E6E2D8] dark:border-[#2E2C28] bg-white dark:bg-[#242320] p-3">
                      <span className="w-5 h-5 rounded-full bg-[#C96442]/15 text-[#C96442] dark:text-[#E28868] font-semibold flex items-center justify-center shrink-0">
                        1
                      </span>
                      <span>
                        Abra o link do <strong>HardWorkAI</strong> no{' '}
                        <strong>Google Chrome</strong> do seu celular Android.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5 rounded-xl border border-[#E6E2D8] dark:border-[#2E2C28] bg-white dark:bg-[#242320] p-3">
                      <span className="w-5 h-5 rounded-full bg-[#C96442]/15 text-[#C96442] dark:text-[#E28868] font-semibold flex items-center justify-center shrink-0">
                        2
                      </span>
                      <span className="flex flex-wrap items-center gap-1">
                        Toque no botão de menu{' '}
                        <MoreVertical className="w-3.5 h-3.5 inline text-[#6B675E]" />{' '}
                        no canto superior direito.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5 rounded-xl border border-[#E6E2D8] dark:border-[#2E2C28] bg-white dark:bg-[#242320] p-3">
                      <span className="w-5 h-5 rounded-full bg-[#C96442]/15 text-[#C96442] dark:text-[#E28868] font-semibold flex items-center justify-center shrink-0">
                        3
                      </span>
                      <span>
                        Selecione <strong>Instalar aplicativo</strong> (ou{' '}
                        <strong>Adicionar à tela inicial</strong>) e confirme.
                      </span>
                    </li>
                  </ol>
                ) : (
                  <ol className="space-y-2.5 text-xs text-[#3F3D37] dark:text-[#D5D0C6]">
                    <li className="flex items-start gap-2.5 rounded-xl border border-[#E6E2D8] dark:border-[#2E2C28] bg-white dark:bg-[#242320] p-3">
                      <span className="w-5 h-5 rounded-full bg-[#C96442]/15 text-[#C96442] dark:text-[#E28868] font-semibold flex items-center justify-center shrink-0">
                        1
                      </span>
                      <span>
                        Abra o <strong>HardWorkAI</strong> pelo navegador{' '}
                        <strong>Safari</strong> no iPhone ou iPad.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5 rounded-xl border border-[#E6E2D8] dark:border-[#2E2C28] bg-white dark:bg-[#242320] p-3">
                      <span className="w-5 h-5 rounded-full bg-[#C96442]/15 text-[#C96442] dark:text-[#E28868] font-semibold flex items-center justify-center shrink-0">
                        2
                      </span>
                      <span className="flex flex-wrap items-center gap-1">
                        Toque no ícone <strong>Compartilhar</strong>{' '}
                        <Share className="w-3.5 h-3.5 inline text-[#6B675E]" />{' '}
                        na barra inferior do Safari.
                      </span>
                    </li>
                    <li className="flex items-start gap-2.5 rounded-xl border border-[#E6E2D8] dark:border-[#2E2C28] bg-white dark:bg-[#242320] p-3">
                      <span className="w-5 h-5 rounded-full bg-[#C96442]/15 text-[#C96442] dark:text-[#E28868] font-semibold flex items-center justify-center shrink-0">
                        3
                      </span>
                      <span className="flex flex-wrap items-center gap-1">
                        Role e toque em{' '}
                        <strong>Adicionar à Tela de Início</strong>{' '}
                        <PlusSquare className="w-3.5 h-3.5 inline text-[#6B675E]" />{' '}
                        e depois em <strong>Adicionar</strong>.
                      </span>
                    </li>
                  </ol>
                )}

                {/* Copy link for desktop -> mobile transfer */}
                {!isIOS && !isAndroid && shareUrl && (
                  <div className="pt-1 space-y-1.5">
                    <p className="text-[11px] font-medium text-[#6B675E] dark:text-[#9E998F]">
                      Abrir no seu celular:
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={shareUrl}
                        aria-label="Link do aplicativo HardWorkAI"
                        className="flex-1 h-9 px-3 rounded-lg border border-[#E2DDD2] dark:border-[#34322E] bg-white dark:bg-[#171614] text-xs font-mono text-[#3F3D37] dark:text-[#D5D0C6] truncate focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={handleCopyUrl}
                        className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg bg-[#1F1E1C] hover:bg-[#32302C] dark:bg-[#F2EFE9] dark:hover:bg-[#E2DDD2] text-white dark:text-[#1F1E1C] text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer"
                      >
                        {copiedLink ? (
                          <>
                            <Check className="w-3.5 h-3.5" />
                            <span>Copiado</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar link</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="px-5 py-3 border-t border-[#ECE8DF] dark:border-[#2C2A26] bg-[#F5F2EA]/70 dark:bg-[#191816]/70 flex items-center justify-between gap-2">
                <span className="text-[11px] text-[#7D786E] dark:text-[#8E897F]">
                  App PWA · Tela cheia e atualizações automáticas
                </span>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#3F3D37] dark:text-[#DFDBD2] hover:bg-[#E8E4DA] dark:hover:bg-[#2B2926] transition-colors cursor-pointer"
                >
                  Fechar
                </button>
              </div>
            </div>
          </div>,
          document.body
        )
      : null;

  if (variant === 'sidebar') {
    return (
      <>
        <button
          type="button"
          onClick={handleTriggerClick}
          disabled={installing}
          title="Baixar e instalar a versão Mobile do HardWorkAI"
          className="w-full flex items-center justify-between gap-2.5 px-2.5 py-2 rounded-lg text-xs font-medium text-[#C96442] dark:text-[#E28868] bg-[#C96442]/8 dark:bg-[#D97757]/12 hover:bg-[#C96442]/14 dark:hover:bg-[#D97757]/20 transition-colors cursor-pointer"
        >
          <span className="flex items-center gap-2 min-w-0">
            <Smartphone className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {installing ? 'Instalando...' : 'Baixar versão Mobile'}
            </span>
          </span>
          <Download className="w-3.5 h-3.5 shrink-0 opacity-80" />
        </button>
        {modal}
      </>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={handleTriggerClick}
        disabled={installing}
        title="Baixar e instalar a versão Mobile do HardWorkAI"
        aria-label="Baixar versão Mobile"
        className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border border-[#C96442]/35 dark:border-[#D97757]/40 bg-[#C96442]/10 dark:bg-[#D97757]/15 hover:bg-[#C96442]/16 dark:hover:bg-[#D97757]/24 text-xs font-medium text-[#B55433] dark:text-[#EC9A7E] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
      >
        <Smartphone className="w-3.5 h-3.5 shrink-0" />
        <span className="hidden sm:inline">
          {installing ? 'Instalando...' : 'Baixar Mobile'}
        </span>
      </button>
      {modal}
    </>
  );
}
