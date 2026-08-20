import { z } from "zod";
import { normalizeNigerianPhone } from "@/lib/format";

export const signUpSchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  businessName: z.string().trim().min(2, "Enter your business name."),
  email: z.string().trim().email("Enter a valid email address.").toLowerCase(),
  phone: z.string().trim().optional(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const loginSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").toLowerCase(),
  password: z.string().min(1, "Enter your password."),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email("Enter a valid email address.").toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

export const contactSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Name is required."),
  phone: z.string().trim().transform((value, ctx) => {
    const normalized = normalizeNigerianPhone(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "Enter a valid Nigerian phone number." });
      return z.NEVER;
    }
    return normalized;
  }),
  email: z.string().trim().email("Enter a valid email.").optional().or(z.literal("")),
  tags: z.string().trim().optional(),
  groupIds: z.array(z.string()).default([]),
});

export const groupSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Group name is required."),
  description: z.string().trim().optional(),
});

export const templateSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Template name is required."),
  body: z.string().trim().min(1, "Template body is required."),
});

export const senderIdSchema = z.object({
  name: z.string().trim().regex(/^[A-Za-z0-9]{3,11}$/, "Sender ID must be 3-11 alphanumeric characters.").transform((v) => v.toUpperCase()),
  industry: z.string().trim().optional(),
  website: z.string().trim().url("Enter a valid URL.").optional().or(z.literal("")),
  useCase: z.string().trim().min(10, "Describe how this sender ID will be used."),
});

export const sendSmsSchema = z.object({
  senderId: z.string().min(1, "Select a sender ID."),
  recipientPhone: z.string().trim().transform((value, ctx) => {
    const normalized = normalizeNigerianPhone(value);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "Enter a valid Nigerian phone number." });
      return z.NEVER;
    }
    return normalized;
  }),
  body: z.string().trim().min(1, "Message is required.").max(1600, "Message is too long."),
});

export const campaignSchema = z.object({
  id: z.string().optional(),
  name: z.string().trim().min(2, "Campaign name is required."),
  senderId: z.string().min(1, "Select a sender ID."),
  body: z.string().trim().min(1, "Message is required."),
  groupIds: z.array(z.string()).default([]),
  contactIds: z.array(z.string()).default([]),
  scheduledFor: z.string().optional(),
});
