import gql from "graphql-tag";

/**
 * query document:
 *  queries multiple projects ordered by date descending with locale
 */
export default gql`

query NavigationLinkList($location: String $lang: String) 
{
  navigation_links(sort: [ "sort" ] filter: { location: {_eq: $location}})
  {
    id
    route
    display_tag
    target
    button
    translations(filter: { language_code: {code: {_eq: $lang} }}) 
    {
      title
    }
  }
}
`;