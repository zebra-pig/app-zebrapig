import gql from "graphql-tag";

/**
 * query document:
 *  queries multiple projects ordered by date descending with locale
 */
export default gql`

query DownloadPagesByHash($hash: String) 
{
  download_pages(filter: { hash: {_eq: $hash} })
  {
    id
    hash
    title
    preview
    download_url
    version
    hero {
      id
    }
  }
}
`;