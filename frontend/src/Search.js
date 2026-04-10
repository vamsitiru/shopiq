import React, { useState } from "react";
import axios from "axios";
import "./Search.css";

function Search() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [winner, setWinner] = useState(null);
  const [llmExplanation, setLlmExplanation] = useState(null);

  const handleSearch = async () => {
    try {
      const response = await axios.get(`http://localhost:8000/api/products/search?q=${query}`);
      setProducts(response.data.ranked || []);
      setWinner(response.data.winner || null);
      setLlmExplanation(response.data.llmExplanation || null);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  const otherProducts = products.filter(
    (product) => !winner || product.title !== winner.title || product.platform !== winner.platform
  );

  return (
    <div className="Search">
      <h1>ShopIQ - eCommerce Product Search</h1>

      <div className="search-controls">
        <input
          type="text"
          placeholder="Enter product name..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button onClick={handleSearch}>Search</button>
      </div>

      <div className="results-grid">
        <div className="winner-card">
          {winner ? (
            <>
              <div className="winner-badge">🏆 Best Overall</div>
              <h2>{winner.title}</h2>
              <p>{winner.platform} · {winner.currency} {winner.price}</p>
              <p style={{ marginTop: 16 }}>
                {winner.description || winner.shortDescription || "Top recommendation based on score, confidence, rating, and value."}
              </p>

              <div className="winner-meta">
                <div className="meta-item">
                  <strong>Rating</strong>
                  {winner.rating ?? "N/A"}
                </div>
                <div className="meta-item">
                  <strong>Reviews</strong>
                  {winner.reviewCount ?? "N/A"}
                </div>
                <div className="meta-item">
                  <strong>Confidence</strong>
                  {winner.confidence ?? "N/A"}
                </div>
                <div className="meta-item">
                  <strong>Score</strong>
                  {winner.finalScore ?? "N/A"}
                </div>
              </div>

              {winner.itemUrl ? (
                <a className="winner-link" href={winner.itemUrl} target="_blank" rel="noreferrer">
                  View Product
                </a>
              ) : null}

              {llmExplanation ? (
                <div className="explanation-box">
                  <h3>Why this winner?</h3>
                  <p>{llmExplanation.whyBest}</p>

                  {Array.isArray(llmExplanation.whyNotOthers) && llmExplanation.whyNotOthers.length > 0 ? (
                    <div>
                      <strong>Why not others:</strong>
                      <ul>
                        {llmExplanation.whyNotOthers.map((reason, idx) => (
                          <li key={idx}>{reason}</li>
                        ))}
                      </ul>
                    </div>
                  ) : null}

                  <h4>Summary</h4>
                  <p>{llmExplanation.summary}</p>
                </div>
              ) : null}
            </>
          ) : (
            <div className="no-results">Search for a product to see the best match here.</div>
          )}
        </div>

        <div className="sidebar">
          {otherProducts.length > 0 ? (
            otherProducts.map((product, index) => (
              <div className="sidebar-card" key={`${product.title}-${product.platform}-${index}`}>
                <h3>{product.title}</h3>
                <p>
                  <strong>Price:</strong> {product.currency} {product.price}
                </p>
                <p>
                  <strong>Platform:</strong> {product.platform}
                </p>
                <p>
                  <strong>Rating:</strong> {product.rating ?? "N/A"} · <strong>Reviews:</strong> {product.reviewCount ?? "N/A"}
                </p>
                {product.itemUrl ? (
                  <a className="small-link" href={product.itemUrl} target="_blank" rel="noreferrer">
                    Open product
                  </a>
                ) : null}
              </div>
            ))
          ) : (
            <div className="sidebar-card no-results">No additional products to show yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Search;