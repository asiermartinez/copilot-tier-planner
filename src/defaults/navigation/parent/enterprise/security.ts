import { HomeIcon } from "@primer/octicons-react";
import { PageNavigation } from "@/types/navigation";

export const security: PageNavigation = {
  name: "Security",
  slug: "security",
  groups: [
    {
      items: [
        {
          name: "Overview",
          icon: HomeIcon,
          path: "security",
        },
      ],
    },
  ],
};
