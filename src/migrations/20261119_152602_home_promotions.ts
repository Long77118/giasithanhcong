import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_site_settings_home_promotions_tone" AS ENUM('mint', 'ice', 'peach', 'sand');
  CREATE TABLE "site_settings_home_promotions" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"enabled" boolean DEFAULT true,
  	"tone" "enum_site_settings_home_promotions_tone" DEFAULT 'mint' NOT NULL,
  	"title" varchar NOT NULL,
  	"description" varchar,
  	"image_id" integer NOT NULL,
  	"button_label" varchar DEFAULT 'Xem sản phẩm' NOT NULL,
  	"url" varchar NOT NULL
  );
  
  ALTER TABLE "site_settings_home_promotions" ADD CONSTRAINT "site_settings_home_promotions_image_id_media_id_fk" FOREIGN KEY ("image_id") REFERENCES "public"."media"("id") ON DELETE set null ON UPDATE no action;
  ALTER TABLE "site_settings_home_promotions" ADD CONSTRAINT "site_settings_home_promotions_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_home_promotions_order_idx" ON "site_settings_home_promotions" USING btree ("_order");
  CREATE INDEX "site_settings_home_promotions_parent_id_idx" ON "site_settings_home_promotions" USING btree ("_parent_id");
  CREATE INDEX "site_settings_home_promotions_image_idx" ON "site_settings_home_promotions" USING btree ("image_id");`)

  const appRole = process.env.SQL_USER
  if (appRole) {
    await db.execute(sql`
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings_home_promotions TO ${sql.identifier(appRole)}
    `)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "site_settings_home_promotions" CASCADE;
  DROP TYPE "public"."enum_site_settings_home_promotions_tone";`)
}
