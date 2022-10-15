import { useI18n } from 'vue-i18n';

export default function (hash: string) {
    return useAsyncGql('DownloadPagesByHash', { hash });
}