import { z } from 'zod';
import { eventStatusEnum } from '../db/schema';

// We extract the enum values from the Drizzle schema enum definition
const eventStatuses = eventStatusEnum.enumValues;

export const createEventSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100, 'Title is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  date: z.coerce.date({
    required_error: 'Please select a date and time',
    invalid_type_error: 'That is not a valid date',
  }),
  location: z.string().max(200, 'Location is too long').optional(),
  maxAttendees: z.coerce.number().int().positive('Must be a positive number').optional().nullable(),
});

export type CreateEventInput = z.infer<typeof createEventSchema>;

export const updateEventSchema = createEventSchema.partial().extend({
  status: z.enum(eventStatuses).optional(),
});

export type UpdateEventInput = z.infer<typeof updateEventSchema>;
