"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2Icon, Loader2Icon, SettingsIcon, TrendingUpIcon } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FormRow } from "@/components/form-row";
import { PasswordInput } from "@/components/password-input";
import { api } from "@/lib/api";
import { applyServerErrors } from "@/lib/hooks";
import { cn } from "@/lib/utils";

const schema = z
  .object({
    role: z.enum(["sales", "operation"], { message: "Select a role" }),
    name: z.string().trim().min(2, "Name is required"),
    employeeId: z.string().trim().min(1, "Employee ID is required"),
    email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });
type Values = z.infer<typeof schema>;

const roles = [
  { value: "sales", title: "Sales", body: "Manage clients, leads and project proposals.", icon: TrendingUpIcon },
  { value: "operation", title: "Operations", body: "Coordinate project delivery and resources.", icon: SettingsIcon },
] as const;

export default function RegisterPage() {
  const router = useRouter();
  const [done, setDone] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { role: "operation" } });

  async function onSubmit(values: Values) {
    try {
      await api.post("/auth/register", values);
      setDone(true);
    } catch (err) {
      applyServerErrors(err, setError);
    }
  }

  if (done) {
    return (
      <div className="flex w-full max-w-[496px] animate-pop flex-col items-center gap-5 rounded-2xl border bg-card p-8 text-center shadow-sm">
        <div className="grid size-16 place-items-center rounded-full bg-brand-soft text-brand">
          <CheckCircle2Icon className="size-8" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold text-title">Registration submitted</h1>
          <p className="text-subtitle">
            An admin will review your account. You&apos;ll be able to log in as soon as it&apos;s approved.
          </p>
        </div>
        <Button size="lg" className="w-full" onClick={() => router.push("/login")}>
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex w-full max-w-[1000px] flex-col gap-6">
      <h1 className="text-2xl font-medium text-title md:text-[28px]">Users Registration</h1>

      <section className="space-y-3">
        <h2 className="text-lg font-medium text-title">Select The Role</h2>
        <Controller
          control={control}
          name="role"
          render={({ field }) => (
            <div role="radiogroup" className="grid gap-3 sm:grid-cols-2 md:flex">
              {roles.map((r, i) => {
                const active = field.value === r.value;
                const Icon = r.icon;
                return (
                  <button
                    key={r.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => field.onChange(r.value)}
                    style={{ "--i": i } as React.CSSProperties}
                    className={cn(
                      "stagger relative flex items-start gap-3 rounded-lg border p-3 pr-8 text-left transition-all duration-300 md:w-[300px]",
                      active
                        ? "border-warn bg-brand text-white shadow-lg shadow-brand/20"
                        : "border-warn bg-background hover:-translate-y-0.5 hover:shadow-md",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-10 shrink-0 place-items-center rounded-md transition-colors",
                        active ? "bg-white text-warn" : "bg-muted text-warn",
                      )}
                    >
                      <Icon className="size-4" />
                    </span>
                    <span className="space-y-0.5">
                      <span className="block text-lg font-medium">{r.title}</span>
                      <span className={cn("block text-sm", active ? "text-white/90" : "text-subtitle")}>{r.body}</span>
                    </span>
                    <span
                      className={cn(
                        "absolute top-3 right-3 grid size-4 place-items-center rounded-full border transition-all",
                        active ? "border-white bg-white" : "border-warn",
                      )}
                    >
                      {active && <span className="size-2 animate-pop rounded-full bg-brand" />}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        />
        {errors.role && <p className="text-sm text-destructive">{errors.role.message}</p>}
      </section>

      <section className="space-y-5 rounded-lg border bg-card p-4 shadow-surface md:p-6">
        <h2 className="text-lg font-medium text-title">User Information</h2>
        <FormRow label="Name" htmlFor="name" error={errors.name?.message} labelClassName="text-sm">
          <Input id="name" placeholder="Your full name" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
        </FormRow>
        <FormRow label="Employee ID" htmlFor="employeeId" error={errors.employeeId?.message} labelClassName="text-sm">
          <Input id="employeeId" placeholder="e.g. 17329" aria-invalid={!!errors.employeeId} {...register("employeeId")} />
        </FormRow>
        <FormRow label="Email" htmlFor="email" error={errors.email?.message} labelClassName="text-sm">
          <Input id="email" type="email" placeholder="you@company.com" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
        </FormRow>
        <FormRow label="Password" htmlFor="password" error={errors.password?.message} labelClassName="text-sm">
          <PasswordInput id="password" autoComplete="new-password" placeholder="At least 8 characters" aria-invalid={!!errors.password} {...register("password")} />
        </FormRow>
        <FormRow label="Confirm Password" htmlFor="confirmPassword" error={errors.confirmPassword?.message} labelClassName="text-sm">
          <PasswordInput id="confirmPassword" autoComplete="new-password" placeholder="Repeat password" aria-invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
        </FormRow>

        <div className="flex flex-col gap-3 pt-1 sm:flex-row">
          <Button type="submit" disabled={isSubmitting} className="h-11 sm:w-[220px]">
            {isSubmitting && <Loader2Icon className="animate-spin" />}
            Save
          </Button>
          <Button type="button" variant="outline-warn" className="h-11 sm:w-[220px]" asChild>
            <Link href="/login">Cancel</Link>
          </Button>
        </div>
      </section>
    </form>
  );
}
