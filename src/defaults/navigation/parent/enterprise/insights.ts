import { HomeIcon } from "@primer/octicons-react";
import { PageNavigation } from "@/types/navigation";

export const insights: PageNavigation = {
  name: "Insights",
  slug: "insights",
  groups: [
    {
      items: [
        {
          name: "Overview",
          icon: HomeIcon,
          path: "insights",
        },
      ],
    },
  ],
};
