import { jsPDF } from 'jspdf';
import { Invoice, Quotation } from '../../types.ts';

export function downloadInvoicePdf(invoice: Invoice, customerData?: any) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(15, 23, 42); // slate-900 deep navy
  doc.rect(0, 0, pageWidth, 90, 'F');

  // Company Logo / Brand
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('NEXORA', 40, 48);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184); // slate-400
  doc.text('Subscription & Revenue Intelligence Platform', 40, 64);
  doc.text('Tax ID: US-EIN-99218204 | support@nexora.io', 40, 76);

  // Invoice Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('TAX INVOICE', pageWidth - 40, 52, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text(`# ${invoice.invoiceNumber}`, pageWidth - 40, 68, { align: 'right' });

  // Bill To & Invoice Info Blocks
  const startY = 125;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('BILLED TO:', 40, startY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text(customerData?.name || invoice.customerName || 'Customer', 40, startY + 16);
  if (customerData?.companyName) {
    doc.text(customerData.companyName, 40, startY + 30);
  }
  doc.text(customerData?.billingAddress || 'Corporate Headquarters', 40, startY + 44);
  doc.text(`Tax ID: ${customerData?.taxId || 'N/A'} | ${customerData?.email || invoice.customerEmail || ''}`, 40, startY + 58);

  // Meta Info Table on right
  const metaX = pageWidth - 200;
  doc.setFont('helvetica', 'bold');
  doc.text('Invoice Date:', metaX, startY);
  doc.text('Due Date:', metaX, startY + 16);
  doc.text('Billing Period:', metaX, startY + 32);
  doc.text('Payment Status:', metaX, startY + 48);

  doc.setFont('helvetica', 'normal');
  doc.text(invoice.invoiceDate.slice(0, 10), pageWidth - 40, startY, { align: 'right' });
  doc.text(invoice.dueDate.slice(0, 10), pageWidth - 40, startY + 16, { align: 'right' });
  doc.text(invoice.billingPeriod, pageWidth - 40, startY + 32, { align: 'right' });
  doc.text(invoice.status, pageWidth - 40, startY + 48, { align: 'right' });

  // Items Table Header
  const tableTop = startY + 90;
  doc.setFillColor(241, 245, 249);
  doc.rect(40, tableTop, pageWidth - 80, 26, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text('DESCRIPTION', 50, tableTop + 17);
  doc.text('QTY', 340, tableTop + 17, { align: 'center' });
  doc.text('UNIT PRICE', 420, tableTop + 17, { align: 'right' });
  doc.text('TOTAL (INR)', pageWidth - 50, tableTop + 17, { align: 'right' });

  // Line Item
  const lineY = tableTop + 45;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  const desc = invoice.notes || `Recurring SaaS Subscription Billing (${invoice.billingPeriod})`;
  doc.text(desc, 50, lineY);
  doc.text('1', 340, lineY, { align: 'center' });
  doc.text(`₹${Number(invoice.subtotal).toFixed(2)}`, 420, lineY, { align: 'right' });
  doc.text(`₹${Number(invoice.subtotal).toFixed(2)}`, pageWidth - 50, lineY, { align: 'right' });

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(40, lineY + 25, pageWidth - 40, lineY + 25);

  // Financial Breakdown Box
  const summaryY = lineY + 50;
  const summaryX = pageWidth - 240;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal:', summaryX, summaryY);
  doc.text(`₹${Number(invoice.subtotal).toFixed(2)}`, pageWidth - 50, summaryY, { align: 'right' });

  doc.text('Discount:', summaryX, summaryY + 18);
  doc.text(`- ₹${Number(invoice.discountAmount || 0).toFixed(2)}`, pageWidth - 50, summaryY + 18, { align: 'right' });

  doc.text('Taxes (GST 18%):', summaryX, summaryY + 36);
  doc.text(`+ ₹${Number(invoice.taxAmount || 0).toFixed(2)}`, pageWidth - 50, summaryY + 36, { align: 'right' });

  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX, summaryY + 46, pageWidth - 40, summaryY + 46);

  // Total
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Total Invoiced:', summaryX, summaryY + 64);
  doc.text(`₹${Number(invoice.total).toFixed(2)}`, pageWidth - 50, summaryY + 64, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(16, 185, 129); // emerald-600
  doc.text('Amount Paid:', summaryX, summaryY + 82);
  doc.text(`₹${Number(invoice.amountPaid || 0).toFixed(2)}`, pageWidth - 50, summaryY + 82, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(225, 29, 72); // rose-600
  doc.text('Outstanding Due:', summaryX, summaryY + 100);
  doc.text(`₹${Number(invoice.outstandingAmount || 0).toFixed(2)}`, pageWidth - 50, summaryY + 100, { align: 'right' });

  // Footer notes & bank details
  const footerY = 660;
  doc.setFillColor(248, 250, 252);
  doc.rect(40, footerY, pageWidth - 80, 80, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(15, 23, 42);
  doc.text('REMITTANCE & WIRE INSTRUCTIONS', 55, footerY + 22);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('Bank Name: Silicon Valley Bank / HDFC Bank Global', 55, footerY + 38);
  doc.text('Account Number: 9918-2049-1120-4491 | Swift: HDFCINBB', 55, footerY + 50);
  doc.text('Please quote invoice number on bank reference for immediate reconciliation.', 55, footerY + 62);

  // Bottom stamp
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('Generated electronically by NEXORA Revenue Intelligence Engine. Certified valid.', pageWidth / 2, 780, {
    align: 'center',
  });

  doc.save(`${invoice.invoiceNumber}.pdf`);
}

export function downloadQuotationPdf(quotation: Quotation, customerData?: any) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Banner
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 90, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(255, 255, 255);
  doc.text('NEXORA', 40, 48);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Enterprise SaaS Subscription Proposal', 40, 64);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('OFFICIAL QUOTATION', pageWidth - 40, 52, { align: 'right' });

  doc.setFontSize(10);
  doc.setTextColor(203, 213, 225);
  doc.text(`# ${quotation.quotationNumber}`, pageWidth - 40, 68, { align: 'right' });

  const startY = 125;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('PREPARED FOR:', 40, startY);

  doc.setFont('helvetica', 'normal');
  doc.text(customerData?.name || quotation.customerName || 'Customer', 40, startY + 16);
  if (customerData?.companyName) doc.text(customerData.companyName, 40, startY + 30);
  doc.text(customerData?.billingAddress || 'Headquarters', 40, startY + 44);

  const metaX = pageWidth - 200;
  doc.setFont('helvetica', 'bold');
  doc.text('Date:', metaX, startY);
  doc.text('Valid Until:', metaX, startY + 16);
  doc.text('Payment Terms:', metaX, startY + 32);
  doc.text('Status:', metaX, startY + 48);

  doc.setFont('helvetica', 'normal');
  doc.text(quotation.quotationDate.slice(0, 10), pageWidth - 40, startY, { align: 'right' });
  doc.text(quotation.expiryDate.slice(0, 10), pageWidth - 40, startY + 16, { align: 'right' });
  doc.text(quotation.paymentTerms, pageWidth - 40, startY + 32, { align: 'right' });
  doc.text(quotation.status, pageWidth - 40, startY + 48, { align: 'right' });

  // Table
  const tableTop = startY + 90;
  doc.setFillColor(241, 245, 249);
  doc.rect(40, tableTop, pageWidth - 80, 26, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(51, 65, 85);
  doc.text('SUBSCRIPTION PLAN / ADD-ONS', 50, tableTop + 17);
  doc.text('SEATS', 340, tableTop + 17, { align: 'center' });
  doc.text('UNIT PRICE', 420, tableTop + 17, { align: 'right' });
  doc.text('TOTAL (INR)', pageWidth - 50, tableTop + 17, { align: 'right' });

  const lineY = tableTop + 45;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(30, 41, 59);
  doc.text(quotation.planName || 'Enterprise Subscription Plan', 50, lineY);
  doc.text(String(quotation.quantity || 1), 340, lineY, { align: 'center' });
  doc.text(`₹${Number(quotation.subtotal / (quotation.quantity || 1)).toFixed(2)}`, 420, lineY, { align: 'right' });
  doc.text(`₹${Number(quotation.subtotal).toFixed(2)}`, pageWidth - 50, lineY, { align: 'right' });

  // Financial summary
  const summaryY = lineY + 60;
  const summaryX = pageWidth - 240;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(71, 85, 105);
  doc.text('Subtotal:', summaryX, summaryY);
  doc.text(`₹${Number(quotation.subtotal).toFixed(2)}`, pageWidth - 50, summaryY, { align: 'right' });

  doc.text('Applied Discount:', summaryX, summaryY + 18);
  doc.text(`- ₹${Number(quotation.discountAmount || 0).toFixed(2)}`, pageWidth - 50, summaryY + 18, { align: 'right' });

  doc.text('Estimated Tax (18%):', summaryX, summaryY + 36);
  doc.text(`+ ₹${Number(quotation.taxAmount || 0).toFixed(2)}`, pageWidth - 50, summaryY + 36, { align: 'right' });

  doc.setDrawColor(203, 213, 225);
  doc.line(summaryX, summaryY + 46, pageWidth - 40, summaryY + 46);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(15, 23, 42);
  doc.text('Proposal Total:', summaryX, summaryY + 64);
  doc.text(`₹${Number(quotation.totalAmount).toFixed(2)}`, pageWidth - 50, summaryY + 64, { align: 'right' });

  // Terms & Acceptance
  const termsY = 580;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('TERMS & CONDITIONS:', 40, termsY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.text('1. Quotation valid for 30 calendar days from issue date.', 40, termsY + 16);
  doc.text('2. Subscription activation takes effect immediately upon online customer acceptance.', 40, termsY + 28);
  doc.text('3. Invoices subject to calendar-aware automated recurring renewal cycles.', 40, termsY + 40);

  doc.save(`${quotation.quotationNumber}.pdf`);
}
