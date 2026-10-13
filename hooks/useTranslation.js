import { useLanguage } from "@/context/LanguageContext";
import { translations } from "@/lib/translations";

export function useTranslation() {
  const { language } = useLanguage();
  // fallback to English if language not found
  return translations[language] || translations.en;
}
