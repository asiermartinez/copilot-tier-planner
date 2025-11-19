import { HomeIcon } from "@primer/octicons-react";
import { PageNavigation } from "@/types/navigation";

export const installations: PageNavigation = {
  name: "Installations",
  slug: "installations",
  groups: [
    {
      items: [
        {
          name: "Overview",
          icon: HomeIcon,
          path: "installations",
        },
      ],
    },
  ],
};
