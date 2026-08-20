import { resetPasswordAction } from "@/app/actions/auth";
import { ActionForm } from "@/components/action-form";
import { Input, Label } from "@/components/ui/input";

export default function ResetPasswordPage() {
  return (
    <>
      <h1 className="text-2xl font-semibold">Set a new password</h1>
      <ActionForm action={resetPasswordAction} submitLabel="Reset password" className="mt-6 space-y-4">
        <div>
          <Label htmlFor="token">Reset token</Label>
          <Input id="token" name="token" required />
        </div>
        <div>
          <Label htmlFor="password">New password</Label>
          <Input id="password" name="password" type="password" autoComplete="new-password" required />
        </div>
      </ActionForm>
    </>
  );
}
