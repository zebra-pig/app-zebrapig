import gql from "graphql-tag";

/**
 * query document:
 *  queries multiple projects ordered by date descending with locale
 */
export default gql`

query PagesBySlug($slug: String $lang: String) 
{
  pages(filter: { slug: {_eq: $slug} })
  {
    id
    translations(filter: { language_code: {code: {_eq: $lang} }}) 
    {
      title
      content
    }
  }
}
`;