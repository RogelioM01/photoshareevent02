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

  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { eventTitle } = req.query || {};

  if (!eventTitle) {
    return res.status(400).json({ message: 'Event title is required' });
  }

  try {
    // Return demo event data
    const event = {
      id: `event_${eventTitle}`,
      title: eventTitle,
      description: `Evento: ${eventTitle}`,
      coverImageUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=200",
      ownerId: "",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.status(200).json(event);

  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}