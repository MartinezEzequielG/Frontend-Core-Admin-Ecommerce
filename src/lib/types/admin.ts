export type AdminCategoryRef = { id: number; name: string };

export type AdminProductSummary = {
  id: number;
  name: string;
  slug: string;
  sku?: string | null;
  featured?: boolean;
  active?: boolean;
  category?: AdminCategoryRef | null;
};