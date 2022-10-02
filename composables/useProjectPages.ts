import { useI18n } from 'vue-i18n';

import { useQuery } from '@vue/apollo-composable'
import ProjectPagesBySlugQuery from '../graphql/ProjectPagesBySlug.query';
import { ProjectPagesBySlug, ProjectPagesBySlugVariables } from '../graphql/generated/ProjectPagesBySlug';

export default function (slug: string) {
    const { locale } = useI18n();

    const query = 
    useQuery<ProjectPagesBySlug, ProjectPagesBySlugVariables>(ProjectPagesBySlugQuery, {
        slug: slug,
        lang: locale.value, // use locale in future'
    });

    return query
}