const { google } = require("googleapis");
const { JWT } = require("google-auth-library");
const moment = require("moment");
const Product = require("../Models/Product");

// Load Google Sheets credentials
const credentials = require("../config/ google_credentials.json");

// Configure the JWT client
const client = new JWT({
  email: credentials.client_email,
  key: credentials.private_key.replace(/\\n/g, "\n"),
  scopes: ["https://www.googleapis.com/auth/spreadsheets"]
});

// Google Sheet ID and sheet names
const SPREADSHEET_ID = "1CF9ZBxHHWd7F9YXG9gILgbshsIdfykuFO-9-D0F_8zo";
const WASTE_MANAGEMENT_SHEET = "WasteManagment";
const PRODUCT_MANAGEMENT_SHEET = "ProductManagement";

// Add or Update Inventory
const addOrUpdateInventory = async (req, res) => {
  const {
    barcodeOrSKU,
    quantityPerCarton,
    noOfCarton,
    establishment,
    username,
    imagery,
    role,
    productName,
    vendorName,
    invoiceNumber,
    expiryDate,
    isProductLost
  } = req.body;

  const storeName =
    establishment == 1
      ? "Sunnyvale"
      : establishment == 2
        ? "Fremont"
        : establishment == 3
          ? "Milpitas"
          : establishment == 4
            ? "Karthik"
            : "warehouse";

  const cartons = noOfCarton || 1;
  const quantity = quantityPerCarton * cartons || 1;

  if (isNaN(quantity)) {
    return res.status(400).json({ message: "Invalid data type for quantity." });
  }

  try {
    let product;
    if (!isNaN(barcodeOrSKU)) {
      product = await Product.findOne({ barcode: Number(barcodeOrSKU) });
    } else {
      product = await Product.findOne({ sku: barcodeOrSKU });
    }

    if (!product) {
      product = await Product.create({
        productName: productName || "Unknown Product",
        barcode: !isNaN(barcodeOrSKU) ? Number(barcodeOrSKU) : undefined,
        sku: isNaN(barcodeOrSKU) ? barcodeOrSKU : undefined
      });
    }

    const currentDate = moment().format("YYYY-MM-DD");
    const currentTime = moment().format("HH:mm");

    const row = [
      currentDate,
      currentTime,
      username,
      vendorName,
      invoiceNumber,
      quantityPerCarton,
      isProductLost === "on" ? "TRUE" : "FALSE",
      establishment,
      storeName,
      isNaN(barcodeOrSKU) ? product.sku : product.barcode,
      product.productName,
      quantity,
      expiryDate,
      imagery || "image",
      "TRUE"
    ];

    const row2 = [
      currentDate,
      currentTime,
      barcodeOrSKU,
      productName,
      quantity,
      username,
      storeName
    ];

    const sheetName =
      role === "Waste Management"
        ? WASTE_MANAGEMENT_SHEET
        : PRODUCT_MANAGEMENT_SHEET;
    const range =
      role === "Waste Management" ? `'${sheetName}'!A:G` : `'${sheetName}'!A:O`;
    const finalrow = role === "Waste Management" ? row2 : row;

    const sheets = google.sheets({ version: "v4", auth: client });
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range,
      valueInputOption: "USER_ENTERED",
      resource: { values: [finalrow] }
    });

    res
      .status(200)
      .json({ message: "Inventory added to Google Sheets successfully." });
  } catch (error) {
    console.error("Error adding inventory:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Get last product added by user in ProductManagement sheet
// Get last product added by user in ProductManagement sheet
const lastProductadded = async (req, res) => {
  try {
    const { username } = req.body;
    console.log("Fetching last product for username:", username);
    if (!username) {
      return res.status(400).json({ message: "Username is required." });
    }

    const sheets = google.sheets({ version: "v4", auth: client });
    let response;
    try {
      response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `'${PRODUCT_MANAGEMENT_SHEET}'!A:O`
      });
    } catch (apiError) {
      console.error("Google Sheets API error:", apiError);
      return res.status(500).json({
        message: "Failed to access Google Sheet",
        error: apiError.message
      });
    }

    const rows = response.data.values;
    if (!rows || rows.length === 0) {
      console.log("No data found in ProductManagement sheet");
      return res.status(404).json({ message: "No data found in the sheet." });
    }

    // Log first few rows to help debug structure
    console.log("Sheet structure (first row):", rows[0]);
    if (rows.length > 1) console.log("Sample data row:", rows[1]);

    // More robust filtering and validation
    const userRows = [];

    for (let i = 1; i < rows.length; i++) {
      // Skip header row
      const row = rows[i];

      // Check if row has sufficient data and matches username (index 2)
      if (row && row.length >= 11 && row[2] === username) {
        // Safely extract date and time
        const dateStr = row[0] || "";
        const timeStr = row[1] || "";

        try {
          // Use simple string comparison for timestamps instead of moment parsing
          // This avoids moment validation issues
          const timestamp = `${dateStr} ${timeStr}`;

          userRows.push({
            date: dateStr,
            time: timeStr,
            productName: row[10] || "Unknown Product",
            timestamp: timestamp
          });
        } catch (err) {
          console.warn(
            `Skipping row with invalid date/time: ${dateStr} ${timeStr}`,
            err
          );
          // Continue processing other rows even if this one fails
        }
      }
    }

    console.log(`Found ${userRows.length} records for user ${username}`);

    if (userRows.length === 0) {
      return res
        .status(404)
        .json({ message: "No records found for this user." });
    }

    // Sort by timestamp string - newest first
    userRows.sort((a, b) => b.timestamp.localeCompare(a.timestamp));

    const lastProduct = userRows[0].productName;
    console.log(`Last product for ${username}: ${lastProduct}`);
    res.status(200).json({
      message: "Last product added retrieved successfully.",
      lastProduct
    });
  } catch (error) {
    console.error("Error in lastProductadded:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

module.exports = {
  addOrUpdateInventory,
  lastProductadded
};
