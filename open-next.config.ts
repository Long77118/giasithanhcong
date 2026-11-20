import { defineCloudflareConfig } from '@opennextjs/cloudflare';

// All public routes are SSR; trial CMS queries bypass persistent caching.
// No R2 cache bucket or cache Durable Objects are needed for this staging setup.
export default defineCloudflareConfig({});
