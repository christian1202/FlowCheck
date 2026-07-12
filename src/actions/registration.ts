'use server';

import { registerAttendee } from '@/data/registration';
import { registrationSchema } from '@/lib/validators/registration';

export async function submitRegistrationAction(eventId: string, formData: FormData) {
  const rawData = {
    name: formData.get('name'),
    email: formData.get('email'),
    local: formData.get('local'),
    district: formData.get('district'),
    zone: formData.get('zone'),
    duty: formData.get('duty'),
  };

  const validated = registrationSchema.safeParse(rawData);
  if (!validated.success) {
    return { error: validated.error.flatten().fieldErrors };
  }

  try {
    const result = await registerAttendee(validated.data, eventId);
    
    if (!result.success) {
      return { error: { form: [result.error] } };
    }

    return { 
      success: true, 
      queuedEmail: result.queuedEmail 
    };
  } catch (err: any) {
    console.error('Registration Action Error:', err);
    return { error: { form: ['An unexpected error occurred during registration.'] } };
  }
}
