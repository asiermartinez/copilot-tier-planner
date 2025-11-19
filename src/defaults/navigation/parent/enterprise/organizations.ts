import { HomeIcon } from "@primer/octicons-react";
import { PageNavigation } from "@/types/navigation";

export const organizations: PageNavigation = {
  name: "Organizations",
  slug: "organizations",
  groups: [
    {
      items: [
        {
          name: "Overview",
          icon: HomeIcon,
          path: "organizations",
        },
      ],
    },
  ],
};
