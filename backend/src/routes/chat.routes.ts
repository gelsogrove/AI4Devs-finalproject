import { Router } from 'express';
import chatController from '../controllers/chat.controller';

const router = Router();

/**
 * @swagger
 * /api/chat:
 *   post:
 *     summary: Process a chat message with AI function calling
 *     description: Handles chat messages and processes them with OpenAI function calling for products and services
 *     tags:
 *       - Chat
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChatRequest'
 *     responses:
 *       200:
 *         description: Chat message processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ChatResponse'
 *       400:
 *         description: Validation error
 *       500:
 *         description: Server error
 */
router.post('/', chatController.processChat.bind(chatController));

export default router; 