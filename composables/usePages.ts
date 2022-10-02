import { useI18n } from 'vue-i18n';

import { useQuery } from '@vue/apollo-composable'
import PagesBySlugQuery from '../graphql/PagesBySlug.query';
import { PagesBySlug, PagesBySlugVariables } from '../graphql/generated/PagesBySlug';


export default function (slug: string) {
    const { locale } = useI18n();

    return useQuery<PagesBySlug, PagesBySlugVariables>(PagesBySlugQuery, {
        slug,
        lang: locale.value,
    });
}