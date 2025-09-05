export default async function handler(req: any, res: any) {
  res.json({ 
    message: 'Event Photo Gallery API is running',
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.url,
    endpoints: [
      '/api/auth/login',
      '/api/users',
      '/api/users/[userId]',
      '/api/events/[eventId]/join',
      '/api/events/[eventId]/photos',
      '/api/events/[eventId]/posts',
      '/api/evento/[username]'
    ]
  });
}