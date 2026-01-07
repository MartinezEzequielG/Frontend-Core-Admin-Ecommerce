export type AdminCategoryRef = { id: number; name: string };

export type AdminProductSummary = {
  id: number;
  name: string;
  slug: string;

  sku?: string | null;

  basePrice: number;
  salePrice?: number | null;

  active?: boolean;
  featured?: boolean;

  createdAt: string;

  // ✅ lo usa /admin/products/page.tsx
  totalStock?: number;

  category?: AdminCategoryRef | null;
};