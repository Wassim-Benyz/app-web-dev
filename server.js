const express = require("express");
const mongoose = require("mongoose");
const Product = require("./models/Product");
const Order = require("./models/Order");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 5001;

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
    imageUrl: "/images/headphones.jpg",
  },
  {
    name: "Smartphone",
    price: 300,
    description: "Latest model with advanced features",
    imageUrl:
      "/images/smartphone-with-blank-black-screen-innovative-future-technology.jpg",
  },
  {
    name: "Laptop",
    price: 800,
    description: "Powerful laptop for gaming and work",
    imageUrl: "/images/laptop.webp",
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

//Search
app.get("/api/products/search", async (req, res) => {
  const query = req.query.q;

  try {
    const products = await Product.find({
      name: { $regex: query, $options: "i" }, // Case-insensitive search
    });

    res.json(products);
  } catch (err) {
    console.error("Error fetching products:", err);
    res.status(500).json({ message: "Server error" });
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
const paypal = require("paypal-rest-sdk");

paypal.configure({
  mode: "sandbox", // or 'live'
  client_id: process.env.PAYPAL_CLIENT_ID,
  client_secret: process.env.PAYPAL_CLIENT_SECRET,
});

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

  paypal.payment.create(create_payment_json, (error, payment) => {
    if (error) {
      console.error(error);
      res.status(500).send(error);
    } else {
      res.json(payment);
    }
  });
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
