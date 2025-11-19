import { Account } from "@/types/accounts";

// List of mock user accounts, add yours here

export const userAccounts = [
  {
    name: "Mona the Octocat",
    slug: "monalisa",
  },
];

export function getUserAccountBySlug(slug: string): Account | undefined {
  return userAccounts.find(account => account.slug === slug);
}
