import {
  OrganizationIcon,
  PeopleIcon,
  GlobeIcon,
  ShieldLockIcon,
  LinkIcon,
} from "@primer/octicons-react";
import { PageNavigation } from "@/types/navigation";

export const people: PageNavigation = {
  name: "People",
  slug: "people",
  groups: [
    {
      items: [
        {
          name: "Members",
          icon: PeopleIcon,
          path: "people",
        },
      ],
    },
    {
      name: "Team and role management",
      items: [
        {
          name: "Enterprise teams",
          icon: PeopleIcon,
          path: "people/teams",
        },
        {
          name: "Enterprise roles",
          icon: GlobeIcon,
          path: "people/enterprise-roles",
        },
        {
          name: "Organization roles",
          icon: OrganizationIcon,
          path: "people/organization-roles",
        },
      ],
    },
    {
      name: "Security and provisioning",
      items: [
        {
          name: "Two factor authentication",
          icon: ShieldLockIcon,
          path: "people/2fa",
        },
        {
          name: "SSO and SCIM provisioning",
          icon: LinkIcon,
          path: "people/provisioning",
        },
      ],
    },
  ],
};
