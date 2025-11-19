import {
  RepoIcon,
  ShieldLockIcon,
  CodespacesIcon,
  CopilotIcon,
  PlayIcon,
  CpuIcon,
  ProjectIcon,
  ShieldIcon,
  KeyIcon,
  LawIcon,
  HeartIcon,
  AiModelIcon,
} from "@primer/octicons-react";
import { PageNavigation } from "@/types/navigation";

export const policies: PageNavigation = {
  name: "Policies",
  slug: "policies",
  groups: [
    {
      items: [
        {
          name: "Repository",
          icon: RepoIcon,
          subItems: [
            {
              name: "Repository",
              path: "policies",
            },
            {
              name: "Code",
              path: "policies/code",
            },
            {
              name: "Code insights",
              path: "policies/insights",
            },
            {
              name: "Code ruleset bypasses",
              path: "policies/bypasses",
            },
            {
              name: "Custom properties",
              path: "policies/custom-properties",
            },
          ],
        },
        {
          name: "Member privileges",
          icon: ShieldLockIcon,
          path: "policies/privileges",
        },
        {
          name: "Codespaces",
          icon: CodespacesIcon,
          path: "policies/codespaces",
        },
        {
          name: "Copilot",
          icon: CopilotIcon,
          path: "policies/copilot",
        },
        {
          name: "Actions",
          icon: PlayIcon,
          path: "policies/actions",
        },
        {
          name: "Hosted compute networking",
          icon: CpuIcon,
          path: "policies/compute",
        },
        {
          name: "Projects",
          icon: ProjectIcon,
          path: "policies/projects",
        },
        {
          name: "Advanced security",
          icon: ShieldIcon,
          path: "policies/advanced-security",
        },
        {
          name: "Personal access tokens",
          icon: KeyIcon,
          path: "policies/access-tokens",
        },
        {
          name: "License policy",
          icon: LawIcon,
          path: "policies/license-policy",
        },
        {
          name: "Sponsors",
          icon: HeartIcon,
          path: "policies/sponsors",
        },
        {
          name: "Models",
          icon: AiModelIcon,
          path: "policies/models",
        },
      ],
    },
  ],
};
