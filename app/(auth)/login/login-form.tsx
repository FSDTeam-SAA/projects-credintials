"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2Icon, LockIcon, MailIcon } from "lucide-react";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormRow, IconInput } from "@/components/form-row";
import { PasswordInput } from "@/components/password-input";
import { api } from "@/lib/api";
import { applyServerErrors } from "@/lib/hooks";
import { qk } from "@/lib/queries";
import type { User } from "@/lib/types";

const schema = z.object({
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  password: z.string().min(1, "Password is required"),
});
type Values = z.infer<typeof schema>;

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const queryClient = useQueryClient();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit(values: Values) {
    try {
      const { user } = await api.post<{ user: User }>("/auth/login", values);
      queryClient.setQueryData(qk.me, user);
      const next = params.get("next");
      router.replace(next && next.startsWith("/") ? next : "/dashboard");
    } catch (err) {
      applyServerErrors(err, setError);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="flex w-full max-w-[496px] flex-col gap-8" noValidate>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-title">Login To Your Account</h1>
        <p className="text-lg text-faint">Please enter your email and password to continue</p>
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-4">
          <FormRow label="Email" htmlFor="email" error={errors.email?.message}>
            <IconInput
              id="email"
              type="email"
              autoComplete="email"
              placeholder="Email"
              icon={<MailIcon />}
              aria-invalid={!!errors.email}
              {...register("email")}
            />
          </FormRow>
          <FormRow label="Password" htmlFor="password" error={errors.password?.message}>
            <div className="group relative">
              <LockIcon className="pointer-events-none absolute top-1/2 left-3.5 z-10 size-5 -translate-y-1/2 text-muted-foreground transition-colors group-focus-within:text-brand" />
              <PasswordInput
                id="password"
                autoComplete="current-password"
                placeholder="Password"
                className="pl-11"
                aria-invalid={!!errors.password}
                {...register("password")}
              />
            </div>
          </FormRow>
        </div>

        <Link href="/forgot-password" className="self-end text-base text-warn transition-opacity hover:opacity-80">
          Forgot Password?
        </Link>

        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2Icon className="animate-spin" />}
          Login
        </Button>

        <p className="text-center text-base text-subtitle">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-medium text-brand hover:underline">
            Register Now.
          </Link>
        </p>
      </div>
    </form>
  );
}
