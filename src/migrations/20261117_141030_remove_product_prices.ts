import { MigrateUpArgs, MigrateDownArgs, sql } from '@payloadcms/db-postgres'

export async function up({ db, payload, req }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" DROP COLUMN "price";
  ALTER TABLE "products" DROP COLUMN "show_price";`)
}

export async function down({ db, payload, req }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
   ALTER TABLE "products" ADD COLUMN "price" numeric;
  ALTER TABLE "products" ADD COLUMN "show_price" boolean DEFAULT false;`)
}
