import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { useLocale } from "@/hooks/useLocale";
import { EN_STRINGS } from "./keys";
import { supabase } from "@/integrations/supabase/client";

interface TranslationContextValue {
  t: (key: string, replacements?: Record<string, string>) => string;
  isTranslating: boolean;
  currentLanguage: string;
}

const TranslationContext = createContext<TranslationContextValue>({
  t: (key) => EN_STRINGS[key] || key,
  isTranslating: false,
  currentLanguage: "English",
});

const CACHE_PREFIX = "i18n_cache_";
const CACHE_VERSION = "v1_";

function getCachedTranslations(language: string): Record<string, string> | null {
  try {
    const cached = localStorage.getItem(CACHE_PREFIX + CACHE_VERSION + language);
    if (cached) return JSON.parse(cached);
  } catch {}
  return null;
}

function setCachedTranslations(language: string, translations: Record<string, string>) {
  try {
    localStorage.setItem(CACHE_PREFIX + CACHE_VERSION + language, JSON.stringify(translations));
  } catch {}
}

export const TranslationProvider = ({ children }: { children: ReactNode }) => {
  const { locale } = useLocale();
  const [translations, setTranslations] = useState<Record<string, string>>(EN_STRINGS);
  const [isTranslating, setIsTranslating] = useState(false);
  const fetchRef = useRef<string>("");

  const fetchTranslations = useCallback(async (language: string, country: string) => {
    const fetchId = language + "_" + country;
    fetchRef.current = fetchId;

    // English is the source language - no translation needed
    if (language.toLowerCase() === "english") {
      setTranslations(EN_STRINGS);
      setIsTranslating(false);
      return;
    }

    // Check cache first
    const cached = getCachedTranslations(language);
    if (cached && Object.keys(cached).length > 0) {
      setTranslations(cached);
      setIsTranslating(false);
      return;
    }

    setIsTranslating(true);

    try {
      // Split strings into chunks of 50 to avoid token limits
      const entries = Object.entries(EN_STRINGS);
      const chunkSize = 50;
      const allTranslations: Record<string, string> = {};

      for (let i = 0; i < entries.length; i += chunkSize) {
        // Abort if locale changed while we were fetching
        if (fetchRef.current !== fetchId) return;

        const chunk = Object.fromEntries(entries.slice(i, i + chunkSize));
        
        const { data, error } = await supabase.functions.invoke("translate", {
          body: { strings: chunk, targetLanguage: language, targetCountry: country },
        });

        if (error) {
          console.error("Translation error:", error);
          // Fall back to English for this chunk
          Object.assign(allTranslations, chunk);
        } else if (data?.translations) {
          Object.assign(allTranslations, data.translations);
        } else {
          Object.assign(allTranslations, chunk);
        }
      }

      if (fetchRef.current === fetchId) {
        setTranslations(allTranslations);
        setCachedTranslations(language, allTranslations);
      }
    } catch (err) {
      console.error("Translation fetch failed:", err);
      // Keep English as fallback
      setTranslations(EN_STRINGS);
    } finally {
      if (fetchRef.current === fetchId) {
        setIsTranslating(false);
      }
    }
  }, []);

  useEffect(() => {
    fetchTranslations(locale.language, locale.name);
  }, [locale.language, locale.name, fetchTranslations]);

  const t = useCallback(
    (key: string, replacements?: Record<string, string>): string => {
      let value = translations[key] || EN_STRINGS[key] || key;
      if (replacements) {
        for (const [k, v] of Object.entries(replacements)) {
          value = value.replace(`{${k}}`, v);
        }
      }
      return value;
    },
    [translations]
  );

  return (
    <TranslationContext.Provider value={{ t, isTranslating, currentLanguage: locale.language }}>
      {children}
    </TranslationContext.Provider>
  );
};

export const useTranslation = () => useContext(TranslationContext);
