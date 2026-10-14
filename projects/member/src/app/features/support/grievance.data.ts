/**
 * Grievance redressal — DUMMY / STATIC data and configuration, zero backend.
 *
 * Stands in for the grievance APIs (orders the member has used, tickets and
 * their threads) and for the centrally managed Grievance Configuration: the
 * reason list per service line and the raise window. Until
 * those exist, the values below are what the Support page reads. Members
 * cannot reopen a closed ticket; the support phone line is the way back.
 */

export type ServiceLine =
  | 'Online Consult'
  | 'In-Clinic Consultation'
  | 'Vision Care'
  | 'Dental Services'
  | 'Pharmacy'
  | 'Vaccination'
  | 'Pathology (Lab)'
  | 'Radiology/Cardiology'
  | 'Annual Health Check';

export type OrderType = 'Cashless' | 'Reimbursement';

export interface InvoiceLine {
  readonly label: string;
  readonly amount: number;
}

export interface SupportOrder {
  readonly id: string;
  readonly service: ServiceLine;
  readonly type: OrderType;
  readonly provider: string;
  readonly placedAt: Date;
  readonly progress: 'In Progress' | 'Completed';
  /** Reimbursement claims only — set when the claim is waiting on the member. */
  readonly claimFlag?: 'Documents needed' | 'Rejected';
  readonly gross: number;
  readonly discount: number;
  readonly paidByWallet: number;
  readonly paidByMember: number;
  readonly invoiceLines: readonly InvoiceLine[];
}

export type TicketState = 'awaiting_support' | 'awaiting_member' | 'closed';
export type ClosedBy = 'support' | 'member' | 'auto';

export interface TicketMessage {
  readonly from: 'member' | 'support' | 'system';
  /** The support team member who wrote it, when from support. */
  readonly author?: string;
  readonly text: string;
  readonly at: Date;
}

export interface SupportTicket {
  readonly id: string;
  readonly orderId: string;
  readonly reason: string;
  readonly detail: string;
  readonly createdAt: Date;
  readonly state: TicketState;
  readonly closedAt?: Date;
  readonly closedBy?: ClosedBy;
  readonly messages: readonly TicketMessage[];
}

// ── Grievance Configuration (centrally managed; static here) ──────────────

/** How long after the order date a grievance can be raised; also the auto-close cutoff. */
export const RAISE_WINDOW_MONTHS = 3;
/** PLACEHOLDER — the real support line is not decided yet. */
export const SUPPORT_PHONE = '1800-000-0000';


/** Reason list per service line, in the order shown to the member. */
export const REASONS: Readonly<Record<ServiceLine | 'Reimbursement', readonly string[]>> = {
  'Online Consult': [
    'Doctor did not join in time',
    'Consultation quality',
    'Poor call quality or connectivity issue',
    'Wrong doctor joined',
    'Prescription not provided',
    'Session ended abruptly',
    'Other',
  ],
  'In-Clinic Consultation': [
    'Doctor was not available',
    'Consultation quality',
    'Cashless letter not accepted at the clinic',
    'Wrong doctor attended',
    'Prescription not provided',
    'Consultation cut short',
    'Other',
  ],
  'Dental Services': [
    'Doctor was not available',
    'Consultation quality',
    'Cashless letter not accepted at the clinic',
    'Wrong doctor attended',
    'Prescription not provided',
    'Consultation cut short',
    'Procedure not approved as expected, disagree with the adjudication outcome',
    'Approved amount incorrect',
    'Procedure not completed as agreed',
    'Procedure quality or complication',
    'Other',
  ],
  'Annual Health Check': [
    'Part of the package not completed, for example radiology or cardiology missed while pathology was done',
    'Report has errors',
    'Report delayed or not received',
    'Phlebotomist did not arrive for home collection',
    'Wrong package or test given',
    'Other',
  ],
  'Pathology (Lab)': [
    'Appointment cancelled by the lab',
    'Report delayed or not received',
    'Report has errors',
    'Phlebotomist did not arrive for home collection',
    'Disagree with items removed during adjudication',
    'Wrong test conducted',
    'Other',
  ],
  'Radiology/Cardiology': [
    'Appointment cancelled by the lab',
    'Report delayed or not received',
    'Report has errors',
    'Phlebotomist did not arrive for home collection',
    'Disagree with items removed during adjudication',
    'Wrong test conducted',
    'Other',
  ],
  Pharmacy: [
    'Wrong medicine delivered',
    'Disagree with items removed during adjudication',
    'Order not delivered or delayed',
    'Prescription rejected incorrectly',
    'Delivered to the wrong address',
    'Items missing from the order',
    'Other',
  ],
  Vaccination: [
    'Vaccinator did not arrive or show up',
    'Wrong vaccine or wrong dose administered',
    'Appointment cancelled by the clinic or vendor',
    'Cashless letter not accepted',
    'Wrong vaccine or dose selected at booking',
    'Other',
  ],
  'Vision Care': [
    'Delivery took too long',
    'Wrong product received',
    'Coupon not accepted at the partner',
    'Order cancelled incorrectly',
    'Amount charged does not match the coupon value',
    'Other',
  ],
  Reimbursement: [
    'Issue with the reimbursement amount',
    'Issue with documents requested',
    'Claim rejected incorrectly',
    'No update for too long',
    'Approved but payment not received',
    'Other',
  ],
};

