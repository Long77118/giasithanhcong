import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    CREATE TABLE public.quote_rate_limits (
      bucket text PRIMARY KEY,
      hits timestamptz[] NOT NULL,
      expires_at timestamptz NOT NULL
    );
    CREATE INDEX quote_rate_limits_expires_at_idx ON public.quote_rate_limits (expires_at);
  `);

  const appRole = process.env.SQL_USER;
  if (appRole) {
    await db.execute(sql`
      GRANT SELECT, INSERT, UPDATE, DELETE ON public.quote_rate_limits TO ${sql.identifier(appRole)}
    `);
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`DROP TABLE public.quote_rate_limits`);
}
