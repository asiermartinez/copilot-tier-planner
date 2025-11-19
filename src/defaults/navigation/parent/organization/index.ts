import { repositories } from "./repositories";

const allNavigationItems = [repositories];

export function getOrgParentPageNavigation(slug: string) {
  return allNavigationItems.find(nav => nav.slug === slug);
}
