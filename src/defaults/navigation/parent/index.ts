import { PageNavigation } from "@/types/navigation";

import { getEnterpriseParentPageNavigation } from "./enterprise";
import { getOrgParentPageNavigation } from "./organization";
import { getUserParentPageNavigation } from "./user";

export type NavigationLevel =
  | "enterprise"
  | "organization"
  | "repository"
  | "user";

type NavigationFunction = (slug: string) => PageNavigation | undefined;

const navigationRegistry: Record<NavigationLevel, NavigationFunction> = {
  enterprise: getEnterpriseParentPageNavigation,
  organization: getOrgParentPageNavigation,
  user: getUserParentPageNavigation,
  repository: () => {
    console.warn("Repository level navigation is not yet implemented");
    return undefined;
  },
} as const;

export function getNavigationByLevel(
  level: NavigationLevel,
  slug: string
): PageNavigation | undefined {
  const navigationFunction = navigationRegistry[level];

  if (!navigationFunction) {
    console.warn(`Navigation level "${level}" is not supported`);
    return undefined;
  }

  return navigationFunction(slug);
}

export { navigationRegistry };
