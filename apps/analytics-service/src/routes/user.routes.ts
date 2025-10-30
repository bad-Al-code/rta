import { IRouter, Router } from 'express';

import { UserController } from '../controllers';
import { requireAuth, validateRequest } from '../middlewares';
import { updateUserSchema } from '../schema';

const router: IRouter = Router();

router.use(requireAuth);

router.patch(
  '/me',
  validateRequest(updateUserSchema),
  UserController.updateCurrentUser
);

export { router as userRouter };
