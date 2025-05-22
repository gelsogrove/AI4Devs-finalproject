import { Router } from 'express';
import agentController from '../controllers/agent.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Get agent configuration
router.get('/config', authenticate, agentController.getAgentConfig);

// Update agent configuration
router.put('/config', authenticate, agentController.updateAgentConfig);

export default router; 