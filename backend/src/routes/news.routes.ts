import { Router } from 'express';
import { newsRegistry } from '../providers/news/registry';

const router = Router();

/**
 * GET /api/news/world?country=in&category=All&page=1
 * Used by the Global News Feed
 */
router.get('/world', async (req, res, next) => {
  try {
    const { country = 'IN', category = 'All', page = 1 } = req.query as any;
    
    // Build search query based on category
    let query = 'top news';
    if (category && category !== 'all' && category !== 'All') {
      query = `${category} news`;
    }

    const result = await newsRegistry.search({
      query: query.trim(),
      category: category,
      country: country.toUpperCase(),
      max: 50,
    });

    // Sort newest first
    const sorted = result.articles.sort((a, b) => 
      new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
    );

    // Handle basic pagination
    const pageNum = parseInt(page) || 1;
    const limit = 20;
    const startIndex = (pageNum - 1) * limit;
    const paginatedArticles = sorted.slice(startIndex, startIndex + limit);

    res.json({ 
      success: true, 
      data: { 
        articles: paginatedArticles, 
        provider: result.provider,
        hasMore: sorted.length > startIndex + limit
      } 
    });
  } catch (e) {
    next(e);
  }
});

/**
 * GET /api/news/search?category=All&country=IN&exactDate=2026-10-17
 * Used by the World News Explorer with date filtering
 */
router.get('/search', async (req, res, next) => {
  try {
    const { q, category, country, exactDate } = req.query as any;

    // 1. Build base query
    let query = q || 'breaking news';
    if (category && category !== 'All' && category !== 'Top Stories') {
      query += ` ${category}`;
    }
    
    // 2. Handle the specific date (Fetch a wider window to account for timezones)
    if (exactDate) {
      const dateObj = new Date(exactDate);
      
      const prevDay = new Date(dateObj);
      prevDay.setDate(prevDay.getDate() - 1);
      
      const nextDay = new Date(dateObj);
      nextDay.setDate(nextDay.getDate() + 2); // 2 days later
      
      const afterStr = prevDay.toISOString().split('T')[0];
      const beforeStr = nextDay.toISOString().split('T')[0];
      
      query += ` after:${afterStr} before:${beforeStr}`;
    }

    // 3. Fetch from provider (fetch more because we will filter down)
    const result = await newsRegistry.search({
      query: query.trim(),
      category: category || 'All',
      country: country || 'IN',
      max: 100, 
    });

    let finalArticles = result.articles;

    // 4. STRICT DATE FILTER: Ensure the article matches the requested date in the user's local time
    if (exactDate) {
      finalArticles = finalArticles.filter(a => {
        if (!a.publishedAt) return false;
        const d = new Date(a.publishedAt);
        
        // 'en-CA' formats as YYYY-MM-DD
        const localDate = d.toLocaleDateString('en-CA'); 
        return localDate === exactDate;
      });
    }

    // 5. Sort newest first
    const sorted = finalArticles.sort((a, b) => 
      new Date(b.publishedAt || 0).getTime() - new Date(a.publishedAt || 0).getTime()
    );

    res.json({ success: true, data: { articles: sorted, provider: result.provider } });
  } catch (e) { next(e); }
});

export default router;