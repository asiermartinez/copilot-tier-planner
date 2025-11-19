"use client";
import React from "react";
import Link from "next/link";
import { UnderlineNav } from "@primer/react";
import { globalNavigationItems } from "@/defaults/navigation/global";
import { useBaseURL, useActiveNavigation } from "@/utils/navigation";
import { GlobalNavigationItem } from "@/types/navigation";

type GlobalNavigationVariant = keyof typeof globalNavigationItems;

interface GlobalNavProps {
  variant: GlobalNavigationVariant;
}

export const GlobalNav = React.memo<GlobalNavProps>(({ variant }) => {
  const items = globalNavigationItems[variant];
  const baseURL = useBaseURL();
  const buildURL = (item: GlobalNavigationItem): string =>
    item.path ? `${baseURL}/${item.path}` : baseURL;

  const allURLs = items.map(buildURL);
  const activeURL = useActiveNavigation(allURLs);

  return (
    <UnderlineNav aria-label="Navigation" key={`globalNav-${variant}`}>
      {items.map(item => {
        const URL = buildURL(item);
        return (
          <UnderlineNav.Item
            counter={item.counter ? item.counter : undefined}
            icon={<item.icon />}
            key={`underlineItem-${variant}-${item.name}`}
            href={URL}
            aria-current={URL === activeURL ? "page" : undefined}
            as={Link}
          >
            {item.name}
          </UnderlineNav.Item>
        );
      })}
    </UnderlineNav>
  );
});

GlobalNav.displayName = "GlobalNav";
