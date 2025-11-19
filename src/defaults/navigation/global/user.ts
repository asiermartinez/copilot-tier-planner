import {
  BookIcon,
  RepoIcon,
  TableIcon,
  PackageIcon,
  StarIcon,
  HeartIcon,
} from "@primer/octicons-react";
import { GlobalNavigationItem } from "@/types/navigation";

// User global navigation
//
// In product user global navigation is based on a ?tab= query parameter
// but for the sake of consistency for this prototype we'll use paths.

export const user: GlobalNavigationItem[] = [
  {
    name: "Overview",
    icon: BookIcon,
    path: "",
  },
  {
    name: "Repositories",
    icon: RepoIcon,
    counter: 50,
    path: "repositories",
  },
  {
    name: "Projects",
    icon: TableIcon,
    path: "projects",
  },
  {
    name: "Packages",
    icon: PackageIcon,
    path: "packages",
  },
  {
    name: "Stars",
    icon: StarIcon,
    counter: "1.2k",
    path: "stars",
  },
  {
    name: "Sponsoring",
    icon: HeartIcon,
    path: "sponsoring",
  },
];