/** A reimbursement claim reads the claim list; everything else its service line's. */
export function reasonsFor(order: SupportOrder): readonly string[] {
  return order.type === 'Reimbursement' ? REASONS.Reimbursement : REASONS[order.service];
}

// ── Dates ─────────────────────────────────────────────────────────────────

export function addMonths(date: Date, months: number): Date {
  const d = new Date(date);
  d.setMonth(d.getMonth() + months);
  return d;
}

function daysAgo(days: number, hour = 10, minute = 30): Date {
  const d = new Date();
  d.setDate(d.getDate() - days);
  d.setHours(hour, minute, 0, 0);
  return d;
}

/** Raise window cutoff for an order — also when an open ticket auto-closes. */
export function raiseCutoff(order: SupportOrder): Date {
  return addMonths(order.placedAt, RAISE_WINDOW_MONTHS);
}

// ── Seed data: one order per use case ─────────────────────────────────────

const R = 'Riya · Support team';
const A = 'Arjun · Support team';

function order(o: Omit<SupportOrder, 'gross'>): SupportOrder {
  return { ...o, gross: o.invoiceLines.reduce((s, l) => s + l.amount, 0) };
}

export const SEED_ORDERS: SupportOrder[] = [
  order({
    id: 'ORD-24081', service: 'Online Consult', type: 'Cashless', provider: 'Dr. A. Sharma (video)',
    placedAt: daysAgo(2, 18, 15), progress: 'Completed', discount: 0, paidByWallet: 400, paidByMember: 100,
    invoiceLines: [{ label: 'Online consultation — General Physician', amount: 500 }],
  }),
  order({
    id: 'ORD-24077', service: 'Pharmacy', type: 'Cashless', provider: 'Tata 1mg',
    placedAt: daysAgo(5, 9, 40), progress: 'In Progress', discount: 45, paidByWallet: 320, paidByMember: 80,
    invoiceLines: [
      { label: 'Crocin 500mg × 2', amount: 60 },
      { label: 'Novamox 500mg × 1', amount: 120 },
      { label: 'Pan-D × 1', amount: 85 },
      { label: 'Cetzine 10mg × 4', amount: 180 },
    ],
  }),
  order({
    id: 'ORD-24070', service: 'Pathology (Lab)', type: 'Cashless', provider: 'Metropolis Labs',
    placedAt: daysAgo(12, 7, 30), progress: 'Completed', discount: 100, paidByWallet: 400, paidByMember: 900,
    invoiceLines: [
      { label: 'HbA1c', amount: 400 },
      { label: 'Lipid Profile', amount: 600 },
      { label: 'TSH', amount: 250 },
      { label: 'Home collection charge', amount: 150 },
    ],
  }),
  order({
    id: 'CLM-2026-0009', service: 'Pathology (Lab)', type: 'Reimbursement', provider: 'Metropolis Labs',
    placedAt: daysAgo(19, 11, 5), progress: 'In Progress', discount: 0, paidByWallet: 0, paidByMember: 528,
    invoiceLines: [{ label: 'Vitamin D (25-OH)', amount: 528 }],
  }),
  order({
    id: 'CLM-2026-0006', service: 'Pharmacy', type: 'Reimbursement', provider: 'Apollo Pharmacy',
    placedAt: daysAgo(23, 16, 20), progress: 'In Progress', claimFlag: 'Documents needed', discount: 0, paidByWallet: 0, paidByMember: 320,
    invoiceLines: [{ label: 'Medicines as per bill APL-88213', amount: 320 }],
  }),
  order({
    id: 'ORD-23990', service: 'In-Clinic Consultation', type: 'Cashless', provider: 'HealthFirst Clinic, Sector 44',
    placedAt: daysAgo(25, 11, 0), progress: 'Completed', discount: 0, paidByWallet: 480, paidByMember: 120,
    invoiceLines: [{ label: 'In-clinic consultation — Dermatology', amount: 600 }],
  }),
  order({
    id: 'CLM-2026-0002', service: 'Online Consult', type: 'Reimbursement', provider: 'Dr. A. Sharma',
    placedAt: daysAgo(37, 19, 45), progress: 'Completed', claimFlag: 'Rejected', discount: 0, paidByWallet: 0, paidByMember: 500,
    invoiceLines: [{ label: 'Online consultation fee', amount: 500 }],
  }),
  order({
    id: 'ORD-23910', service: 'Dental Services', type: 'Cashless', provider: 'Smile Dental Studio',
    placedAt: daysAgo(55, 15, 10), progress: 'Completed', discount: 200, paidByWallet: 1200, paidByMember: 600,
    invoiceLines: [
      { label: 'Dental consultation', amount: 400 },
      { label: 'Scaling and polishing', amount: 1600 },
    ],
  }),
  order({
    id: 'ORD-23850', service: 'Vaccination', type: 'Cashless', provider: 'Apollo Clinic, Cyber City',
    placedAt: daysAgo(63, 10, 0), progress: 'Completed', discount: 0, paidByWallet: 1600, paidByMember: 400,
    invoiceLines: [{ label: 'Influenza vaccine (Vaxigrip Tetra)', amount: 2000 }],
  }),
  order({
    id: 'ORD-23760', service: 'Vision Care', type: 'Cashless', provider: 'Lenskart',
    placedAt: daysAgo(80, 13, 25), progress: 'Completed', discount: 300, paidByWallet: 2000, paidByMember: 700,
    invoiceLines: [
      { label: 'Eye check-up', amount: 0 },
      { label: 'Spectacle frame + lenses', amount: 3000 },
    ],
  }),
  order({
    id: 'ORD-23620', service: 'Radiology/Cardiology', type: 'Cashless', provider: 'Medanta Diagnostics',
    placedAt: daysAgo(100, 9, 0), progress: 'Completed', discount: 0, paidByWallet: 1500, paidByMember: 400,
    invoiceLines: [
      { label: '2D Echo', amount: 1500 },
      { label: 'ECG', amount: 400 },
    ],
  }),
  order({
    id: 'ORD-23410', service: 'Annual Health Check', type: 'Cashless', provider: 'Dr Lal PathLabs',
    placedAt: daysAgo(125, 8, 0), progress: 'Completed', discount: 0, paidByWallet: 0, paidByMember: 0,
    invoiceLines: [{ label: 'Annual health check package (covered)', amount: 0 }],
  }),
];

