import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { withPayload } from '@payloadcms/next/withPayload';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const workersBuild = process.env.DEPLOY_TARGET === 'cloudflare';

/** @type {import('next').NextConfig} */
const nextConfig = {
  ...(workersBuild ? { output: 'standalone' } : {}),
  env: { CLOUDFLARE_BUILD_TARGET: workersBuild ? 'true' : 'false' },
  serverExternalPackages: ['jose', 'pg-cloudflare'],
  images: {
    // Sharp is native Node code. Trial Workers serve originals through the R2 adapter.
    unoptimized: workersBuild,
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
      {
        pathname: '/images/**',
      },
    ],
  },
  headers: async () => workersBuild ? [{
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
