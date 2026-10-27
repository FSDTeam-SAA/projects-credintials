"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { api, errorMessage } from "@/lib/api";
import { cn } from "@/lib/utils";

export const RESET_TOKEN_KEY = "pm_reset_token";
const RESEND_SECONDS = 60;

export function VerifyOtpForm() {
  const router = useRouter();
  const email = useSearchParams().get("email") ?? "";
  const [otp, setOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [cooldown, setCooldown] = useState(RESEND_SECONDS);

  useEffect(() => {
    if (!email) router.replace("/forgot-password");
  }, [email, router]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function verify(code = otp) {
    if (code.length !== 6) return setError("Enter the 6 digit code");
    setBusy(true);
    setError("");
    try {
      const { resetToken } = await api.post<{ resetToken: string }>("/auth/verify-otp", { email, otp: code });
      sessionStorage.setItem(RESET_TOKEN_KEY, resetToken);
      router.push("/reset-password");
    } catch (err) {
      setError(errorMessage(err));
      setOtp("");
    } finally {
      setBusy(false);
    }
  }

  async function resend() {
    try {
      await api.post("/auth/forgot-password", { email });
      toast.success("A new code has been sent");
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      toast.error(errorMessage(err));
    }
  }

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        verify();
      }}
      className="flex w-full max-w-[570px] flex-col items-center gap-8"
    >
      <div className="space-y-2 text-center">
        <h1 className="text-xl font-medium text-title">Enter OTP</h1>
        {email && (
          <p className="text-sm text-subtitle">
            We sent a 6 digit code to <span className="font-medium text-title">{email}</span>
          </p>
        )}
      </div>

      <div className={cn(error && "animate-[shake_0.35s_ease-in-out]")} key={error}>
        <InputOTP
          maxLength={6}
          value={otp}
          onChange={(v) => {
            setOtp(v.replace(/\D/g, ""));
            setError("");
          }}
          onComplete={(v: string) => verify(v)}
          autoFocus
          inputMode="numeric"
        >
          <InputOTPGroup className="gap-3 md:gap-7">
            {Array.from({ length: 6 }, (_, i) => (
              <InputOTPSlot
                key={i}
                index={i}
                className="size-12 rounded-md border! border-border text-2xl text-title transition-all data-[active=true]:border-brand! data-[active=true]:ring-brand/20 md:size-[70px] md:text-3xl"
              />
            ))}
          </InputOTPGroup>
        </InputOTP>
      </div>

      {error && <p className="-mt-4 animate-fade-in text-sm text-destructive">{error}</p>}

      <p className="-mt-2 text-base text-title">
        Didn&apos;t Receive OTP?{" "}
        <button
          type="button"
          disabled={cooldown > 0}
          onClick={resend}
          className="font-medium text-warn transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {cooldown > 0 ? `Resend in ${cooldown}s` : "RESEND OTP"}
        </button>
      </p>

      <Button type="submit" size="lg" disabled={busy || otp.length !== 6} className="w-full">
        {busy && <Loader2Icon className="animate-spin" />}
        Verify
      </Button>
    </form>
  );
}
