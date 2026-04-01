import axios from 'axios';

import { getToken } from './authService.js';

async function searchProducts(query) {
  try {
    const token = await getToken();
    const response = await axios.get(`https://api.ebay.com/buy/browse/v1/item_summary/search?q=${query}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return (response.data.itemSummaries || []).map(item => ({
      title: item.title,
      price: item.price.value,
      currency: item.price.currency,
      image: item.image ? item.image.imageUrl : null,
      url: item.itemWebUrl,
      itemId: item.itemId,
      condition: item.condition,
      seller: item.seller ? item.seller.username : null
    }));
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }
}

export { searchProducts };