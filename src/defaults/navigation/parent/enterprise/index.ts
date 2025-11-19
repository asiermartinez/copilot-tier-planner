import { billing } from "./billing";
import { compliance } from "./compliance";
import { insights } from "./insights";
import { installations } from "./installations";
import { organizations } from "./organizations";
import { people } from "./people";
import { policies } from "./policies";
import { security } from "./security";
import { settings } from "./settings";

export function getEnterpriseParentPageNavigation(slug: string) {
  const parentNavigation = [
    billing,
    compliance,
    insights,
    installations,
    organizations,
    people,
    policies,
    security,
    settings,
  ];
  return parentNavigation.find(nav => nav.slug === slug);
}
