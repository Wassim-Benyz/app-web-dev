// frontend/scripts/orders.js

export async function fetchOrders() {
  try {
    const response = await fetch("http://localhost:5001/api/orders");
    if (!response.ok) {
      throw new Error("Failed to fetch orders");
    }
    const orders = await response.json();
    return orders;
  } catch (error) {
    console.error("Error fetching orders:", error);
    return [];
  }
}

export async function createOrder(orderData) {
  try {
    const response = await fetch("http://localhost:5001/api/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(orderData),
    });
    if (!response.ok) {
      throw new Error("Failed to create order");
    }
    return await response.json();
  } catch (error) {
    console.error("Error creating order:", error);
    throw error;
  }
}
