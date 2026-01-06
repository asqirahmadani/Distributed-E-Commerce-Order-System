import express from "express";

const router = express.Router();

router.get("/orders", (req, res) => {
  res.json({ message: "Orders endpoint - coming soon" });
});

router.post("/orders", (req, res) => {
  res.json({ message: "Create order ednpoint - coming soon" });
});

export default router;
