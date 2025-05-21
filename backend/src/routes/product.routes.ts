import { Router } from 'express';
import productController from '../controllers/product.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

// Public routes - No authentication required
router.get('/', productController.getProducts);
router.get('/categories', productController.getCategories);
router.get('/:id', productController.getProductById);

// Protected routes - Authentication required
router.post('/', authenticate, productController.createProduct);
router.put('/:id', authenticate, productController.updateProduct);
router.delete('/:id', authenticate, productController.deleteProduct);

export default router; 