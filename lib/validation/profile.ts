import { z } from "zod";

export const consultantProfileSchema = z.object({
  title: z.string().min(1),
  bio: z.string().min(1),
  expertise: z.array(z.string()).min(1),
  languages: z.array(z.string()).min(1),
  location: z.string().optional(),
  photoUrl: z.string().url().optional(),
});

export type ConsultantProfileInput = z.infer<typeof consultantProfileSchema>;

export const organizationProfileSchema = z.object({
  industry: z.string().min(1),
  description: z.string().min(1),
  location: z.string().optional(),
  logoUrl: z.string().url().optional(),
});

export type OrganizationProfileInput = z.infer<
  typeof organizationProfileSchema
>;
