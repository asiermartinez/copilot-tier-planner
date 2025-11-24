"use client";

import { useState } from "react";
import { ActionMenu, ActionList, Button, FormControl } from "@primer/react";
import { TriangleDownIcon } from "@primer/octicons-react";

type AccountType = "individual" | "organization" | "enterprise";

interface AccountTypeSelectorProps {
  value: AccountType;
  onChange: (accountType: AccountType) => void;
}

const ACCOUNT_TYPES: Array<{ value: AccountType; label: string }> = [
  { value: "individual", label: "Individual" },
  { value: "organization", label: "Organization" },
  { value: "enterprise", label: "Enterprise" },
];

export default function AccountTypeSelector({
  value,
  onChange,
}: AccountTypeSelectorProps) {
  const [open, setOpen] = useState(false);

  const currentLabel =
    ACCOUNT_TYPES.find(type => type.value === value)?.label || "Individual";

  const handleSelect = (newValue: AccountType) => {
    setOpen(false);
    onChange(newValue);
  };

  return (
    <FormControl>
      <FormControl.Label>Account type</FormControl.Label>
      <ActionMenu open={open} onOpenChange={setOpen}>
        <ActionMenu.Anchor>
          <Button trailingVisual={TriangleDownIcon}>{currentLabel}</Button>
        </ActionMenu.Anchor>
        <ActionMenu.Overlay>
          <ActionList selectionVariant="single">
            {ACCOUNT_TYPES.map(type => (
              <ActionList.Item
                key={type.value}
                selected={value === type.value}
                onSelect={() => handleSelect(type.value)}
              >
                {type.label}
              </ActionList.Item>
            ))}
          </ActionList>
        </ActionMenu.Overlay>
      </ActionMenu>
    </FormControl>
  );
}
