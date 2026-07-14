'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

export default function RegistrationFormHono({ eventId }: { eventId: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);

  const fetchEvent = async () => {
    setLoading(true);
    try {
      const res = await api.api.events[':id'].$get({
        param: { id: eventId }
      });
      if (res.ok) {
        const json = await res.json();
        setData(json);
      } else {
        console.error('Failed to fetch event');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 border rounded-lg space-y-4">
      <h3 className="font-semibold text-lg">Hono RPC Example</h3>
      <button 
        onClick={fetchEvent}
        disabled={loading}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
      >
        {loading ? 'Fetching...' : 'Fetch Event via Hono'}
      </button>

      {data && (
        <pre className="p-2 bg-gray-100 rounded text-sm overflow-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      )}
    </div>
  );
}
