import express from 'express';
import * as propertyController from '../controllers/propertyController.js';
import * as roomController from '../controllers/roomController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = express.Router();

// Require authentication for all property endpoints
router.use(requireAuth);

// Property CRUD endpoints
router.get('/', propertyController.list);
router.post('/', propertyController.create);
router.get('/:id', propertyController.getById);
router.patch('/:id', propertyController.update);
router.delete('/:id', propertyController.archive);

// Nested Room endpoints under Property
router.get('/:propertyId/rooms', roomController.listByProperty);
router.post('/:propertyId/rooms', roomController.create);

export default router;
