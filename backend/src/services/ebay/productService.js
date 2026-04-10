import axios from 'axios';
import readJSONFile from '../../utils/fileUtils.js';


import { getToken } from './authService.js';
import { normalizeEbayProduct } from '../../utils/normalizeEbayProduct.js';

async function searchProducts(query) {
  try {
    const token = await getToken();
    console.log('Calling product search on eBay...');

    const dummyResponse = readJSONFile('ebayResponse.json');    
    const isWithStub = process.env.TEST_WITH_EBAY_STUB === 'true';

    const response = 
      isWithStub 
      ? 
        { data: dummyResponse } 
      : 
        await axios.get(
        `${process.env.EBAY_API_URL}`, {
          params: {
            q: query,
            limit: 10
          },
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
            "X-EBAY-C-MARKETPLACE-ID": "EBAY_US"
          }
        });

    // console.log('Received response from eBay:', response.data);    

    return (response.data.itemSummaries || [])
        .map(item => normalizeEbayProduct(item));
    /*
    return (response.data.itemSummaries || []).map(item => ({
      title: item.title,
      price: item.price.value,
      currency: item.price.currency,
      rating: 5, // Placeholder, as eBay's API may not provide this directly
      ratingsTotal: 100, // Placeholder, as eBay's API may not provide this directly      
      image: item.image ? item.image.imageUrl : null,
      url: item.itemWebUrl,
      seller: item.seller ? item.seller.username : null,
      sellerFeedbackScore: item.seller ? item.seller.feedbackScore : null,
      sellerPositiveFeedbackPercentage: item.seller ? item.seller.positiveFeedbackPercentage : null,
      platform: 'ebay'
    }));
    */
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }
}

export { searchProducts };