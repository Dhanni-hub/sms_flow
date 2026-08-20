import Link from "next/link";
import { loginAction } from "@/app/actions/auth";
import { ActionForm } from "@/components/action-form";
import { Input, Label } from "@/components/ui/input";

export default function LoginPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Log in to SMSFlow</h1>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">Access your business SMS workspace.</p>
      <ActionForm action={loginAction} submitLabel="Log in" className="mt-6 space-y-4">
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="current-password" required />
        </div>
      </ActionForm>
      <div className="mt-5 flex items-center justify-between text-sm">
        <Link href="/forgot-password" className="text-[var(--brand)] hover:underline">Forgot password?</Link>
        <Link href="/signup" className="text-[var(--brand)] hover:underline">Create account</Link>
      </div>
    </>
  );
}
