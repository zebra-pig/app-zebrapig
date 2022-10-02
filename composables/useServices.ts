

export default function useServices()
{
    const SERVICES = [ 'video', 'development', '3d-design' ];

    const navigation = useNavigation('header').result;

    const serviceLinks = computed(() =>
    {
        if (!navigation.value?.navigation_links)
            return;

        return SERVICES.map(service =>
            navigation.value?.navigation_links.find(link => link.display_tag === service)
        );
    });

    return {
        serviceLinks,
        numberServices: SERVICES.length,
    }
}