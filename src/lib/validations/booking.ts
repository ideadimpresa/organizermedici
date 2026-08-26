import { z } from "zod";

export const bookingSchema = z.object({
  doctorId: z.string().uuid(),
  serviceId: z.string().uuid(),
  addressId: z.string().uuid().nullable().optional(),
  mode: z.enum(["studio", "online"]),
  startsAt: z.string().datetime(),
  patient: z.object({
    fullName: z.string().min(2),
    email: z.string().email(),
    phone: z.string().min(6).optional().or(z.literal("")),
  }),
});

export type BookingInput = z.infer<typeof bookingSchema>;
