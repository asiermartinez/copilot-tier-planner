import { Repository } from "@/types/accounts";

// List of mock repositories, add yours here

export const repositories = [
  {
    slug: "github",
    description: "",
  },
];

export function getRepositoryBySlug(slug: string): Repository | undefined {
  return repositories.find(repository => repository.slug === slug);
}
