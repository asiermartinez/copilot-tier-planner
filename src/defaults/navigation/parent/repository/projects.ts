import { HomeIcon } from "@primer/octicons-react";
import { PageNavigation } from "@/types/navigation";

export const projects: PageNavigation = {
  name: "Projects",
  slug: "projects",
  groups: [
    {
      items: [
        {
          name: "All",
          icon: HomeIcon,
          path: "all",
        },
      ],
    },
  ],
};
