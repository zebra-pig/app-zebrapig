/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: DownloadPagesByHash
// ====================================================

export interface DownloadPagesByHash_download_pages {
  __typename: "download_pages";
  id: string;
  hash: string | null;
  title: string | null;
  preview: boolean | null;
  download_url: string | null;
  version: number | null;
  hero: string | null;
}

export interface DownloadPagesByHash {
  download_pages: DownloadPagesByHash_download_pages[];
}

export interface DownloadPagesByHashVariables {
  hash?: string | null;
}
