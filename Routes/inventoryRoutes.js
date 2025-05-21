const express = require("express");
const router = express.Router();
const {
  addOrUpdateInventory,
  lastProductadded
} = require("../Resolvers/inventoryResolver");
const { authenticateToken } = require("../middleware/Authentication");

router.post(
  "/inventory",
  authenticateToken("Product Management"),
  addOrUpdateInventory
);
router.post("/recentproduct", authenticateToken(), lastProductadded);

module.exports = router;
