import { searchProducts } from '../services/ebay/productService.js';

async function search(req, res) {
  const query = req.query.q;
  if (!query) {
    return res.status(400).json({ error: 'Query parameter "q" is required' });
  }
  
  try {
    const products = await searchProducts(query);
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}

export {
  search
};