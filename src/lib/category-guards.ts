import { sql } from '@payloadcms/db-postgres';
import { APIError, ValidationError, type CollectionBeforeChangeHook, type CollectionBeforeDeleteHook } from 'payload';
import { getWriteTransaction } from './db-transaction';

export const validateCategoryParent: CollectionBeforeChangeHook = async ({ data, originalDoc, req }) => {
  if (data.parent == null) return data;

  const invalid = (message: string): never => {
    throw new ValidationError({
      collection: 'product-categories',
      errors: [{ path: 'parent', message }],
      req,
    });
  };

  const parent = data.parent;
  const parentID = typeof parent === 'number' || (typeof parent === 'string' && /^\d+$/.test(parent))
    ? Number(parent)
    : NaN;
  if (!Number.isInteger(parentID) || parentID < 1 || parentID > 2_147_483_647) {
    invalid('Chọn một danh mục cha hợp lệ.');
  }
  if (parentID === originalDoc?.id) invalid('Danh mục không thể tự làm cha của chính nó.');

  const db = await getWriteTransaction(req);
  // Serialize parent changes across requests, so neither of two simultaneous moves can
  // validate against a tree that the other is about to change.
  await db.execute(sql`SELECT pg_advisory_xact_lock(208174, 1)`);
  const { rows: [ancestor] } = await db.execute<{
    parent_exists: boolean;
    reaches_root: boolean;
    includes_current: boolean;
  }>(sql`
    WITH RECURSIVE ancestors (id, parent_id) AS (
      SELECT id, parent_id FROM product_categories WHERE id = ${parentID}
      UNION
      SELECT category.id, category.parent_id
      FROM product_categories AS category
      JOIN ancestors ON category.id = ancestors.parent_id
    )
    SELECT EXISTS (SELECT 1 FROM ancestors) AS parent_exists,
           EXISTS (SELECT 1 FROM ancestors WHERE parent_id IS NULL) AS reaches_root,
           EXISTS (SELECT 1 FROM ancestors WHERE id = ${originalDoc?.id ?? null}) AS includes_current
  `);
  if (!ancestor.parent_exists) invalid('Danh mục cha đã chọn không tồn tại.');
  if (ancestor.includes_current) invalid('Không thể chọn danh mục con làm cha vì sẽ tạo vòng lặp.');
  if (!ancestor.reaches_root) invalid('Nhánh danh mục cha đã có vòng lặp. Hãy sửa nhánh đó trước.');

  return data;
};

export const guardProductCategoryDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const db = await getWriteTransaction(req);
  // A new FK reference must wait for this row lock before it can be committed.
  await db.execute(sql`SELECT id FROM product_categories WHERE id = ${id} FOR UPDATE`);
  const { rows: [references] } = await db.execute<{ has_children: boolean; has_products: boolean }>(sql`
    SELECT EXISTS (SELECT 1 FROM product_categories WHERE parent_id = ${id}) AS has_children,
           EXISTS (SELECT 1 FROM products WHERE category_id = ${id}) AS has_products
  `);
  if (references.has_children) {
    throw new APIError('Danh mục còn danh mục con. Hãy chuyển các danh mục con sang nhóm khác hoặc bỏ danh mục cha trước khi xóa.', 409);
  }
  if (references.has_products) {
    throw new APIError('Danh mục còn sản phẩm. Hãy chuyển các sản phẩm sang danh mục khác trước khi xóa.', 409);
  }
};

export const guardPostCategoryDelete: CollectionBeforeDeleteHook = async ({ id, req }) => {
  const db = await getWriteTransaction(req);
  await db.execute(sql`SELECT id FROM post_categories WHERE id = ${id} FOR UPDATE`);
  const { rows: [references] } = await db.execute<{ has_posts: boolean }>(sql`
    SELECT EXISTS (SELECT 1 FROM posts WHERE category_id = ${id}) AS has_posts
  `);
  if (references.has_posts) {
    throw new APIError('Chuyên mục còn bài viết. Hãy chuyển các bài viết sang chuyên mục khác trước khi xóa.', 409);
  }
};
