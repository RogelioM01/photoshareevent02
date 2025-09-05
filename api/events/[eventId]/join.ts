import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Add CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { eventId } = req.query || {};
  const { name, userId } = req.body || {};

  if (!eventId || !name || !userId) {
    return res.status(400).json({ message: 'Event ID, name, and user ID are required' });
  }

  try {
    // Return demo event user data
    const eventUser = {
      id: `eventuser_${Date.now()}`,
      eventId: eventId,
      userId: userId,
      name: name,
      joinedAt: new Date().toISOString()
    };

    res.status(200).json(eventUser);

  } catch (error) {
    console.error('Join event error:', error);
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}