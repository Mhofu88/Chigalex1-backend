const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(express.json());
app.use(cors());

const PI_API_KEY = process.env.PI_API_KEY; 
const PI_WALLET_ADDRESS = "GXXXXXXXXXXXXXXXXXXXX"; // REPLACE with your Pi mainnet wallet address
const MEMBERSHIP_AMOUNT = 1;

let paidUsers = new Set();

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

app.post('/complete-payment', async (req, res) => {
  const { paymentId, txid, username } = req.body;
  try {
    const payment = await axios.get(`https://api.minepi.com/v2/payments/${paymentId}`, {
      headers: { 'Authorization': `Key ${PI_API_KEY}` }
    });
    
    const p = payment.data;
    if (p.amount === MEMBERSHIP_AMOUNT && p.receiver === PI_WALLET_ADDRESS) {
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

app.get('/check-membership', (req, res) => {
  const { username } = req.query;
  res.json({ paid: paidUsers.has(username) });
});

app.get('/', (req, res) => res.send('Chigalex1 Backend Online'));
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on ${PORT}`));