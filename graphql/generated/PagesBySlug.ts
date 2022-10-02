/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: PagesBySlug
// ====================================================

export interface PagesBySlug_pages_translations {
  __typename: "page_translations";
  title: string | null;
  content: any | null;
}

export interface PagesBySlug_pages {
  __typename: "pages";
  id: string;
  translations: (PagesBySlug_pages_translations | null)[] | null;
}

export interface PagesBySlug {
  pages: PagesBySlug_pages[];
}

export interface PagesBySlugVariables {
  slug?: string | null;
  lang?: string | null;
}
