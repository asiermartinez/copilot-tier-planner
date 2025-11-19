"use client";
import { use } from "react";
import { Blankslate } from "@primer/react/experimental";

export default function OrgPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);

  return (
    <Blankslate spacious>
      <Blankslate.Heading>Welcome to {slug} people</Blankslate.Heading>
      <Blankslate.Description>
        This is your org account people entry point
      </Blankslate.Description>
    </Blankslate>
  );
}
