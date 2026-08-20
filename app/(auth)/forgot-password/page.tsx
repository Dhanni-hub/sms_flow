import Link from "next/link";
import { forgotPasswordAction } from "@/app/actions/auth";
import { ActionForm } from "@/components/action-form";
import { Input, Label } from "@/components/ui/input";

export default function ForgotPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Reset your password</h1>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">In local development, the reset token is shown after submission.</p>
      <ActionForm action={forgotPasswordAction} submitLabel="Create reset token" className="mt-6 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
      </ActionForm>
      <p className="mt-5 text-sm"><Link href="/login" className="text-[var(--brand)] hover:underline">Back to login</Link></p>
    </>
  );
}
