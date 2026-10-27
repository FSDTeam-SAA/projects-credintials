"use client";

import { useState } from "react";
import { CheckIcon, CopyIcon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

export async function copyText(text: string, label = "Copied to clipboard") {
  try {
    await navigator.clipboard.writeText(text);
    toast.success(label);
    return true;
  } catch {
    toast.error("Could not access the clipboard");
    return false;
  }
}

export function CopyButton({
  value,
  label = "Copy",
  toastLabel,
  className,
  size = "icon-sm",
}: {
  value: string;
  label?: string;
  toastLabel?: string;
  className?: string;
  size?: "icon-sm" | "icon-xs" | "icon";
}) {
  const [copied, setCopied] = useState(false);

  async function onCopy() {
    if (await copyText(value, toastLabel)) {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    }
  }

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size={size}
          onClick={onCopy}
          disabled={!value}
          className={cn("text-muted-foreground hover:text-foreground", copied && "text-brand hover:text-brand", className)}
          aria-label={label}
        >
          <span key={String(copied)} className="animate-pop">
            {copied ? <CheckIcon /> : <CopyIcon />}
          </span>
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? "Copied!" : label}</TooltipContent>
    </Tooltip>
  );
}
