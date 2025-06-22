const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
// const { generatePDF } = require('../services/pdfGenerator');
const { generatePDF } = require('../services/pdfGenerator');
const { calculateTotals } = require('../services/calculator');

const prisma = new PrismaClient();

// Get all invoices
router.get('/', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 100;
    const invoices = await prisma.invoice.findMany({
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: { lineItems: true }
    });
    res.json(invoices);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create invoice
router.post('/', async (req, res) => {
  try {
    const calculated = calculateTotals(req.body);
    
    // Generate invoice number
    const count = await prisma.invoice.count();
    const year = new Date().getFullYear();
    const prefix = calculated.type === 'invoice' ? 'FA' : 'DE';
    const invoiceNumber = `${prefix}${year}-${String(count + 1).padStart(4, '0')}`;
    
    const invoice = await prisma.invoice.create({
      data: {
        invoiceNumber,
        type: calculated.type || 'invoice',
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
    
    res.status(201).json(invoice);
  } catch (error) {
    console.error('Create invoice error:', error);
    res.status(400).json({ error: error.message });
  }
});

// Get single invoice
router.get('/:id', async (req, res) => {
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { lineItems: true }
    });
    
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    // Generate PDF
router.get('/:id/pdf', async (req, res) => {
  res.json({ message: 'PDF generation temporarily disabled' });
  /*
  try {
    const invoice = await prisma.invoice.findUnique({
      where: { id: req.params.id },
      include: { lineItems: true }
    });
    
    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });
    
    // Transform to match PDF generator format
    const invoiceData = {
      ...invoice,
      client: {
        name: invoice.clientName,
        email: invoice.clientEmail,
        address: invoice.clientAddress,
        phone: invoice.clientPhone,
        siret: invoice.clientSiret
      }
    };
    
    const pdf = await generatePDF(invoiceData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${invoice.invoiceNumber}.pdf`);
    res.send(pdf);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: error.message });
  }
  */
});
    };
    
    const pdf = await generatePDF(invoiceData);
    
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=${invoice.invoiceNumber}.pdf`);
    res.send(pdf);
  } catch (error) {
    console.error('PDF generation error:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
