const { google } = require("googleapis");
const { JWT } = require("google-auth-library");
const moment = require("moment");
const Product = require("../Models/Product");
const Inventory = require("../Models/Inventory");
const mongoose = require("mongoose");
const credentials = require("../config/ google_credentials.json");

// Configure the JWT client
const client = new JWT({
  email: credentials.client_email,
  key: credentials.private_key.replace(/\\n/g, "\n"), // Fix escaped newlines in private key
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

// Google Sheet ID and range
const SPREADSHEET_ID = "1CF9ZBxHHWd7F9YXG9gILgbshsIdfykuFO-9-D0F_8zo";

// Function to fetch data from Google Sheets and add to MongoDB
const addDataToMongoDB = async () => {
  console.log("Called addDataToMongoDB");

  try {
    // Check if MongoDB is connected
    if (mongoose.connection.readyState !== 1) {
      console.error("MongoDB is not connected.");
      return;
    }

    // Create an instance of Google Sheets API
    const sheets = google.sheets({ version: "v4", auth: client });

    // Fetch and list all sheet names for debugging
    const metadata = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID
    });

    const sheetNames = metadata.data.sheets.map(
      (sheet) => sheet.properties.title
    );
    console.log("Available sheets:", sheetNames);

    // Check if 'WasteManagment' exists in the available sheets
    if (!sheetNames.includes("WasteManagment")) {
      console.error(
        `Sheet 'WasteManagment' not found. Available sheets: ${sheetNames}`
      );
      return;
    }

    // Fetch data from the 'WasteManagment' sheet
    const WasteManagmentData = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `'WasteManagment'!A:H` // Adjust the range as necessary
    });

    const wasteRows = WasteManagmentData.data.values;

    if (!wasteRows || wasteRows.length === 0) {
      console.log("No data found in WasteManagment sheet.");
    } else {
      console.log(
        `Processing WasteManagment sheet (${wasteRows.length} rows)...`
      );
      await processRows(wasteRows);
    }

    // Fetch data from the 'ProductManagment' sheet if it exists
    if (sheetNames.includes("ProductManagment")) {
      const ProductManagmentData = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'ProductManagment'!A:H` // Adjust the range as necessary
      });

      const productRows = ProductManagmentData.data.values;

      if (!productRows || productRows.length === 0) {
        console.log("No data found in ProductManagment sheet.");
      } else {
        console.log(
          `Processing ProductManagment sheet (${productRows.length} rows)...`
        );
        await processRows(productRows);
      }
    } else {
      console.log("ProductManagment sheet not found.");
    }
  } catch (error) {
    console.error(
      "Error fetching data from Google Sheets or updating MongoDB:",
      error
    );
  }
};

// Function to process rows from the sheet and update MongoDB
const processRows = async (rows) => {
  // Process each row, skip header row if present
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const [
      date,
      time,
      username,
      establishment,
      barcodeOrSKU,
      productName,
      quantity,
      isAdded
    ] = row;

    // Log row data for debugging
    console.log(`Processing row ${i + 1}:`, row);

    // Ensure mandatory fields are present and valid
    if (
      !productName ||
      !barcodeOrSKU ||
      !quantity ||
      isNaN(quantity) ||
      !isAdded ||
      !establishment
    ) {
      console.error(`Row ${i + 1} is missing or has invalid required fields.`);
      continue;
    }

    // Convert quantity to a number
    const quantityNumber = parseInt(quantity, 10);

    // Only process rows where `isAdded` is `TRUE`
    if (isAdded.trim().toUpperCase() === "TRUE") {
      // Check whether the identifier is a barcode (number) or SKU (string)
      const query = isNaN(barcodeOrSKU)
        ? { sku: barcodeOrSKU } // SKU is a string
        : { barcode: parseInt(barcodeOrSKU, 10) }; // Barcode is a number

      // Find the product by barcode or SKU
      let product = await Product.findOne(query);

      if (!product) {
        try {
          // Create a new product if not found
          product = await Product.create({
            barcode: isNaN(barcodeOrSKU)
              ? undefined
              : parseInt(barcodeOrSKU, 10),
            sku: isNaN(barcodeOrSKU) ? barcodeOrSKU : undefined,
            productName
          });
          console.log(
            `Created new product: ${productName} (Identifier: ${barcodeOrSKU})`
          );
        } catch (error) {
          console.error(
            `Error creating product ${productName} in row ${i + 1}:`,
            error.message
          );
          continue; // Skip to the next row if error occurs
        }
      }

      // Check if the inventory entry exists for the product and establishment
      let inventory = await Inventory.findOne({
        product: product._id,
        establishment
      });

      if (inventory) {
        // Update existing inventory
        try {
          inventory.quantity += quantityNumber;
          inventory.remarks = inventory.remarks || "Automatically updated";
          await inventory.save();
          console.log(
            `Updated inventory for product ${productName} (Identifier: ${barcodeOrSKU}) at ${establishment}`
          );
        } catch (error) {
          console.error(
            `Error updating inventory for ${productName} in row ${i + 1}:`,
            error.message
          );
          continue;
        }
      } else {
        // Create a new inventory entry
        try {
          inventory = new Inventory({
            product: product._id,
            quantity: quantityNumber,
            remarks: "Automatically updated",
            establishment
          });

          await inventory.save();
          console.log(
            `Created new inventory entry for product ${productName} (Identifier: ${barcodeOrSKU}) at ${establishment}`
          );
        } catch (error) {
          console.error(
            `Error creating inventory for ${productName} in row ${i + 1}:`,
            error.message
          );
          continue;
        }
      }
    } else {
      console.log(`Skipping row ${i + 1}: isAdded is not TRUE`);
    }
  }
};

module.exports = {
  addDataToMongoDB
};
