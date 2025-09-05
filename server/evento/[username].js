exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };
  
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers, body: '' };
  }

  const username = event.path.split('/').pop();

  if (event.httpMethod === 'GET') {
    // Return personal event data
    const personalEvent = {
      id: `event_${username}`,
      title: `Evento de ${username}`,
      description: `Evento personal de ${username}`,
      coverImageUrl: 'https://via.placeholder.com/400x300',
      ownerId: username,
      ownerUsername: username,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(personalEvent)
    };
  }

  if (event.httpMethod === 'PUT') {
    const { title, description, coverImageUrl } = JSON.parse(event.body || '{}');
    
    const updatedEvent = {
      id: `event_${username}`,
      title: title || `Evento de ${username}`,
      description: description || `Evento personal de ${username}`,
      coverImageUrl: coverImageUrl || 'https://via.placeholder.com/400x300',
      ownerId: username,
      ownerUsername: username,
      updatedAt: new Date().toISOString()
    };

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(updatedEvent)
    };
  }
  
  return {
    statusCode: 405,
    headers,
    body: JSON.stringify({ message: 'Method not allowed' })
  };
};