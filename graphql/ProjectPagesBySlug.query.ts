import gql from "graphql-tag";

/**
 * query document:
 *  queries multiple projects ordered by date descending with locale
 */
export default gql`

query ProjectPagesBySlug($slug: String $lang: String) 
{
  project_pages(filter: { slug: {_eq: $slug} })
  {
    id
    background_color
    text_color
    accent_color
    cover {
      id
    }
    hero {
      id
    }
    translations(filter: { language_code: {code: {_eq: $lang} }}) 
    {
      title
      content
    }
  }
}
`;