import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "site_settings_home_category_shelves" (
    "_order" integer NOT NULL,
    "_parent_id" integer NOT NULL,
    "id" varchar PRIMARY KEY NOT NULL,
    "enabled" boolean DEFAULT true,
    "category_id" integer,
    "title" varchar
  );

  ALTER TABLE "site_settings" ADD COLUMN "home_category_shelves_enabled" boolean DEFAULT true;
  ALTER TABLE "site_settings_home_category_shelves" ADD CONSTRAINT "site_settings_home_category_shelves_category_id_product_categories_id_fk" FOREIGN KEY ("category_id") REFERENCES "public"."product_categories"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_home_category_shelves" ADD CONSTRAINT "site_settings_home_category_shelves_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_home_category_shelves_order_idx" ON "site_settings_home_category_shelves" USING btree ("_order");
  CREATE INDEX "site_settings_home_category_shelves_parent_id_idx" ON "site_settings_home_category_shelves" USING btree ("_parent_id");
  CREATE INDEX "site_settings_home_category_shelves_category_idx" ON "site_settings_home_category_shelves" USING btree ("category_id");`)

  const appRole = process.env.SQL_USER
  if (appRole) {
    await db.execute(sql`GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings_home_category_shelves TO ${sql.identifier(appRole)}`)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "site_settings_home_category_shelves" CASCADE;
  ALTER TABLE "site_settings" DROP COLUMN "home_category_shelves_enabled";`)
}
