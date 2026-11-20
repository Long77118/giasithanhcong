import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
  DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM "users" WHERE "role"::text <> 'admin') THEN
      RAISE EXCEPTION 'Admin-only migration blocked: non-admin accounts exist. Review and revoke those accounts before migrating; never auto-promote them.';
    END IF;
  END $$;
   ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE text;
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'admin'::text;
  DROP TYPE "public"."enum_users_role";
  CREATE TYPE "public"."enum_users_role" AS ENUM('admin');
  ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'admin'::"public"."enum_users_role";
  ALTER TABLE "users" ALTER COLUMN "role" SET DATA TYPE "public"."enum_users_role" USING "role"::"public"."enum_users_role";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TYPE "public"."enum_users_role" ADD VALUE 'editor';`)
}
