import { Router } from 'express';
import { requireAuth, requireRole } from '../middleware/auth';
import { User } from '../models/User';
import { Verification } from '../models/Verification';
import { NewsSource } from '../models/NewsSource';
import { Report } from '../models/Report';
import { AdminLog } from '../models/AdminLog';
import { ApiError } from '../utils/ApiError';

const router = Router();
router.use(requireAuth, requireRole('moderator'));

// Helper to record every admin action
async function logAction(req: any, action: string, targetType?: string, targetId?: any, metadata?: any) {
  await AdminLog.create({
    adminId: req.user.id,
    action,
    targetType,
    targetId,
    metadata,
  });
}

// ==== STATS ====
router.get('/stats', async (_req, res, next) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [totalUsers, activeUsers, totalVerifications, todayVerifications, openReports] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: true }),
      Verification.countDocuments(),
      Verification.countDocuments({ createdAt: { $gte: todayStart } }),
      Report.countDocuments({ status: 'OPEN' }),
    ]);

    res.json({ success: true, data: { totalUsers, activeUsers, totalVerifications, todayVerifications, openReports } });
  } catch (e) { next(e); }
});

// ==== USERS ====
router.get('/users', async (req, res, next) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query as any;
    const query: any = {};
    if (search) query.$or = [{ name: new RegExp(search, 'i') }, { email: new RegExp(search, 'i') }];
    if (role) query.role = role;

    const [items, total] = await Promise.all([
      User.find(query).select('name email role isActive isVerified createdAt lastLoginAt').sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit)).lean(),
      User.countDocuments(query),
    ]);

    res.json({ success: true, data: { items: items.map(u => ({ ...u, id: String(u._id), _id: undefined })), total, page: Number(page) } });
  } catch (e) { next(e); }
});

router.patch('/users/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const { role, isActive } = req.body;
    const update: any = {};
    if (role) update.role = role;
    if (typeof isActive === 'boolean') update.isActive = isActive;

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true }).select('name email role isActive');
    if (!user) throw new ApiError(404, 'NOT_FOUND', 'User not found.');

    await logAction(req, 'update_user', 'User', user._id, update);
    res.json({ success: true, data: user });
  } catch (e) { next(e); }
});

router.delete('/users/:id', requireRole('superadmin'), async (req, res, next) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    await logAction(req, 'delete_user', 'User', req.params.id);
    res.json({ success: true, data: { deleted: true } });
  } catch (e) { next(e); }
});

// ==== VERIFICATIONS ====
router.get('/verifications', async (req, res, next) => {
  try {
    const { status, userId, page = 1, limit = 20 } = req.query as any;
    const query: any = {};
    if (status) query.status = status;
    if (userId) query.userId = userId;

    const [items, total] = await Promise.all([
      Verification.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit))
        .populate('userId', 'name email').lean(),
      Verification.countDocuments(query),
    ]);

    res.json({ success: true, data: { items, total, page: Number(page) } });
  } catch (e) { next(e); }
});

router.delete('/verifications/:id', requireRole('admin'), async (req, res, next) => {
  try {
    await Verification.findByIdAndDelete(req.params.id);
    await logAction(req, 'delete_verification', 'Verification', req.params.id);
    res.json({ success: true, data: { deleted: true } });
  } catch (e) { next(e); }
});

// ==== SOURCES ====
router.get('/sources', async (_req, res, next) => {
  try {
    const sources = await NewsSource.find().sort({ createdAt: -1 }).lean();
    res.json({ success: true, data: { items: sources } });
  } catch (e) { next(e); }
});

router.post('/sources', requireRole('admin'), async (req, res, next) => {
  try {
    const src = await NewsSource.create(req.body);
    await logAction(req, 'create_source', 'NewsSource', src._id, req.body);
    res.status(201).json({ success: true, data: src });
  } catch (e) { next(e); }
});

router.patch('/sources/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const src = await NewsSource.findByIdAndUpdate(req.params.id, req.body, { new: true });
    await logAction(req, 'update_source', 'NewsSource', req.params.id, req.body);
    res.json({ success: true, data: src });
  } catch (e) { next(e); }
});

// ==== REPORTS ====
router.get('/reports', async (req, res, next) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }).populate('userId', 'name email').lean();
    res.json({ success: true, data: { items: reports } });
  } catch (e) { next(e); }
});

router.patch('/reports/:id', requireRole('admin'), async (req, res, next) => {
  try {
    const { status, adminResponse } = req.body;
    const report = await Report.findByIdAndUpdate(req.params.id, { status, adminResponse }, { new: true });
    await logAction(req, 'update_report', 'Report', req.params.id, { status });
    res.json({ success: true, data: report });
  } catch (e) { next(e); }
});

// ==== LOGS ====
router.get('/logs', async (req, res, next) => {
  try {
    const { page = 1, limit = 50 } = req.query as any;
    const [items, total] = await Promise.all([
      AdminLog.find().sort({ createdAt: -1 }).skip((page - 1) * limit).limit(Number(limit))
        .populate('adminId', 'name email').lean(),
      AdminLog.countDocuments(),
    ]);
    res.json({ success: true, data: { items, total } });
  } catch (e) { next(e); }
});

// ==== ANALYTICS ====
router.get('/analytics', async (_req, res, next) => {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);

    const userGrowth = await User.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const verificationsByDay = await Verification.aggregate([
      { $match: { createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const verdictDistribution = await Verification.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    res.json({
      success: true,
      data: {
        userGrowth: userGrowth.map(x => ({ date: x._id, count: x.count })),
        verificationsByDay: verificationsByDay.map(x => ({ date: x._id, count: x.count })),
        verdictDistribution: verdictDistribution.map(x => ({ status: x._id, count: x.count })),
      },
    });
  } catch (e) { next(e); }
});

// ==== PROVIDER HEALTH ====
router.get('/provider-health', async (_req, res, next) => {
  try {
    const { newsRegistry } = await import('../providers/news/registry');
    const health = await newsRegistry.health();
    res.json({ success: true, data: health });
  } catch (e) { next(e); }
});

export default router;