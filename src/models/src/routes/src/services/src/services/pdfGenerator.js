const puppeteer = require('puppeteer');
const handlebars = require('handlebars');

async function generatePDF(invoice) {
  // HTML template
  const templateHtml = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { 
          font-family: Arial, sans-serif; 
          margin: 40px; 
          color: #333;
        }
        .header { 
          display: flex; 
          justify-content: space-between; 
          margin-bottom: 40px;
          border-bottom: 2px solid #333;
          padding-bottom: 20px;
        }
        .invoice-title { 
          font-size: 32px; 
          font-weight: bold; 
          color: #2563eb;
        }
        .invoice-details { 
          text-align: right; 
        }
        .invoice-details p {
          margin: 5px 0;
        }
        .client-info { 
          margin-bottom: 30px;
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
        }
        .client-info h3 {
          margin-top: 0;
          color: #2563eb;
        }
        table { 
          width: 100%; 
          border-collapse: collapse; 
          margin: 20px 0; 
        }
        th, td { 
          padding: 12px; 
          text-align: left; 
          border-bottom: 1px solid #ddd; 
        }
        th { 
          background-color: #2563eb;
          color: white;
          font-weight: bold;
        }
        tr:hover {
          background-color: #f5f5f5;
        }
        .totals { 
          margin-top: 30px;
          display: flex;
          justify-content: flex-end;
        }
        .totals-box {
          background: #f5f5f5;
          padding: 20px;
          border-radius: 8px;
          min-width: 300px;
        }
        .total-row { 
          display: flex; 
          justify-content: space-between; 
          margin: 10px 0;
          font-size: 16px;
        }
        .total-row.final {
          font-size: 20px;
          font-weight: bold;
          color: #2563eb;
          border-top: 2px solid #333;
          padding-top: 10px;
          margin-top: 10px;
        }
        .footer {
          margin-top: 50px;
          text-align: center;
          color: #666;
          font-size: 12px;
        }
        .notes {
          margin-top: 40px;
          padding: 20px;
          background: #fff9c4;
          border-radius: 8px;
          border-left: 4px solid #f9a825;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div>
          <h1 class="invoice-title">{{#if (eq type 'invoice')}}FACTURE{{else}}DEVIS{{/if}}</h1>
        </div>
        <div class="invoice-details">
          <p><strong>N°:</strong> {{invoiceNumber}}</p>
          <p><strong>Date:</strong> {{formatDate date}}</p>
          {{#if dueDate}}<p><strong>Échéance:</strong> {{formatDate dueDate}}</p>{{/if}}
        </div>
      </div>
      
      <div class="client-info">
        <h3>Informations client</h3>
        <p><strong>{{client.name}}</strong></p>
        {{#if client.address}}<p>{{client.address}}</p>{{/if}}
        {{#if client.email}}<p>Email: {{client.email}}</p>{{/if}}
        {{#if client.phone}}<p>Tél: {{client.phone}}</p>{{/if}}
        {{#if client.siret}}<p>SIRET: {{client.siret}}</p>{{/if}}
      </div>
      
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th style="width: 100px;">Quantité</th>
            <th style="width: 120px;">Prix unitaire</th>
            <th style="width: 80px;">TVA %</th>
            <th style="width: 120px; text-align: right;">Total HT</th>
          </tr>
        </thead>
        <tbody>
          {{#each lineItems}}
          <tr>
            <td>{{description}}</td>
            <td style="text-align: center;">{{quantity}}</td>
            <td>{{unitPrice}} €</td>
            <td style="text-align: center;">{{vatRate}}%</td>
            <td style="text-align: right;">{{total}} €</td>
          </tr>
          {{/each}}
        </tbody>
      </table>
      
      <div class="totals">
        <div class="totals-box">
          <div class="total-row">
            <span>Total HT:</span>
            <span>{{subtotal}} €</span>
          </div>
          <div class="total-row">
            <span>TVA:</span>
            <span>{{totalVat}} €</span>
          </div>
          <div class="total-row final">
            <span>Total TTC:</span>
            <span>{{total}} €</span>
          </div>
        </div>
      </div>
      
      {{#if notes}}
      <div class="notes">
        <h4>Notes</h4>
        <p>{{notes}}</p>
      </div>
      {{/if}}
      
      <div class="footer">
        <p>Document généré automatiquement le {{formatDate currentDate}}</p>
      </div>
    </body>
    </html>
  `;
  
  // Register helpers
  handlebars.registerHelper('formatDate', (date) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  });
  
  handlebars.registerHelper('eq', (a, b) => a === b);
  
  // Compile template with data
  const template = handlebars.compile(templateHtml);
  const html = template({
    ...invoice.toObject(),
    currentDate: new Date()
  });
  
  // Generate PDF with Puppeteer
  const browser = await puppeteer.launch({ 
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'] 
  });
  
  const page = await browser.newPage();
  await page.setContent(html, { waitUntil: 'networkidle0' });
  
  const pdf = await page.pdf({ 
    format: 'A4',
    printBackground: true,
    margin: {
      top: '20mm',
      right: '20mm',
      bottom: '20mm',
      left: '20mm'
    }
  });
  
  await browser.close();
  
  return pdf;
}

module.exports = { generatePDF };
