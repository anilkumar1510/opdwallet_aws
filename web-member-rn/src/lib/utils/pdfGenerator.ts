import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface PolicyData {
  policyNumber: string;
  policyHolder: string;
  age?: number;
  corporate: string;
  validTill: string;
}

interface WalletBalance {
  allocated: number;
  current: number;
  consumed: number;
}

interface CategoryBalance {
  categoryCode: string;
  categoryName: string;
  allocated: number;
  current: number;
  consumed: number;
  isUnlimited: boolean;
}

interface HealthBenefit {
  categoryCode: string;
  name: string;
  description?: string;
}

interface PDFData {
  policy: PolicyData;
  totalWallet: WalletBalance;
  categoryBalances: CategoryBalance[];
  healthBenefits: HealthBenefit[];
  copayDetails?: string;
}

export function generatePolicyPDF(data: PDFData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  let yPos = 20;

  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Policy Document', pageWidth / 2, yPos, { align: 'center' });

  yPos += 15;

  // Policy Details Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Policy Information', 14, yPos);
  yPos += 8;

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  const policyInfo = [
    ['Policy Holder', data.policy.policyHolder],
    ['Policy Number', data.policy.policyNumber],
    ['Age', data.policy.age ? `${data.policy.age} years` : 'N/A'],
    ['Corporate', data.policy.corporate],
    ['Valid Till', data.policy.validTill],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: policyInfo,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 'auto' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // Total Wallet Balance Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Total Wallet Balance', 14, yPos);
  yPos += 8;

  const walletInfo = [
    ['Total Allocated', `₹${data.totalWallet.allocated.toLocaleString('en-IN')}`],
    ['Current Available', `₹${data.totalWallet.current.toLocaleString('en-IN')}`],
    ['Consumed', `₹${data.totalWallet.consumed.toLocaleString('en-IN')}`],
  ];

  autoTable(doc, {
    startY: yPos,
    head: [],
    body: walletInfo,
    theme: 'grid',
    styles: { fontSize: 10, cellPadding: 3 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 50 },
      1: { cellWidth: 'auto' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // Category-wise Balance Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Per Category Balance (Allocated vs Available)', 14, yPos);
  yPos += 8;

  const categoryData = data.categoryBalances.map(cat => [
    cat.categoryName,
    cat.isUnlimited ? 'Unlimited' : `₹${cat.allocated.toLocaleString('en-IN')}`,
    cat.isUnlimited ? 'Unlimited' : `₹${cat.current.toLocaleString('en-IN')}`,
    cat.isUnlimited ? '-' : `₹${cat.consumed.toLocaleString('en-IN')}`
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Category', 'Allocated', 'Available', 'Consumed']],
    body: categoryData,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [66, 139, 202], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 60 },
      1: { cellWidth: 40, halign: 'right' },
      2: { cellWidth: 40, halign: 'right' },
      3: { cellWidth: 40, halign: 'right' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // Check if we need a new page
  if (yPos > 250) {
    doc.addPage();
    yPos = 20;
  }

  // Health Benefits Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Mapped Wallet Benefits', 14, yPos);
  yPos += 8;

  const benefitsData = data.healthBenefits.map(benefit => [
    benefit.name,
    benefit.description || '-'
  ]);

  autoTable(doc, {
    startY: yPos,
    head: [['Benefit Name', 'Description']],
    body: benefitsData,
    theme: 'striped',
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [66, 139, 202], fontStyle: 'bold' },
    columnStyles: {
      0: { cellWidth: 50, fontStyle: 'bold' },
      1: { cellWidth: 'auto' }
    }
  });

  yPos = (doc as any).lastAutoTable.finalY + 12;

  // Co-pay Details Section (if available)
  if (data.copayDetails) {
    if (yPos > 250) {
      doc.addPage();
      yPos = 20;
    }

    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Co-pay Details', 14, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(data.copayDetails, 14, yPos, { maxWidth: pageWidth - 28 });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Generated on ${new Date().toLocaleDateString('en-IN')} | Page ${i} of ${pageCount}`,
      pageWidth / 2,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Download the PDF
  const fileName = `Policy_${data.policy.policyNumber}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}
