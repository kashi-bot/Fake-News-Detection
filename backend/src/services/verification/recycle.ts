import { NormalizedArticle } from './compare';

export interface RecycledResult {
  isRecycled: boolean;
  originalPublishedAt?: Date;
  note?: string;
}

/**
 * Compares the submitted text's implied date against the earliest retrieved coverage.
 * Being recycled is independent of whether the original story was true.
 */
export function detectRecycled(content: string, articles: NormalizedArticle[]): RecycledResult {
  const dated = articles.filter(a => a.publishedAtDate);
  if (!dated.length) return { isRecycled: false };

  const earliest = dated.reduce((m, a) => (a.publishedAtDate! < m ? a.publishedAtDate! : m), dated[0].publishedAtDate!);
  const ageDays = (Date.now() - earliest.getTime()) / 86400000;

  const contentYear = content.match(/\b(20\d{2})\b/)?.[1];
  const contentHasExplicitOldDate = contentYear ? Number(contentYear) < new Date().getFullYear() - 1 : false;

  if (ageDays > 180 && contentHasExplicitOldDate) {
    return {
      isRecycled: true,
      originalPublishedAt: earliest,
      note: `Coverage of this story dates back to ${earliest.toISOString().slice(0, 10)}, which is more than six months before today. The submitted text references ${contentYear}. The story may be circulating again out of its original context.`,
    };
  }
  if (ageDays > 400) {
    return {
      isRecycled: true,
      originalPublishedAt: earliest,
      note: `The earliest retrieved coverage is from ${earliest.toISOString().slice(0, 10)}. If this is being presented as new, it is likely recycled content.`,
    };
  }
  return { isRecycled: false, originalPublishedAt: earliest };
}