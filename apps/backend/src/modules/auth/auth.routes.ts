import { Router } from 'express';
import * as authController from './auth.controller';
import { authenticate } from '../../middleware/auth';
import { validateBody } from '../../middleware/validate';
import {
  LoginSchema, ForgotPasswordSchema, ResetPasswordSchema, ChangePasswordSchema
} from '@tvs/shared';

const router = Router();

// Public routes
router.get('/csrf', authController.getCsrfToken);
router.post('/login', validateBody(LoginSchema), authController.login);
router.post('/refresh', authController.refresh);
router.post('/forgot-password', validateBody(ForgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password', validateBody(ResetPasswordSchema), authController.resetPassword);

// Protected routes
router.use(authenticate);
router.post('/logout', authController.logout);
router.post('/logout-all', authController.logoutAll);
router.post('/change-password', validateBody(ChangePasswordSchema), authController.changePassword);
router.get('/profile', authController.getProfile);
router.get('/login-history', authController.getLoginHistory);

export default router;
