import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { Verification } from '../models/Verification';

const router = Router();

router.get('/stats', requireAuth, async (req, res, next) => {
  try {
    const userId = req.user!.id;
    
    // Count all verifications for this user
    const totalVerifications = await Verification.countDocuments({ userId });
    
    // Get the 5 most recent verifications
    const recent = await Verification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.json({
      success: true,
      data: {
        totalVerifications,
        recent: recent.map(v => ({
          id: String(v._id),
          originalInput: v.originalInput,
          status: v.status,
          inputType: v.inputType,
          confidence: v.confidence,
          createdAt: v.createdAt,
        })),
      },
    });
  } catch (e) { next(e); }
});

export default router;