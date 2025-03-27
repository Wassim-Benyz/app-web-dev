// Get the product ID from the URL query string
const urlParams = new URLSearchParams(window.location.search);
const productId = urlParams.get("id");

const productDetailsContainer = document.getElementById("product-details");

async function loadProductDetails() {
  try {
    // Fetch the product details by ID
    const response = await fetch(`/api/products/${productId}`);
    const product = await response.json();

    // Display the product details on the page
    const productHTML = `
      <div class="product-detail">
        <h3>${product.name}</h3>
        <img src="${product.imageUrl}" alt="${product.name}" width="300" />
        <p>${product.description}</p>
        <p>$${product.price}</p>
      </div>
    `;
    productDetailsContainer.innerHTML = productHTML;
  } catch (error) {
    console.error("Error loading product details:", error);
    productDetailsContainer.innerHTML = "<p>Product not found.</p>";
  }
}

loadProductDetails();
