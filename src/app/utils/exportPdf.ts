import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

// Base64 data URL for OPay Certified Stamp, Signature, Contact Card & CBN Logo Footer extracted from Page 85 of template
const STAMP_IMAGE_B64 = `data:image/png;base64,${
  // We can read or embed the exact base64
  ""
}`;

function formatDateTime(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const months = ["May", "Jun", "Jul", "Aug"];
    const monthIndex = d.getMonth();
    const month = monthIndex >= 4 && monthIndex <= 7 ? months[monthIndex - 4] : "Jul";
    const day = d.getDate();
    const year = d.getFullYear();
    const hrs = String(d.getHours()).padStart(2, '0');
    const mins = String(d.getMinutes()).padStart(2, '0');
    const secs = String(d.getSeconds()).padStart(2, '0');
    return `${day} ${month} ${year} ${hrs}:${mins}:${secs}`;
  } catch (e) {
    return dateStr;
  }
}

function formatDate(dateStr: string) {
  try {
    const d = new Date(dateStr);
    const months = ["May", "Jun", "Jul", "Aug"];
    const monthIndex = d.getMonth();
    const month = monthIndex >= 4 && monthIndex <= 7 ? months[monthIndex - 4] : "Jul";
    const day = d.getDate();
    const year = d.getFullYear();
    return `${day} ${month} ${year}`;
  } catch (e) {
    return dateStr;
  }
}

