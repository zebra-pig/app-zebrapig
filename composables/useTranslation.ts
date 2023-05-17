

type Translation =
    {
        languages_code?: {
            code: string;
        } | null | undefined;
        languages?: {
            code: string;
        } | null | undefined;
    } | null | undefined;

export default function useTranslation<T extends Translation>(translationsArray?: T[] | null): T | undefined {
    const { locale } = useI18n();
    if (!translationsArray) return;

    const preferredLocales = [locale.value, 'en'];

    while (preferredLocales.length) {
        const currLocale = preferredLocales.pop()!;
        const currTrans = grabTranslation(translationsArray, currLocale);
        if (currTrans != null) {
            return currTrans;
        }
    }

    // no preferred found
    return translationsArray[0];
}

function grabTranslation<T extends Translation>(translationsArray: T[], locale: string) {
    for (const translation of translationsArray || []) {
        if (translation == null) continue;

        if (translation.languages_code?.code == locale ||
            translation.languages?.code == locale) {
            return translation as T;
        }
    }
}