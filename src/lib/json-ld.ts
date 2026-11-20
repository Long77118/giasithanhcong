/** JSON escaping alone does not prevent an HTML parser from closing a script. */
export function serializeJsonLd(data: Record<string, unknown>): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
