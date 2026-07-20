import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(6),
  avatar: z.string().optional(),
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const googleSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  googleId: z.string().min(1),
  avatar: z.string().optional(),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(50).optional(),
  avatar: z.string().optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(6),
});
