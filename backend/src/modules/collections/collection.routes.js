import { Router } from 'express';
import * as collectionController from './collection.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { authorize } from '../../middleware/authorize.js';

export const collectionRouter = Router();

collectionRouter.get('/',       collectionController.list);
collectionRouter.get('/:slug',  collectionController.getBySlug);

collectionRouter.post('/',    authenticate, authorize('admin'), collectionController.create);
collectionRouter.put('/:id',  authenticate, authorize('admin'), collectionController.update);
collectionRouter.delete('/:id', authenticate, authorize('admin'), collectionController.remove);

