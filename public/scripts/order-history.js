// Sample order data
const orders = [
  {
    id: "order1",
    items: [
      { name: "Product A", price: 30 },
      { name: "Product B", price: 20 },
    ],
    total: 50,
  },
  {
    id: "order2",
    items: [{ name: "Product C", price: 40 }],
    total: 40,
  },
];

// Function to display orders
function displayOrders() {
  const orderList = document.getElementById("order-list");
  orderList.innerHTML = ""; // Clear existing orders
  orders.forEach((order) => {
    const orderDiv = document.createElement("div");
    orderDiv.classList.add("order");
    orderDiv.innerHTML = `
        <h2>Order ID: ${order.id}</h2>
        <ul>
          ${order.items
            .map((item) => `<li>${item.name} - $${item.price}</li>`)
            .join("")}
        </ul>
        <p>Total: $${order.total}</p>
        <button onclick="initiatePayment(${order.total}, ${JSON.stringify(
      order.items
    )})">Pay with PayPal</button>
      `;
    orderList.appendChild(orderDiv);
  });
}

// Function to initiate payment
function initiatePayment(total, items) {
  paypal
    .Buttons({
      createOrder: function (data, actions) {
        return fetch("/api/pay", {
          method: "post",
          body: JSON.stringify({ total: total, items: items }),
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((res) => res.json())
          .then((data) => data.id);
      },
      onApprove: function (data, actions) {
        return fetch(`/api/pay/${data.orderID}/capture`, {
          method: "post",
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((res) => res.json())
          .then((details) => {
            alert("Payment successful!");
            // Optionally, update the UI to reflect the successful payment
          })
          .catch((err) => {
            console.error("Error capturing payment:", err);
          });
      },
    })
    .render("#paypal-button-container");
}

// Initialize the order display
displayOrders();
