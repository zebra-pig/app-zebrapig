
const SERVICES = ['video', 'development', 'design'];

export default async function useServices() {
    const navigation = await GqlNavigationLinkList({ location: 'header' });
    const serviceLinks = computed(() => {
        if (!navigation?.navigation_links)
            return;
        return SERVICES.map(service =>
            navigation?.navigation_links.find((link: any) => link.display_tag === service)
        );
    });

    return serviceLinks;
}