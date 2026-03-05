import { useCurrencyFromLocale } from "@/hooks/useLocale";

/**
 * Backwards-compatible hook. Now delegates to the global LocaleProvider.
 */
export const useCurrency = useCurrencyFromLocale;
