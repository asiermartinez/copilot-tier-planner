import { HomeIcon } from "@primer/octicons-react";
import { PageNavigation } from "@/types/navigation";

export const repositories: PageNavigation = {
  name: "Repositories",
  slug: "repositories",
  groups: [
    {
      items: [
        {
          name: "All",
          icon: HomeIcon,
          path: "repositories",
        },
      ],
    },
  ],
};
