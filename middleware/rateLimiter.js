const requestLog = new Map();

const WINDOW_MS = 60 * 1000;
const MAX_REQUESTS = 5;

function getClientIp(req) {
  const forwardedFor = req.headers['x-forwarded-for'];

  if (typeof forwardedFor === 'string' && forwardedFor.trim()) {
    return forwardedFor.split(',')[0].trim();
  }

  return req.ip || req.socket?.remoteAddress || 'unknown';
}

function rateLimiter(req, res, next) {
  const ipAddress = getClientIp(req);
  const now = Date.now();
  const windowStart = now - WINDOW_MS;
  const requests = requestLog.get(ipAddress) || [];
  const recentRequests = requests.filter((timestamp) => timestamp > windowStart);

  if (recentRequests.length >= MAX_REQUESTS) {
    return res.status(429).json({
      success: false,
      message: 'Too many requests. Please try again later.',
    });
  }

  recentRequests.push(now);
  requestLog.set(ipAddress, recentRequests);

  next();
}

module.exports = rateLimiter;