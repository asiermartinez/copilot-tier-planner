import { projects } from "./projects";

const allNavigationItems = [projects];

export function getRepositoryParentPageNavigation(slug: string) {
  return allNavigationItems.find(nav => nav.slug === slug);
}
