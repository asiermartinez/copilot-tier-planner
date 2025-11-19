import {
  CodeIcon,
  IssueOpenedIcon,
  GitPullRequestIcon,
  TableIcon,
  PlayIcon,
  BookIcon,
  ShieldIcon,
  GraphIcon,
  GearIcon,
  AiModelIcon,
} from "@primer/octicons-react";
import { GlobalNavigationItem } from "@/types/navigation";

// Repository global navigation

export const repository: GlobalNavigationItem[] = [
  {
    name: "Code",
    icon: CodeIcon,
    path: "",
  },
  {
    name: "Issues",
    icon: IssueOpenedIcon,
    counter: 42,
    path: "issues",
  },
  {
    name: "Pull requests",
    icon: GitPullRequestIcon,
    counter: 10,
    path: "pulls",
  },
  {
    name: "Discussions",
    icon: TableIcon,
    path: "discussions",
  },
  {
    name: "Actions",
    icon: PlayIcon,
    path: "actions",
  },
  {
    name: "Projects",
    icon: TableIcon,
    counter: 2,
    path: "projects",
  },
  {
    name: "Models",
    icon: AiModelIcon,
    path: "models",
  },
  {
    name: "Wiki",
    icon: BookIcon,
    path: "wiki",
  },
  {
    name: "Security",
    icon: ShieldIcon,
    path: "security",
  },
  {
    name: "Insights",
    icon: GraphIcon,
    path: "insigths",
  },
  {
    name: "Settings",
    icon: GearIcon,
    path: "settings",
  },
];
