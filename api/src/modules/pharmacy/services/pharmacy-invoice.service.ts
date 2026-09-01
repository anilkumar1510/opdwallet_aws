import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { PharmacyOrderDocument } from '../schemas/pharmacy-order.schema';

/** Same pdfkit approach as dental-invoice.service.ts, condensed. */
@Injectable()
export class PharmacyInvoiceService {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'invoices', 'pharmacy');

  constructor() {
    if (!existsSync(this.uploadDir)) mkdirSync(this.uploadDir, { recursive: true });
  }

  async generateInvoice(order: PharmacyOrderDocument): Promise<{ filePath: string; fileName: string }> {
    const fileName = `invoice-${order.orderId}-${Date.now()}.pdf`;
    const filePath = join(this.uploadDir, fileName);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const stream = createWriteStream(filePath);
        doc.pipe(stream);

        doc.fontSize(20).font('Helvetica-Bold').text('PHARMACY INVOICE', { align: 'center' }).moveDown(0.5);
        doc.fontSize(10).font('Helvetica')
          .text(`Order ID: ${order.orderId}`, { align: 'center' })
          .text(`Patient: ${order.patientName}`, { align: 'center' })
          .moveDown(1.5);

        doc.fontSize(12).font('Helvetica-Bold').text('Items delivered');
        doc.moveDown(0.5);
        order.items
          .filter((item) => item.retained)
          .forEach((item) => {
            doc.fontSize(10).font('Helvetica')
              .text(`${item.name} x${item.requestedQuantity} — Rs.${item.price * item.requestedQuantity}`);
          });

        doc.moveDown(1);
        doc.fontSize(11).font('Helvetica-Bold').text(`Bill amount: Rs.${order.billAmount}`);
        doc.text(`Paid from wallet: Rs.${order.walletDebitAmount}`);
        if (order.totalMemberPayment > 0) doc.text(`Paid by member: Rs.${order.totalMemberPayment}`);

        doc.moveDown(2);
        doc.fontSize(8).font('Helvetica').fillColor('#888').text('This is a system-generated invoice.', { align: 'center' });

        doc.end();
        stream.on('finish', () => resolve({ filePath, fileName }));
        stream.on('error', reject);
      } catch (error) {
        reject(error);
      }
    });
  }
}
