import { useI18n } from 'vue-i18n';

export default function (hash: string) {
    const { locale } = useI18n();

    return useAsyncGql('DownloadPagesByHash', { hash });
}