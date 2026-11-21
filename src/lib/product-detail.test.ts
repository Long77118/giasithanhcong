import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { Product } from '../payload-types';
import { availabilityLabels, hasProductDescription, productDocuments, productQuickFacts, productTextItems, productVideos } from './product-detail';
import { buildProductJsonLd, buildVideoJsonLd } from './seo';
import { serializeJsonLd } from './json-ld';
import { ProductVideo } from '../components/ProductVideo';
import { ProductGallery } from '../components/ProductGallery';
import { ProductContactActions } from '../components/ProductContactActions';
import { resolveContactConfig } from './contact';
import { LexicalContent } from '../components/LexicalContent';
import { Documents } from '../collections/Documents';
import { Media } from '../collections/Media';
import { r2Storage } from '@payloadcms/storage-r2';
import { postgresAdapter } from '@payloadcms/db-postgres';

const origin = 'https://example.com';
const videoId = 'M7lc1UVf-VE';
const pageUrl = `${origin}/san-pham/chai-pet`;

test('Old products without optional fields hide the new sections and preserve real text', () => {
  assert.deepEqual(productQuickFacts(undefined), []);
  assert.deepEqual(productVideos(undefined, origin), []);
  assert.deepEqual(productDocuments(null, origin), []);
  assert.deepEqual(productTextItems(['  Dễ đóng gói  ', '', '   ', 'Dùng cho quán ăn']), ['Dễ đóng gói', 'Dùng cho quán ăn']);
  assert.equal(hasProductDescription(null), false);
  assert.equal(hasProductDescription({root:{children:[{type:'paragraph',children:[{type:'text',text:'  '}]}]}}), false);
  assert.equal(hasProductDescription({root:{children:[{type:'paragraph',children:[{type:'text',text:'Nội dung thật'}]}]}}), true);
  assert.equal(renderToStaticMarkup(React.createElement(ProductGallery, { items: [], productName: 'Chai PET' })), '');
});

test('Only opted-in nonempty specifications become quick facts, bounded to four', () => {
  const specs = Array.from({length:6}, (_, index) => ({label:`Thông số ${index}`,value:String(index),showInQuickFacts:index !== 0}));
  specs.unshift({label:'',value:'Rỗng',showInQuickFacts:true});
  const facts = productQuickFacts(specs);
  assert.equal(facts.length, 4);
  assert.deepEqual(facts.map(f => f.label), ['Thông số 1','Thông số 2','Thông số 3','Thông số 4']);
});

test('Document links require populated PDF records with safe public URLs and real titles', () => {
  const pdf = {id:1,title:'Catalog chai PET',url:'/api/documents/file/catalog.pdf',mimeType:'application/pdf'};
  const fixtures = [pdf, 2, {...pdf,id:3,mimeType:'image/png'}, {...pdf,id:4,url:'javascript:alert(1)'}, {...pdf,id:5,title:' '}];
  assert.deepEqual(productDocuments(fixtures as Product['documents'], origin), [{id:1,title:pdf.title,url:origin+pdf.url}]);
});

test('PDF storage keeps its schema on Node and Workers without widening the Media MIME allowlist', async () => {
  assert.ok(Documents.upload && typeof Documents.upload === 'object');
  assert.ok(Media.upload && typeof Media.upload === 'object');
  assert.deepEqual(Documents.upload.mimeTypes, ['application/pdf']);
  assert.ok(!Media.upload.mimeTypes?.includes('application/pdf'));
  const configured = await r2Storage({bucket:{} as never,collections:{documents:{prefix:'documents'}}})({
    collections:[Documents], secret:'unit-test-only-not-a-runtime-secret',
    db:postgresAdapter({pool:{host:'127.0.0.1',database:'not_connected'}}),
  });
  const workerDocuments=configured.collections?.find(c=>c.slug==='documents');
  assert.ok(workerDocuments && typeof workerDocuments.upload==='object');
  assert.equal(workerDocuments.upload.disableLocalStorage,true);
  assert.deepEqual(workerDocuments.upload.mimeTypes,['application/pdf']);
  const storedFields=workerDocuments.fields.filter(f=>'name' in f && f.name!=='url').map(f=>'name' in f ? f.name : '');
  assert.deepEqual(storedFields.sort(),['_objectKey','prefix','title'].sort());
});

