import assert from 'node:assert/strict';
import test from 'node:test';
import { imageUploadConfig as config } from './image-upload-config';
import { defaultImageKind, formatImageBytes, hasImageAnimation, imageSourceError, mediaUploadError, imageTargetSize, imageUploadFilename,
  outputImageType, preferredImageType, preferCompressedImage, shouldCompressImage } from './image-upload';
import { createMediaUploadFetch, type UploadProgress } from './media-upload-transport';

test('resize preserves aspect ratio, never enlarges, and respects each use', () => {
  assert.deepEqual(imageTargetSize(6000, 4000, 'product'), { width: 2000, height: 1333 });
  assert.deepEqual(imageTargetSize(4000, 6000, 'editorial'), { width: 1067, height: 1600 });
  assert.deepEqual(imageTargetSize(600, 300, 'social'), { width: 600, height: 300 });
  assert.ok(imageTargetSize(6000, 4000, 'social').width >= 1200);
  assert.deepEqual(imageTargetSize(1300, 600, 'social'), { width: 1300, height: 600 });
  assert.throws(() => imageTargetSize(0, 100, 'product'));
});

test('source limit is inclusive at 20 MiB; empty, unsupported and oversized inputs fail', () => {
  assert.equal(imageSourceError(config.maxSourceBytes, 'image/jpeg'), null);
  assert.match(imageSourceError(config.maxSourceBytes + 1, 'image/jpeg')!, /20 MB/);
  assert.match(imageSourceError(0, 'image/png')!, /rỗng/);
  assert.ok(imageSourceError(2000, 'application/pdf'));
});

test('server rejects spoofed MIME, missing bytes and excluded formats without trusting the client', () => {
  const jpeg = new Uint8Array([255, 216, 255, 224]);
  assert.equal(mediaUploadError(4, 'image/jpeg', jpeg), null);
  assert.ok(mediaUploadError(4, 'image/png', jpeg));
  assert.ok(mediaUploadError(4, 'image/jpeg', new TextEncoder().encode('html')));
  assert.ok(mediaUploadError(4, 'image/jpeg'));
  assert.match(mediaUploadError(4, 'image/svg+xml', jpeg)!, /SVG\/GIF/);
  assert.match(mediaUploadError(config.maxSourceBytes + 1, 'image/jpeg', jpeg)!, /20 MB/);
});

test('small files, SVG, GIF and animation skip compression; larger output is rejected', () => {
  assert.equal(shouldCompressImage(config.smallFileBytes - 1, 'image/jpeg'), false);
  assert.equal(shouldCompressImage(config.smallFileBytes, 'image/jpeg'), true);
  for (const type of ['image/svg+xml', 'image/gif']) assert.equal(shouldCompressImage(500000, type), false);
  assert.equal(shouldCompressImage(500000, 'image/webp', true), false);
  assert.equal(preferCompressedImage(1000, 1001), false);
  assert.equal(preferCompressedImage(1000, 1000), false);
  assert.equal(preferCompressedImage(1000, 0), false);
  assert.equal(preferCompressedImage(1000, 700), true);
});

test('actual encoder type determines extension; JPEG fallback never destroys transparency', () => {
  assert.equal(outputImageType('image/webp', true), 'image/webp');
  assert.equal(outputImageType('image/png', false), 'image/jpeg');
  assert.equal(outputImageType('image/png', true), 'image/png');
  assert.equal(preferredImageType('image/jpeg', false, true), 'image/jpeg');
  assert.equal(preferredImageType('image/png', false, true), 'image/png');
  assert.equal(preferredImageType('image/avif', true, true), 'image/png');
  assert.equal(preferredImageType('image/jpeg', false, false), 'image/webp');
  assert.equal(imageUploadFilename('Ly giấy HAI lớp 350ml.PNG', 'image/webp'), 'ly-giay-hai-lop-350ml.webp');
  assert.equal(imageUploadFilename('../../ĐỒ HỌA.jpeg', 'image/png'), 'do-hoa.png');
  assert.equal(imageUploadFilename('图片.jpg', 'image/jpeg'), 'hinh-anh.jpg');
  assert.throws(() => imageUploadFilename('bad.txt', 'text/html'));
});

test('nested blog drawers default to editorial; reused library defaults conservatively', () => {
  assert.equal(defaultImageKind('/admin/collections/posts/12'), 'editorial');
  assert.equal(defaultImageKind('/admin/collections/products/12'), 'product');
  assert.equal(defaultImageKind('/admin/collections/media/create'), 'product');
});

