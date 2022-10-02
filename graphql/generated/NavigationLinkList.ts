/* tslint:disable */
/* eslint-disable */
// @generated
// This file was automatically generated and should not be edited.

// ====================================================
// GraphQL query operation: NavigationLinkList
// ====================================================

export interface NavigationLinkList_navigation_links_translations {
  __typename: "navigation_link_translations";
  title: string | null;
}

export interface NavigationLinkList_navigation_links {
  __typename: "navigation_links";
  id: string;
  route: string | null;
  display_tag: string | null;
  target: string | null;
  button: boolean | null;
  translations: (NavigationLinkList_navigation_links_translations | null)[] | null;
}

export interface NavigationLinkList {
  navigation_links: NavigationLinkList_navigation_links[];
}

export interface NavigationLinkListVariables {
  location?: string | null;
  lang?: string | null;
}
