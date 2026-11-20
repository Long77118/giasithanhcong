import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withPayload } from '@payloadcms/next/withPayload';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const workersBuild = process.env.DEPLOY_TARGET === 'cloudflare';
const renderStaging = process.env.RENDER === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(workersBuild ? { output: 'standalone' } : {}),
  env: { CLOUDFLARE_BUILD_TARGET: workersBuild ? 'true' : 'false' },
  serverExternalPackages: ['jose', 'pg-cloudflare', ...(renderStaging ? ['@payloadcms/storage-s3'] : [])],
  images: {
    // Serve the existing CMS image variants to avoid resizing on a Free Render instance.
    unoptimized: workersBuild || renderStaging,
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
      {
        pathname: '/images/**',
      },
    ],
  },
  headers: async () => workersBuild || renderStaging ? [{
    source: '/:path*',
    headers: [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive' }],
  }] : [],
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...(config.resolve.alias || {}),
      '@': path.resolve(dirname, 'src'),
      '@payload-config': path.resolve(dirname, 'src/payload.config.ts'),
    };
    return config;
  },
};

export default withPayload(nextConfig, { devBundleServerPackages: false });
