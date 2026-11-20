export const quoteBodyMaxBytes = 32 * 1024;

type QuoteJsonBody =
  | { status: 200; data: unknown }
  | { status: 400 | 413 };

export async function readQuoteJson(request: Pick<Request, 'body' | 'headers'>): Promise<QuoteJsonBody> {
  const contentLength = request.headers.get('content-length');
  if (contentLength !== null && Number(contentLength) > quoteBodyMaxBytes) return { status: 413 };
  if (!request.body) return { status: 400 };

  const reader = request.body.getReader();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  let size = 0;
  let input = '';
  try {
    for (;;) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > quoteBodyMaxBytes) {
        void reader.cancel().catch(() => {});
        return { status: 413 };
      }
      input += decoder.decode(chunk.value, { stream: true });
    }
    return { status: 200, data: JSON.parse(input + decoder.decode()) };
  } catch {
    void reader.cancel().catch(() => {});
    return { status: 400 };
  } finally {
    reader.releaseLock();
  }
}
