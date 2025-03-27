const express = require("express");
const mongoose = require("mongoose");
const Product = require("./models/Product");
const Order = require("./models/Order");
const bodyParser = require("body-parser");
const cors = require("cors");
const checkoutNodeJssdk = require("@paypal/checkout-server-sdk"); // Use the same SDK as frontend
const path = require("path");
const dotenv = require("dotenv");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

const environment = new checkoutNodeJssdk.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);

function client() {
  return new checkoutNodeJssdk.core.PayPalHttpClient(environment);
}

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("MongoDB connected");
    insertMockDataIfEmpty(); // Insert mock data if necessary
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
    console.log(
      "Failed to connect to MongoDB. Please check your connection string and ensure the MongoDB service is running."
    );
  });

// Mock product data
const mockProducts = [
  {
    name: "Wireless Headphones",
    price: 50,
    description: "Noise-cancelling wireless headphones",
    imageUrl: "https://via.placeholder.com/150",
  },
  {
    name: "Smartphone",
    price: 300,
    description: "Latest model with advanced features",
    imageUrl: "https://via.placeholder.com/150",
  },
  {
    name: "Laptop",
    price: 800,
    description: "Powerful laptop for gaming and work",
    imageUrl: "https://via.placeholder.com/150",
  },
];

// Function to insert mock data if the database is empty
const insertMockDataIfEmpty = async () => {
  try {
    const productCount = await Product.countDocuments();
    if (productCount === 0) {
      console.log("Database is empty, inserting mock products...");
      await Product.insertMany(mockProducts);
      console.log("Mock products inserted:", mockProducts); // Log the inserted mock products
    }
  } catch (error) {
    console.error("Error inserting mock data:", error);
  }
};

// API Endpoints
// Create a new product
app.post("/api/products", async (req, res) => {
  const { name, price, description, imageUrl } = req.body;
  const newProduct = new Product({ name, price, description, imageUrl });
  try {
    await newProduct.save();
    res.status(201).json(newProduct);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all products
app.get("/api/products", async (req, res) => {
  try {
    const products = await Product.find();
    console.log("Products retrieved:", products); // Log the retrieved products
    res.json(
      products.map((product) => ({
        _id: product._id,
        name: product.name,
        price: product.price,
        description: product.description,
        imageUrl: product.imageUrl,
      }))
    );
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get a product by ID
app.get("/api/products/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    res.json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new order
app.post("/api/orders", async (req, res) => {
  const { productId, quantity, total } = req.body;
  const newOrder = new Order({ productId, quantity, total });
  try {
    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get all orders (populate product details)
app.get("/api/orders", async (req, res) => {
  try {
    const orders = await Order.find().populate("productId");
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Search products by name or description
app.get("/api/products/search", async (req, res) => {
  const searchQuery = req.query.q || ""; // Get search query from the URL parameter
  try {
    const products = await Product.find({
      $or: [
        { name: { $regex: searchQuery, $options: "i" } }, // Case-insensitive search by name
        { description: { $regex: searchQuery, $options: "i" } }, // Case-insensitive search by description
      ],
    });
    console.log("Search results:", products); // Log the search results
    res.json(products);
    console.log("Search query:", searchQuery); // Log the search query
  } catch (error) {
    console.error("Error during search:", error); // Log the error

    res.status(500).json({ message: error.message });
  }
});

// PayPal payment integration
app.post("/api/pay", (req, res) => {
  const { total, items } = req.body;

  const create_payment_json = {
    intent: "sale",
    payer: {
      payment_method: "paypal",
    },
    redirect_urls: {
      return_url: "http://localhost:5000/success",
      cancel_url: "http://localhost:5000/cancel",
    },
    transactions: [
      {
        item_list: {
          items: items,
        },
        amount: {
          currency: "USD",
          total: total,
        },
        description: "Payment for your order",
      },
    ],
  };

  const request = new checkoutNodeJssdk.orders.OrdersCreateRequest();
  request.requestBody(create_payment_json);

  client()
    .execute(request)
    .then((response) => {
      if (response.statusCode !== 201) {
        console.error(response);
        res.status(500).send(response);
      } else {
        res.json(response.result);
      }
    });
});

// Capture payment after user approval
app.post("/api/capture-payment", async (req, res) => {
  const { orderID } = req.body;

  if (!orderID) {
    return res.status(400).json({ error: "Order ID is required" });
  }

  const request = new checkoutNodeJssdk.orders.OrdersCaptureRequest(orderID);
  request.requestBody({});

  try {
    const capture = await client().execute(request);
    console.log("Capture Response:", capture.result);

    // After successful payment, create a new order in the database
    const newOrder = new Order({
      customerName: capture.result.payer.name.given_name, // You can adjust this if needed
      customerEmail: capture.result.payer.email_address, // Same here, if needed
      items: capture.result.purchase_units[0].items.map((item) => ({
        productId: item.sku, // Assuming SKU is product ID
        quantity: item.quantity,
        price: item.unit_amount.value,
      })),
      totalAmount: capture.result.purchase_units[0].amount.value,
      status: "Completed", // Set status to Completed after capture
    });

    await newOrder.save();
    console.log("New order saved:", newOrder);

    res.json({ message: "Payment Successful", data: capture.result });
  } catch (error) {
    console.error("PayPal Capture Error:", error);
    res
      .status(500)
      .json({ error: "Payment capture failed", details: error.message });
  }
});

// Serve static frontend files
app.use(express.static(path.join(__dirname, "public")));

// Route to serve frontend pages
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
