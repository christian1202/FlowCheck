import { z } from 'zod';

export const registrationSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long').trim(),
  email: z.string().email('Please enter a valid email address').toLowerCase().trim(),
  local: z.string().min(2, 'Local must be at least 2 characters').max(100, 'Local is too long').trim(),
  district: z.string().min(2, 'District must be at least 2 characters').max(100, 'District is too long').trim(),
  zone: z.string().min(1, 'Zone is required').max(100, 'Zone is too long').trim(),
  duty: z.string().min(2, 'Duty is required').max(100, 'Duty is too long').trim(),
});

export type RegistrationInput = z.infer<typeof registrationSchema>;
