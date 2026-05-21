const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

const PI_API_KEY = process.env.PI_API_KEY; // Get from Pi Developer Portal
const PI_WALLET_ADDRESS = "GABWRTXUPYTRO7RBCMIPKP55UZ6LKVPSX2NOMXXFBFOOZEFQTKJSGZ7J"; // Your Pi wallet address
const MEMBERSHIP_AMOUNT = 1;

// Simple database - use MongoDB/Postgres in production
let paidUsers = new Set();

// Approve payment
app.post('/approve-payment', async (req, res) => {
  const { paymentId } = req.body;
  try {
    await axios.post(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {}, {
      headers: { 'Authorization': `Key ${PI_API_KEY}` }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Complete and verify payment
app.post('/complete-payment', async (req, res) => {
  const { paymentId, txid, username } = req.body;
  try {
    const payment = await axios.get(`https://api.minepi.com/v2/payments/${paymentId}`, {
      headers: { 'Authorization': `Key ${PI_API_KEY}` }
    });
    
    const p = payment.data;
    
    // Verify payment
    if (p.amount === MEMBERSHIP_AMOUNT && 
        p.receiver === PI_WALLET_ADDRESS && 
        p.status.developer_completed === false) {
      
      await axios.post(`https://api.minepi.com/v2/payments/${paymentId}/complete`, { txid }, {
        headers: { 'Authorization': `Key ${PI_API_KEY}` }
      });
      
      paidUsers.add(username);
      res.json({ success: true });
    } else {
      res.status(400).json({ error: "Invalid payment" });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Check if user paid
app.get('/check-membership', (req, res) => {
  const { username } = req.query;
  res.json({ paid: paidUsers.has(username) });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));