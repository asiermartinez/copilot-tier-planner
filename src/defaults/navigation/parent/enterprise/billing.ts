import {
  HomeIcon,
  GraphIcon,
  LawIcon,
  OrganizationIcon,
  BellIcon,
  CreditCardIcon,
  FileIcon,
  PeopleIcon,
} from "@primer/octicons-react";
import { PageNavigation } from "@/types/navigation";

export const billing: PageNavigation = {
  name: "Billing and licensing",
  slug: "billing",
  groups: [
    {
      items: [
        {
          name: "Overview",
          icon: HomeIcon,
          path: "billing",
        },
        {
          name: "Usage",
          icon: GraphIcon,
          subItems: [
            {
              name: "Metered usage",
              path: "billing/usage",
            },
            {
              name: "Copilot premium requests analytics",
              path: "billing/premium-usage",
            },
          ],
        },
        {
          name: "Licensing",
          icon: LawIcon,
          path: "billing/licensing",
        },
      ],
    },
    {
      items: [
        {
          name: "Cost centers",
          icon: OrganizationIcon,
          path: "billing/cost-centers",
        },
        {
          name: "Budgets and alerts",
          icon: BellIcon,
          path: "billing/budgets",
        },
      ],
    },
    {
      items: [
        {
          name: "Payment information",
          icon: CreditCardIcon,
          path: "billing/payment",
        },
        {
          name: "Past invoices",
          icon: FileIcon,
          path: "billing/invoices",
        },
        {
          name: "Billing contacts",
          icon: PeopleIcon,
          path: "billing/contacts",
        },
      ],
    },
  ],
};