function closedAt(o: SupportOrder): Date {
  return raiseCutoff(o);
}

export const SEED_TICKETS: SupportTicket[] = [
  // Ticket open — waiting on support.
  {
    id: 'TKT-10412', orderId: 'ORD-24077', reason: 'Order not delivered or delayed',
    detail: 'The order was due yesterday and tracking has not moved since it was packed.',
    createdAt: daysAgo(1, 12, 5), state: 'awaiting_support',
    messages: [
      { from: 'member', text: 'The order was due yesterday and tracking has not moved since it was packed.', at: daysAgo(1, 12, 5) },
      { from: 'system', text: 'Ticket opened', at: daysAgo(1, 12, 5) },
    ],
  },
  // Response received — support asked a question; waiting on the member.
  {
    id: 'TKT-10398', orderId: 'ORD-24070', reason: 'Report delayed or not received',
    detail: 'It has been 5 days and the lipid profile report is still not in Health Records.',
    createdAt: daysAgo(6, 9, 30), state: 'awaiting_member',
    messages: [
      { from: 'member', text: 'It has been 5 days and the lipid profile report is still not in Health Records.', at: daysAgo(6, 9, 30) },
      { from: 'system', text: 'Ticket opened', at: daysAgo(6, 9, 30) },
      { from: 'system', text: `Assigned to ${R}`, at: daysAgo(6, 11, 0) },
      { from: 'support', author: R, text: 'Thanks for flagging this. HbA1c and TSH are uploaded; the lab has re-run the lipid profile. Could you confirm you fasted for 10–12 hours before the sample? The lab needs this to release the report.', at: daysAgo(5, 15, 20) },
    ],
  },
  // Closed by support — recently.
  {
    id: 'TKT-10355', orderId: 'ORD-23990', reason: 'Cashless letter not accepted at the clinic',
    detail: 'The clinic asked me to pay ₹600 at the counter even though I had the cashless letter.',
    createdAt: daysAgo(24, 13, 0), state: 'closed', closedAt: daysAgo(4, 17, 45), closedBy: 'support',
    messages: [
      { from: 'member', text: 'The clinic asked me to pay ₹600 at the counter even though I had the cashless letter.', at: daysAgo(24, 13, 0) },
      { from: 'system', text: 'Ticket opened', at: daysAgo(24, 13, 0) },
      { from: 'system', text: `Assigned to ${A}`, at: daysAgo(24, 15, 30) },
      { from: 'support', author: A, text: 'We have spoken to HealthFirst Clinic. They have confirmed the cashless letter and will refund ₹600 to you; the visit is billed to your wallet instead.', at: daysAgo(4, 17, 45) },
      { from: 'system', text: 'Resolved and closed by support', at: daysAgo(4, 17, 45) },
    ],
  },
  // Closed by support — some weeks ago.
  {
    id: 'TKT-10201', orderId: 'ORD-23910', reason: 'Approved amount incorrect',
    detail: 'Only ₹1,200 was approved for scaling though the policy covers it fully.',
    createdAt: daysAgo(52, 10, 15), state: 'closed', closedAt: daysAgo(44, 12, 0), closedBy: 'support',
    messages: [
      { from: 'member', text: 'Only ₹1,200 was approved for scaling though the policy covers it fully.', at: daysAgo(52, 10, 15) },
      { from: 'system', text: 'Ticket opened', at: daysAgo(52, 10, 15) },
      { from: 'support', author: R, text: 'The dental sub-limit for scaling is ₹1,200 per year under your policy; the remaining ₹600 is outside it. Sharing the policy clause in your Health Records.', at: daysAgo(44, 12, 0) },
      { from: 'system', text: 'Resolved and closed by support', at: daysAgo(44, 12, 0) },
    ],
  },
  // Marked resolved by the member — closed for good.
  {
    id: 'TKT-10150', orderId: 'ORD-23850', reason: 'Appointment cancelled by the clinic or vendor',
    detail: 'My vaccination slot was cancelled without notice.',
    createdAt: daysAgo(62, 9, 0), state: 'closed', closedAt: daysAgo(60, 18, 30), closedBy: 'member',
    messages: [
      { from: 'member', text: 'My vaccination slot was cancelled without notice.', at: daysAgo(62, 9, 0) },
      { from: 'system', text: 'Ticket opened', at: daysAgo(62, 9, 0) },
      { from: 'support', author: A, text: 'Sorry about that. We have booked a complimentary slot for you on the next day at 10 AM at the same clinic.', at: daysAgo(61, 11, 10) },
      { from: 'member', text: 'Got the new slot, thanks.', at: daysAgo(60, 18, 30) },
      { from: 'system', text: 'Marked resolved by you', at: daysAgo(60, 18, 30) },
    ],
  },
];

// Auto-closed — still open when the raise window ran out.
{
  const o = SEED_ORDERS.find((x) => x.id === 'ORD-23620')!;
  SEED_TICKETS.push({
    id: 'TKT-10088', orderId: o.id, reason: 'Report has errors',
    detail: 'The 2D Echo report has another patient’s name on it.',
    createdAt: daysAgo(96, 10, 40), state: 'closed', closedAt: closedAt(o), closedBy: 'auto',
    messages: [
      { from: 'member', text: 'The 2D Echo report has another patient’s name on it.', at: daysAgo(96, 10, 40) },
      { from: 'system', text: 'Ticket opened', at: daysAgo(96, 10, 40) },
      { from: 'support', author: R, text: 'We have asked Medanta to reissue the report. Could you share a photo of the page with the wrong name?', at: daysAgo(94, 14, 0) },
      { from: 'system', text: `Closed automatically — ${RAISE_WINDOW_MONTHS} months from the order date`, at: closedAt(o) },
    ],
  });
}

/** The executive who picks up a demo response. */
export const DEMO_EXECUTIVE = R;
