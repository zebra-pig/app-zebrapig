
export default function (link: any) {
    if (link.route.startsWith("mailto:")) {
        return link.route
    }
    return useLocalePath()('/' + link.route)
}