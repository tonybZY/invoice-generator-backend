function calculateTotals(invoiceData) {
  let subtotal = 0;
  let totalVat = 0;
  
  // Calculate line items
  invoiceData.lineItems = invoiceData.lineItems.map(item => {
    const lineTotal = item.quantity * item.unitPrice;
    const vatAmount = lineTotal * (item.vatRate / 100);
    
    subtotal += lineTotal;
    totalVat += vatAmount;
    
    return {
      ...item,
      total: lineTotal
    };
  });
  
  return {
    ...invoiceData,
    subtotal: Math.round(subtotal * 100) / 100,
    totalVat: Math.round(totalVat * 100) / 100,
    total: Math.round((subtotal + totalVat) * 100) / 100
  };
}

module.exports = { calculateTotals };
