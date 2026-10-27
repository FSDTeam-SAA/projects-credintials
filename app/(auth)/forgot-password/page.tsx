"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, Loader2Icon, MailIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { FormRow, IconInput } from "@/components/form-row";
import { api } from "@/lib/api";
import { applyServerErrors } from "@/lib/hooks";

const schema = z.object({ email: z.string().trim().min(1, "Email is required").email("Enter a valid email") });
type Values = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema) });

  async function onSubmit({ email }: Values) {
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("If that email is registered, a 6 digit code is on its way.");
      router.push(`/verify-otp?email=${encodeURIComponent(email)}`);
    } catch (err) {
      applyServerErrors(err, setError);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex w-full max-w-[496px] flex-col gap-8">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-title">Forgot Password</h1>
        <p className="text-lg text-faint">Enter your email and we&apos;ll send you a code to reset your password</p>
      </div>
      <FormRow label="Email" htmlFor="email" error={errors.email?.message}>
        <IconInput id="email" type="email" placeholder="Email" autoComplete="email" icon={<MailIcon />} aria-invalid={!!errors.email} {...register("email")} />
      </FormRow>
      <div className="flex flex-col gap-4">
        <Button type="submit" size="lg" disabled={isSubmitting} className="w-full">
          {isSubmitting && <Loader2Icon className="animate-spin" />}
          Send Code
        </Button>
        <Link href="/login" className="group inline-flex items-center justify-center gap-1.5 text-subtitle transition-colors hover:text-title">
          <ArrowLeftIcon className="size-4 transition-transform group-hover:-translate-x-0.5" /> Back to login
        </Link>
      </div>
    </form>
  );
}
