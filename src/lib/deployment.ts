export function isCloudflareTarget(env: Record<string, string | undefined> = process.env): boolean {
  return env.DEPLOY_TARGET === 'cloudflare';
}

export function isCloudflareRuntime(env: Record<string, string | undefined> = process.env): boolean {
  return isCloudflareTarget(env) && env.CLOUDFLARE_BUILD !== 'true';
}

export function isRenderStaging(env: Record<string, string | undefined> = process.env): boolean {
  return env.RENDER === 'true';
}
