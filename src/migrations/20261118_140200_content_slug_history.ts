import { sql, type MigrateDownArgs, type MigrateUpArgs } from '@payloadcms/db-postgres';

export async function up({ db }: MigrateUpArgs): Promise<void> {
  await db.execute(sql`
    LOCK TABLE public.products, public.product_categories, public.posts IN SHARE ROW EXCLUSIVE MODE;

    CREATE TABLE public.content_slug_history (
      namespace text NOT NULL CHECK (namespace IN ('products', 'product-categories', 'posts')),
      slug text NOT NULL,
      document_id integer NOT NULL,
      PRIMARY KEY (namespace, slug)
    );

    INSERT INTO public.content_slug_history (namespace, slug, document_id)
      SELECT 'products', slug, id FROM public.products
      UNION ALL
      SELECT 'product-categories', slug, id FROM public.product_categories
      UNION ALL
      SELECT 'posts', slug, id FROM public.posts;

    CREATE FUNCTION public.reserve_content_slug() RETURNS trigger LANGUAGE plpgsql AS $$
    BEGIN
      IF TG_OP = 'UPDATE' AND OLD.slug IS NOT DISTINCT FROM NEW.slug THEN
        RETURN NEW;
      END IF;

      IF char_length(NEW.slug) > 160 OR NEW.slug COLLATE "C" !~ '^[a-z0-9]+(-[a-z0-9]+)*$' THEN
        RAISE EXCEPTION 'Invalid public content slug' USING ERRCODE = '23514';
      END IF;

      -- Old slugs stay reserved even if their document is removed.
      INSERT INTO public.content_slug_history (namespace, slug, document_id)
        VALUES (TG_ARGV[0], NEW.slug, NEW.id);
      RETURN NEW;
    END;
    $$;

    CREATE TRIGGER reserve_public_slug AFTER INSERT OR UPDATE OF slug ON public.products
      FOR EACH ROW EXECUTE FUNCTION public.reserve_content_slug('products');
    CREATE TRIGGER reserve_public_slug AFTER INSERT OR UPDATE OF slug ON public.product_categories
      FOR EACH ROW EXECUTE FUNCTION public.reserve_content_slug('product-categories');
    CREATE TRIGGER reserve_public_slug AFTER INSERT OR UPDATE OF slug ON public.posts
      FOR EACH ROW EXECUTE FUNCTION public.reserve_content_slug('posts');
  `);

  const appRole = process.env.SQL_USER;
  if (appRole) {
    await db.execute(sql`
      GRANT SELECT, INSERT ON public.content_slug_history TO ${sql.identifier(appRole)}
    `);
  }
}

export async function down({ db }: MigrateDownArgs): Promise<void> {
  await db.execute(sql`
    DROP TRIGGER reserve_public_slug ON public.posts;
    DROP TRIGGER reserve_public_slug ON public.product_categories;
    DROP TRIGGER reserve_public_slug ON public.products;
    DROP FUNCTION public.reserve_content_slug();
    DROP TABLE public.content_slug_history;
  `);
}
