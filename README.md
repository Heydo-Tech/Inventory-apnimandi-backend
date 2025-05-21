Apni Mandi Backend
This repository contains the backend for the Apni Mandi inventory management system, designed to support the tracking and visualization of waste and product inventories for a farmers' market. The backend provides RESTful APIs to serve data to the frontend, built with React, Vite, and Tailwind CSS. It handles inventory data storage, retrieval, and pagination, ensuring efficient management of stock and waste across multiple store locations.
Table of Contents

Technology Stack
Prerequisites
Installation
Environment Variables
Running the Application
API Endpoints
Database Schema
Contributing
License

Technology Stack

Node.js: JavaScript runtime for building the server.
Express: Web framework for creating RESTful APIs.
MongoDB: NoSQL database for storing inventory data.
Mongoose: ODM for MongoDB to manage schemas and queries.
dotenv: For managing environment variables.
CORS: To enable cross-origin requests from the frontend.

Prerequisites
Ensure you have the following installed:

Node.js (v16 or higher)
MongoDB (local or cloud instance, e.g., MongoDB Atlas)
npm or yarn
Git

Installation

Clone the repository:
git clone https://github.com/apni-mandi/apni-mandi-backend.git
cd apni-mandi-backend

Install dependencies:
npm install

or
yarn install

Set up MongoDB:

Ensure MongoDB is running locally or provide a connection string to a cloud instance (e.g., MongoDB Atlas).
Create a database named apni_mandi (or configure the name in the environment variables).

Environment Variables
Create a .env file in the root directory and configure the following variables:

# MongoDB connection string

MONGODB_URI=mongodb://localhost:27017/apni_mandi

# Port for the server

PORT=5000

# Frontend URL for CORS (e.g., React app)

FRONTEND_URL=http://localhost:5173

MONGODB_URI: Connection string for your MongoDB database.
PORT: Port on which the backend server runs.
FRONTEND_URL: URL of the frontend app to allow CORS.

Running the Application

Start the server:
npm start

or
yarn start

The server will run on http://localhost:5000 (or the port specified in .env).

Development mode (with hot-reloading using nodemon):
npm run dev

or
yarn dev

API Endpoints
The backend provides the following RESTful API endpoints to support the frontend inventory management system. All endpoints are prefixed with /api2/inventory.

1. Get Waste Inventory

Endpoint: GET /api2/inventory/getWasteInventory?page=<page>&limit=<limit>
Description: Retrieves paginated waste inventory data.
Query Parameters:
page (optional, default: 1): Page number for pagination.
limit (optional, default: 10): Number of items per page.

Response:{
"data": [
{
"_id": "string",
"storeName": "string",
"quantity": number,
"currentDate": "string (YYYY-MM-DD)",
"__v": number
}
],
"currentPage": number,
"totalPages": number
}

Error Response:{
"error": "string"
}

2. Get Product Inventory

Endpoint: GET /api2/inventory/getProductInventory?page=<page>&limit=<limit>
Description: Retrieves paginated product inventory data.
Query Parameters:
page (optional, default: 1): Page number for pagination.
limit (optional, default: 10): Number of items per page.

Response:{
"productInventoryData": [
{
"_id": "string",
"currentDate": "string (YYYY-MM-DD)",
"currentTime": "string (HH:mm:ss)",
"expiryDate": "string (YYYY-MM-DD)",
"isTaken": boolean,
"__v": number
}
],
"currentPage": number,
"totalPages": number
}

Error Response:{
"error": "string"
}

Database Schema
The backend uses MongoDB with Mongoose schemas to manage inventory data. Below are the primary schemas:
WasteInventory
{
storeName: { type: String, required: true }, // e.g., "Sunnyvale", "Milpitas"
quantity: { type: Number, required: true }, // Waste quantity
currentDate: { type: String, required: true }, // Date in YYYY-MM-DD format
}

ProductInventory
{
currentDate: { type: String, required: true }, // Date in YYYY-MM-DD format
currentTime: { type: String, required: true }, // Time in HH:mm:ss format
expiryDate: { type: String }, // Expiry date in YYYY-MM-DD format
isTaken: { type: Boolean, default: false }, // Indicates if the item is taken
}

Contributing
We welcome
