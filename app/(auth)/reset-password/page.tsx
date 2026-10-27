"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormRow } from "@/components/form-row";
import { PasswordInput } from "@/components/password-input";
import { PasswordStrength } from "@/components/password-strength";
import { api } from "@/lib/api";
import { applyServerErrors } from "@/lib/hooks";
import { RESET_TOKEN_KEY } from "../verify-otp/verify-otp-form";

const schema = z
  .object({
    password: z.string().min(8, "Use at least 8 characters"),
    confirmPassword: z.string().min(1, "Confirm your password"),
  })
  .refine((v) => v.password === v.confirmPassword, { path: ["confirmPassword"], message: "Passwords do not match" });
type Values = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    control,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  const password = useWatch({ control, name: "password" });

  useEffect(() => {
    if (!sessionStorage.getItem(RESET_TOKEN_KEY)) router.replace("/forgot-password");
  }, [router]);

  async function onSubmit(values: Values) {
    try {
      await api.post("/auth/reset-password", { ...values, resetToken: sessionStorage.getItem(RESET_TOKEN_KEY) });
      sessionStorage.removeItem(RESET_TOKEN_KEY);
      toast.success("Password updated. You can log in now.");
      router.replace("/login");
    } catch (err) {
      applyServerErrors(err, setError);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex w-full max-w-[570px] flex-col gap-8">
      <div className="space-y-2 text-center">
        <h1 className="text-2xl font-bold text-title">Reset Password</h1>
        <p className="text-base text-subtitle">Choose a new password for your account</p>
      </div>
      <div className="flex flex-col gap-4">
        <FormRow label="New Password" htmlFor="password" error={errors.password?.message}>
          <PasswordInput id="password" autoComplete="new-password" placeholder="New password" aria-invalid={!!errors.password} {...register("password")} />
          <PasswordStrength value={password ?? ""} />
        </FormRow>
        <FormRow label="Confirm Password" htmlFor="confirmPassword" error={errors.confirmPassword?.message}>
          <PasswordInput id="confirmPassword" autoComplete="new-password" placeholder="Confirm password" aria-invalid={!!errors.confirmPassword} {...register("confirmPassword")} />
        </FormRow>
      </div>
      <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
        {isSubmitting && <Loader2Icon className="animate-spin" />}
        Update Password
      </Button>
    </form>
  );
}
