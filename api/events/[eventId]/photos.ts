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
      // Return demo photos
      const photos = [
        {
          id: 'photo1',
          eventId: eventId,
          userId: 'sofia',
          userName: 'Sofia García',
          url: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=600',
          filename: 'photo1.jpg',
          mimeType: 'image/jpeg',
          createdAt: new Date().toISOString()
        }
      ];

      return res.status(200).json(photos);
      
    } else if (req.method === 'POST') {
      // For demo purposes, return success
      const { userId, files } = req.body || {};
      
      if (!userId || !files || !Array.isArray(files)) {
        return res.status(400).json({ message: 'User ID and files are required' });
      }

      const uploadedPhotos = files.map((file, index) => ({
        id: `photo_${Date.now()}_${index}`,
        eventId: eventId,
        userId: userId,
        userName: 'Usuario',
        url: file.url || 'https://via.placeholder.com/400x300',
        filename: file.filename || `photo_${index}.jpg`,
        mimeType: file.mimeType || 'image/jpeg',
        createdAt: new Date().toISOString()
      }));

      return res.status(201).json(uploadedPhotos);
      
    } else {
      return res.status(405).json({ message: 'Method not allowed' });
    }

  } catch (error) {
    console.error('Photos API error:', error);
    res.status(500).json({ message: 'Internal server error', error: String(error) });
  }
}