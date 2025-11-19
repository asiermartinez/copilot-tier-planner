import { AppHeader } from "@/components/AppHeader";
import { enterpriseAccounts } from "@/defaults/accounts";

export async function generateStaticParams() {
  return enterpriseAccounts.map(enterprise => ({
    slug: enterprise.slug,
  }));
}

export default function EnterpriseRootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      <AppHeader withGlobalNav="enterprise" />
      {children}
    </>
  );
}
