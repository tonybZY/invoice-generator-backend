const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/invoice-generator')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Invoice Generator API', version: '1.0.0' });
});

app.use('/api/invoices', require('./routes/invoices'));

// n8n webhook endpoint
app.post('/api/webhook/n8n', async (req, res) => {
  try {
    const { action, data } = req.body;
    const Invoice = require('./models/Invoice');
    
    switch(action) {
      case 'create_invoice':
      case 'create_quote':
        const invoiceData = {
          ...data,
          type: action === 'create_invoice' ? 'invoice' : 'quote'
        };
        const invoice = new Invoice(invoiceData);
        await invoice.save();
        res.json({ success: true, invoice });
        break;
      
      default:
        res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
