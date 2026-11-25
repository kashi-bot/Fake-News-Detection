import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { Verification } from '../models/Verification';

const router = Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const items = await Verification.find({ userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const total = await Verification.countDocuments({ userId });

    res.json({
      success: true,
      data: {
        items: items.map(v => ({
          id: String(v._id),
          originalInput: v.originalInput,
          status: v.status,
          confidence: v.confidence,
          inputType: v.inputType,
          createdAt: v.createdAt,
        })),
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (e) { next(e); }
});

router.delete('/clear', requireAuth, async (req, res, next) => {
  try {
    const result = await Verification.deleteMany({ userId: req.user!.id });
    res.json({ success: true, data: { deleted: result.deletedCount } });
  } catch (e) { next(e); }
});

export default router;