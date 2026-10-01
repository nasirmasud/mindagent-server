import { z } from "zod";

// bcrypt silently ignores everything past 72 bytes, so a longer password is not
// stronger - it just looks stronger. Cap it rather than accept a truncated secret.
export const PASSWORD_MIN = 12;
export const PASSWORD_MAX = 72;

export const passwordSchema = z
  .string()
  .min(PASSWORD_MIN, `Password must be at least ${PASSWORD_MIN} characters`)
  .max(PASSWORD_MAX, `Password must be ${PASSWORD_MAX} characters or fewer`)
  .regex(/[a-z]/, "Password must include a lowercase letter")
  .regex(/[A-Z]/, "Password must include an uppercase letter")
  .regex(/[0-9]/, "Password must include a number")
  .regex(/[^A-Za-z0-9]/, "Password must include a symbol");

export const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: passwordSchema,
  avatar: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const googleSchema = z.object({
  credential: z.string().min(20),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  avatar: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: passwordSchema,
});