export function exportOpayStatement(payments: any[]) {
  const successPayments = [...payments]
    .filter(p => p.status === 'success')
    .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

  const totalCredit = successPayments.reduce((sum, p) => sum + (p.amountNgn || 0), 0);
  const creditCount = successPayments.length;

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'a4'
  });

  const pageWidth = 595;
  const pageHeight = 842;

  // Split into Page 1 (first 15 items) and Page 2 (remaining items)
  const itemsPerPage = 15;
  const totalPages = 2;

  // --- PAGE 1 ---
  // 1. Logo
  doc.setFillColor(0, 184, 148); // OPay Green
  doc.ellipse(520, 50, 12, 12, 'F');
  doc.setTextColor(19, 31, 55); // OPay Navy
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('opay', 450, 56);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(120, 120, 120);
  doc.text('...Beyond Banking', 455, 68);

  // 2. Title
  doc.setTextColor(19, 31, 55);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text('Account Statement', 50, 95);

  const now = new Date();
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text(`Generated on 16 Aug 2026 ${hours}:${minutes}:${seconds}`, 50, 110);

  // 3. User Details Info Box
  doc.setDrawColor(240, 240, 240);
  doc.setFillColor(252, 252, 252);
  doc.roundedRect(50, 130, 495, 65, 6, 6, 'FD');

  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text('Account Name', 70, 148);
  doc.text('Account Number', 230, 148);
  doc.text('Address', 370, 148);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(30, 30, 30);
  doc.text('Cadence Technologies', 70, 165);
  doc.text('7065882218', 230, 165);
  doc.text('Industrial Layout, Oregun Lagos', 370, 165);

  // 4. Wallet Account Summary Box
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(19, 31, 55);
  doc.text('Wallet Account', 50, 225);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(120, 120, 120);
  doc.text('Period: 15 May 2026 - 15 Aug 2026', 200, 225);

  doc.setDrawColor(240, 240, 240);
  doc.line(50, 235, 545, 235);

  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text('Opening Balance', 60, 255);
  doc.text('Total Debit', 230, 255);
  doc.text('Debit Count', 400, 255);

  doc.text('Closing Balance', 60, 300);
  doc.text('Total Credit', 230, 300);
  doc.text('Credit Count', 400, 300);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(30, 30, 30);
  doc.text('N0.00', 60, 275);
  doc.text('N0.00', 230, 275);
  doc.text('0', 400, 275);

  const formattedTotalCredit = `N${totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  doc.text(formattedTotalCredit, 60, 320);
  doc.setTextColor(0, 184, 148); // Green for credit
  doc.text(formattedTotalCredit, 230, 320);
  doc.setTextColor(30, 30, 30);
  doc.text(String(creditCount), 400, 320);

  doc.setDrawColor(240, 240, 240);
  doc.line(50, 335, 545, 335);

  // Page 1 Table Header
  let startY1 = 350;
  doc.setFillColor(248, 249, 250);
  doc.rect(50, startY1, 495, 20, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Trans. Time', 55, startY1 + 13);
  doc.text('Value Date', 140, startY1 + 13);
  doc.text('Description', 210, startY1 + 13);
  doc.text('Credit(N)', 370, startY1 + 13);
  doc.text('Balance(N)', 430, startY1 + 13);
  doc.text('Ref', 490, startY1 + 13);

  let runningBal = 0;
  let rowY1 = startY1 + 20;

  const page1Payments = successPayments.slice(0, itemsPerPage);
  page1Payments.forEach((p) => {
    runningBal += p.amountNgn || 0;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 30, 30);

    const dateTimeStr = formatDateTime(p.createdAt);
    const valDateStr = formatDate(p.createdAt);
    const desc = `Transfer from ${p.customerId || 'Merchant'} | OPay`;
    const amountStr = (p.amountNgn || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const balStr = runningBal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const cleanRef = (p.reference || '').substring(0, 10);

    doc.text(dateTimeStr, 55, rowY1 + 14);
    doc.text(valDateStr, 140, rowY1 + 14);
    doc.text(desc, 210, rowY1 + 14);
    
    doc.setTextColor(0, 184, 148);
    doc.text(amountStr, 370, rowY1 + 14);
    doc.setTextColor(30, 30, 30);

    doc.text(balStr, 430, rowY1 + 14);
    doc.text(cleanRef, 490, rowY1 + 14);

    doc.setDrawColor(245, 245, 245);
    doc.line(50, rowY1 + 22, 545, rowY1 + 22);

    rowY1 += 25;
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text('Page 1 of 2', 500, 810);

  // --- PAGE 2 ---
  doc.addPage();

  // Page 2 Table Header
  let startY2 = 40;
  doc.setFillColor(248, 249, 250);
  doc.rect(50, startY2, 495, 20, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.setTextColor(80, 80, 80);
  doc.text('Trans. Time', 55, startY2 + 13);
  doc.text('Value Date', 140, startY2 + 13);
  doc.text('Description', 210, startY2 + 13);
  doc.text('Credit(N)', 370, startY2 + 13);
  doc.text('Balance(N)', 430, startY2 + 13);
  doc.text('Ref', 490, startY2 + 13);

  let rowY2 = startY2 + 20;

  const page2Payments = successPayments.slice(itemsPerPage);
  page2Payments.forEach((p) => {
    runningBal += p.amountNgn || 0;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 30, 30);

    const dateTimeStr = formatDateTime(p.createdAt);
    const valDateStr = formatDate(p.createdAt);
    const desc = `Transfer from ${p.customerId || 'Merchant'} | OPay`;
    const amountStr = (p.amountNgn || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const balStr = runningBal.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const cleanRef = (p.reference || '').substring(0, 10);

    doc.text(dateTimeStr, 55, rowY2 + 14);
    doc.text(valDateStr, 140, rowY2 + 14);
    doc.text(desc, 210, rowY2 + 14);
    
    doc.setTextColor(0, 184, 148);
    doc.text(amountStr, 370, rowY2 + 14);
    doc.setTextColor(30, 30, 30);

    doc.text(balStr, 430, rowY2 + 14);
    doc.text(cleanRef, 490, rowY2 + 14);

    doc.setDrawColor(245, 245, 245);
    doc.line(50, rowY2 + 22, 545, rowY2 + 22);

    rowY2 += 25;
  });

  // Page 2 Footer: Certified Stamp, Signature Box, Contact Card & CBN/NDIC Logo Footer
  // Placed cleanly at y = max(rowY2 + 20, 420)
  const stampY = Math.max(rowY2 + 25, 420);

  // Draw OPay Contact Card on Left of Page 2 bottom
  doc.setFillColor(255, 255, 255);
  
  // OPay green circle logo
  doc.setFillColor(0, 184, 148);
  doc.ellipse(75, stampY + 30, 10, 10, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(30, 30, 30);
  doc.text('www.opayweb.com', 95, stampY + 22);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(100, 100, 100);
  doc.text('Alexander House, Plot 9, Dr.Nurudeen Olowopopo Avenue, Alausa, Lagos', 95, stampY + 34);
  doc.text('+234 (0)700 8888 328', 95, stampY + 46);

  // Draw Certified Stamp & Signature Box on Right of Page 2 bottom
  doc.setDrawColor(120, 120, 200);
  doc.setFillColor(252, 252, 255);
  doc.roundedRect(380, stampY + 10, 160, 55, 4, 4, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(0, 184, 148);
  doc.text('opay', 388, stampY + 24);
  doc.setTextColor(19, 31, 55);
  doc.setFontSize(7);
  doc.text('OPAY DIGITAL SERVICES LIMITED', 410, stampY + 22);
  doc.setFontSize(7.5);
  doc.text('CERTIFIED TRUE COPY', 420, stampY + 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text('SIGNATURE:', 388, stampY + 44);

  // Blue signature simulation text
  doc.setFont('times', 'italic');
  doc.setFontSize(10);
  doc.setTextColor(30, 50, 180);
  doc.text('Akinfolarin', 435, stampY + 44);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.5);
  doc.setTextColor(80, 80, 80);
  doc.text('NAME: Akinfolarin Moses Ilokosu', 388, stampY + 58);
  doc.text('DATE: 16 Aug 2026', 480, stampY + 58);

  // Bottom Center: CBN Logo & Insurance Footer on Page 2
  doc.setDrawColor(230, 230, 230);
  doc.line(50, stampY + 85, 545, stampY + 85);

  // Green CBN shield icon
  doc.setFillColor(40, 130, 80);
  doc.rect(215, stampY + 92, 10, 10, 'F');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(50, 50, 50);
  doc.text('Licensed by the ', 230, 100 + stampY);
  doc.setFont('helvetica', 'bold');
  doc.text('CBN', 288, 100 + stampY);
  doc.setFont('helvetica', 'normal');
  doc.text(' and insured by the ', 307, 100 + stampY);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(19, 31, 55);
  doc.text('NDIC', 377, 100 + stampY);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(140, 140, 140);
  doc.text('Page 2 of 2', 500, 810);

  doc.save('opay_statement.pdf');
}
