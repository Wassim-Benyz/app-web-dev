document.addEventListener("DOMContentLoaded", () => {
  const productList = document.getElementById("product-list");

  fetch("/api/products")
    .then((response) => response.json())
    .then((products) => {
      productList.innerHTML = "";

      products.forEach((product) => {
        const productHTML = `
          <div class="product-card">
            <h3>${product.name}</h3>
            <p>${product.description}</p>
            <p>$${product.price}</p>
            <a href="product-details.html?id=${product._id}">View Details</a>
            <div id="paypal-button-${product._id}"></div>
          </div>
        `;

        productList.innerHTML += productHTML;

        // Load PayPal button for each product
        paypal
          .Buttons({
            createOrder: function (data, actions) {
              return actions.order.create({
                purchase_units: [
                  {
                    amount: {
                      value: product.price,
                    },
                  },
                ],
              });
            },
            onApprove: function (data, actions) {
              return actions.order.capture().then(function (details) {
                alert(
                  `Transaction completed by ${details.payer.name.given_name}`
                );
              });
            },
          })
          .render(`#paypal-button-${product._id}`);
      });
    })
    .catch((err) => console.error("Error loading products:", err));
});
