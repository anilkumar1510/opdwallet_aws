import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  DigitalPrescription,
  DigitalPrescriptionDocument,
} from './schemas/digital-prescription.schema';
import * as PDFDocument from 'pdfkit';
import { createWriteStream, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

@Injectable()
export class PdfGenerationService {
  private readonly uploadDir = join(process.cwd(), 'uploads', 'prescriptions', 'generated');

  constructor(
    @InjectModel(DigitalPrescription.name)
    private digitalPrescriptionModel: Model<DigitalPrescriptionDocument>,
  ) {
    // Ensure upload directory exists
    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
    }
  }

  async generatePrescriptionPDF(
    prescriptionId: string,
  ): Promise<{ filePath: string; fileName: string }> {
    const prescription = await this.digitalPrescriptionModel
      .findOne({ prescriptionId, isActive: true })
      .populate('appointmentId');

    if (!prescription) {
      throw new Error('Prescription not found');
    }

    const fileName = `prescription-${prescriptionId}-${Date.now()}.pdf`;
    const filePath = join(this.uploadDir, fileName);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const stream = createWriteStream(filePath);

        doc.pipe(stream);

        // Header
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text('MEDICAL PRESCRIPTION', { align: 'center' })
          .moveDown(0.5);

        // Doctor Details
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(prescription.doctorName.toUpperCase())
          .font('Helvetica')
          .fontSize(10);

        if (prescription.doctorQualification) {
          doc.text(prescription.doctorQualification);
        }

        if (prescription.doctorRegistrationNumber) {
          doc.text(`Reg. No: ${prescription.doctorRegistrationNumber}`);
        }

        doc.moveDown(1);

        // Prescription Date
        doc
          .fontSize(10)
          .text(`Date: ${new Date(prescription.createdDate).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}`, { align: 'right' });

        doc.moveDown(1);

        // Patient Details Box
        doc.rect(50, doc.y, 500, 80).stroke();
        const patientBoxY = doc.y + 10;

        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('Patient Details:', 60, patientBoxY);

        doc
          .font('Helvetica')
          .fontSize(10)
          .text(`Name: ${prescription.patientName}`, 60, patientBoxY + 20)
          .text(`Prescription ID: ${prescription.prescriptionId}`, 60, patientBoxY + 35);

        doc.y = patientBoxY + 80;
        doc.moveDown(1);

        // Chief Complaint & Diagnosis
        if (prescription.chiefComplaint || prescription.diagnosis) {
          if (prescription.chiefComplaint) {
            doc
              .font('Helvetica-Bold')
              .fontSize(10)
              .text('Chief Complaint: ', { continued: true })
              .font('Helvetica')
              .text(prescription.chiefComplaint);
            doc.moveDown(0.5);
          }

          if (prescription.diagnosis) {
            doc
              .font('Helvetica-Bold')
              .fontSize(10)
              .text('Diagnosis: ', { continued: true })
              .font('Helvetica')
              .text(prescription.diagnosis);
            doc.moveDown(0.5);
          }

          doc.moveDown(0.5);
        }

        // Rx Symbol
        doc
          .fontSize(24)
          .font('Helvetica-Bold')
          .text('Rx', 50, doc.y)
          .moveDown(1);

        // Medicines Table
        if (prescription.medicines && prescription.medicines.length > 0) {
          const tableTop = doc.y;
          const colWidths = [200, 100, 80, 120];

          // Table Header
          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('Medicine', 50, tableTop)
            .text('Dosage', 250, tableTop)
            .text('Frequency', 350, tableTop)
            .text('Duration', 430, tableTop);

          doc.moveDown(0.3);
          doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
          doc.moveDown(0.3);

          // Table Rows
          doc.font('Helvetica').fontSize(9);

          prescription.medicines.forEach((medicine, index) => {
            const rowY = doc.y;

            // Medicine name (Generic in CAPS, brand in brackets)
            const medicineName = medicine.genericName
              ? `${medicine.genericName.toUpperCase()}${medicine.medicineName !== medicine.genericName ? ` (${medicine.medicineName})` : ''}`
              : medicine.medicineName.toUpperCase();

            doc
              .text(medicineName, 50, rowY, { width: 180 })
              .text(medicine.dosage, 250, rowY, { width: 90 })
              .text(medicine.frequency, 350, rowY, { width: 70 })
              .text(medicine.duration, 430, rowY, { width: 110 });

            doc.moveDown(0.3);

            // Instructions
            if (medicine.instructions) {
              doc
                .fontSize(8)
                .fillColor('#666666')
                .text(`${medicine.instructions} - ${medicine.route}`, 50, doc.y, { width: 500 });
              doc.fillColor('#000000').fontSize(9);
            }

            doc.moveDown(0.8);

            // Add page break if needed
            if (doc.y > 700 && index < prescription.medicines.length - 1) {
              doc.addPage();
            }
          });

          doc.moveDown(1);
        }

        // Lab Tests
        if (prescription.labTests && prescription.labTests.length > 0) {
          doc
            .font('Helvetica-Bold')
            .fontSize(11)
            .text('Investigations / Lab Tests:', 50, doc.y);
          doc.moveDown(0.5);

          doc.font('Helvetica').fontSize(10);

          prescription.labTests.forEach((test, index) => {
            doc.text(`${index + 1}. ${test.testName}`, 60, doc.y);
            if (test.instructions) {
              doc
                .fontSize(9)
                .fillColor('#666666')
                .text(`   ${test.instructions}`, 65, doc.y);
              doc.fillColor('#000000').fontSize(10);
            }
            doc.moveDown(0.5);
          });

          doc.moveDown(1);
        }

        // General Instructions
        if (prescription.generalInstructions) {
          doc
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('General Instructions:', 50, doc.y);
          doc.moveDown(0.3);

          doc
            .font('Helvetica')
            .fontSize(9)
            .text(prescription.generalInstructions, 50, doc.y, { width: 500 });
          doc.moveDown(1);
        }

        // Dietary Advice
        if (prescription.dietaryAdvice) {
          doc
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('Dietary Advice:', 50, doc.y);
          doc.moveDown(0.3);

          doc
            .font('Helvetica')
            .fontSize(9)
            .text(prescription.dietaryAdvice, 50, doc.y, { width: 500 });
          doc.moveDown(1);
        }

        // Follow-up
        if (prescription.followUpDate || prescription.followUpInstructions) {
          doc
            .font('Helvetica-Bold')
            .fontSize(10)
            .text('Follow-up:', 50, doc.y);
          doc.moveDown(0.3);

          doc.font('Helvetica').fontSize(9);

          if (prescription.followUpDate) {
            doc.text(`Date: ${new Date(prescription.followUpDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })}`);
          }

          if (prescription.followUpInstructions) {
            doc.text(prescription.followUpInstructions);
          }

          doc.moveDown(2);
        }

        // Doctor Signature
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text('Dr. ' + prescription.doctorName, 350, doc.y, { align: 'right' });

        if (prescription.doctorQualification) {
          doc
            .font('Helvetica')
            .fontSize(9)
            .text(prescription.doctorQualification, 350, doc.y, { align: 'right' });
        }

        // Footer
        doc
          .fontSize(8)
          .font('Helvetica')
          .fillColor('#999999')
          .text(
            'This is a digitally generated prescription. For any queries, please contact the clinic.',
            50,
            750,
            { align: 'center', width: 500 }
          );

        doc.end();

        stream.on('finish', async () => {
          // Update prescription with PDF info
          await this.digitalPrescriptionModel.updateOne(
            { prescriptionId },
            {
              $set: {
                pdfGenerated: true,
                pdfPath: filePath,
                pdfFileName: fileName,
              },
            }
          );

          resolve({ filePath, fileName });
        });

        stream.on('error', (error) => {
          reject(error);
        });
      } catch (error) {
        reject(error);
      }
    });
  }
}
