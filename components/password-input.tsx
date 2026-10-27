"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export function PasswordInput({ className, ...props }: Omit<React.ComponentProps<typeof Input>, "type">) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <Input type={show ? "text" : "password"} className={cn("pr-11", className)} {...props} />
      <button
        type="button"
        tabIndex={-1}
        onClick={() => setShow((s) => !s)}
        className="absolute inset-y-0 right-0 grid w-11 place-items-center text-muted-foreground transition-colors hover:text-foreground"
        aria-label={show ? "Hide password" : "Show password"}
      >
        <span key={String(show)} className="animate-pop">
          {show ? <EyeOffIcon className="size-4" /> : <EyeIcon className="size-4" />}
        </span>
      </button>
    </div>
  );
}
