import axios from 'axios';

let cachedToken = null;
let tokenExpiry = null;

async function getToken() {
  if (cachedToken && tokenExpiry && new Date() < tokenExpiry) {
    return cachedToken;
  }

  try {
    const response = await axios.post('https://api.ebay.com/identity/v1/oauth2/token', new URLSearchParams({
      grant_type: 'client_credentials',
      scope: 'https://api.ebay.com/oauth/api_scope'
    }), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${process.env.EBAY_CLIENT_ID}:${process.env.EBAY_CLIENT_SECRET}`).toString('base64')}`
      }
    });

    cachedToken = response.data.access_token;
    tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
    return cachedToken;
  } catch (error) {
    console.error('Error fetching eBay token:', error);
    throw new Error('Failed to fetch eBay token');
  }
}

export { getToken };