import test from 'node:test';
import assert from 'node:assert/strict';
import { getYouTubeID, youTubeEmbedUrl, youTubeThumbnailUrl } from './youtube';

const id = 'M7lc1UVf-VE';

test('YouTube URLs support watch, short links, shorts, live and privacy-enhanced embeds', () => {
  for (const url of [
    `https://www.youtube.com/watch?v=${id}&t=20`, `https://m.youtube.com/watch?v=${id}`,
    `https://youtu.be/${id}?si=share`, `https://youtube.com/shorts/${id}`,
    `https://www.youtube.com/live/${id}`, `https://youtube.com/embed/${id}`,
    `https://www.youtube-nocookie.com/embed/${id}`, `  https://youtu.be/${id}  `,
  ]) assert.equal(getYouTubeID(url), id, url);
});

test('YouTube validation rejects origin spoofing, credentials, arbitrary schemes and non-video URLs', () => {
  for (const url of [
    null, undefined, '', id, `//youtube.com/watch?v=${id}`, `javascript:alert(1)`,
    `https://youtube.com.evil.example/watch?v=${id}`, `https://evil.example/watch?v=${id}`,
    `https://youtube.com@evil.example/watch?v=${id}`, `https://user@youtube.com/watch?v=${id}`,
    `https://youtube.com:444/watch?v=${id}`, 'https://youtube.com/playlist?list=123',
    'https://youtube.com/@channel', 'https://youtu.be/short', `https://youtu.be/${id}/extra`,
    `https://youtube.com/watch?v=${id}%22`, `https://youtube-nocookie.com/watch?v=${id}`,
  ]) assert.equal(getYouTubeID(url), null, String(url));
});

test('YouTube player URLs are fixed to nocookie without autoplay and reject malformed IDs', () => {
  assert.equal(youTubeEmbedUrl(id), `https://www.youtube-nocookie.com/embed/${id}?rel=0`);
  assert.doesNotMatch(youTubeEmbedUrl(id), /autoplay/);
  assert.equal(youTubeThumbnailUrl(id), `https://i.ytimg.com/vi/${id}/hqdefault.jpg`);
  for (const invalid of ['../bad', 'short', id + '?autoplay=1']) {
    assert.throws(() => youTubeEmbedUrl(invalid));
    assert.throws(() => youTubeThumbnailUrl(invalid));
  }
});
