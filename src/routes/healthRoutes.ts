import { Router } from 'express';
import { getHealthHandler } from '../controllers/healthController';

const router = Router();

router.get('/', getHealthHandler);

export default router;
