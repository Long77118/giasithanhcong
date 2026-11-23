import * as migration_20261117_130909_initial_schema from './20261117_130909_initial_schema';
import * as migration_20261117_141030_remove_product_prices from './20261117_141030_remove_product_prices';
import * as migration_20261117_144020_admin_only from './20261117_144020_admin_only';
import * as migration_20261118_135213_guard_category_references from './20261118_135213_guard_category_references';
import * as migration_20261118_140200_content_slug_history from './20261118_140200_content_slug_history';
import * as migration_20261119_005721_product_brand from './20261119_005721_product_brand';
import * as migration_20261119_015000_quote_rate_limits from './20261119_015000_quote_rate_limits';
import * as migration_20261119_021054_facebook_pages from './20261119_021054_facebook_pages';
import * as migration_20261119_152602_home_promotions from './20261119_152602_home_promotions';
import * as migration_20261120_040000_cloudflare_media from './20261120_040000_cloudflare_media';
import * as migration_20261121_034654_product_detail_content from './20261121_034654_product_detail_content';
import * as migration_20261122_031937_home_category_shelves from './20261122_031937_home_category_shelves';
import * as migration_20261122_080626_secondary_hotline from './20261122_080626_secondary_hotline';

export const migrations = [
  {
    up: migration_20261117_130909_initial_schema.up,
    down: migration_20261117_130909_initial_schema.down,
    name: '20261117_130909_initial_schema',
  },
  {
    up: migration_20261117_141030_remove_product_prices.up,
    down: migration_20261117_141030_remove_product_prices.down,
    name: '20261117_141030_remove_product_prices',
  },
  {
    up: migration_20261117_144020_admin_only.up,
    down: migration_20261117_144020_admin_only.down,
    name: '20261117_144020_admin_only',
  },
  {
    up: migration_20261118_135213_guard_category_references.up,
    down: migration_20261118_135213_guard_category_references.down,
    name: '20261118_135213_guard_category_references',
  },
  {
    up: migration_20261118_140200_content_slug_history.up,
    down: migration_20261118_140200_content_slug_history.down,
    name: '20261118_140200_content_slug_history',
  },
  {
    up: migration_20261119_005721_product_brand.up,
    down: migration_20261119_005721_product_brand.down,
    name: '20261119_005721_product_brand',
  },
  {
    up: migration_20261119_015000_quote_rate_limits.up,
    down: migration_20261119_015000_quote_rate_limits.down,
    name: '20261119_015000_quote_rate_limits',
  },
  {
    up: migration_20261119_021054_facebook_pages.up,
    down: migration_20261119_021054_facebook_pages.down,
    name: '20261119_021054_facebook_pages',
  },
  {
    up: migration_20261119_152602_home_promotions.up,
    down: migration_20261119_152602_home_promotions.down,
    name: '20261119_152602_home_promotions',
  },
  {
    up: migration_20261120_040000_cloudflare_media.up,
    down: migration_20261120_040000_cloudflare_media.down,
    name: '20261120_040000_cloudflare_media',
  },
  {
    up: migration_20261121_034654_product_detail_content.up,
    down: migration_20261121_034654_product_detail_content.down,
    name: '20261121_034654_product_detail_content',
  },
  {
    up: migration_20261122_031937_home_category_shelves.up,
    down: migration_20261122_031937_home_category_shelves.down,
    name: '20261122_031937_home_category_shelves',
  },
  {
    up: migration_20261122_080626_secondary_hotline.up,
    down: migration_20261122_080626_secondary_hotline.down,
    name: '20261122_080626_secondary_hotline',
  },
];
