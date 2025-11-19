import { Account } from "@/types/accounts";

// List of mock enterprise accounts, add yours here

export const enterpriseAccounts = [
  {
    name: "Avocado Corp.",
    slug: "avocado-corp",
  },
  {
    name: "Octocat Inc.",
    slug: "octocat-inc",
  },
  {
    name: "Mona's Bakery",
    slug: "monas-bakery",
  },
  {
    name: "GitHub Universe",
    slug: "github-universe",
  },
];

export function getEnterpriseAccountBySlug(slug: string): Account | undefined {
  return enterpriseAccounts.find(account => account.slug === slug);
}
