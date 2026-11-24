import test from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { LexicalContent } from '../components/LexicalContent';
import { publicDocumentLink, richTextImage, safeRichTextHref } from './rich-text';
import { articleBodyImageContext, productDescriptionImageContext } from './storefront-image-sizes';

const text = (value: string, format = 0) => ({type:'text',text:value,format,detail:0,mode:'normal',style:'',version:1});
const element = (type: string, children: unknown[], rest: Record<string, unknown> = {}) => ({type,children,format:'',indent:0,direction:'ltr',version:1,...rest});
const render = (nodes: unknown[], imageSizeContext = articleBodyImageContext(false)) =>
  renderToStaticMarkup(React.createElement(LexicalContent,{data:{root:element('root',nodes)},imageSizeContext}));
const image = {id:1,url:'/api/media/file/anh-bai-viet.jpg',mimeType:'image/jpeg',width:1600,height:900,alt:'Hộp giấy & ly PET',caption:'Ảnh minh họa giữa bài'};
const reference = (relationTo = 'products', status = 'published') => ({relationTo,value:{id:2,slug:'ly-pet-500ml',name:'Ly PET 500ml',status}});

test('Rich text renders embedded images with alt, caption, original dimensions and surrounding content', () => {
  const html = render([element('paragraph',[text('Trước ảnh')]),{type:'upload',version:3,relationTo:'media',value:image},element('paragraph',[text('Sau ảnh')])]);
  assert.match(html,/<figure class="rich-text-image" data-align="center" style="--rich-text-image-width:60%/);
  assert.doesNotMatch(html,/data-wrap=/);
  assert.match(html,/src="\/api\/media\/file\/anh-bai-viet.jpg"/);
  assert.match(html,/alt="Hộp giấy &amp; ly PET"/);
  assert.match(html,/width="1600" height="900" loading="lazy"/);
  assert.match(html,/<figcaption>Ảnh minh họa giữa bài<\/figcaption>/);
  assert.ok(html.indexOf('Trước ảnh') < html.indexOf('<figure '));
  assert.ok(html.indexOf('</figure>') < html.indexOf('Sau ảnh'));
});

test('Configured image output bounds widths, supports wrapping and uses the page image context', () => {
  const node = {
    type: 'upload', version: 3, relationTo: 'media',
    value: {...image,sizes:{wide:{url:'/wide.jpg',width:800,height:450},crop:{url:'/crop.jpg',width:480,height:360}}},
    fields: { imageSize: 'custom', customWidth: 2400, customWidthUnit: 'px', imageAlignment: 'right', wrapText: true, caption: 'Chú thích riêng' },
  };
  const product = render([node], productDescriptionImageContext);
  const article = render([node], articleBodyImageContext(true));
  for(const html of [product, article]) {
    assert.match(html,/data-align="right" data-wrap="true"/);
    assert.match(html,/--rich-text-image-width:1600px/);
    assert.match(html,/--rich-text-image-max-width:min\(100%, 1600px\)/);
    assert.match(html,/sizes="auto, \(width &lt; 40rem\)/);
    assert.match(html,/srcSet="\/wide.jpg 800w,/i);
    assert.doesNotMatch(html,/\/crop.jpg/);
    assert.match(html,/<figcaption>Chú thích riêng<\/figcaption>/);
  }
  assert.match(product,/sizes="[^"]*1240px/);
  assert.match(article,/sizes="[^"]*64rem[^"]*46.25rem[^"]*20.625rem/);
  assert.doesNotMatch(render([node]), /sizes="[^"]*64rem/);
  const invalid = render([{...node,fields:{ imageSize: 'custom', customWidthUnit: 'px', customWidth: '300px; color:red', imageAlignment: 'unsafe', wrapText: true }}]);
  assert.match(invalid,/data-align="center" style="--rich-text-image-width:60%/);
  assert.doesNotMatch(invalid,/color:red|unsafe|data-wrap/);
});

test('Internal document links and block relationships use the correct public routes', () => {
  for (const [collection,href] of [['products','/san-pham/ly-pet-500ml'],['posts','/blog/ly-pet-500ml'],['product-categories','/danh-muc/ly-pet-500ml'],['post-categories','/blog?category=ly-pet-500ml']]) {
    const ref = reference(collection);
    const html = render([element('paragraph',[element('link',[text('Xem tài liệu')],{fields:{linkType:'internal',doc:ref,newTab:true}})]),{type:'relationship',version:2,...ref}]);
    assert.equal((html.match(new RegExp(`href="${href.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')}"`,'g')) ?? []).length,2);
    assert.match(html,/target="_blank" rel="noopener noreferrer"/);
  }
});

test('Unresolved, deleted, draft and private relationships retain link text without a fake hash URL', () => {
  for (const ref of [null,{relationTo:'products',value:2},reference('products','draft'),reference('users'),{relationTo:'posts',value:null}]) {
    assert.equal(publicDocumentLink(ref),undefined);
    const html = render([element('paragraph',[element('link',[text('Nội dung vẫn còn')],{fields:{linkType:'internal',doc:ref}})])]);
    assert.match(html,/Nội dung vẫn còn/);assert.doesNotMatch(html,/<a\b|href="#"/);
  }
});

test('Custom, auto and legacy URL links work; dangerous URL schemes remain plain escaped text', () => {
  for (const href of ['/san-pham?q=PET','#quy-cach','https://example.com/','mailto:sales@example.com','tel:0900000000']) {
    assert.equal(safeRichTextHref(href),href);
    assert.match(render([element('link',[text('Liên kết')],{fields:{linkType:'custom',url:href}})]),/<a href=/);
  }
  assert.match(render([element('autolink',[text('Website')],{fields:{url:'https://example.com/'}})]),/href="https:\/\/example.com\/"/);
  assert.match(render([element('link',[text('Cũ')],{url:'/blog'})]),/href="\/blog"/);
  for (const href of ['javascript:alert(1)','data:text/html,test','//example.com/','/\\example.com','java\nscript:alert(1)']) {
    const html = render([element('link',[text('<script>không thực thi</script>')],{fields:{url:href}})]);
    assert.equal(safeRichTextHref(href),undefined);assert.doesNotMatch(html,/<a\b|<script>/);assert.match(html,/&lt;script&gt;/);
  }
});

test('Formatting, heading, nested lists, alignment, quote and horizontal rule survive conversion', () => {
  const html = render([
    element('heading',[text('Đề mục')],{tag:'h2'}),
    element('paragraph',[text('Đậm',1),text('Nghiêng',2),text('Gạch',4),text('Gạch dưới',8),text('Mã',16),text('Trên',64),text('Dưới',32),{type:'linebreak',version:1}],{format:'center'}),
    element('list',[element('listitem',[text('Mục 1'),element('list',[element('listitem',[text('Mục con')],{value:1})],{listType:'bullet',tag:'ul'})],{value:1})],{listType:'number',tag:'ol',start:1}),
    element('quote',[text('Trích dẫn')]),{type:'horizontalrule',version:1},
  ]);
  for (const pattern of [/<h2>Đề mục<\/h2>/,/<strong>Đậm<\/strong>/,/<em>Nghiêng<\/em>/,/text-decoration:line-through/,/text-decoration:underline/,/<code>Mã<\/code>/,/<sup>Trên<\/sup>/,/<sub>Dưới<\/sub>/,/text-align:center/,/<ol/,/<ul/,/<blockquote>/,/<hr/]) assert.match(html,pattern);
});

test('Responsive image variants preserve image aspect ratio; missing images do not crash an article', () => {
  const resolved = richTextImage({...image,sizes:{thumbnail:{url:'/cropped.jpg',width:480,height:360},uncropped:{url:'/wide.jpg',width:800,height:450}}});
  assert.match(resolved!.srcSet!,/wide.jpg 800w/);assert.doesNotMatch(resolved!.srcSet!,/cropped/);
  for (const value of [null,5,{}, {...image,url:'javascript:alert(1)'},{...image,mimeType:'application/pdf'}]) {
    const html = render([{type:'upload',version:3,relationTo:'media',value},element('paragraph',[text('Tiếp tục đọc')])]);
    assert.match(html,/Ảnh không còn khả dụng/);assert.match(html,/Tiếp tục đọc/);assert.doesNotMatch(html,/<img/);
  }
  assert.equal(renderToStaticMarkup(React.createElement(LexicalContent,{data:null,imageSizeContext:articleBodyImageContext(false)})), '');
});
