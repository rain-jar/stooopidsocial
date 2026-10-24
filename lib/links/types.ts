export type LinkCategory = {
  id: string;
  name: string;
  slug: string;
  sort_order: number;
  is_visible: boolean;
};

export type ManagedLink = {
  id: string;
  title: string;
  url: string;
  icon: string | null;
  category_id: string;
  sort_order: number;
  is_visible: boolean;
};

export type PublicLinkCategory = LinkCategory & { links: ManagedLink[] };
