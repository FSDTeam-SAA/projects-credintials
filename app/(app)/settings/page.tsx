"use client";

import { useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { CheckIcon, Loader2Icon, PaletteIcon, ShieldIcon, UserRoundIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCurrentUser } from "@/components/app/current-user";
import { RoleBadge } from "@/components/badges";
import { FormRow } from "@/components/form-row";
import { PageHeader } from "@/components/page-header";
import { PasswordInput } from "@/components/password-input";
import { PasswordStrength } from "@/components/password-strength";
import { THEMES, useMounted, useThemeSwitch } from "@/components/theme-toggle";
import { api } from "@/lib/api";
import { initials, shortDate } from "@/lib/format";
import { applyServerErrors } from "@/lib/hooks";
import { qk } from "@/lib/queries";
import type { User } from "@/lib/types";
import { cn } from "@/lib/utils";

type Tab = "profile" | "password" | "appearance";

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("profile");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title="Settings" description="Manage your account, security, and appearance." />
      <div className="grid animate-fade-up gap-5 rounded-xl border bg-card p-4 [animation-delay:60ms] md:grid-cols-[200px_minmax(0,1fr)] lg:p-5">
        <nav className="flex gap-1 overflow-x-auto rounded-lg bg-muted/40 p-1.5 scrollbar-thin md:min-h-[360px] md:flex-col md:p-2">
          <p className="hidden border-b border-brand/10 px-2 py-2 text-base font-medium text-title md:block">Account</p>
          <TabButton active={tab === "profile"} onClick={() => setTab("profile")} icon={<UserRoundIcon />}>
            Profile
          </TabButton>
          <TabButton active={tab === "password"} onClick={() => setTab("password")} icon={<ShieldIcon />}>
            Change Password
          </TabButton>
          <TabButton active={tab === "appearance"} onClick={() => setTab("appearance")} icon={<PaletteIcon />}>
            Appearance
          </TabButton>
        </nav>
        <div key={tab} className="animate-fade-up">
          {tab === "profile" ? <ProfileForm /> : tab === "password" ? <PasswordForm /> : <AppearancePanel />}
        </div>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, children }: { active: boolean; onClick: () => void; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center gap-2 rounded-md px-2.5 py-2 text-left text-sm whitespace-nowrap transition-all duration-200 md:py-1.5 [&_svg]:size-4",
        active ? "bg-brand-soft text-accent-foreground" : "text-subtitle hover:bg-muted hover:text-title",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

/** Miniature of the app shell, drawn in the given palette. */
function ThemePreview({ mode }: { mode: "light" | "dark" | "system" }) {
  const pane = (dark: boolean) => (
    <div className={cn("flex h-full flex-1 gap-1.5 p-2", dark ? "bg-[#161616]" : "bg-white")}>
      <div className={cn("flex w-1/3 flex-col gap-1 rounded-sm p-1", dark ? "bg-[#0f0f0f]" : "bg-[#f6f6f6]")}>
        <span className="h-1.5 w-full rounded-full bg-[#04b22f]" />
        <span className={cn("h-1.5 w-3/4 rounded-full", dark ? "bg-[#2c2c2c]" : "bg-[#e4e4e4]")} />
        <span className={cn("h-1.5 w-2/3 rounded-full", dark ? "bg-[#2c2c2c]" : "bg-[#e4e4e4]")} />
      </div>
      <div className="flex flex-1 flex-col gap-1">
        <span className={cn("h-2 w-2/3 rounded-full", dark ? "bg-[#e8e8e8]" : "bg-[#1e1e1e]")} />
        <span className={cn("h-6 w-full rounded-sm border", dark ? "border-[#2c2c2c] bg-[#1c1c1c]" : "border-[#e4e4e4] bg-white")} />
        <span className="h-1.5 w-1/3 rounded-full bg-[#febf00]" />
      </div>
    </div>
  );
  if (mode === "system") {
    return (
      <div className="flex h-20 overflow-hidden rounded-md border">
        <div className="w-1/2 overflow-hidden">{pane(false)}</div>
        <div className="w-1/2 overflow-hidden">{pane(true)}</div>
      </div>
    );
  }
  return <div className="flex h-20 overflow-hidden rounded-md border">{pane(mode === "dark")}</div>;
}

function AppearancePanel() {
  const mounted = useMounted();
  const { theme, change } = useThemeSwitch();

  return (
    <div className="flex flex-col gap-5">
      <div className="border-b pb-3">
        <h2 className="text-base font-semibold text-title">Appearance</h2>
        <p className="text-sm text-subtitle">Choose how SCALEUP looks on this device.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {THEMES.map(({ value, label, icon: Icon }, i) => {
          const active = mounted && theme === value;
          return (
            <button
              key={value}
              type="button"
              onClick={() => change(value)}
              style={{ "--i": i } as React.CSSProperties}
              className={cn(
                "stagger flex flex-col gap-3 rounded-xl border-2 p-3 text-left transition-all duration-200 hover:-translate-y-0.5",
                active ? "border-brand shadow-md shadow-brand/15" : "border-border hover:border-brand/40",
              )}
            >
              <ThemePreview mode={value} />
              <span className="flex items-center gap-2 text-sm font-medium text-title">
                <Icon className="size-4" /> {label}
                {active && <CheckIcon className="ml-auto size-4 animate-pop text-brand" />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

const profileSchema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  avatarUrl: z.string().trim().refine((v) => !v || /^https?:\/\//.test(v), "Must be an http(s) URL"),
});

function ProfileForm() {
  const user = useCurrentUser();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<z.infer<typeof profileSchema>>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: user.name, avatarUrl: user.avatarUrl ?? "" },
  });
  const avatarUrl = useWatch({ control, name: "avatarUrl" });

  async function onSubmit(values: z.infer<typeof profileSchema>) {
    try {
      const { user: updated } = await api.patch<{ user: User }>("/me", values);
      queryClient.setQueryData(qk.me, updated);
      reset({ name: updated.name, avatarUrl: updated.avatarUrl ?? "" });
      toast.success("Profile updated");
    } catch (err) {
      applyServerErrors(err, setError);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <h2 className="border-b pb-3 text-base font-semibold text-title">Profile</h2>
      <div className="flex items-center gap-4">
        <Avatar className="size-16 border-2 border-brand">
          {avatarUrl && <AvatarImage src={avatarUrl} alt={user.name} />}
          <AvatarFallback className="bg-brand-soft text-lg font-semibold text-brand">{initials(user.name)}</AvatarFallback>
        </Avatar>
        <div className="flex flex-col gap-1">
          <span className="text-lg font-medium text-title">{user.name}</span>
          <div className="flex items-center gap-2 text-sm text-subtitle">
            <RoleBadge role={user.role} className="px-2 py-0.5 text-xs" /> Member since {shortDate(user.createdAt)}
          </div>
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <FormRow label="Name" htmlFor="s-name" error={errors.name?.message} labelClassName="text-sm">
          <Input id="s-name" className="bg-brand-soft" {...register("name")} />
        </FormRow>
        <FormRow label="Employee ID" labelClassName="text-sm">
          <Input value={user.employeeId} disabled className="bg-brand-soft" />
        </FormRow>
        <FormRow label="Email" labelClassName="text-sm" hint="Ask an admin to change your email.">
          <Input value={user.email} disabled className="bg-brand-soft" />
        </FormRow>
        <FormRow label="Avatar URL" htmlFor="s-avatar" error={errors.avatarUrl?.message} labelClassName="text-sm">
          <Input id="s-avatar" placeholder="https://…" className="bg-brand-soft" {...register("avatarUrl")} />
        </FormRow>
      </div>
      <div className="border-t pt-4">
        <Button type="submit" disabled={isSubmitting || !isDirty}>
          {isSubmitting && <Loader2Icon className="animate-spin" />} Save Changes
        </Button>
      </div>
    </form>
  );
}

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });

function PasswordForm() {
  const {
    register,
    handleSubmit,
    setError,
    reset,
    control,
    formState: { errors, isSubmitting },
  } = useForm<z.infer<typeof passwordSchema>>({ resolver: zodResolver(passwordSchema) });

  const password = useWatch({ control, name: "password" });

  async function onSubmit(values: z.infer<typeof passwordSchema>) {
    try {
      await api.patch("/me/password", values);
      reset({ currentPassword: "", password: "", confirmPassword: "" });
      toast.success("Password changed", { description: "Other devices have been signed out." });
    } catch (err) {
      applyServerErrors(err, setError);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <h2 className="border-b pb-3 text-base font-semibold text-title">Change Password</h2>
      <FormRow label="Current Password" htmlFor="p-current" error={errors.currentPassword?.message} labelClassName="text-sm">
        <PasswordInput id="p-current" autoComplete="current-password" className="bg-brand-soft" {...register("currentPassword")} />
      </FormRow>
      <FormRow label="Password" htmlFor="p-new" error={errors.password?.message} labelClassName="text-sm">
        <PasswordInput id="p-new" autoComplete="new-password" className="bg-brand-soft" {...register("password")} />
        <PasswordStrength value={password ?? ""} />
      </FormRow>
      <FormRow label="Confirm Password" htmlFor="p-confirm" error={errors.confirmPassword?.message} labelClassName="text-sm">
        <PasswordInput id="p-confirm" autoComplete="new-password" className="bg-brand-soft" {...register("confirmPassword")} />
      </FormRow>
      <div className="border-t pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2Icon className="animate-spin" />} Save Changes
        </Button>
      </div>
    </form>
  );
}
