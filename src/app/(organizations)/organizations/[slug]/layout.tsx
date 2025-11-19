import { AppHeader } from "@/components/AppHeader";
import { organizationAccounts } from "@/defaults/accounts";

export async function generateStaticParams() {
  return organizationAccounts.map(organization => ({
    slug: organization.slug,
  }));
}

export default function EnterpriseRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AppHeader withGlobalNav="organization" />
      {children}
    </>
  );
}
