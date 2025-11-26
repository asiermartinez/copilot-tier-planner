"use client";

import { FormControl, Textarea } from "@primer/react";

interface MessageFieldProps {
  /**
   * Label text for the field
   */
  label: string;
  /**
   * Current message value
   */
  value: string;
  /**
   * Callback when value changes
   */
  onChange: (value: string) => void;
  /**
   * Help text explaining the field's purpose
   */
  caption?: string;
  /**
   * Number of rows for the textarea
   */
  rows?: number;
  /**
   * Placeholder text
   */
  placeholder?: string;
}

/**
 * MessageField Component
 *
 * Reusable field for editing banner messages.
 * Uses Primer's Textarea with FormControl for consistent styling.
 */
export default function MessageField({
  label,
  value,
  onChange,
  caption,
  rows = 3,
  placeholder,
}: MessageFieldProps) {
  return (
    <FormControl>
      <FormControl.Label>{label}</FormControl.Label>
      <Textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
        block
        placeholder={placeholder}
      />
      {caption && <FormControl.Caption>{caption}</FormControl.Caption>}
    </FormControl>
  );
}
