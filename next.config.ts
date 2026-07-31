import type { NextConfig } from 'next';
import withSerwistInit from '@serwist/next';

const withSerwist = withSerwistInit({
  swSrc: 'src/app/sw.ts',
  swDest: 'public/sw.js',
  disable: process.env.NODE_ENV !== 'production',
});

const nextConfig: NextConfig = {
  // Your Next.js config
  reactStrictMode: true,
  reactCompiler: true,
  turbopack: {},
  images: {
    formats: ['image/avif', 'image/webp'],
  },
};

export default withSerwist(nextConfig);
