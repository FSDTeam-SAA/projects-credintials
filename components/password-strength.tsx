import { cn } from "@/lib/utils";

export function scorePassword(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[A-Z]/.test(pw) && /[a-z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return Math.min(4, score);
}

const labels = ["Too weak", "Weak", "Fair", "Good", "Strong"];
const colors = ["bg-destructive", "bg-destructive", "bg-warn", "bg-brand/70", "bg-brand"];

export function PasswordStrength({ value, className }: { value: string; className?: string }) {
  if (!value) return null;
  const score = scorePassword(value);
  return (
    <div className={cn("flex animate-fade-in items-center gap-3", className)}>
      <div className="flex flex-1 gap-1">
        {[0, 1, 2, 3].map((i) => (
          <span
            key={i}
            className={cn("h-1 flex-1 rounded-full bg-muted transition-colors duration-300", i < score && colors[score])}
          />
        ))}
      </div>
      <span className="w-16 text-right text-xs text-subtitle">{labels[score]}</span>
    </div>
  );
}
