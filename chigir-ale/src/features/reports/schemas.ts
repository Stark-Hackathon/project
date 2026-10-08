import { z } from "zod";

export const createReportSchema = z.object({
  categoryId: z.string().min(1, "Please select an infrastructure category"),
  title: z.string().min(3, "Title must be at least 3 characters").max(150, "Title is too long"),
  description: z
    .string()
    .min(10, "Please describe the problem with at least 10 characters")
    .max(3000, "Description cannot exceed 3000 characters"),
  severity: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).default("MEDIUM"),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  locationAccuracy: z.number().positive().optional(),
  formattedAddress: z.string().max(250).optional(),
  administrativeArea: z.string().max(100).optional(),
  mediaUrls: z.array(z.string()).max(5).optional(),
  idempotencyKey: z.string().max(128).optional(),
});

export type CreateReportFormData = z.infer<typeof createReportSchema>;
