import { Router } from 'express';
import * as wishlistController from './wishlist.controller.js';
import { authenticate } from '../../middleware/authenticate.js';
import { validate } from '../../middleware/validate.js';
import { addWishlistSchema } from './wishlist.schema.js';

export const wishlistRouter = Router();

wishlistRouter.use(authenticate);

wishlistRouter.get('/',               wishlistController.list);
wishlistRouter.post('/',              validate(addWishlistSchema), wishlistController.add);
wishlistRouter.delete('/:productId',  wishlistController.remove);
