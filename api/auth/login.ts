export default async function handler(req: any, res: any) {
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

  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required' });
    }

    // Secure authentication: Only admin login with Account Secret
    if (username === 'admin') {
      const adminPassword = process.env.ADMIN_PASSWORD;
      
      if (!adminPassword) {
        return res.status(500).json({ message: 'Admin configuration incomplete' });
      }
      
      if (password !== adminPassword) {
        return res.status(401).json({ message: 'Invalid admin credentials' });
      }
      
      return res.status(200).json({
        user: { id: 'admin', username: 'admin', fullName: 'Administrator', isAdmin: true }
      });
    }
    
    // For other users, return error as guest access requires database check
    return res.status(401).json({ message: 'Guest access requires database validation. Use Replit deployment for full functionality.' });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}