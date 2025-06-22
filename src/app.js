const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Invoice Generator API', version: '1.0.0' });
});

app.use('/api/invoices', require('./routes/invoices'));

// n8n webhook endpoint
app.post('/api/webhook/n8n', async (req, res) => {
  try {
    const { action, data } = req.body;
    const { calculateTotals } = require('./services/calculator');
    
    switch(action) {
      case 'create_invoice':
      case 'create_quote':
        const invoiceData = {
          ...data,
          type: action === 'create_invoice' ? 'invoice' : 'quote'
        };
        
        // Calculate totals
        const calculated = calculateTotals(invoiceData);
        
        // Generate invoice number
        const count = await prisma.invoice.count();
        const year = new Date().getFullYear();
        const prefix = calculated.type === 'invoice' ? 'FA' : 'DE';
        const invoiceNumber = `${prefix}${year}-${String(count + 1).padStart(4, '0')}`;
        
        // Create invoice with line items
        const invoice = await prisma.invoice.create({
          data: {
            invoiceNumber,
            type: calculated.type,
            clientName: calculated.client.name,
            clientEmail: calculated.client.email,
            clientAddress: calculated.client.address,
            clientPhone: calculated.client.phone,
            clientSiret: calculated.client.siret,
            subtotal: calculated.subtotal,
            totalVat: calculated.totalVat,
            total: calculated.total,
            notes: calculated.notes,
            dueDate: calculated.dueDate ? new Date(calculated.dueDate) : null,
            lineItems: {
              create: calculated.lineItems
            }
          },
          include: {
            lineItems: true
          }
        });
        
        res.json({ success: true, invoice });
        break;
      
      default:
        res.status(400).json({ error: 'Unknown action' });
    }
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
