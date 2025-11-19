"use client";
import { Button, PageHeader } from "@primer/react";

export default function EnterprisePage() {
  return (
    <div>
      <PageHeader role="banner" aria-label="Organizations">
        <PageHeader.TitleArea>
          <PageHeader.Title>Organizations</PageHeader.Title>
        </PageHeader.TitleArea>
        <PageHeader.Actions>
          <Button>Invite organization</Button>
          <Button variant="primary">New organization</Button>
        </PageHeader.Actions>
      </PageHeader>
    </div>
  );
}
