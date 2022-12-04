import { useI18n } from 'vue-i18n';

export default function (slug: string) {
    const { locale } = useI18n();

    return useAsyncGql('PagesBySlug', {
        slug,
        lang: locale.value,
    });
}