import { translate as bingTranslate } from "bing-translate-api";

const translations = new Map<string, string>();

const getKey = (languageTo: string, text: string) => `${languageTo}|${text}`;

export const translate = async (
  languageTo: string,
  text: string
): Promise<string> => {
  const key = getKey(languageTo, text);

  console.log(`Looking for translation of the '${text}' into '${languageTo}'`);
  if (translations.has(key)) {
    console.log(`Found existing translation: ${translations.get("key")}`);
    return translations.get(key) || text;
  }

  const translated = await bingTranslate(text, undefined, languageTo);
  const result = translated?.translation;
  if (result) {
    console.log(`Successfully translated: ${result}`);
    translations.set(key, result);
    return result;
  }

  return text;
};
