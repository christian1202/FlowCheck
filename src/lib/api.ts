import { hc } from 'hono/client';
import type { AppType } from '@/app/api/[[...route]]/route';

// We determine the origin based on whether we are in browser or server
// If in browser, use relative path, otherwise use absolute
const getBaseUrl = () => {
  if (typeof window !== 'undefined') return ''; // browser should use relative url
  if (process.env.NEXT_PUBLIC_APP_URL) return process.env.NEXT_PUBLIC_APP_URL;
  return 'http://localhost:3000';
};

export const api = hc<AppType>(getBaseUrl());
