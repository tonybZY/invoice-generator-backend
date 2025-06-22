const mongoose = require('mongoose');

const lineItemSchema = new mongoose.Schema({
  description: String,
  quantity: Number,
  unitPrice: Number,
  vatRate: { type: Number, default: 20 },
  total: Number
});

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, unique: true },
  type: { type: String, enum: ['invoice', 'quote'], default: 'invoice' },
  date: { type: Date, default: Date.now },
  dueDate: Date,
  status: { type: String, enum: ['draft', 'sent', 'paid', 'cancelled'], default: 'draft' },
  
  client: {
    name: String,
    email: String,
    address: String,
    phone: String,
    siret: String
  },
  
  lineItems: [lineItemSchema],
  
  subtotal: Number,
  totalVat: Number,
  total: Number,
  
  notes: String,
  terms: String
}, { timestamps: true });

// Auto-generate invoice number
invoiceSchema.pre('save', async function(next) {
  if (!this.invoiceNumber) {
    const count = await this.constructor.countDocuments();
    const year = new Date().getFullYear();
    this.invoiceNumber = `${this.type === 'invoice' ? 'FA' : 'DE'}${year}-${String(count + 1).padStart(4, '0')}`;
  }
  next();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
