import axios from 'axios';
// import dummyResponse from '../../../stubs/amazonResponse.json' assert { type: 'json' };
import readJSONFile from '../../utils/fileUtils.js';
import { normalizeAmazonProduct } from '../../utils/normalizeAmazonProduct.js';


async function searchProducts(query) {
  try {
    console.log('Calling product search on Amazon...');
    const isWithStub = process.env.TEST_WITH_AMAZON_STUB === 'true';
    const dummyResponse = readJSONFile('amazonResponse.json');

    const response = 
    isWithStub ? 
        { data: dummyResponse } 
       :
        await axios.get(
          `${process.env.AMAZON_API_URL}`, {
            params: {
              searchTerm: query,
              domain: 'US',
              limit: 10,
              sort: 'FEATURED'
            },
            headers: {
              'API-KEY': `${process.env.AMAZON_CANOPY_API_KEY}`,
              'Content-Type': 'application/json',
              'accept': 'application/json'
            }
          });
    // console.log('Received response from Amazon:', response.data);
    
    return (response.data.data.amazonProductSearchResults.productResults.results || [])
        .map(item => normalizeAmazonProduct(item));

    /*
    return (response.data.data.amazonProductSearchResults.productResults.results || []).map(item => ({
      title: item.title,
      price: item.price.value,
      currency: item.price.currency,
      rating: item.rating,
      ratingsTotal: item.ratingsTotal,
      image: item.mainImageUrl ? item.mainImageUrl : null,
      url: item.url,
      sellerRating: 70, // Placeholder, as Amazon's API may not provide this directly
      sellerFeedbackScore: 1000, // Placeholder, as Amazon's API may not provide this directly
      sellerPositiveFeedbackPercentage: 98, // Placeholder, as Amazon's API may not provide this directly
      platform: 'amazon'
    }));
    */
  } catch (error) {
    console.error('Error fetching products:', error);
    throw new Error('Failed to fetch products');
  }
}

export { searchProducts };