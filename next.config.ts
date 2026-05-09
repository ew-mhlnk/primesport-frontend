import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { hostname: 'api.api-tennis.com' },
      { hostname: 'primesport.online' },
      { hostname: 'www.primesport.online' },
      // Supabase Storage
      { hostname: 'ufreolzgexjgrpfbpynz.supabase.co' },
    ],
  },
};

export default nextConfig;