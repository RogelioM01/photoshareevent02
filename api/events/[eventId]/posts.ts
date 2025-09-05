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

  const { eventId } = req.query || {};

  if (!eventId) {
    return res.status(400).json({ message: 'Event ID is required' });
  }

  try {
    if (req.method === 'GET') {
      // Return demo text posts
      const posts = [
        {
          id: 'post1',
          eventId: eventId,
          userId: 'sofia',
          userName: 'Sofia García',
          content: '¡Qué día tan especial! 🎉',
          createdAt: new Date().toISOString()
        }
      ];

      return res.status(200).json(posts);
      
    } else if (req.method === 'POST') {
      // Create text post
      const { userId, content } = req.body || {};
      
      if (!userId || !content) {
        return res.status(400).json({ message: 'User ID and content are required' });
      }

      const post = {
        id: `post_${Date.now()}`,
        eventId: eventId,
        userId: userId,
        userName: 'Usuario',
        content: content,
        createdAt: new Date().toISOString()
      };

      return res.status(201).json(post);
      
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Posts API error:', error);
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}