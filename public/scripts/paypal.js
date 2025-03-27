// frontend/scripts/paypal.js

export function initPayPalButtons(product, successCallback, errorCallback) {
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
            fetch("http://localhost:5001/api/capture-payment", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ orderID: data.orderID }),
            })
              .then((response) => response.json())
              .then((result) => {
                successCallback(details);
              })
              .catch((error) => {
                console.error("Error capturing payment:", error);
                errorCallback(error);
              });
          });
        },
      })
      .render(`#paypal-button-${product._id}`);
  }
  