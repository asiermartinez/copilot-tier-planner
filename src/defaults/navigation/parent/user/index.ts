import { repositories } from "./repositories";

const allNavigationItems = [repositories];

export function getUserParentPageNavigation(slug: string) {
  return allNavigationItems.find(nav => nav.slug === slug);
}
