import { Router } from 'express';
const router = Router();

router.get('/', (req, res) => {
  res.json({ success: true, data: { message: 'Reports route - to be implemented' } });
});

export default router;