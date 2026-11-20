import { type MigrateUpArgs, type MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP CONSTRAINT "products_category_id_product_categories_id_fk";

  ALTER TABLE "product_categories" DROP CONSTRAINT "product_categories_parent_id_product_categories_id_fk";

  ALTER TABLE "posts" DROP CONSTRAINT "posts_category_id_post_categories_id_fk";

  ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE restrict ON UPDATE no action;
  ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parent_id_product_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."product_categories"("id") ON DELETE restrict ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_post_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."post_categories"("id") ON DELETE restrict ON UPDATE no action;`)
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP CONSTRAINT "products_category_id_product_categories_id_fk";

  ALTER TABLE "product_categories" DROP CONSTRAINT "product_categories_parent_id_product_categories_id_fk";

  ALTER TABLE "posts" DROP CONSTRAINT "posts_category_id_post_categories_id_fk";

  ALTER TABLE "products" ADD CONSTRAINT "products_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "product_categories" ADD CONSTRAINT "product_categories_parent_id_product_categories_id_fk" FOREIGN KEY ("parent_id") REFERENCES "public"."product_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "posts" ADD CONSTRAINT "posts_category_id_post_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."post_categories"("id") ON DELETE set null ON UPDATE no action;`)
}
