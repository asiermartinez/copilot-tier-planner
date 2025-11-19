import { ComponentType } from "react";

interface BaseNavigationItem {
  name: string;
  path?: string;
  icon?: ComponentType<React.SVGProps<SVGSVGElement>>;
  counter?: number | string;
}

export interface GlobalNavigationItem extends BaseNavigationItem {
  icon: ComponentType<React.SVGProps<SVGSVGElement>>;
}

export interface NavigationItem extends BaseNavigationItem {
  subItems?: NavigationItem[];
}

export interface NavigationGroup {
  name?: string;
  items: NavigationItem[];
}

export interface PageNavigation {
  name: string;
  slug: string;
  groups: NavigationGroup[];
}

export interface BreadcrumbItem {
  label: string;
  href?: string;
  isPrivate?: boolean;
}

export type GlobalNavigationVariant =
  | "enterprise"
  | "organization"
  | "repository"
  | "user";
