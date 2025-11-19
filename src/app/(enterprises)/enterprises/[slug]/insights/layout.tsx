"use client";
import { PageLayout } from "@primer/react";
import { ParentNavigation } from "@/components/ParentNavigation";

export default function EnterprisePeopleLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <PageLayout
      rowGap="none"
      columnGap="none"
      padding="none"
      containerWidth="full"
      className="height-full"
    >
      <PageLayout.Pane
        position="start"
        divider="line"
        padding="condensed"
        width="large"
      >
        <ParentNavigation />
      </PageLayout.Pane>
      <PageLayout.Content padding="condensed" width="xlarge">
        {children}
      </PageLayout.Content>
    </PageLayout>
  );
}
