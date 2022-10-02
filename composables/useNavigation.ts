import { useQuery } from '@vue/apollo-composable'
import { useI18n } from 'vue-i18n';
import { NavigationLinkList, NavigationLinkListVariables } from '../graphql/generated/NavigationLinkList';

import NavigationLinkListQuery from '../graphql/NavigationLinkList.query';

export default function (location: string) {
    const { locale } = useI18n();

    const query = useQuery<NavigationLinkList, NavigationLinkListVariables>(NavigationLinkListQuery, {
        lang: locale.value,
        location: location,
    });

    return query;
}