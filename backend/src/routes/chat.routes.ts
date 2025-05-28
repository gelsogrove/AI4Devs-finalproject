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

/**
 * @swagger
 * /api/chat/test:
 *   get:
 *     summary: Test AI service directly
 *     description: Simple test endpoint to verify AI service is working
 *     tags:
 *       - Chat
 *     responses:
 *       200:
 *         description: AI test successful
 *       500:
 *         description: AI test failed
 */
router.get('/test', chatController.testAI.bind(chatController));

/**
 * @swagger
 * /api/chat/test-functions:
 *   get:
 *     summary: Test availableFunctions directly
 *     description: Debug endpoint to test the availableFunctions implementation
 *     tags:
 *       - Chat
 *     responses:
 *       200:
 *         description: Function tests successful
 *       500:
 *         description: Function tests failed
 */
router.get('/test-functions', chatController.testFunctions.bind(chatController));

/**
 * @swagger
 * /api/chat/integration-test:
 *   get:
 *     summary: Comprehensive chatbot integration test
 *     description: Tests all chatbot functionality including products, services, and FAQ embedding search
 *     tags:
 *       - Chat
 *     responses:
 *       200:
 *         description: Integration test completed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 successRate:
 *                   type: string
 *                 timestamp:
 *                   type: string
 *                 tests:
 *                   type: array
 *                   items:
 *                     type: object
 *                 summary:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: number
 *                     passed:
 *                       type: number
 *                     failed:
 *                       type: number
 *       500:
 *         description: Integration test failed
 */
router.get('/integration-test', chatController.testChatbotIntegration.bind(chatController));

export default router; 