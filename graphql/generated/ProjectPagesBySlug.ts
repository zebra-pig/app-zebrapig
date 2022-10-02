/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ProjectPagesBySlug
// ====================================================

export interface ProjectPagesBySlug_project_pages_cover {
  __typename: "directus_files";
  id: string;
}

export interface ProjectPagesBySlug_project_pages_hero {
  __typename: "directus_files";
  id: string;
}

export interface ProjectPagesBySlug_project_pages_translations {
  __typename: "project_pages_translations";
  title: string | null;
  content: any | null;
}

export interface ProjectPagesBySlug_project_pages {
  __typename: "project_pages";
  id: string;
  background_color: string | null;
  text_color: string | null;
  accent_color: string | null;
  cover: ProjectPagesBySlug_project_pages_cover | null;
  hero: ProjectPagesBySlug_project_pages_hero | null;
  translations: (ProjectPagesBySlug_project_pages_translations | null)[] | null;
}

export interface ProjectPagesBySlug {
  project_pages: ProjectPagesBySlug_project_pages[];
}

export interface ProjectPagesBySlugVariables {
  slug?: string | null;
  lang?: string | null;
}
