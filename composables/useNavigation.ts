import { useI18n } from 'vue-i18n';

export default function (location: string) {
    const i18n = useI18n();
    console.log(i18n)

    return useAsyncGql('NavigationLinkList', {
        lang: i18n.locale.value,
        location: location,
    });
}