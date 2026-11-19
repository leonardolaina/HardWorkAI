'use client';

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  ALL_PROVIDERS,
  getSelectableModels,
  type ProviderConfig,
} from '@/lib/providers';
import {
  AUTO_ALL_AI_MODEL,
  BUILTIN_AI_MODELS,
  type AiModelChoice,
} from '@/lib/types';

export const MODEL_PREFERENCE_STORAGE_KEY = 'hardworkai_model_preference_v1';
const LEGACY_MODEL_STORAGE_KEY = 'hardworkai_selected_model_v1';
export const PROVIDER_CONFIGS_STORAGE_KEY = 'hardworkai_provider_configs_v1';
export const DEFAULT_MODEL_PREFERENCE = 'auto:builtin';

const FLAGSHIP_PROVIDER_IDS = [
  'openai',
  'anthropic',
  'openrouter',
  'deepseek',
  'mistral',
  'google',
];

export interface ProviderOptionGroup {
  id: string;
  name: string;
  subtitle: string;
  configured: boolean;
  isExternal: boolean;
  models: AiModelChoice[];
}

interface ModelPreferenceContextValue {
  modelPreference: string;
  setModelPreference: (nextModelId: string) => void;
  providerConfigs: Record<string, ProviderConfig>;
  saveProviderConfig: (cfg: ProviderConfig) => void;
  deleteProviderConfig: (providerId: string) => void;
  availableModels: AiModelChoice[];
  providerGroups: ProviderOptionGroup[];
  activeModel: AiModelChoice;
  hydrated: boolean;
}

const ModelPreferenceContext = createContext<ModelPreferenceContextValue | null>(
  null
);

function readStoredModelPreference(): string {
  try {
    const primary = localStorage.getItem(MODEL_PREFERENCE_STORAGE_KEY);
    if (primary && primary.trim()) return primary;
    const legacy = localStorage.getItem(LEGACY_MODEL_STORAGE_KEY);
    if (legacy && legacy.trim()) return legacy;
  } catch {
    // Ignore storage read errors
  }
  return DEFAULT_MODEL_PREFERENCE;
}

