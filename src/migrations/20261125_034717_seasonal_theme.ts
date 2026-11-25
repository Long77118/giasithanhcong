import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   CREATE TYPE "public"."enum_site_settings_seasonal_theme_theme" AS ENUM('christmas');
  CREATE TYPE "public"."enum_site_settings_seasonal_theme_intensity" AS ENUM('light', 'medium', 'strong');
  ALTER TABLE "site_settings" ADD COLUMN "seasonal_theme_enabled" boolean DEFAULT false;
  ALTER TABLE "site_settings" ADD COLUMN "seasonal_theme_theme" "enum_site_settings_seasonal_theme_theme" DEFAULT 'christmas';
  ALTER TABLE "site_settings" ADD COLUMN "seasonal_theme_starts_on" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "seasonal_theme_ends_on" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "seasonal_theme_intensity" "enum_site_settings_seasonal_theme_intensity" DEFAULT 'light';
  ALTER TABLE "site_settings" ADD COLUMN "seasonal_theme_snow_enabled" boolean DEFAULT true;
  ALTER TABLE "site_settings" ADD COLUMN "seasonal_theme_lights_enabled" boolean DEFAULT true;
  ALTER TABLE "site_settings" ADD COLUMN "seasonal_theme_decorations_enabled" boolean DEFAULT true;
  ALTER TABLE "site_settings" ADD COLUMN "seasonal_theme_scroll_effects_enabled" boolean DEFAULT true;
  ALTER TABLE "site_settings" ADD COLUMN "seasonal_theme_announcement_enabled" boolean DEFAULT false;
  ALTER TABLE "site_settings" ADD COLUMN "seasonal_theme_announcement_text" varchar;
  ALTER TABLE "site_settings" ADD COLUMN "seasonal_theme_announcement_href" varchar;`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "site_settings" DROP COLUMN "seasonal_theme_enabled";
  ALTER TABLE "site_settings" DROP COLUMN "seasonal_theme_theme";
  ALTER TABLE "site_settings" DROP COLUMN "seasonal_theme_starts_on";
  ALTER TABLE "site_settings" DROP COLUMN "seasonal_theme_ends_on";
  ALTER TABLE "site_settings" DROP COLUMN "seasonal_theme_intensity";
  ALTER TABLE "site_settings" DROP COLUMN "seasonal_theme_snow_enabled";
  ALTER TABLE "site_settings" DROP COLUMN "seasonal_theme_lights_enabled";
  ALTER TABLE "site_settings" DROP COLUMN "seasonal_theme_decorations_enabled";
  ALTER TABLE "site_settings" DROP COLUMN "seasonal_theme_scroll_effects_enabled";
  ALTER TABLE "site_settings" DROP COLUMN "seasonal_theme_announcement_enabled";
  ALTER TABLE "site_settings" DROP COLUMN "seasonal_theme_announcement_text";
  ALTER TABLE "site_settings" DROP COLUMN "seasonal_theme_announcement_href";
  DROP TYPE "public"."enum_site_settings_seasonal_theme_theme";
  DROP TYPE "public"."enum_site_settings_seasonal_theme_intensity";`)
}
