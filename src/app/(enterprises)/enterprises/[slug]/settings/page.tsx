"use client";
import { use } from "react";
import { Blankslate } from "@primer/react/experimental";

export default function EnterprisePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  return (
    <Blankslate spacious>
      <Blankslate.Heading>Welcome to {slug} settings</Blankslate.Heading>
      <Blankslate.Description>
        This is your enterprise account settings entry point
      </Blankslate.Description>
    </Blankslate>
  );
}