function readStoredProviderConfigs(): Record<string, ProviderConfig> {
  try {
    const raw = localStorage.getItem(PROVIDER_CONFIGS_STORAGE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, ProviderConfig>;
    if (parsed && typeof parsed === 'object') {
      return parsed;
    }
  } catch {
    // Ignore storage parse errors
  }
  return {};
}

export function ModelPreferenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [modelPreference, setModelPreferenceState] = useState<string>(
    DEFAULT_MODEL_PREFERENCE
  );
  const [providerConfigs, setProviderConfigs] = useState<
    Record<string, ProviderConfig>
  >({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const frame = window.requestAnimationFrame(() => {
      setModelPreferenceState(readStoredModelPreference());
      setProviderConfigs(readStoredProviderConfigs());
      setHydrated(true);
    });

    const handleStorage = (e: StorageEvent) => {
      if (
        e.key === MODEL_PREFERENCE_STORAGE_KEY ||
        e.key === LEGACY_MODEL_STORAGE_KEY
      ) {
        setModelPreferenceState(readStoredModelPreference());
      } else if (e.key === PROVIDER_CONFIGS_STORAGE_KEY) {
        setProviderConfigs(readStoredProviderConfigs());
      }
    };

    window.addEventListener('storage', handleStorage);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const setModelPreference = useCallback((nextModelId: string) => {
    const cleanId = nextModelId.trim() || DEFAULT_MODEL_PREFERENCE;
    setModelPreferenceState(cleanId);
    try {
      localStorage.setItem(MODEL_PREFERENCE_STORAGE_KEY, cleanId);
      localStorage.setItem(LEGACY_MODEL_STORAGE_KEY, cleanId);
    } catch {
      // Ignore storage write errors
    }
  }, []);

  const saveProviderConfig = useCallback((cfg: ProviderConfig) => {
    setProviderConfigs((prev) => {
      const next = {
        ...prev,
        [cfg.providerId]: cfg,
      };
      try {
        localStorage.setItem(PROVIDER_CONFIGS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage write errors
      }
      return next;
    });
  }, []);

  const deleteProviderConfig = useCallback((providerId: string) => {
    setProviderConfigs((prev) => {
      const next = { ...prev };
      delete next[providerId];
      try {
        localStorage.setItem(PROVIDER_CONFIGS_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // Ignore storage write errors
      }
      return next;
    });
  }, []);

  const { providerGroups, availableModels } = useMemo(() => {
    const externalProviderIds: string[] = [];
    const seen = new Set<string>();

    // Configured providers first
    for (const [providerId, cfg] of Object.entries(providerConfigs)) {
      if (cfg?.enabled && cfg.apiKey?.trim() && !seen.has(providerId)) {
        seen.add(providerId);
        externalProviderIds.push(providerId);
      }
    }

    // Then flagship providers (selectable even before API key is added)
    for (const id of FLAGSHIP_PROVIDER_IDS) {
      if (!seen.has(id)) {
        seen.add(id);
        externalProviderIds.push(id);
      }
    }

    // Also include any saved configs without key yet
    for (const providerId of Object.keys(providerConfigs)) {
      if (!seen.has(providerId)) {
        seen.add(providerId);
        externalProviderIds.push(providerId);
      }
    }

    const hasConnectedGateway = Object.values(providerConfigs).some(
      (cfg) => Boolean(cfg?.enabled && cfg.apiKey?.trim())
    );

    const autoGroup: ProviderOptionGroup = {
      id: 'auto',
      name: 'Automático',
      subtitle: 'Roteamento inteligente por requisição',
      configured: true,
      isExternal: false,
      models: hasConnectedGateway
        ? [BUILTIN_AI_MODELS[0], AUTO_ALL_AI_MODEL]
        : [BUILTIN_AI_MODELS[0]],
    };

    const builtinGroup: ProviderOptionGroup = {
      id: 'hardwork-builtin',
      name: 'Gemini (Integrado)',
      subtitle: 'Pronto para uso sem chave externa',
      configured: true,
      isExternal: false,
      models: BUILTIN_AI_MODELS.slice(1),
    };

    const externalGroups: ProviderOptionGroup[] = [];

    for (const providerId of externalProviderIds) {
      const providerDef = ALL_PROVIDERS.find((p) => p.id === providerId);
      if (!providerDef) continue;

      const cfg = providerConfigs[providerId];
      const hasApiKey = Boolean(cfg?.enabled && cfg.apiKey?.trim());
      const allProviderModels = getSelectableModels(providerDef);
      const enabledModels =
        cfg && cfg.modelSelection === 'picked' && cfg.selectedModels.length > 0
          ? cfg.selectedModels
          : allProviderModels;

      const models: AiModelChoice[] = enabledModels.map((modelName) => {
        const cleanShort = modelName.includes('/')
          ? modelName.split('/').pop() || modelName
          : modelName;
        return {
          id: `gateway:${providerId}:${modelName}`,
          source: 'gateway',
          providerId,
          providerName: providerDef.name,
          modelId: modelName,
          label: `${providerDef.name} · ${cleanShort}`,
          shortLabel: cleanShort,
          description: hasApiKey
            ? `${providerDef.name} · ${modelName}`
            : `${providerDef.name} · Requer chave no Gateway`,
          configured: hasApiKey,
        };
      });

      if (models.length === 0) continue;

      externalGroups.push({
        id: providerId,
        name: providerDef.name,
        subtitle: providerDef.subtitle || `${models.length} modelos`,
        configured: hasApiKey,
        isExternal: true,
        models,
      });
    }

    const groups: ProviderOptionGroup[] = [
      autoGroup,
      builtinGroup,
      ...externalGroups,
    ];

    const flatModels: AiModelChoice[] = groups.flatMap((g) => g.models);

    return {
      providerGroups: groups,
      availableModels: flatModels,
    };
  }, [providerConfigs]);

  const activeModel = useMemo<AiModelChoice>(
    () =>
      availableModels.find((m) => m.id === modelPreference) ??
      BUILTIN_AI_MODELS[0],
    [availableModels, modelPreference]
  );

  const value = useMemo<ModelPreferenceContextValue>(
    () => ({
      modelPreference,
      setModelPreference,
      providerConfigs,
      saveProviderConfig,
      deleteProviderConfig,
      availableModels,
      providerGroups,
      activeModel,
      hydrated,
    }),
    [
      modelPreference,
      setModelPreference,
      providerConfigs,
      saveProviderConfig,
      deleteProviderConfig,
      availableModels,
      providerGroups,
      activeModel,
      hydrated,
    ]
  );

  return (
    <ModelPreferenceContext.Provider value={value}>
      {children}
    </ModelPreferenceContext.Provider>
  );
}

export function useModelPreference(): ModelPreferenceContextValue {
  const ctx = useContext(ModelPreferenceContext);
  if (!ctx) {
    throw new Error(
      'useModelPreference deve ser usado dentro de ModelPreferenceProvider.'
    );
  }
  return ctx;
}
