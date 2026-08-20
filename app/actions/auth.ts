"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/db";
import { createSession, destroySession } from "@/lib/auth";
import { createToken, hashPassword, hashToken, verifyPassword } from "@/lib/security";
import { forgotPasswordSchema, loginSchema, resetPasswordSchema, signUpSchema } from "@/lib/validation";

export interface ActionState {
  error?: string;
  success?: string;
}

function slugify(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48) || "business";
}

async function uniqueBusinessSlug(name: string) {
  const base = slugify(name);
  let slug = base;
  let i = 2;
  while (await prisma.business.findUnique({ where: { slug } })) {
    slug = `${base}-${i++}`;
  }
  return slug;
}

export async function signUpAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = signUpSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details." };

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (existing) return { error: "An account already exists for this email." };

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email,
      phone: parsed.data.phone || null,
      passwordHash: hashPassword(parsed.data.password),
      business: {
        create: {
          name: parsed.data.businessName,
          slug: await uniqueBusinessSlug(parsed.data.businessName),
          wallet: { create: {} },
        },
      },
    },
  });

  await createSession(user.id);
  redirect("/dashboard");
}

export async function loginAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details." };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user || !verifyPassword(parsed.data.password, user.passwordHash)) {
    return { error: "Invalid email or password." };
  }

  await createSession(user.id);
  redirect("/dashboard");
}

export async function logoutAction() {
  await destroySession();
  redirect("/login");
}

export async function forgotPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = forgotPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Enter your email." };

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!user) return { success: "If the email exists, a reset link has been created." };

  const token = createToken();
  await prisma.passwordResetToken.create({
    data: {
      tokenHash: hashToken(token),
      userId: user.id,
      expiresAt: new Date(Date.now() + 30 * 60 * 1000),
    },
  });

  return {
    success: `Password reset token created for local development: ${token}`,
  };
}

export async function resetPasswordAction(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = resetPasswordSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check your details." };

  const reset = await prisma.passwordResetToken.findUnique({ where: { tokenHash: hashToken(parsed.data.token) } });
  if (!reset || reset.usedAt || reset.expiresAt <= new Date()) return { error: "Reset link is invalid or expired." };

  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { passwordHash: hashPassword(parsed.data.password) } }),
    prisma.passwordResetToken.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    prisma.session.deleteMany({ where: { userId: reset.userId } }),
  ]);

  redirect("/login");
}
