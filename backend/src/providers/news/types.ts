export interface RawArticle {
  title: string;
  description?: string;
  url: string;
  sourceName?: string;
  sourceDomain?: string;
  publishedAt?: string;
  imageUrl?: string;
  author?: string;
}

export interface NewsSearchOptions {
  query: string;
  category?: string;
  from?: Date;
  to?: Date;
  language?: string;
  country?: string;
  max?: number;
}

export interface NewsProvider {
  readonly name: string;
  isConfigured(): boolean;
  search(opts: NewsSearchOptions, signal?: AbortSignal): Promise<RawArticle[]>;
  health(): Promise<{ ok: boolean; latencyMs?: number; message?: string }>;
}