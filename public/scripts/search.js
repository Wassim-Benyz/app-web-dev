document.addEventListener("DOMContentLoaded", () => {
  const searchInput = document.getElementById("search-input");
  const productList = document.getElementById("product-list");

  searchInput.addEventListener("input", function () {
    const query = searchInput.value.trim();

    if (query.length > 0) {
      // Send GET request to the backend with the search query
      fetch(`/api/products/search?q=${encodeURIComponent(query)}`)
        .then((response) => response.json())
        .then((products) => {
          productList.innerHTML = ""; // Clear previous results

          if (products.length > 0) {
            products.forEach((product) => {
              const productHTML = `
                <div class="product-item">
                  <h3>${product.name}</h3>
                  <p>${product.description}</p>
                  <p>$${product.price}</p>
                  <a href="product-details.html?id=${product._id}">View Details</a>
                </div>
              `;
              productList.innerHTML += productHTML;
            });
          } else {
            productList.innerHTML = `<p>No products found for "${query}"</p>`;
          }
        })
        .catch((err) => console.error("Error searching products:", err));
    } else {
      productList.innerHTML = ""; // Clear product list when input is empty
    }
  });
});
