import { Suspense } from "react";
import type { Metadata } from "next";
import { VerifyOtpForm } from "./verify-otp-form";

export const metadata: Metadata = { title: "Enter OTP" };

export default function VerifyOtpPage() {
  return (
    <Suspense>
      <VerifyOtpForm />
    </Suspense>
  );
}
