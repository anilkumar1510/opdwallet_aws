import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  NotFoundException,
  forwardRef,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { WalletService } from '../wallet/wallet.service';
import { PlanConfigService } from '../plan-config/plan-config.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { CopayCalculator } from '../plan-config/utils/copay-calculator';
import { ServiceTransactionLimitCalculator } from '../plan-config/utils/service-transaction-limit-calculator';
import { PaymentService } from '../payments/payment.service';
import { PaymentType, ServiceType } from '../payments/schemas/payment.schema';
import { DentalBookingsService } from '../dental-bookings/dental-bookings.service';
import { DentalBooking } from '../dental-bookings/schemas/dental-booking.schema';
import {
  DentalProcedure,
  DentalProcedureStatus,
} from './schemas/dental-procedure.schema';

/** Dental's category. The wallet stores the categoryId in `categoryCode`. */
const DENTAL_CATEGORY = 'CAT006';

@Injectable()
export class DentalProceduresService {
  constructor(
    @InjectModel(DentalProcedure.name)
    private readonly procedureModel: Model<DentalProcedure>,
    @InjectModel(DentalBooking.name)
    private readonly bookingModel: Model<DentalBooking>,
    private readonly walletService: WalletService,
    private readonly planConfigService: PlanConfigService,
    private readonly assignmentsService: AssignmentsService,
    @Inject(forwardRef(() => PaymentService))
    private readonly paymentService: PaymentService,
    private readonly dentalBookingsService: DentalBookingsService,
  ) {}

  /**
   * Step 18 — the member enters the estimate the dentist gave them.
   *
   * Only against a consultation that is completed AND where they answered yes
   * to "was a procedure recommended". Without that gate any member could open a
   * procedure against any past visit, and the sheet is explicit that the
   * estimate belongs to the same prescription and the same dentist.
   *
   * Nothing is charged and nothing is held. Step 19: "the cart stays on hold
   * until adjudication".
   */
  async addEstimate(
    userId: string,
    input: { bookingId: string; estimateAmount: number; procedureNotes?: string },
  ): Promise<DentalProcedure> {
    if (!Number.isFinite(input.estimateAmount) || input.estimateAmount <= 0) {
      throw new BadRequestException('Enter the estimate the dentist gave you');
    }

    const booking = await this.bookingModel.findOne({ bookingId: input.bookingId });
    if (!booking) {
      throw new NotFoundException('That consultation could not be found');
    }
    if (booking.userId.toString() !== userId) {
      throw new ForbiddenException('That consultation belongs to another member');
    }
    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException('Close the consultation before adding an estimate');
    }
    if (booking.procedureRecommended !== true) {
      throw new BadRequestException(
        'No procedure was recommended at that consultation, so there is nothing to estimate',
      );
    }

    /*
     * Only an IN-PROGRESS procedure blocks another.
     *
     * COMPLETED and NO_SHOW are finished, like CANCELLED and REJECTED — a
     * member who had a root canal in March may well need a crown in October,
     * and treating a finished procedure as open locks them out of the route
     * permanently with nothing able to clear it.
     *
     * This is the fourth time this exact shape has bitten: vision's USED and
     * REPORTED did the same. A terminal state that reads as "consumed" rather
     * than "done" is easy to leave out of the list.
     */
    const existing = await this.procedureModel.findOne({
      bookingId: input.bookingId,
      status: {
        $nin: [
          DentalProcedureStatus.CANCELLED,
          DentalProcedureStatus.REJECTED,
          DentalProcedureStatus.COMPLETED,
          DentalProcedureStatus.NO_SHOW,
        ],
      },
    });
    if (existing) {
      throw new BadRequestException(
        `A procedure is already in progress for that consultation (${existing.procedureId})`,
      );
    }

