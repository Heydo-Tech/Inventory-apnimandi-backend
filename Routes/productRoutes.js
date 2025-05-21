const express = require("express");
const { google } = require("googleapis");
const { JWT } = require("google-auth-library");
const router = express.Router();
const Product = require("../Models/Product");
const { authenticateToken } = require("../middleware/Authentication"); // Adjust path if needed

// Load Google credentials safely
let credentials;
try {
  credentials = require("../config/ google_credentials.json");
} catch (error) {
  console.error("Error loading Google credentials:", error);
  credentials = {
    client_email: process.env.GOOGLE_CLIENT_EMAIL,
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, "\n")
  };
  if (!credentials.client_email || !credentials.private_key) {
    throw new Error(
      "Google credentials not found. Set GOOGLE_CLIENT_EMAIL and GOOGLE_PRIVATE_KEY in .env."
    );
  }
}

// Set up Google Sheets API Client
const client = new JWT({
  email: credentials.client_email,
  key: credentials.private_key.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

// Google Sheet ID
const SPREADSHEET_ID = "1CF9ZBxHHWd7F9YXG9gILgbshsIdfykuFO-9-D0F_8zo";

// Route to handle fetching product by barcode or SKU
router.post("/", authenticateToken(), async (req, res) => {
  const { barcode } = req.body;

  if (!barcode) {
    return res.status(400).json({ error: "Barcode is required" });
  }

  try {
    let product;
    if (!isNaN(barcode)) {
      product = await Product.findOne({ barcode: Number(barcode) });
    } else {
      product = await Product.findOne({ sku: barcode });
    }

    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }

    return res.json(product);
  } catch (error) {
    console.error("Error fetching product:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while fetching the product" });
  }
});

// Route to handle adding product details to Google Sheets
router.post("/submit-product", authenticateToken(), async (req, res) => {
  const { productName, sku, quantity, productCategory, productSubcategory } =
    req.body;

  if (
    !productName ||
    !sku ||
    !quantity ||
    !productCategory ||
    !productSubcategory
  ) {
    return res.status(400).json({
      error:
        "Product Name, SKU, Quantity, Product Category, and Product Subcategory are required"
    });
  }

  try {
    const sheets = google.sheets({ version: "v4", auth: client });
    const values = [
      [productName, productCategory, productSubcategory, sku, quantity]
    ];
    const resource = { values };

    const result = await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: "Count!A:E",
      valueInputOption: "RAW",
      resource
    });

    console.log(`${result.data.updates.updatedCells} cells appended.`);
    return res
      .status(200)
      .json({ message: "Product details successfully saved to Google Sheets" });
  } catch (error) {
    console.error("Error writing to Google Sheets:", error);
    return res
      .status(500)
      .json({ error: "Failed to write product details to Google Sheets" });
  }
});

// Route to add a product to MongoDB
router.post("/add-product", authenticateToken(), async (req, res) => {
  const {
    productName,
    sku,
    barcode,
    quantity,
    productCategory,
    productSubcategory,
    expireDate
  } = req.body;

  if (
    !productName ||
    !sku ||
    !quantity ||
    !productCategory ||
    !productSubcategory
  ) {
    return res.status(400).json({
      error:
        "Product Name, SKU, Quantity, Product Category, and Product Subcategory are required"
    });
  }

  try {
    const newProduct = new Product({
      productName,
      sku,
      barcode: barcode ? Number(barcode) : undefined,
      productCategory,
      productSubcategory,
      quantity,
      expireDate: expireDate ? new Date(expireDate) : undefined
    });

    const savedProduct = await newProduct.save();
    return res
      .status(201)
      .json({ savedProduct, message: "Product added successfully" });
  } catch (error) {
    console.error("Error adding product:", error);
    return res
      .status(500)
      .json({ error: "An error occurred while adding the product" });
  }
});

// Search endpoint
router.get("/search", authenticateToken(), async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  try {
    const products = await Product.find({
      productName: { $regex: new RegExp(query, "i") }
    })
      .limit(5)
      .select("productName barcode sku");

    res.json(products); // Always return an array
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ error: "Server error while searching products" });
  }
});

// Search endpoint for Waste.jsx
router.get("/search2", authenticateToken(), async (req, res) => {
  const { query } = req.query;

  if (!query) {
    return res.status(400).json({ error: "Query parameter is required" });
  }

  try {
    const products = await Product.find({
      productName: { $regex: new RegExp(query, "i") },
      sku: { $ne: "" }
    })
      .limit(5)
      .select("productName barcode sku");

    res.json(products); // Always return an array
  } catch (error) {
    console.error("Error searching products:", error);
    res.status(500).json({ error: "Server error while searching products" });
  }
});

module.exports = router;
