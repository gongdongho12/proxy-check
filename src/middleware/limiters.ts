import rateLimit from 'express-rate-limit';

export const mainLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,
  max: 300,
  message: {
    status: 429,
    message: 'Too Many Requests',
  },
});
