import React, { useState } from "react";
import axios from "axios";

function Search() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);

  const handleSearch = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/products/search?q=${query}`);
        setProducts(response.data);
        } catch (error) {
          console.error("Error fetching products:", error);
        }
      };

  return (
    <div className="Search">
      <h1>ShopIQ - eBay Product Search</h1>
        <input
            type="text"
            placeholder="Enter product name..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
        <div>
          {products.map((product) => (
            <div key={product.id}>
              <h2>{product.name}</h2>
              <p>{product.description}</p>
            </div>
          ))}
        </div>
      </div>
    );
}

export default Search;