test('byte labels do not turn tiny files into 0 KB', () => {
  assert.equal(formatImageBytes(291), '291 B');
  assert.equal(formatImageBytes(310 * 1024), '310 KB');
});

test('animated container markers are detected without flattening images', () => {
  const webp = new Uint8Array(24);
  webp.set(new TextEncoder().encode('ANIM'), 12);
  new DataView(webp.buffer).setUint32(16, 4, true);
  assert.equal(hasImageAnimation(webp, 'image/webp'), true);
  webp.set(new TextEncoder().encode('VP8 '), 12);
  assert.equal(hasImageAnimation(webp, 'image/webp'), false);
  const png = new Uint8Array(20);
  png.set(new TextEncoder().encode('acTL'), 12);
  assert.equal(hasImageAnimation(png, 'image/png'), true);
  assert.equal(hasImageAnimation(new Uint8Array(2), 'image/png'), false);
});

function form(file: File) {
  const body = new FormData();
  body.append('file', file);
  body.append('_payload', JSON.stringify({ alt: 'Tiếng Việt', caption: 'Giữ nguyên' }));
  body.append('repeated', 'a'); body.append('repeated', 'b');
  return body;
}

test('single/bulk transport serializes compression, retains data and isolates Documents', async () => {
  let running = 0;
  let peak = 0;
  const sent: { path: string; body: FormData }[] = [];
  const progress: UploadProgress[] = [];
  const wrapped = createMediaUploadFetch({
    origin: 'https://site.test', apiPath: '/api',
    baseFetch: async (input, init) => { sent.push({ path: String(input), body: init?.body as FormData }); return new Response('{}'); },
    optionsFor: () => ({ kind: 'editorial', highQuality: true }),
    compress: async (_file, options) => {
      running++; peak = Math.max(peak, running);
      assert.deepEqual(options, { kind: 'editorial', highQuality: true });
      await new Promise((resolve) => setTimeout(resolve, 5));
      running--;
      return { file: new File(['small'], 'anh.webp', { type: 'image/webp' }) };
    },
    onProgress: (value) => progress.push(value),
  });
  const bodies = [form(new File(['large'], 'a.jpg')), form(new File(['large'], 'b.jpg'))];
  await Promise.all(bodies.map((body, index) => wrapped(`/api/media${index ? '/12' : ''}?depth=0`, { method: index ? 'PATCH' : 'POST', body })));
  assert.equal(peak, 1);
  for (const { body } of sent) {
    assert.equal((body.get('file') as File).name, 'anh.webp');
    assert.deepEqual(body.getAll('repeated'), ['a', 'b']);
    assert.equal(body.get('_payload'), bodies[0].get('_payload'));
  }
  const pdf = form(new File(['pdf'], 'x.pdf'));
  await wrapped('/api/documents', { method: 'POST', body: pdf });
  await wrapped('https://other.test/api/media', { method: 'POST', body: pdf });
  assert.equal(sent[2].body, pdf); assert.equal(sent[3].body, pdf);
  assert.equal(progress.filter((item) => item.status === 'processing').length, 2);
});

test('failed job blocks network send but does not poison next upload; abort skips send', async () => {
  let sent = 0;
  const wrapped = createMediaUploadFetch({
    origin: 'https://site.test', apiPath: '/api', onProgress: () => {},
    optionsFor: () => ({ kind: 'product', highQuality: false }),
    baseFetch: async () => { sent++; return new Response('{}'); },
    compress: async (file) => { if (file.name === 'bad.jpg') throw new Error('Ảnh vượt quá 20 MB.'); return { file }; },
  });
  const bad = await wrapped('/api/media', { method: 'POST', body: form(new File(['bad'], 'bad.jpg')) });
  assert.equal(bad.status, 400); assert.equal(sent, 0);
  assert.match(await bad.text(), /20 MB/);
  await wrapped('/api/media', { method: 'POST', body: form(new File(['ok'], 'ok.jpg')) });
  assert.equal(sent, 1);
  const controller = new AbortController(); controller.abort();
  await assert.rejects(wrapped('/api/media', { method: 'POST', body: form(new File(['ok'], 'ok.jpg')), signal: controller.signal }));
  assert.equal(sent, 1);
});
