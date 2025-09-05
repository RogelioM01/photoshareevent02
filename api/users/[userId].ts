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

  const { userId } = req.query || {};

  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }

  try {
    if (req.method === 'GET') {
      // Return hardcoded user for demo
      const users = [
        { id: 'admin', username: 'admin', fullName: 'Administrator', isAdmin: true, isActive: true },
        { id: 'sofia', username: 'sofia', fullName: 'Sofia García', isAdmin: false, isActive: true },
        { id: 'javier', username: 'javier', fullName: 'Javier López', isAdmin: false, isActive: true }
      ];

      const user = users.find(u => u.id === userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json(user);
      
    } else if (req.method === 'PUT') {
      // For demo purposes, just return success
      const { username, fullName, isAdmin } = req.body || {};
      
      const updatedUser = {
        id: userId,
        username: username || 'updated_user',
        fullName: fullName || 'Updated Name',
        isAdmin: isAdmin || false,
        isActive: true
      };

      return res.status(200).json(updatedUser);
      
    } else if (req.method === 'DELETE') {
      // For demo purposes, just return success
      return res.status(200).json({ message: 'User deleted successfully' });
      
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('User API error:', error);
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}