import { Router } from 'express';
import serviceController from '../controllers/service.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();

router.get('/', serviceController.getServices.bind(serviceController));

router.get('/all', serviceController.getAllServices.bind(serviceController));

router.get('/:id', serviceController.getServiceById.bind(serviceController));

router.post('/', authenticate, serviceController.createService.bind(serviceController));

router.put('/:id', authenticate, serviceController.updateService.bind(serviceController));

router.delete('/:id', authenticate, serviceController.deleteService.bind(serviceController));

export default router; 