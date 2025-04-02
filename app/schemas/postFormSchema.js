import { z } from "zod";

export const PostFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  message: z.string().min(1, "Message is required"),
  date: z.string().optional().or(z.literal("")),
  startTime: z.string().optional().or(z.literal("")),
  endTime: z.string().optional().or(z.literal("")),
  beginnerClinic: z
    .object({
      beginnerClinicOffered: z.boolean().default(false),
      beginnerClinicStartTime: z
        .string()
        .optional()
        .or(z.literal(""))
        .or(z.null()),
      beginnerClinicEndTime: z
        .string()
        .optional()
        .or(z.literal(""))
        .or(z.null()),
      beginnerClinicMessage: z.string().optional().or(z.literal("")),
      beginnerClinicCourts: z.string().optional().or(z.literal("")),
    })
    .optional(),
  courts: z.string().optional().or(z.literal("")),
  buttonOption1: z.string().optional().or(z.literal("")),
  buttonOption2: z.string().optional().or(z.literal("")),
  includeButton: z.boolean().default(false),
});
