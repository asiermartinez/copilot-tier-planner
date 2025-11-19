import { usePathname, useParams } from "next/navigation";
import { useMemo } from "react";
import {
  getEnterpriseAccountBySlug,
  getOrganizationAccountBySlug,
} from "@/defaults/accounts";
import { BreadcrumbItem, NavigationItem } from "@/types/navigation";
import { NavigationLevel } from "@/defaults/navigation/parent";

const ACCOUNT_TYPES = {
  "/enterprises/": {
    getAccount: getEnterpriseAccountBySlug,
    pathPrefix: "/enterprises",
  },
  "/organizations/": {
    getAccount: getOrganizationAccountBySlug,
    pathPrefix: "/organizations",
  },
} as const;

const formatDisplayName = (str: string): string =>
  str
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");

export function useBaseURL(paramKey = "slug"): string {
  const pathname = usePathname();
  const params = useParams();

  return useMemo(() => {
    const paramValue = params[paramKey];
    if (!paramValue) return pathname;

    const pathSegments = pathname.split("/").filter(Boolean);
    const paramIndex = pathSegments.findIndex(
      segment => segment === paramValue
    );

    return paramIndex !== -1
      ? "/" + pathSegments.slice(0, paramIndex + 1).join("/")
      : pathname;
  }, [pathname, params, paramKey]);
}

export function useActiveNavigation(urls: string[]): string {
  const pathname = usePathname();

  return useMemo(() => {
    if (urls.length === 0) return "";

    const sortedUrls = [...urls].sort((a, b) => b.length - a.length);

    for (const url of sortedUrls) {
      if (pathname === url || pathname.startsWith(url + "/")) {
        return url;
      }
    }

    return "";
  }, [pathname, urls]);
}

// TODO Support more levels (e.g. repositories...)
export function useBreadcrumbs(): BreadcrumbItem[] {
  const pathname = usePathname();
  const params = useParams();

  return useMemo(() => {
    const breadcrumbItems: BreadcrumbItem[] = [];
    const slug = params.slug as string;

    const accountType = Object.entries(ACCOUNT_TYPES).find(([prefix]) =>
      pathname.startsWith(prefix)
    );

    if (accountType && slug) {
      const [, config] = accountType;
      const account = config.getAccount(slug);
      const accountName = account?.name || formatDisplayName(slug);
      const baseURL = `${config.pathPrefix}/${slug}`;

      breadcrumbItems.push({
        label: accountName,
        href: baseURL,
      });
    }

    return breadcrumbItems;
  }, [pathname, params.slug]);
}

export function useParentPath(paramKey = "slug"): {
  level: NavigationLevel;
  parentPath: string;
} {
  const pathname = usePathname();
  const params = useParams();

  return useMemo(() => {
    const paramValue = params[paramKey] as string;

    const pathSegments = pathname.split("/").filter(Boolean);
    const slugIndex = pathSegments.findIndex(segment => segment === paramValue);

    let level: NavigationLevel = "repository";
    if (slugIndex !== -1 && slugIndex > 0) {
      const levelSegment = pathSegments[slugIndex - 1];
      switch (levelSegment) {
        case "enterprises":
          level = "enterprise";
          break;
        case "organizations":
          level = "organization";
          break;
        case "users":
          level = "user";
          break;
        default:
          level = "repository";
      }
    }

    const parentPath =
      slugIndex !== -1 && slugIndex + 1 < pathSegments.length
        ? pathSegments[slugIndex + 1]
        : "";
    return { level, parentPath };
  }, [pathname, params, paramKey]);
}

export function generateAllBaseURLs<T extends NavigationItem>(
  navItems: T[],
  baseURL: string
): string[] {
  const urls: string[] = [];

  for (const item of navItems) {
    if (item.path) {
      urls.push(`${baseURL}/${item.path}`);
    }

    if (item.subItems) {
      for (const subItem of item.subItems) {
        if (subItem.path) {
          urls.push(`${baseURL}/${subItem.path}`);
        }
      }
    }
  }

  return urls;
}
