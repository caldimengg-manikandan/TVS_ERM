import csrf from 'csurf';
import { env } from '../config/env';

export const csrfProtection = csrf({
  cookie: {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
  },
});
