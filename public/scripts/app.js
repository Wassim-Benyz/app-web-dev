document.addEventListener("DOMContentLoaded", function () {
  loadProducts();
});

function loadProducts() {
  fetch("http://localhost:5001/api/products")
    .then((response) => response.json())
    .then((products) => {
      const productList = document.getElementById("product-list");
      productList.innerHTML = "";
      products.forEach((product) => {
        const productDiv = document.createElement("div");
        productDiv.classList.add("product");
        productDiv.innerHTML = `
            <h2>${product.name}</h2>
            <p>${product.description}</p>
            <p>$${product.price}</p>
            <button onclick="addToCart('${product._id}')">Add to Cart</button>
          `;
        productList.appendChild(productDiv);
      });
    })
    .catch((err) => console.error("Error fetching products:", err));
}

function searchProducts() {
  const query = document.getElementById("search-bar").value;
  fetch(`http://localhost:5001/api/products?search=${query}`)
    .then((response) => response.json())
    .then((products) => {
      const productList = document.getElementById("product-list");
      productList.innerHTML = "";
      products.forEach((product) => {
        const productDiv = document.createElement("div");
        productDiv.classList.add("product");
        productDiv.innerHTML = `
            <h2>${product.name}</h2>
            <p>${product.description}</p>
            <p>$${product.price}</p>
            <button onclick="addToCart('${product._id}')">Add to Cart</button>
          `;
        productList.appendChild(productDiv);
      });
    })
    .catch((err) => console.error("Error searching products:", err));
}

function addToCart(productId) {
  // Function to handle adding items to the cart
  console.log(`Product ${productId} added to cart.`);
}
