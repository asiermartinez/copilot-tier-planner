import { Account } from "@/types/accounts";

// List of mock org accounts, add yours here

export const organizationAccounts = [
  {
    name: "GitHub",
    slug: "github",
  },
  {
    name: "Microsoft",
    slug: "microsoft",
  },
  {
    name: "Octodemo",
    slug: "octodemo",
  },
];

export function getOrganizationAccountBySlug(
  slug: string
): Account | undefined {
  return organizationAccounts.find(account => account.slug === slug);
}
