import { HomeIcon } from "@primer/octicons-react";
import { PageNavigation } from "@/types/navigation";

export const compliance: PageNavigation = {
  name: "Compliance",
  slug: "compliance",
  groups: [
    {
      items: [
        {
          name: "Overview",
          icon: HomeIcon,
          path: "compliance",
        },
      ],
    },
  ],
};
