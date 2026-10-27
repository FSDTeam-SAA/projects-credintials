"use client";

import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon, WandSparklesIcon } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FormRow } from "@/components/form-row";
import { CopyButton } from "@/components/copy-button";
import { api } from "@/lib/api";
import { generatePassword } from "@/lib/credentials";
import { applyServerErrors } from "@/lib/hooks";

const schema = z.object({
  name: z.string().trim().min(2, "Name is required"),
  employeeId: z.string().trim().min(1, "Employee ID is required"),
  email: z.string().trim().min(1, "Email is required").email("Enter a valid email"),
  role: z.enum(["operation", "sales", "admin"]),
  password: z.string().min(8, "Use at least 8 characters"),
});
type Values = z.infer<typeof schema>;

export function AddUserDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: () => void }) {
  const {
    register,
    control,
    handleSubmit,
    setValue,
    setError,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { role: "operation", password: "" } });

  const password = useWatch({ control, name: "password" });

  async function onSubmit(values: Values) {
    try {
      await api.post("/users", values);
      toast.success(`${values.name} added`, { description: "Share the password with them securely; they can change it in Settings." });
      onCreated();
      reset();
      onOpenChange(false);
    } catch (err) {
      applyServerErrors(err, setError);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-lg">Add User</DialogTitle>
          <DialogDescription>Accounts created here are approved immediately.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <FormRow label="Name" htmlFor="u-name" error={errors.name?.message} labelClassName="text-sm">
              <Input id="u-name" {...register("name")} />
            </FormRow>
            <FormRow label="Employee ID" htmlFor="u-eid" error={errors.employeeId?.message} labelClassName="text-sm">
              <Input id="u-eid" {...register("employeeId")} />
            </FormRow>
          </div>
          <FormRow label="Email" htmlFor="u-email" error={errors.email?.message} labelClassName="text-sm">
            <Input id="u-email" type="email" {...register("email")} />
          </FormRow>
          <FormRow label="Role" error={errors.role?.message} labelClassName="text-sm">
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="operation">Operation</SelectItem>
                    <SelectItem value="sales">Sales</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </FormRow>
          <FormRow
            label="Temporary password"
            htmlFor="u-pass"
            error={errors.password?.message}
            labelClassName="text-sm"
            action={
              <Button type="button" variant="ghost" size="xs" onClick={() => setValue("password", generatePassword(14), { shouldValidate: true })}>
                <WandSparklesIcon /> Generate
              </Button>
            }
          >
            <div className="relative">
              <Input id="u-pass" autoComplete="new-password" className="pr-10 font-mono" {...register("password")} />
              <CopyButton value={password} size="icon-xs" className="absolute top-1/2 right-2 -translate-y-1/2" />
            </div>
          </FormRow>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline-warn" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2Icon className="animate-spin" />} Add User
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
