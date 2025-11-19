import React from "react";
import Link from "next/link";
import { NavList, Heading } from "@primer/react";

import { getNavigationByLevel } from "@/defaults/navigation/parent";
import {
  useBaseURL,
  useParentPath,
  useActiveNavigation,
  generateAllBaseURLs,
} from "@/utils/navigation";
import {
  NavigationGroup as NavigationGroupType,
  NavigationItem as NavigationItemType,
} from "@/types/navigation";

const buildURL = (item: NavigationItemType, baseURL: string): string =>
  item.path ? `${baseURL}/${item.path}` : baseURL;

const isSelected = (
  item: NavigationItemType,
  baseURL: string,
  activeURL: string
): boolean => buildURL(item, baseURL) === activeURL;

interface NavigationItemProps {
  item: NavigationItemType;
  baseURL: string;
  activeURL: string;
}

const NavigationItem = React.memo<NavigationItemProps>(
  ({ item, baseURL, activeURL }) => {
    const itemURL = buildURL(item, baseURL);
    const selected = isSelected(item, baseURL, activeURL);

    return (
      <NavList.Item
        href={itemURL}
        aria-current={selected ? "page" : undefined}
        as={Link}
      >
        <NavList.LeadingVisual>
          {item.icon && <item.icon />}
        </NavList.LeadingVisual>
        {item.name}

        {item.subItems && (
          <NavList.SubNav>
            {item.subItems.map(subItem => (
              <NavList.Item
                key={subItem.path || subItem.name}
                href={buildURL(subItem, baseURL)}
                aria-current={
                  isSelected(subItem, baseURL, activeURL) ? "page" : undefined
                }
                as={Link}
              >
                {subItem.name}
              </NavList.Item>
            ))}
          </NavList.SubNav>
        )}
      </NavList.Item>
    );
  }
);

NavigationItem.displayName = "NavigationItem";

interface NavigationGroupProps {
  group: NavigationGroupType;
  baseURL: string;
  activeURL: string;
  showDivider: boolean;
}

const NavigationGroup = React.memo<NavigationGroupProps>(
  ({ group, baseURL, activeURL, showDivider }) => (
    <>
      {showDivider && !group.name && <NavList.Divider />}
      {group.name ? (
        <NavList.Group title={group.name}>
          {group.items.map(item => (
            <NavigationItem
              key={item.path || item.name}
              item={item}
              baseURL={baseURL}
              activeURL={activeURL}
            />
          ))}
        </NavList.Group>
      ) : (
        group.items.map(item => (
          <NavigationItem
            key={item.path || item.name}
            item={item}
            baseURL={baseURL}
            activeURL={activeURL}
          />
        ))
      )}
    </>
  )
);

NavigationGroup.displayName = "NavigationGroup";

export const ParentNavigation = React.memo(() => {
  const { level, parentPath } = useParentPath();
  const navigation = getNavigationByLevel(level, parentPath);
  const baseURL = useBaseURL();

  const allItems = navigation?.groups.flatMap(group => group.items) || [];
  const allUrls = generateAllBaseURLs(allItems, baseURL);
  const activeUrl = useActiveNavigation(allUrls);

  if (!navigation) return null;

  return (
    <>
      <Heading
        as="h2"
        variant="medium"
        style={{ marginLeft: "var(--base-size-16)" }}
      >
        {navigation.name}
      </Heading>
      <NavList>
        {navigation.groups.map((group, index) => (
          <NavigationGroup
            key={group.name || `group-${index}`}
            group={group}
            baseURL={baseURL}
            activeURL={activeUrl}
            showDivider={index > 0}
          />
        ))}
      </NavList>
    </>
  );
});

ParentNavigation.displayName = "ParentNavigation";
