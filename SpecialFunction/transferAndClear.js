const { google } = require('googleapis');
const { JWT } = require('google-auth-library');
const moment = require('moment'); // For formatting date and time

// Load Google Sheets credentials
const credentials = require('../config/ google_credentials.json'); // Corrected path

// Ensure private key is properly formatted by replacing escaped newlines
const client = new JWT({
  email: credentials.client_email,
  key: credentials.private_key.replace(/\\n/g, '\n'), // Fixing private key format
  scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

// Google Sheet ID and sheet names
const SPREADSHEET_ID = '1CF9ZBxHHWd7F9YXG9gILgbshsIdfykuFO-9-D0F_8zo';
const WASTE_MANAGEMENT_SHEET = 'WasteManagment';
const PRODUCT_MANAGEMENT_SHEET = 'ProductManagment';
const HISTORY_SHEET_NAME = 'history';

// Function to transfer data from WasteManagment and ProductManagment to history and clear the original sheets
const transferAndClearSheets = async () => {
  console.log('Called transferAndClearSheets');
  try {
    const sheets = google.sheets({ version: 'v4', auth: client });

    // Function to transfer and clear data from a specific sheet
    const transferDataFromSheet = async (sourceSheetName) => {
      console.log(`Transferring data from ${sourceSheetName}`);
      
      // Fetch data from the source sheet
      const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sourceSheetName}!A:H`, // Adjusted to include all necessary columns
      });

      const rows = response.data.values;

      if (!rows || rows.length === 0) {
        console.log(`No data found in ${sourceSheetName}.`);
        return [];
      }

      // Prepare new data for the history sheet in the required format
      const formattedRows = rows.slice(1).map(row => {
        const [date, time, username, establishment, barcode, productName, quantity, isAdded] = row;

        // Format date and time
        const formattedDate = moment(date).format('YYYY-MM-DD'); // Full date format
        const formattedTime = moment(time, 'HH:mm').format('HH:mm'); // Ensure time format
        const checkbox = isAdded ? 'TRUE' : 'FALSE'; // Use checkbox value

        return [formattedDate, formattedTime, username, establishment, barcode, productName, quantity, checkbox];
      });

      // Append the formatted data to the history sheet
      if (formattedRows.length > 0) {
        await sheets.spreadsheets.values.append({
          spreadsheetId: SPREADSHEET_ID,
          range: `${HISTORY_SHEET_NAME}!A:H`, // Adjusting to the 8-column format
          valueInputOption: 'USER_ENTERED',
          resource: {
            values: formattedRows,
          },
        });
        console.log(`Data appended to history sheet from ${sourceSheetName}.`);
      }

      // Clear data in the source sheet
      await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sourceSheetName}!A:H`,
      });
      console.log(`${sourceSheetName} cleared.`);

      return formattedRows;
    };

    // Transfer data from both sheets
    const WasteManagmentData = await transferDataFromSheet(WASTE_MANAGEMENT_SHEET);
    const ProductManagmentData = await transferDataFromSheet(PRODUCT_MANAGEMENT_SHEET);

    // Log a summary
    const totalTransferredRows = WasteManagmentData.length + ProductManagmentData.length;
    console.log(`Total rows transferred to history: ${totalTransferredRows}`);

  } catch (error) {
    if (error.response) {
      console.error('Google API Error:', error.response.data);
    } else {
      console.error('Error transferring data or clearing the sheets:', error);
    }
  }
};

module.exports = {
  transferAndClearSheets,
};
