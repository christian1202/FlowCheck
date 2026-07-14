import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FlowCheck Admin',
    short_name: 'FlowCheck',
    description: 'Zero-config event check-in system',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#2563eb', // Blue-600
  };
}
