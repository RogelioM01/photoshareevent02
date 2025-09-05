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

  const { username } = req.query || {};

  if (!username) {
    return res.status(400).json({ message: 'Username is required' });
  }

  try {
    if (req.method === 'GET') {
      // Return demo personal event
      const event = {
        id: `event_${username}`,
        title: username,
        description: `Evento personal de ${username}`,
        coverImageUrl: "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=200&h=200",
        ownerId: username,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return res.status(200).json(event);
      
    } else if (req.method === 'PUT') {
      // Update personal event
      const { title, description, coverImageUrl } = req.body || {};
      
      const updatedEvent = {
        id: `event_${username}`,
        title: title || username,
        description: description || `Evento personal de ${username}`,
        coverImageUrl: coverImageUrl || "https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&h=200",
        ownerId: username,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return res.status(200).json(updatedEvent);
      
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Personal event error:', error);
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}