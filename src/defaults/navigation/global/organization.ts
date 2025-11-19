import {
  HomeIcon,
  RepoIcon,
  PackageIcon,
  TableIcon,
  PeopleIcon,
  PersonIcon,
  ShieldIcon,
  GraphIcon,
  GearIcon,
  HeartIcon,
} from "@primer/octicons-react";
import { GlobalNavigationItem } from "@/types/navigation";

// Organization global navigation

export const organization: GlobalNavigationItem[] = [
  {
    name: "Overview",
    icon: HomeIcon,
    path: "",
  },
  {
    name: "Repositories",
    icon: RepoIcon,
    counter: "4.2k",
    path: "repositories",
  },
  {
    name: "Projects",
    icon: TableIcon,
    counter: "14.2k",
    path: "projects",
  },
  {
    name: "Packages",
    icon: PackageIcon,
    path: "packages",
  },
  {
    name: "Teams",
    icon: PeopleIcon,
    counter: "3.1k",
    path: "teams",
  },
  {
    name: "People",
    icon: PersonIcon,
    counter: "4.4k",
    path: "people",
  },
  {
    name: "Security",
    icon: ShieldIcon,
    path: "security",
  },
  {
    name: "Insights",
    icon: GraphIcon,
    path: "insights",
  },
  {
    name: "Sponsoring",
    icon: HeartIcon,
    counter: 42,
    path: "sponsoring",
  },
  {
    name: "Settings",
    icon: GearIcon,
    path: "settings",
  },
];