    return this.procedureModel.create({
      procedureId: `DEN-PROC-${Date.now()}-${this.suffix(6)}`,
      userId: new Types.ObjectId(userId),
      bookingId: booking.bookingId,
      clinicId: (booking as any).clinicId,
      clinicName: (booking as any).clinicName,
      // Absent on a dental booking today — see the schema note on doctorId.
      doctorId: (booking as any).doctorId ?? undefined,
      doctorName: (booking as any).doctorName ?? undefined,
      patientName: (booking as any).patientName,
      estimateAmount: input.estimateAmount,
      procedureNotes: input.procedureNotes,
      status: DentalProcedureStatus.PENDING_ADJUDICATION,
    });
  }

  /** The adjudicator's queue — step 20. */
  async awaitingAdjudication(): Promise<DentalProcedure[]> {
    return this.procedureModel
      .find({ status: DentalProcedureStatus.PENDING_ADJUDICATION })
      .sort({ createdAt: 1 })
      .exec();
  }

  /**
   * Steps 20 and 21 — the backend decides eligibility and builds the cart.
   *
   * The approved amount is the adjudicator's, not the estimate: the sheet has
   * the member seeing "what was approved and what was not", so both are kept.
   * Copay and the per-service cap are then applied to the approved figure by
   * the same two calculators every other flow uses.
   *
   * Still nothing charged. Money moves at payment, step 26.
   */
  async adjudicate(
    procedureId: string,
    input: { approvedAmount: number; notes?: string; serviceCode?: string },
  ): Promise<DentalProcedure> {
    const procedure = await this.mustFind(procedureId);
    if (procedure.status !== DentalProcedureStatus.PENDING_ADJUDICATION) {
      throw new BadRequestException(
        `Only a procedure awaiting adjudication can be decided. This one is ${procedure.status}.`,
      );
    }
    if (!Number.isFinite(input.approvedAmount) || input.approvedAmount < 0) {
      throw new BadRequestException('The approved amount must be a number');
    }
    if (input.approvedAmount > procedure.estimateAmount) {
      throw new BadRequestException('The approved amount cannot exceed the estimate');
    }

    if (input.approvedAmount === 0) {
      procedure.status = DentalProcedureStatus.REJECTED;
      procedure.rejectionReason = input.notes || 'Not eligible under the plan';
      procedure.adjudicatedAt = new Date();
      return procedure.save();
    }

    const split = await this.split(
      procedure.userId.toString(),
      input.approvedAmount,
      input.serviceCode,
    );

    procedure.approvedAmount = input.approvedAmount;
    procedure.copayAmount = split.copayAmount;
    procedure.walletPays = split.walletPays;
    // Everything the member funds: copay, anything over the plan cap, and the
    // part of the estimate adjudication did not approve.
    procedure.memberPays = procedure.estimateAmount - split.walletPays;
    procedure.adjudicationNotes = input.notes;
    procedure.status = DentalProcedureStatus.CART_READY;
    procedure.adjudicatedAt = new Date();
    return procedure.save();
  }

  /**
   * Steps 24 to 26 — the member picks a slot with the SAME dentist and pays.
   *
   * The dentist is not a parameter, so the member cannot pick a different one.
   * That is as close to the sheet's same-dentist rule as the data allows: a
   * dental booking records a CLINIC and no dentist, so what is really enforced
   * is the same clinic. Flagged rather than papered over — the constraint needs
   * bookings to start recording a dentist.
   */
  async schedule(
    procedureId: string,
    userId: string,
    input: { appointmentDate: string; appointmentTime: string },
  ): Promise<DentalProcedure> {
    const procedure = await this.mustFind(procedureId);
    if (procedure.userId.toString() !== userId) {
      throw new ForbiddenException('That procedure belongs to another member');
    }
    if (procedure.status !== DentalProcedureStatus.CART_READY) {
      throw new BadRequestException(
        `This procedure is ${procedure.status}, so it cannot be scheduled`,
      );
    }
    if (!input.appointmentDate || !input.appointmentTime) {
      throw new BadRequestException('Pick a date and a time for the procedure');
    }

    /*
     * Step 24: "slots are restricted". The date and time have to be a slot the
     * clinic actually published, checked against the SAME availability the
     * consultation books against — otherwise the procedure route hands out
     * times the clinic never offered, and two journeys can take one slot.
     *
     * (What cannot be checked is the sheet's "same dentist", because a dental
     * booking records a clinic and no dentist at all. Same clinic is the most
     * this can honestly enforce.)
     */
    const { slots } = await this.dentalBookingsService.getAvailableSlots(
      procedure.clinicId,
      input.appointmentDate,
    );
    const slot = slots.find((candidate) => candidate.startTime === input.appointmentTime);
    if (!slot) {
      throw new BadRequestException(
        `${procedure.clinicName} is not open at that time. Pick one of the slots offered.`,
      );
    }
    if (!slot.isAvailable) {
      throw new BadRequestException('That slot has just been taken. Pick another.');
    }

    // The wallet share leaves now. There is no held state to convert later —
    // the same limitation every flow has until wallet-block-and-razorpay lands.
    if (procedure.walletPays > 0) {
      await this.walletService.debitWallet(
        procedure.userId.toString(),
        procedure.walletPays,
        DENTAL_CATEGORY,
        (procedure._id as Types.ObjectId).toString(),
        'DENTAL',
        procedure.clinicName,
        `Dental procedure at ${procedure.clinicName}`,
      );
    }

    if (procedure.memberPays > 0) {
      const payment = await this.paymentService.createPaymentRequest({
        userId: procedure.userId.toString(),
        amount: procedure.memberPays,
        paymentType: PaymentType.COPAY,
        serviceType: ServiceType.DENTAL,
        serviceId: (procedure._id as Types.ObjectId).toString(),
        serviceReferenceId: procedure.procedureId,
        description: `Dental procedure at ${procedure.clinicName}`,
      });
      procedure.paymentId = payment.paymentId;
    }

    procedure.appointmentDate = input.appointmentDate;
    procedure.appointmentTime = input.appointmentTime;

    /*
     * Steps 26, 27 and 28 are three moments, not one. Paying is what moves the
     * procedure to PAID, so a member who still owes a co-payment waits at
     * AWAITING_PAYMENT until that payment actually completes — see
     * `handlePaymentComplete`, which the payment service calls.
     *
     * Setting PAID here regardless is how this read before: it handed out a
     * slot and a "paid" screen to a member who had paid nothing.
     */
    if (procedure.memberPays > 0) {
      procedure.status = DentalProcedureStatus.AWAITING_PAYMENT;
    } else {
      procedure.status = DentalProcedureStatus.PAID;
      procedure.paidAt = new Date();
    }
    return procedure.save();
  }

  /**
   * Development only — see the controller. Moves a procedure past whichever
   * operations step it is waiting on, and refuses when it is not waiting on
   * one, so a demo cannot skip the member's own steps.
   */
  async demoAdvance(procedureId: string): Promise<DentalProcedure> {
    const procedure = await this.mustFind(procedureId);
    switch (procedure.status) {
      case DentalProcedureStatus.PENDING_ADJUDICATION:
        return this.adjudicate(procedureId, {
          approvedAmount: procedure.estimateAmount,
          notes: 'Approved in full (demonstration).',
        });
      case DentalProcedureStatus.PAID:
        return this.confirm(procedureId);
      case DentalProcedureStatus.CONFIRMED:
        return this.complete(procedureId);
      default:
        throw new BadRequestException(
          `This procedure is ${procedure.status}, which is not waiting on us.`,
        );
    }
  }

  /**
   * Step 27 — the co-payment cleared, so the procedure is paid for.
   *
   * Called by the payment service when any DENTAL payment completes. Returns
   * false when the payment belongs to a consultation rather than a procedure,
   * which is how the caller knows to try the bookings service instead.
   */
  async handlePaymentComplete(paymentId: string): Promise<boolean> {
    const procedure = await this.procedureModel.findOne({ paymentId });
    if (!procedure) return false;

    if (procedure.status === DentalProcedureStatus.AWAITING_PAYMENT) {
      procedure.status = DentalProcedureStatus.PAID;
      procedure.paidAt = new Date();
      await procedure.save();
    }
    return true;
  }

  /** Step 29 — operations confirm the slot with the clinic. */
  async confirm(procedureId: string): Promise<DentalProcedure> {
    const procedure = await this.mustFind(procedureId);
    if (procedure.status !== DentalProcedureStatus.PAID) {
      throw new BadRequestException(
        `Only a paid procedure can be confirmed. This one is ${procedure.status}.`,
      );
    }
    procedure.status = DentalProcedureStatus.CONFIRMED;
    procedure.confirmedAt = new Date();
    return procedure.save();
  }

  /** Steps 31 and 32 — the visit happened and the invoice is raised. */
  async complete(procedureId: string): Promise<DentalProcedure> {
    const procedure = await this.mustFind(procedureId);
    if (procedure.status !== DentalProcedureStatus.CONFIRMED) {
      throw new BadRequestException(
        `Only a confirmed procedure can be completed. This one is ${procedure.status}.`,
      );
    }
    procedure.status = DentalProcedureStatus.COMPLETED;
    procedure.completedAt = new Date();
    return procedure.save();
  }

  /** Step 33 — the vendor reports the patient did not attend. */
  async noShow(procedureId: string): Promise<DentalProcedure> {
    const procedure = await this.mustFind(procedureId);
    if (procedure.status !== DentalProcedureStatus.CONFIRMED) {
      throw new BadRequestException('Only a confirmed procedure can be a no-show');
    }
    procedure.status = DentalProcedureStatus.NO_SHOW;
    // Deliberately no refund: the sheet records penalisation as still to be
    // discussed, and inventing one here would be inventing policy.
    return procedure.save();
  }

  async listForUser(userId: string): Promise<DentalProcedure[]> {
    return this.procedureModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOwned(procedureId: string, userId: string): Promise<DentalProcedure> {
    const procedure = await this.mustFind(procedureId);
    if (procedure.userId.toString() !== userId) {
      throw new ForbiddenException('That procedure belongs to another member');
    }
    return procedure;
  }

  private async mustFind(procedureId: string): Promise<DentalProcedure> {
    const procedure = await this.procedureModel.findOne({ procedureId });
    if (!procedure) {
      throw new NotFoundException(`Procedure ${procedureId} not found`);
    }
    return procedure;
  }

  /** Copay then the service cap, in that order, as dental booking already does. */
  private async split(userId: string, amount: number, serviceCode?: string) {
    let config: any = null;
    try {
      const assignments = await this.assignmentsService.getUserAssignments(userId);
      const policyId = assignments?.[0]?.policyId?._id ?? assignments?.[0]?.policyId;
      if (policyId) config = await this.planConfigService.getConfig(policyId.toString());
    } catch {
      config = null;
    }

    const benefit = config?.benefits?.[DENTAL_CATEGORY];
    const copay = CopayCalculator.calculate(amount, config?.wallet?.copay);
    const limit =
      (serviceCode ? benefit?.serviceTransactionLimits?.[serviceCode] : null) ??
      benefit?.perClaimLimit ??
      null;
    const limited = ServiceTransactionLimitCalculator.calculate(
      amount,
      copay.copayAmount,
      limit,
    );

    const cover = await this.dentalCover(userId);
    return {
      copayAmount: limited.copayAmount,
      walletPays: Math.min(limited.insurancePayment, cover),
    };
  }

  private async dentalCover(userId: string): Promise<number> {
    const wallet = await this.walletService.getUserWallet(userId);
    const category = (wallet?.categoryBalances ?? []).find(
      (entry: { categoryCode?: string }) => entry?.categoryCode === DENTAL_CATEGORY,
    );
    if (!category) return 0;
    return category.isUnlimited
      ? (wallet?.totalBalance?.current ?? 0)
      : (category.current ?? 0);
  }

  private suffix(length: number): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from(
      { length },
      () => alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join('');
  }
}
