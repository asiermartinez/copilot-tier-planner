"use client";
import { JSX } from "react";
import {
  InboxIcon,
  GitPullRequestIcon,
  IssueOpenedIcon,
  PlusIcon,
  SearchIcon,
  CopilotIcon,
  MarkGithubIcon,
  ThreeBarsIcon,
  TriangleDownIcon,
} from "@primer/octicons-react";
import { Avatar, ButtonGroup, IconButton, TextInput } from "@primer/react";

import { useBreadcrumbs } from "@/utils/navigation";
import { Breadcrumb } from "./subcomponents/Breadcrumb";
import { GlobalNav } from "./subcomponents/GlobalNav";
import styles from "./AppHeader.module.css";
import { BreadcrumbItem, GlobalNavigationVariant } from "@/types/navigation";

interface AppHeaderProps {
  withGlobalNav?: GlobalNavigationVariant;
  withCustomBreadcrumbs?: BreadcrumbItem[];
}

export function AppHeader({
  withGlobalNav,
  withCustomBreadcrumbs,
}: AppHeaderProps = {}): JSX.Element {
  const userAvatarSrc: string =
    "https://avatars.githubusercontent.com/u/92997159?v=4";

  const autoBreadcrumbItems = useBreadcrumbs();
  const breadcrumbItems = withCustomBreadcrumbs || autoBreadcrumbItems;

  return (
    <div className={styles.container}>
      <div className={styles.headerRow}>
        <div className={styles.leftSection}>
          <IconButton
            icon={ThreeBarsIcon}
            aria-label="Open global navigation menu"
          />
          <MarkGithubIcon size={32} />
          <Breadcrumb items={breadcrumbItems} />
        </div>
        <div className={styles.rightSection}>
          <div className={styles.searchSection}>
            <TextInput
              placeholder="Type / to search"
              leadingVisual={SearchIcon}
              contrast
            />
            <ButtonGroup>
              <IconButton icon={CopilotIcon} aria-label="Chat with Copilot" />
              <IconButton
                icon={TriangleDownIcon}
                aria-label="Open Copilot..."
              />
            </ButtonGroup>
          </div>
          <div className={styles.divider} />
          <div className={styles.actionsSection}>
            <ButtonGroup>
              <IconButton icon={PlusIcon} aria-label="Create new..." />
              <IconButton icon={TriangleDownIcon} aria-label="Create new..." />
            </ButtonGroup>
            <IconButton icon={IssueOpenedIcon} aria-label="Your issues" />
            <IconButton
              icon={GitPullRequestIcon}
              aria-label="Your pull requests"
            />
            <IconButton icon={InboxIcon} aria-label="Open inbox" />
            <Avatar src={userAvatarSrc} size={32} />
          </div>
        </div>
      </div>
      {withGlobalNav && (
        <div className={styles.globalNavRow}>
          <GlobalNav variant={withGlobalNav} />
        </div>
      )}
    </div>
  );
}

AppHeader.displayName = "AppHeader";
