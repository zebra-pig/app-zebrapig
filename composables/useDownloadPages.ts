import { useI18n } from 'vue-i18n';

import { useQuery } from '@vue/apollo-composable'
import DownloadPagesByHashQuery from '../graphql/DownloadPagesByHash.query';
import { DownloadPagesByHash, DownloadPagesByHashVariables } from '../graphql/generated/DownloadPagesByHash';


export default function (hash: string) {
    const { locale } = useI18n();

    return useQuery<DownloadPagesByHash, DownloadPagesByHashVariables>(DownloadPagesByHashQuery, {
        hash,
    });
}