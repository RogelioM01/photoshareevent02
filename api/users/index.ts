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

  try {
    if (req.method === 'GET') {
      // Return hardcoded users for demo
      const users = [
        { id: 'admin', username: 'admin', fullName: 'Administrator', isAdmin: true, isActive: true },
        { id: 'sofia', username: 'sofia', fullName: 'Sofia García', isAdmin: false, isActive: true },
        { id: 'javier', username: 'javier', fullName: 'Javier López', isAdmin: false, isActive: true }
      ];

      return res.status(200).json(users);
      
    } else if (req.method === 'POST') {
      // For demo purposes, just return success
      const { username, password, fullName, isAdmin } = req.body || {};
      
      if (!username || !password || !fullName) {
        return res.status(400).json({ message: 'Username, password, and full name are required' });
      }

      const newUser = {
        id: Date.now().toString(),
        username,
        fullName,
        isAdmin: isAdmin || false,
        isActive: true
      };

      return res.status(201).json(newUser);
      
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Users API error:', error);
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}