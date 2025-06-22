const express = require('express');
const router = express.Router();
const Invoice = require('../models/Invoice');
const { generatePDF } = require('../services/pdfGenerator');
const { calculateTotals } = require('../services/calculator');

// Get all invoices
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const invoices = await Invoice.find()
      .sort('-createdAt')
      .limit(limit);
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create invoice
router.post('/', async (req, res) => {
  try {
    const invoiceData = calculateTotals(req.body);
    const invoice = new Invoice(invoiceData);
    await invoice.save();
    res.status(201).json(invoice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get single invoice
router.get('/:id', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    res.json(invoice);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update invoice
router.put('/:id', async (req, res) => {
  try {
    const invoiceData = calculateTotals(req.body);
    const invoice = await Invoice.findByIdAndUpdate(
      req.params.id, 
      invoiceData,
      { new: true }
    );
    res.json(invoice);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete invoice
router.delete('/:id', async (req, res) => {
  try {
    await Invoice.findByIdAndDelete(req.params.id);
    res.json({ message: 'Invoice deleted' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Generate PDF
router.get('/:id/pdf', async (req, res) => {
  try {
    const invoice = await Invoice.findById(req.params.id);
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    
    const pdf = await generatePDF(invoice);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${invoice.invoiceNumber}.pdf`);
    res.send(pdf);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
