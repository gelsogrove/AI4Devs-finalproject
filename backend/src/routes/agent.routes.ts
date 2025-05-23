import { Router } from 'express';
import agentController from '../controllers/agent.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/config', agentController.getAgentConfig.bind(agentController));

router.put('/config', authenticate, agentController.updateAgentConfig.bind(agentController));

export default router; 