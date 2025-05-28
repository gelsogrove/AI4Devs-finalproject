import { Router } from 'express';
import langchainChatController from '../controllers/langchain-chat.controller';

const router = Router();

/**
 * @swagger
 * /api/langchain/chat:
 *   post:
 *     summary: Process chat messages using LangChain
 *     description: Enhanced chat processing with LangChain agents and tools
 *     tags: [LangChain Chat]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               messages:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       enum: [user, assistant, system]
 *                     content:
 *                       type: string
 *             required:
 *               - messages
 *     responses:
 *       200:
 *         description: Chat response generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: object
 *                   properties:
 *                     role:
 *                       type: string
 *                       example: assistant
 *                     content:
 *                       type: string
 *                       example: "Buongiorno! Welcome to Gusto Italiano..."
 *       400:
 *         description: Invalid request format
 *       500:
 *         description: Server error
 */
router.post('/chat', langchainChatController.processChat.bind(langchainChatController));

/**
 * @swagger
 * /api/langchain/config/update:
 *   post:
 *     summary: Update LangChain configuration
 *     description: Reload LangChain service with latest configuration from database
 *     tags: [LangChain Chat]
 *     responses:
 *       200:
 *         description: Configuration updated successfully
 *       500:
 *         description: Server error
 */
router.post('/config/update', langchainChatController.updateConfig.bind(langchainChatController));

export default router; 