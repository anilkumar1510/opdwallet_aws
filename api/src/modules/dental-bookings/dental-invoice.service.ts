import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { DentalBooking, DentalBookingDocument } from './schemas/dental-booking.schema';
import * as PDFDocument from 'pdfkit';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class DentalInvoiceService {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'invoices', 'dental');

  constructor(
    @InjectModel(DentalBooking.name)
    private dentalBookingModel: Model<DentalBookingDocument>,
  ) {
    // Ensure upload directory exists
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  /**
   * Generate PDF invoice for dental booking
   */
  async generateInvoice(
    booking: DentalBookingDocument,
  ): Promise<{ invoiceId: string; filePath: string; fileName: string }> {
    console.log('[DentalInvoice] Generating invoice for booking:', booking.bookingId);

    // Generate invoice ID
    const invoiceId = this.generateInvoiceId(booking.bookingId);
    const fileName = `invoice-${invoiceId}-${Date.now()}.pdf`;
    const filePath = join(this.uploadDir, fileName);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const stream = createWriteStream(filePath);

        doc.pipe(stream);

        // HEADER SECTION
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .text('DENTAL INVOICE', { align: 'center' })
          .moveDown(0.5);

        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Invoice ID: ${invoiceId}`, { align: 'center' })
          .text(`Booking ID: ${booking.bookingId}`, { align: 'center' })
          .moveDown(1.5);

        // CLINIC & PATIENT INFO BOX
        const boxY = doc.y;
        doc.rect(50, boxY, 495, 120).stroke();

        // Left side - Clinic Info
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('Service Provider:', 60, boxY + 10);

        doc
          .font('Helvetica')
          .fontSize(10)
          .text(booking.clinicName, 60, boxY + 28)
          .text(booking.clinicAddress.street, 60, boxY + 43)
          .text(
            `${booking.clinicAddress.city}, ${booking.clinicAddress.state} - ${booking.clinicAddress.pincode}`,
            60,
            boxY + 58,
          )
          .text(`Contact: ${booking.clinicContact || 'N/A'}`, 60, boxY + 73);

        // Right side - Patient Info
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('Patient Details:', 320, boxY + 10);

        doc
          .font('Helvetica')
          .fontSize(10)
          .text(`Name: ${booking.patientName}`, 320, boxY + 28)
          .text(`Relationship: ${booking.patientRelationship}`, 320, boxY + 43)
          .text(`Patient ID: ${booking.patientId}`, 320, boxY + 58);

        doc.y = boxY + 130;
        doc.moveDown(0.5);

        // APPOINTMENT DETAILS
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('Appointment Details:')
          .moveDown(0.3);

        doc
          .font('Helvetica')
          .fontSize(10)
          .text(`Service: ${booking.serviceName}`, 60)
          .text(`Service Code: ${booking.serviceCode}`, 60)
          .text(
            `Date: ${new Date(booking.appointmentDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
            })}`,
            60,
          )
          .text(`Time: ${booking.appointmentTime}`, 60)
          .text(`Duration: ${booking.duration} minutes`, 60);

        doc.moveDown(1);

        // PAYMENT BREAKDOWN TABLE
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text('Payment Breakdown', 50, doc.y)
          .moveDown(0.5);

        const tableTop = doc.y;

        // Table borders
        doc.rect(50, tableTop, 495, 150).stroke();
        doc.moveTo(50, tableTop + 30).lineTo(545, tableTop + 30).stroke();

        // Header row
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Description', 60, tableTop + 10)
          .text('Amount (₹)', 450, tableTop + 10, { align: 'right', width: 85 });

        // Data rows
        let rowY = tableTop + 40;
        const lineHeight = 20;

        doc.font('Helvetica');

        // Bill Amount
        doc
          .text('Total Bill Amount', 60, rowY)
          .text(booking.billAmount.toFixed(2), 450, rowY, { align: 'right', width: 85 });
        rowY += lineHeight;

        // Copay Amount
        if (booking.copayAmount > 0) {
          doc
            .text('Copay Amount', 60, rowY)
            .text(booking.copayAmount.toFixed(2), 450, rowY, { align: 'right', width: 85 });
          rowY += lineHeight;
        }

        // Insurance Payment
        doc
          .text('Insurance Coverage (Wallet)', 60, rowY)
          .text(booking.insurancePayment.toFixed(2), 450, rowY, { align: 'right', width: 85 });
        rowY += lineHeight;

        // Excess Amount (if service limit applied)
        if (booking.excessAmount > 0) {
          doc
            .text('Excess Amount (Beyond Limit)', 60, rowY)
            .text(booking.excessAmount.toFixed(2), 450, rowY, { align: 'right', width: 85 });
          rowY += lineHeight;
        }

        // Divider line
        doc.moveTo(50, rowY + 5).lineTo(545, rowY + 5).stroke();
        rowY += 15;

        // Total Member Payment
        doc
          .font('Helvetica-Bold')
          .fontSize(11)
          .text('Total Member Payment', 60, rowY)
          .text(booking.totalMemberPayment.toFixed(2), 450, rowY, {
            align: 'right',
            width: 85
          });

        doc.y = tableTop + 160;
        doc.moveDown(1);

        // PAYMENT METHOD
        doc
          .fontSize(10)
          .font('Helvetica')
          .text(`Payment Method: ${booking.paymentMethod}`, 60)
          .text(`Payment Status: ${booking.paymentStatus}`, 60);

        doc.moveDown(1.5);

        // TRANSACTION DETAILS
        if (booking.transactionId) {
          doc
            .fontSize(9)
            .fillColor('#666666')
            .text(`Transaction ID: ${booking.transactionId.toString()}`, 60);
          doc.fillColor('#000000');
        }

        doc.moveDown(2);

        // FOOTER
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#999999')
          .text(
            'This is a system-generated invoice for dental services. For queries, contact the clinic.',
            50,
            doc.page.height - 100,
            { align: 'center', width: 495 }
          )
          .text(
            `Generated on: ${new Date().toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}`,
            50,
            doc.page.height - 80,
            { align: 'center', width: 495 }
          );

        doc.end();

        stream.on('finish', () => {
          console.log('[DentalInvoice] Invoice PDF generated successfully:', fileName);
          resolve({ invoiceId, filePath, fileName });
        });

        stream.on('error', (error) => {
          console.error('[DentalInvoice] Error generating invoice:', error);
          reject(error);
        });
      } catch (error) {
        console.error('[DentalInvoice] Exception during invoice generation:', error);
        reject(error);
      }
    });
  }

  /**
   * Generate unique invoice ID
   */
  private generateInvoiceId(bookingId: string): string {
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `INV-DEN-${bookingId}-${random}`;
  }
}
