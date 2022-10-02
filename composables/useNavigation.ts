import { useI18n } from 'vue-i18n';

export default function (location: string) {
    const { locale } = useI18n();

    return useAsyncGql('NavigationLinkList', {
        lang: locale.value,
        location: location,
    });
}