test('Video presentation requires usable content and uses CMS thumbnails before YouTube fallback', () => {
  const video = {youtubeUrl:`https://youtu.be/${videoId}`,title:' Video chai PET ',description:' Nội dung video '};
  const custom = {...video,id:'custom',thumbnail:{id:1,url:'/api/media/file/video.jpg',mimeType:'image/jpeg',alt:'Ảnh riêng'}};
  const results = productVideos([video, custom, {...video,youtubeUrl:'https://evil.example/video'}, {...video,description:' '} ] as Product['videos'], origin);
  assert.equal(results.length, 2);
  assert.equal(results[0].thumbnail, `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`);
  assert.equal(results[1].thumbnail, origin+'/api/media/file/video.jpg');
  assert.equal(results[1].thumbnailAlt, 'Ảnh riêng');
  const html = renderToStaticMarkup(React.createElement(ProductVideo, {...results[1]}));
  assert.match(html, /<button/);
  assert.doesNotMatch(html, /<iframe|youtube-nocookie|autoplay/);
});

test('VideoObject describes the real video without fabricated dates, pricing or unsafe URLs', () => {
  const schema = buildVideoJsonLd({youtubeUrl:`https://youtu.be/${videoId}`,title:'Chai PET </script>',description:'Hướng dẫn sử dụng',pageUrl,thumbnailUrl:'/api/media/file/video.jpg'});
  assert.ok(schema);
  assert.equal(schema['@type'],'VideoObject');
  assert.equal(schema.embedUrl,`https://www.youtube-nocookie.com/embed/${videoId}?rel=0`);
  assert.equal(schema.thumbnailUrl,origin+'/api/media/file/video.jpg');
  assert.equal(schema.url,`https://www.youtube.com/watch?v=${videoId}`);
  assert.equal(schema.name,'Chai PET </script>');
  assert.doesNotMatch(serializeJsonLd(schema), /<|uploadDate|offers|aggregateRating/);
  assert.equal(buildVideoJsonLd({youtubeUrl:'https://evil.example/x',title:'Video',description:'Nội dung',pageUrl}),null);
  assert.equal(buildVideoJsonLd({youtubeUrl:`https://youtu.be/${videoId}`,title:' ',description:'Nội dung',pageUrl}),null);
});

test('Product structured data remains a quotation catalog without offers or fabricated ratings', () => {
  const schema = buildProductJsonLd({name:'Chai PET',sku:'PET-01',description:'Chai nhựa',url:pageUrl,images:[origin+'/chai.jpg'],brandName:null});
  assert.equal(schema.url,pageUrl);
  assert.equal(schema.offers,undefined);
  assert.equal(schema.aggregateRating,undefined);
  assert.equal(schema.review,undefined);
  assert.deepEqual(Object.values(availabilityLabels), ['Còn hàng','Đặt theo yêu cầu','Ngừng cung cấp']);
});

test('Detail contact controls use SiteSettings and disappear when unconfigured', () => {
  assert.equal(renderToStaticMarkup(React.createElement(ProductContactActions,{contact:resolveContactConfig({})})), '');
  const html=renderToStaticMarkup(React.createElement(ProductContactActions,{contact:resolveContactConfig({hotline:'0901234567',zaloUrl:'https://zalo.me/0901234567'})}));
  assert.match(html,/Nhận báo giá qua Zalo/);
  assert.match(html,/href="tel:0901234567"/);
  assert.match(html,/href="https:\/\/zalo.me\/0901234567"/);
  assert.doesNotMatch(html,/chưa cấu hình|href="#"/);
});

test('Product rich text cannot add a second H1 or a missing-image placeholder', () => {
  const data={root:{type:'root',version:1,direction:'ltr',format:'',indent:0,children:[
    {type:'heading',tag:'h1',version:1,format:'',indent:0,direction:'ltr',children:[{type:'text',version:1,text:'Chi tiết chai PET',format:0,detail:0,mode:'normal',style:''}]},
    {type:'upload',version:3,relationTo:'media',value:null},
  ]}};
  const html=renderToStaticMarkup(React.createElement(LexicalContent,{data,headingTag:'h3',hideUnavailable:true}));
  assert.match(html,/<h3>Chi tiết chai PET<\/h3>/);
  assert.doesNotMatch(html,/<h1|Ảnh không còn khả dụng/);
});
