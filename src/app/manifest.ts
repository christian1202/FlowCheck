import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'FlowCheck Admin',
    short_name: 'FlowCheck',
    description: 'Zero-config event check-in system',
    start_url: '/events',
    display: 'standalone',
    background_color: '#0b0c10',
    theme_color: '#f59e0b',
    icons: [
      {
        src: '/images/flowchecklogo-final-bg-white-big.png',
        sizes: 'any',
        type: 'image/png',
      },
    ],
  };
}
