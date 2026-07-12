import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
});

const nextConfig: NextConfig = {
  // Your Next.js config
  reactStrictMode: true,
  // Ensure standalone output for OpenNext
  output: 'standalone',
};

export default withSerwist(nextConfig);
