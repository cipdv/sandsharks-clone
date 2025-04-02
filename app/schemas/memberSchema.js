import { z } from "zod";

export const MemberSchema = z.object({
  email: z.string().email().min(1, "Email is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  pronouns: z.string().min(1, "Pronouns are required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
  confirmPassword: z
    .string()
    .min(6, "Password must be at least 6 characters long")
    .superRefine(({ confirmPassword, password }, ctx) => {
      if (confirmPassword !== password) {
        ctx.addIssue({
          code: "custom",
          message: "The passwords did not match",
        });
      }
    }),
  about: z.string().optional(),
});

const emptyFileSchema = z.object({
  size: z.number().refine((size) => size === 0, {
    message: "File size must be 0",
  }),
  type: z.string().refine((type) => type === "application/octet-stream", {
    message: "File type must be 'application/octet-stream'",
  }),
  name: z.string().refine((name) => name === "undefined", {
    message: "File name must be 'undefined'",
  }),
  lastModified: z.number(),
});

const fileSchema = z
  .object({
    size: z.number(),
    type: z.string().refine((type) => type.startsWith("image/"), {
      message: "File must be an image",
    }),
    name: z.string(),
    lastModified: z.number(),
  })
  .or(emptyFileSchema)
  .optional();

export const MemberUpdateFormSchema = z.object({
  email: z.string().email().min(1, "Email is required"),
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  pronouns: z.string().min(1, "Pronouns are required"),
  about: z.string().optional(),
  profilePic: fileSchema.optional(),
});

export const loginSchema = z.object({
  email: z.string().email().min(1, "Email is required"),
  password: z.string().min(1, "Password is required"),
  rememberMe: z.boolean().optional(),
});
