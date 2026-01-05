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

    // Use prescription's stored signature (copied at prescription creation time)
    const doctorSignaturePath = prescription.doctorSignatureImage;

    console.log('[PDF Generation] Prescription signature path:', doctorSignaturePath);
    console.log('[PDF Generation] Signature exists:', doctorSignaturePath ? existsSync(doctorSignaturePath) : false);

    const fileName = `prescription-${prescriptionId}-${Date.now()}.pdf`;
    const filePath = join(this.uploadDir, fileName);

    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 50 });
        const stream = createWriteStream(filePath);

        doc.pipe(stream);

        // ==================== ENHANCED HEADER ====================
        doc
          .fontSize(20)
          .font('Helvetica-Bold')
          .text('PRESCRIPTION', { align: 'center' })
          .moveDown(0.3);

        // Prescription Date (top right)
        const currentY = doc.y;
        doc
          .fontSize(9)
          .font('Helvetica')
          .text(
            `Date: ${new Date(prescription.createdDate).toLocaleDateString('en-IN', {
              day: '2-digit',
              month: 'short',
              year: 'numeric'
            })}`,
            { align: 'right' }
          );

        doc.y = currentY;
        doc.moveDown(0.5);

        // Doctor Details with Clinic Info
        doc
          .fontSize(12)
          .font('Helvetica-Bold')
          .text(`Dr. ${prescription.doctorName}`)
          .font('Helvetica')
          .fontSize(9);

        if (prescription.doctorQualification) {
          doc.text(prescription.doctorQualification);
        }

        if (prescription.doctorSpecialty) {
          doc.text(`Specialty: ${prescription.doctorSpecialty}`);
        }

        if (prescription.doctorRegistrationNumber) {
          doc.text(`Reg. No: ${prescription.doctorRegistrationNumber}`);
        }

        // Clinic Information
        if (prescription.clinicName || prescription.clinicAddress) {
          doc.moveDown(0.3);
          if (prescription.clinicName) {
            doc.font('Helvetica-Bold').text(prescription.clinicName);
          }
          doc.font('Helvetica');
          if (prescription.clinicAddress) {
            doc.text(prescription.clinicAddress);
          }
          if (prescription.clinicPhone) {
            doc.text(`Ph: ${prescription.clinicPhone}`);
          }
        }

        doc.moveDown(0.8);
        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.8);

        // ==================== PATIENT DETAILS (ENHANCED) ====================
        doc
          .fontSize(11)
          .font('Helvetica-Bold')
          .text('PATIENT DETAILS');

        doc.moveDown(0.3);
        doc.fontSize(9).font('Helvetica');

        // Build patient details string
        let patientDetails = `Name: ${prescription.patientName}`;
        if (prescription.patientAge) {
          patientDetails += `    Age: ${prescription.patientAge} years`;
        }
        if (prescription.patientGender) {
          patientDetails += `    Gender: ${prescription.patientGender}`;
        }
        if (prescription.patientWeight) {
          patientDetails += `    Weight: ${prescription.patientWeight} kg`;
        }

        doc.text(patientDetails);

        if (prescription.patientBloodGroup) {
          doc.text(`Blood Group: ${prescription.patientBloodGroup}`);
        }

        if (prescription.patientPhone) {
          doc.text(`Contact: ${prescription.patientPhone}`);
        }

        doc.moveDown(0.5);

        // ==================== ALLERGY WARNING BOX (PROMINENT) ====================
        if (prescription.allergies) {
          const hasAllergies = prescription.allergies.hasKnownAllergies &&
            (prescription.allergies.drugAllergies?.length > 0 ||
             prescription.allergies.foodAllergies?.length > 0 ||
             prescription.allergies.otherAllergies?.length > 0);

          if (hasAllergies) {
            // Draw red warning box
            doc.fillColor('#FF0000').rect(50, doc.y, 500, 5).fill();
            doc.fillColor('#000000');
            doc.moveDown(0.3);

            doc
              .fontSize(10)
              .font('Helvetica-Bold')
              .fillColor('#FF0000')
              .text('⚠ ALLERGIES - CRITICAL', 50, doc.y);

            doc.fillColor('#000000').font('Helvetica').fontSize(9);

            const allergies = [];
            if (prescription.allergies.drugAllergies?.length > 0) {
              allergies.push(`Drugs: ${prescription.allergies.drugAllergies.join(', ')}`);
            }
            if (prescription.allergies.foodAllergies?.length > 0) {
              allergies.push(`Food: ${prescription.allergies.foodAllergies.join(', ')}`);
            }
            if (prescription.allergies.otherAllergies?.length > 0) {
              allergies.push(`Other: ${prescription.allergies.otherAllergies.join(', ')}`);
            }

            doc.text(allergies.join(' | '), 50, doc.y);
            doc.fillColor('#FF0000').rect(50, doc.y + 5, 500, 2).fill();
            doc.fillColor('#000000');
            doc.moveDown(0.8);
          } else if (!prescription.allergies.hasKnownAllergies) {
            // NKDA - No Known Drug Allergies
            doc
              .fontSize(9)
              .font('Helvetica')
              .fillColor('#666666')
              .text('NKDA - No Known Drug Allergies', 50, doc.y);
            doc.fillColor('#000000');
            doc.moveDown(0.5);
          }
        }

        // ==================== VITALS SECTION ====================
        if (prescription.vitals && Object.keys(prescription.vitals).some(key =>
          key !== 'recordedAt' && prescription.vitals?.[key as keyof typeof prescription.vitals] != null
        )) {
          doc
            .fontSize(10)
            .font('Helvetica-Bold')
            .text('VITALS', 50, doc.y);

          doc.moveDown(0.2);
          doc.fontSize(9).font('Helvetica');

          const vitals = [];
          if (prescription.vitals.bloodPressure) {
            vitals.push(`BP: ${prescription.vitals.bloodPressure}`);
          }
          if (prescription.vitals.pulse) {
            vitals.push(`Pulse: ${prescription.vitals.pulse} bpm`);
          }
          if (prescription.vitals.temperature) {
            vitals.push(`Temp: ${prescription.vitals.temperature}°F`);
          }
          if (prescription.vitals.oxygenSaturation) {
            vitals.push(`SpO2: ${prescription.vitals.oxygenSaturation}%`);
          }
          if (prescription.vitals.weight) {
            vitals.push(`Wt: ${prescription.vitals.weight} kg`);
          }
          if (prescription.vitals.height) {
            vitals.push(`Ht: ${prescription.vitals.height} cm`);
          }
          if (prescription.vitals.bmi) {
            vitals.push(`BMI: ${prescription.vitals.bmi}`);
          }

          doc.text(vitals.join(' | '), 50, doc.y);
          doc.moveDown(0.5);
        }

        doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
        doc.moveDown(0.5);

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

        // ==================== DOCTOR SIGNATURE ====================
        doc.moveDown(2);

        const doctorInfoStartY = doc.y;

        // FIRST: Embed signature image if available
        if (doctorSignaturePath && existsSync(doctorSignaturePath)) {
          try {
            // Place signature image at current Y position on the right side
            doc.image(doctorSignaturePath, 400, doctorInfoStartY, {
              width: 100,
              height: 40,
              align: 'right'
            });
            console.log('[PDF] Signature embedded at Y:', doctorInfoStartY);

            // Move Y position down to make space for signature (so text appears below it)
            doc.y = doctorInfoStartY + 50;
          } catch (error) {
            console.error('Error embedding signature image:', error);
            // If signature fails, just continue with text at current position
          }
        }

        // THEN: Doctor name and credentials (will be below signature due to Y adjustment)
        doc
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(`Dr. ${prescription.doctorName}`, 350, doc.y, { align: 'right' });

        if (prescription.doctorQualification) {
          doc
            .font('Helvetica')
            .fontSize(9)
            .text(prescription.doctorQualification, 350, doc.y, { align: 'right' });
        }

        if (prescription.doctorRegistrationNumber) {
          doc.text(`Reg. No: ${prescription.doctorRegistrationNumber}`, 350, doc.y, { align: 'right' });
        }

        // ==================== ENHANCED FOOTER ====================
        doc.moveDown(2);

        // Prescription metadata
        const footerY = 750;
        doc.fontSize(8).font('Helvetica').fillColor('#666666');

        const rxId = prescription.prescriptionNumber || prescription.prescriptionId;
        const validityDays = prescription.validityDays || 30;
        const validUntil = new Date(prescription.createdDate);
        validUntil.setDate(validUntil.getDate() + validityDays);

        doc.text(
          `Rx ID: ${rxId} | Generated: ${new Date(prescription.createdDate).toLocaleDateString('en-IN')} | Valid until: ${validUntil.toLocaleDateString('en-IN')} (${validityDays} days)`,
          50,
          footerY,
          { align: 'center', width: 500 }
        );

        doc.moveDown(0.3);
        doc
          .fillColor('#999999')
          .text(
            'This is a digitally generated prescription per MCI e-prescribing guidelines.',
            50,
            doc.y,
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
