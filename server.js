const express = require('express');
const cors = require('cors');
const app = express();

const PORT = process.env.PORT || 3000;
const API_KEY = process.env.PI_API_KEY; // Set this in Render Environment

app.use(cors());
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('Chigalex1 Backend Online');
});

// Create payment
app.post('/create-payment', async (req, res) => {
  try {
    const { amount, memo, metadata } = req.body;
    
    const payment = await fetch('https://api.minepi.com/v2/payments', {
      method: 'POST',
      headers: {
        'Authorization': `Key ${API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        amount: amount,
        memo: memo,
        metadata: metadata
      })
    }).then(r => r.json());

    res.json(payment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Approve payment
app.post('/approve-payment', async (req, res) => {
  try {
    const { paymentId } = req.body;
    
    const result = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/approve`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${API_KEY}` }
    }).then(r => r.json());

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Complete payment
app.post('/complete-payment', async (req, res) => {
  try {
    const { paymentId, txid } = req.body;
    
    const result = await fetch(`https://api.minepi.com/v2/payments/${paymentId}/complete`, {
      method: 'POST',
      headers: { 'Authorization': `Key ${API_KEY}` },
      body: JSON.stringify({ txid })
    }).then(r => r.json());

    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});