import {
  HomeIcon,
  OrganizationIcon,
  PlugIcon,
  PeopleIcon,
  CreditCardIcon,
  ShieldIcon,
  GraphIcon,
  GearIcon,
  ChecklistIcon,
  LawIcon,
} from "@primer/octicons-react";
import { GlobalNavigationItem } from "@/types/navigation";

// Enterprise global navigation

export const enterprise: GlobalNavigationItem[] = [
  {
    name: "Overview",
    icon: HomeIcon,
    path: "",
  },
  {
    name: "Organizations",
    icon: OrganizationIcon,
    path: "organizations",
  },
  {
    name: "People",
    icon: PeopleIcon,
    path: "people",
  },
  {
    name: "Policies",
    icon: LawIcon,
    path: "policies",
  },
  {
    name: "GitHub Connect",
    icon: PlugIcon,
    path: "installations",
  },
  {
    name: "Security",
    icon: ShieldIcon,
    path: "security",
  },
  {
    name: "Billing and licensing",
    icon: CreditCardIcon,
    path: "billing",
  },
  {
    name: "Settings",
    icon: GearIcon,
    path: "settings",
  },
  {
    name: "Compliance",
    icon: ChecklistIcon,
    path: "compliance",
  },
  {
    name: "Insights",
    icon: GraphIcon,
    path: "insights",
  },
];
