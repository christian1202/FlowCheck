import { notFound } from 'next/navigation';
import { getEventBySlug } from '@/data/events';
import RegistrationForm from './RegistrationForm';
import { Calendar, MapPin } from 'lucide-react';

export default async function RegisterPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEventBySlug(id);

  if (!event) {
    notFound();
  }

  if (event.status !== 'open') {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Registration Closed</h2>
          <p className="mt-2 text-sm text-gray-600">
            This event is currently not accepting registrations.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-xl">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Register for {event.title}
        </h2>
        
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center space-y-2 sm:space-y-0 sm:space-x-6 text-sm text-gray-500">
          <div className="flex items-center">
            <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
            {new Date(event.date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </div>
          {event.location && (
            <div className="flex items-center">
              <MapPin className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
              {event.location}
            </div>
          )}
        </div>
        
        {event.description && (
          <p className="mt-4 text-center text-sm text-gray-600 px-4">
            {event.description}
          </p>
        )}
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <RegistrationForm eventId={event.id} />
        </div>
      </div>
    </div>
  );
}
