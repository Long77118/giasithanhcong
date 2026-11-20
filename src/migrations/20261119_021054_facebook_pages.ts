import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres'

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TABLE "site_settings_facebook_pages" (
  	"_order" integer NOT NULL,
  	"_parent_id" integer NOT NULL,
  	"id" varchar PRIMARY KEY NOT NULL,
  	"name" varchar NOT NULL,
  	"url" varchar NOT NULL
  );
  
  ALTER TABLE "site_settings_facebook_pages" ADD CONSTRAINT "site_settings_facebook_pages_parent_id_fk" FOREIGN KEY ("_parent_id") REFERENCES "public"."site_settings"("id") ON DELETE cascade ON UPDATE no action;
  CREATE INDEX "site_settings_facebook_pages_order_idx" ON "site_settings_facebook_pages" USING btree ("_order");
  CREATE INDEX "site_settings_facebook_pages_parent_id_idx" ON "site_settings_facebook_pages" USING btree ("_parent_id");`)

  const appRole = process.env.SQL_USER
  if (appRole) {
    await db.execute(sql`
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.site_settings_facebook_pages TO ${sql.identifier(appRole)}
    `)
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   DROP TABLE "site_settings_facebook_pages" CASCADE;`)
}
