import { useI18n } from 'vue-i18n';

export default function (location: string) {
    return useAsyncGql('NavigationLinkList', {
        location: location,
    });
}