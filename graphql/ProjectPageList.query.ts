import gql from "graphql-tag";

/**
 * query document:
 *  queries multiple projects ordered by date descending with locale
 */
export default gql`

query ProjectPageList($lang: String) 
{
  project_pages(sort: [ "-start" ]) 
  {
    id
    background_color
    text_color
    accent_color
    hero{
      id
    }
    cover{
      id
    }
    slug
    translations(filter: { language_code: {code: {_eq: $lang} }}) 
    {
      title
      content
    }
    worktypes{
      worktype{
        translations(filter: { language_code: {code: {_eq: $lang} }}) 
        {
          title
        }
      }
    }
  }
}
`;