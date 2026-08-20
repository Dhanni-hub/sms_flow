import Link from "next/link";
import { signUpAction } from "@/app/actions/auth";
import { ActionForm } from "@/components/action-form";
import { Input, Label } from "@/components/ui/input";

export default function SignUpPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Create your SMSFlow account</h1>
      <p className="mt-1 text-sm text-[var(--text-secondary)]">Your workspace starts empty and uses persistent database records.</p>
      <ActionForm action={signUpAction} submitLabel="Create account" className="mt-6 space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" autoComplete="name" required />
        </div>
        <div>
          <Label htmlFor="businessName">Business name</Label>
          <Input id="businessName" name="businessName" required />
        </div>
        <div>
          <Label htmlFor="email">Email</Label>
          <Input id="email" name="email" type="email" autoComplete="email" required />
        </div>
        <div>
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" name="phone" autoComplete="tel" />
        </div>
        <div>
          <Label htmlFor="password">Password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required />
        </div>
      </ActionForm>
      <p className="mt-5 text-sm text-[var(--text-secondary)]">
        Already have an account? <Link href="/login" className="text-[var(--brand)] hover:underline">Log in</Link>
      </p>
    </>
  );
}
