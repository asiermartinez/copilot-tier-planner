"use client";
import { Button, PageHeader } from "@primer/react";

export default function EnterprisePage() {
  return (
    <div>
      <PageHeader role="banner" aria-label="Organizations">
        <PageHeader.TitleArea>
          <PageHeader.Title>Members</PageHeader.Title>
        </PageHeader.TitleArea>
        <PageHeader.Actions>
          <Button>CSV Report</Button>
          <Button variant="primary">Invite member</Button>
        </PageHeader.Actions>
      </PageHeader>
    </div>
  );
}
