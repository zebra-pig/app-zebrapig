/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: ProjectPageList
// ====================================================

export interface ProjectPageList_project_pages_hero {
  __typename: "directus_files";
  id: string;
}

export interface ProjectPageList_project_pages_cover {
  __typename: "directus_files";
  id: string;
}

export interface ProjectPageList_project_pages_translations {
  __typename: "project_pages_translations";
  title: string | null;
  content: any | null;
}

export interface ProjectPageList_project_pages_worktypes_worktype_translations {
  __typename: "worktypes_translations";
  title: string | null;
}

export interface ProjectPageList_project_pages_worktypes_worktype {
  __typename: "worktypes";
  translations: (ProjectPageList_project_pages_worktypes_worktype_translations | null)[] | null;
}

export interface ProjectPageList_project_pages_worktypes {
  __typename: "project_pages_worktypes";
  worktype: ProjectPageList_project_pages_worktypes_worktype | null;
}

export interface ProjectPageList_project_pages {
  __typename: "project_pages";
  id: string;
  background_color: string | null;
  text_color: string | null;
  accent_color: string | null;
  hero: ProjectPageList_project_pages_hero | null;
  cover: ProjectPageList_project_pages_cover | null;
  slug: string | null;
  translations: (ProjectPageList_project_pages_translations | null)[] | null;
  worktypes: (ProjectPageList_project_pages_worktypes | null)[] | null;
}

export interface ProjectPageList {
  project_pages: ProjectPageList_project_pages[];
}

export interface ProjectPageListVariables {
  lang?: string | null;
}
