import { HomeIcon } from "@primer/octicons-react";
import { PageNavigation } from "@/types/navigation";

export const settings: PageNavigation = {
  name: "Settings",
  slug: "settings",
  groups: [
    {
      items: [
        {
          name: "Overview",
          icon: HomeIcon,
          path: "settings",
        },
      ],
    },
  ],
};
