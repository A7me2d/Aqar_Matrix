/** Normalized record. Additional engine fields stay at the legacy boundary. */
interface PostRecord {
  id: string; type: string; category: string; text: string;
  srcs: string[]; groups: string[]; phones: string[];
  price?: number; areaM2?: number; done?: boolean;
  [engineField: string]: any;
}
interface PostCardOptions { hideMatchBtn?: boolean; forceOpen?: boolean; }
interface PostCardContext { more: string; ms: any[]; open: boolean; cl: any; dupOpen: boolean; }
interface PostsFilterIgnores { src?: boolean; type?: boolean; cat?: boolean; pur?: boolean; days?: boolean; }
interface PostsPageApi { render(): void; init(): void; card: typeof postCard; }
