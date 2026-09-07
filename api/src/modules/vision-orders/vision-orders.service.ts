import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';

import { WalletService } from '../wallet/wallet.service';
import { PaymentService } from '../payments/payment.service';
import { PaymentType, ServiceType } from '../payments/schemas/payment.schema';
import { PlanConfigService } from '../plan-config/plan-config.service';
import { AssignmentsService } from '../assignments/assignments.service';
import { CopayCalculator } from '../plan-config/utils/copay-calculator';
import { ServiceTransactionLimitCalculator } from '../plan-config/utils/service-transaction-limit-calculator';
import {
  VisionOrder,
  VisionOrderStatus,
  VisionPurchaseMode,
} from './schemas/vision-order.schema';
import { VisionPartner } from './schemas/vision-partner.schema';

/**
 * The vision benefit's category.
 *
 * Both forms, because the wallet's field is NAMED `categoryCode` and holds the
 * categoryId: entries read `categoryCode: 'CAT007'`, never `'VISION'`, while
 * predefined-categories.constant.ts defines `categoryId: 'CAT007'` AND
 * `code: 'VISION'`. Matching only the constant's `code` found nothing and every
 * member looked like they had no vision cover. Accepting either means this
 * keeps working if the data is ever corrected to match the field name.
 */
const VISION_CATEGORY_KEYS = ['CAT007', 'VISION'];

/** What debit and credit are keyed on — the wallet stores the categoryId form. */
const VISION_WALLET_CATEGORY = 'CAT007';

@Injectable()
export class VisionOrdersService {
  constructor(
    @InjectModel(VisionOrder.name) private readonly orderModel: Model<VisionOrder>,
    @InjectModel(VisionPartner.name) private readonly partnerModel: Model<VisionPartner>,
    private readonly walletService: WalletService,
    private readonly planConfigService: PlanConfigService,
    private readonly assignmentsService: AssignmentsService,
    private readonly paymentService: PaymentService,
  ) {}

  /**
   * What the plan actually funds for an order of this value.
   *
   * Vision was the only paid flow reserving the whole benefit with no copay and
   * no transaction limit, which is why the member needs to say what the order
   * comes to BEFORE a coupon is issued: 20% copay and a per-service cap cannot
   * be applied to an unknown number.
   *
   * Same two calculators, in the same order, as dental and appointments —
   * copay first, then the service transaction limit against what is left. Doing
   * it here rather than by hand keeps vision from drifting into its own
   * arithmetic.
   */
  async quote(
    userId: string,
    orderValue: number,
    serviceCode?: string,
    /**
     * What the wallet may draw on, when the caller already knows.
     *
     * Live cover is the right ceiling BEFORE a coupon is issued. Afterwards it
     * is not: the reservation has already left the balance, so reading cover
     * would see zero and quote a coupon that funds nothing. A caller holding a
     * reservation passes it here instead.
     */
    availableOverride?: number,
  ) {
    const config = await this.planConfigFor(userId);
    const benefit = config?.benefits?.[VISION_WALLET_CATEGORY];

    const copay = CopayCalculator.calculate(orderValue, config?.wallet?.copay);
    const serviceLimit =
      (serviceCode ? benefit?.serviceTransactionLimits?.[serviceCode] : null) ??
      benefit?.perClaimLimit ??
      null;
    const limited = ServiceTransactionLimitCalculator.calculate(
      orderValue,
      copay.copayAmount,
      serviceLimit,
    );

    // The wallet can never fund more than the member has left. Callers that
    // hold a reservation cap this again against it — see recordPartnerOrder.
    const remainingCover =
      availableOverride ?? (await this.visionCoverFor(userId));
    const walletPays = Math.min(limited.insurancePayment, remainingCover);
    const shortfall = limited.insurancePayment - walletPays;

    return {
      orderValue,
      copayAmount: limited.copayAmount,
      serviceTransactionLimit: limited.serviceTransactionLimit,
      // Above the cap, and above what the wallet still holds: both land on the
      // member, and are shown separately so the reason is visible.
      overLimitAmount: limited.excessAmount,
      shortfallAmount: shortfall,
      walletPays,
      memberPays: orderValue - walletPays,
      remainingCover,
    };
  }

  private async planConfigFor(userId: string): Promise<any> {
    try {
      const assignments = await this.assignmentsService.getUserAssignments(userId);
      const policyId = assignments?.[0]?.policyId?._id ?? assignments?.[0]?.policyId;
      if (!policyId) return null;
      return await this.planConfigService.getConfig(policyId.toString());
    } catch {
      // No config is not no cover: the caller falls back to no copay and no
      // limit, which is what CopayCalculator does with an undefined config.
      return null;
    }
  }

  async listPartners(): Promise<VisionPartner[]> {
    return this.partnerModel.find({ isActive: true }).sort({ name: 1 }).exec();
  }

  /**
   * The member's orders, newest first. Cancelled ones are included: the member
   * should be able to see that an order they abandoned is closed, rather than
   * have it vanish and leave them unsure whether a coupon is still live.
   */
  async listForUser(userId: string): Promise<VisionOrder[]> {
    return this.orderModel
      .find({ userId: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .exec();
  }

  async findOwned(orderId: string, userId: string): Promise<VisionOrder> {
    const order = await this.orderModel.findOne({ orderId }).exec();
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    if (order.userId.toString() !== userId) {
      throw new ForbiddenException('This order belongs to another member');
    }
    return order;
  }

  /**
   * Starts an order — flow 3 step 3, "One open order at a time".
   *
   * "Open" means still in play: a DRAFT being filled in, or a coupon issued and
   * out being spent. A second coupon against the same benefit while one is live
   * would double-spend the entitlement.
   *
   * CANCELLED, USED and REPORTED are all finished. The last two are easy to
   * get wrong — they look terminal-but-consumed rather than terminal-and-done —
   * and treating either as open locks a member out of vision permanently:
   * neither can be cancelled to clear the way.
   *
   * A REPORTED order is settled: the cart exists, the split is decided and the
   * money has moved. An unpaid copay does not hold it open either, because that
   * is a payment in its own right and is chased as one. Whether they can afford
   * a new coupon is the cover check's job at submit, not this rule's.
   */
  async create(input: {
    userId: string;
    patientId: string;
    patientName: string;
    partnerId: string;
    mode: VisionPurchaseMode;
    orderValue?: number;
  }): Promise<VisionOrder> {
    const open = await this.orderModel
      .findOne({
        userId: new Types.ObjectId(input.userId),
        status: {
          $nin: [
            VisionOrderStatus.CANCELLED,
            VisionOrderStatus.USED,
            VisionOrderStatus.REPORTED,
          ],
        },
      })
      .exec();

    if (open) {
      throw new BadRequestException(
        `You already have a vision order in progress (${open.orderId}). Cancel it before starting another.`,
      );
    }

    const partner = await this.partnerModel
      .findOne({ partnerId: input.partnerId, isActive: true })
      .exec();

    if (!partner) {
      throw new NotFoundException('That vision partner is not available');
    }

    if (!partner.modes.includes(input.mode)) {
      throw new BadRequestException(`${partner.name} does not support that mode of purchase`);
    }

    return this.orderModel.create({
      orderId: this.newOrderId(),
      userId: new Types.ObjectId(input.userId),
      patientId: new Types.ObjectId(input.patientId),
      patientName: input.patientName,
      partnerId: partner.partnerId,
      partnerName: partner.name,
      mode: input.mode,
      orderValue: input.orderValue,
      status: VisionOrderStatus.DRAFT,
    });
  }

  /** Flow 3 step 5 — mandatory before the request can be submitted. */
  async attachPrescription(
    orderId: string,
    userId: string,
    file: { filename: string; originalname: string; path: string },
  ): Promise<VisionOrder> {
    const order = await this.findOwned(orderId, userId);

    if (order.status !== VisionOrderStatus.DRAFT) {
      throw new BadRequestException('This order has already been submitted');
    }

    order.prescription = {
      fileName: file.filename,
      originalName: file.originalname,
      filePath: file.path,
      uploadedAt: new Date(),
    };

    return order.save();
  }

  /**
   * Flow 3 steps 6 and 7, which the `Vision Backend` tab treats as one:
   * "Request is validated and a coupon code plus a link to the partner website
   * are issued."
   *
   * Validation is automatic. The tab says eligibility is verified by a person
   * against records held outside the dashboard — there is no operations queue
   * for that here, and inventing a PENDING state with nothing to move it along
   * would leave every member stuck. What IS checked is what this system can
   * actually know: the member has vision cover, and it has value left.
   */
  async submit(orderId: string, userId: string): Promise<VisionOrder> {
    const order = await this.findOwned(orderId, userId);

    if (order.status === VisionOrderStatus.COUPON_ISSUED) {
      throw new BadRequestException('A coupon has already been issued for this order');
    }
    if (order.status === VisionOrderStatus.CANCELLED) {
      throw new BadRequestException('This order was cancelled');
    }
    if (!order.prescription) {
      throw new BadRequestException('Upload the eye prescription before submitting');
    }

    /*
     * The coupon is worth what the WALLET funds, not the whole benefit.
     *
     * It used to reserve every rupee of remaining cover, which ignored the 20%
     * copay and the per-service cap that every other flow applies — so a coupon
     * promised more than the plan would ever pay, and held the member's whole
     * year against one pair of glasses.
     *
     * With an order value the split is real. Without one there is nothing to
     * apply a percentage to, so the old behaviour stands and is labelled as an
     * estimate on screen.
     */
    const quote = order.orderValue
      ? await this.quote(userId, order.orderValue)
      : null;
    const eligibleAmount = quote ? quote.walletPays : await this.visionCoverFor(userId);

    if (eligibleAmount <= 0) {
      throw new BadRequestException(
        quote
          ? 'Your plan does not fund any of this order, so no coupon can be issued'
          : 'Your plan has no vision cover left, so no coupon can be issued',
      );
    }

    /*
     * Reserve the value BEFORE issuing the coupon.
     *
     * The tab says vision "reserves value against the coupon instead" of
     * blocking the wallet, and that nothing is held on the member ledger. Left
     * literally, that reservation did not exist: the coupon carried a snapshot
     * of remaining cover, nothing outside this module knew a coupon existed,
     * and `vision-bookings` and `memberclaims` both spend the same CAT007. A
     * member could hold a live coupon and spend the same money on a vision
     * visit or a vision claim, and the partner would still honour the coupon.
     *
     * There is no held-balance primitive — that is what
     * `wallet-block-and-razorpay` is building, and it excludes vision. So the
     * reservation is a DEBIT, which is stronger than a hold: the money leaves
     * the available balance, the other two paths correctly see nothing left,
     * and cancelling credits it back in full. When the held primitive lands,
     * this becomes a hold and the release becomes a release.
     *
     * Reserve first, issue second. A failed debit must not leave a coupon
     * quoting money the wallet no longer backs.
     */
    await this.walletService.debitWallet(
      userId,
      eligibleAmount,
      VISION_WALLET_CATEGORY,
      // The Mongo _id, NOT the business VIS-ORD-… id: debitWallet does
      // `new Types.ObjectId(bookingId)` (wallet.service.ts:786), which throws a
      // BSONError on anything else. Every other caller passes `_id.toString()`.
      // Worse, the wallet is saved BEFORE that line, so a bad id leaves the
      // balance changed with no ledger entry behind it.
      (order._id as Types.ObjectId).toString(),
      'VISION',
      order.partnerName,
      `Reserved against vision coupon for ${order.partnerName}`,
    );

    order.couponCode = this.newCouponCode();
    order.eligibleAmount = eligibleAmount;
    if (quote) {
      order.copayAmount = quote.copayAmount;
      order.memberPays = quote.memberPays;
    }
    order.couponIssuedAt = new Date();
    order.status = VisionOrderStatus.COUPON_ISSUED;

    try {
      return await order.save();
    } catch (error) {
      // The reservation succeeded and the order did not. Put the money back
      // rather than stranding it against an order that never became a coupon.
      await this.walletService.creditWallet(
        userId,
        eligibleAmount,
        VISION_WALLET_CATEGORY,
        (order._id as Types.ObjectId).toString(),
        'VISION',
        order.partnerName,
        'Released: vision coupon could not be issued',
      );
      throw error;
    }
  }

  /**
   * The member confirms they have spent the coupon.
   *
   * Closes the hole the release created: cancelling credits the reservation
   * back, and nothing reports redemption, so a member could buy at the partner
   * and then cancel to get the same money returned. Marking it used makes the
   * reservation a real consumption and takes cancellation off the table.
   *
   * Self-declared and therefore not proof. It is the only signal that exists —
   * a partner redemption callback would replace it, and should.
   */
  /**
   * The partner has reported an order against a coupon — the step everything
   * downstream waits on.
   *
   * This is the ONLY way a vision cart comes into being. The member never types
   * a figure: the coupon is a reference id, the partner prices the basket and
   * sends back its value, and the cart is built from that.
   *
   * There is no partner callback, so operations key in what the Lenskart
   * Insurance Dashboard shows them — which is what the Vision Backend tab
   * already describes a person doing. When an integration exists it calls this
   * same method and nothing downstream changes.
   *
   * Settles the money in the same breath, because a cart the member can see is
   * a cart whose split has been decided:
   *   - copay and anything over the per-service cap fall to the member
   *   - the wallet share is captured from the reservation taken at issue
   *   - whatever the order did not use is released back
   */
  /** The ops queue: coupons out in the world with no reported order yet. */
  async awaitingReport(): Promise<VisionOrder[]> {
    return this.orderModel
      .find({ status: VisionOrderStatus.COUPON_ISSUED })
      .sort({ couponIssuedAt: 1 })
      .exec();
  }

  async recordPartnerOrder(
    orderId: string,
    input: { orderValue: number; partnerOrderId?: string; serviceCode?: string },
  ): Promise<VisionOrder> {
    const order = await this.orderModel.findOne({ orderId }).exec();
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
    if (order.status !== VisionOrderStatus.COUPON_ISSUED) {
      throw new BadRequestException(
        `Only an order with a live coupon can be reported. This one is ${order.status}.`,
      );
    }
    if (!Number.isFinite(input.orderValue) || input.orderValue < 0) {
      throw new BadRequestException('The reported order value must be a number');
    }

    const userId = order.userId.toString();
    const reserved = order.eligibleAmount ?? 0;

    /*
     * Quote against the reservation, not against remaining cover: the cover was
     * already taken at issue, so asking the wallet again would see zero and
     * fund nothing. `reserved` is what this order is entitled to draw on.
     */
    const quote = await this.quote(userId, input.orderValue, input.serviceCode, reserved);
    const walletPays = quote.walletPays;
    const unspent = reserved - walletPays;

    if (unspent > 0) {
      await this.walletService.creditWallet(
        userId,
        unspent,
        VISION_WALLET_CATEGORY,
        (order._id as Types.ObjectId).toString(),
        'VISION',
        order.partnerName,
        `Released: unspent balance after ${order.partnerName} reported the order`,
      );
    }

    order.status = VisionOrderStatus.REPORTED;
    order.partnerOrderId = input.partnerOrderId;
    order.orderValue = input.orderValue;
    order.copayAmount = quote.copayAmount;
    order.walletPaid = walletPays;
    order.memberPays = input.orderValue - walletPays;
    order.excessAmount = Math.max(0, input.orderValue - walletPays - quote.copayAmount);
    order.eligibleAmount = walletPays;
    order.reportedAt = new Date();

    /*
     * Open a payment for the copay, through the same dummy gateway every other
     * flow uses. Nothing bespoke here: a PENDING payment the member settles on
     * the existing payment screen, and `mark-paid` completes it.
     *
     * ONLY the copay. The amount above the plan's per-service cap goes to the
     * partner at their till — the sheet puts that outside the member payment
     * flow entirely — so billing it here as well would charge them twice for
     * one pair of glasses.
     */
    const payableHere = quote.copayAmount;
    order.payableHere = payableHere;

    if (payableHere > 0) {
      const payment = await this.paymentService.createPaymentRequest({
        userId,
        amount: payableHere,
        paymentType: PaymentType.COPAY,
        serviceType: ServiceType.VISION,
        serviceId: (order._id as Types.ObjectId).toString(),
        serviceReferenceId: order.orderId,
        description: `Vision co-payment for ${order.partnerName}`,
        notes: input.partnerOrderId
          ? `Partner order ${input.partnerOrderId}`
          : undefined,
      });
      order.paymentId = payment.paymentId;
    }

    return order.save();
  }

  async markUsed(
    orderId: string,
    userId: string,
    orderValue?: number,
  ): Promise<VisionOrder> {
    const order = await this.findOwned(orderId, userId);

    if (order.status !== VisionOrderStatus.COUPON_ISSUED) {
      throw new BadRequestException('Only an order with a live coupon can be marked as used');
    }
    if (orderValue !== undefined && (!Number.isFinite(orderValue) || orderValue < 0)) {
      throw new BadRequestException('Tell us what the order came to, as a number');
    }

    const reserved = order.eligibleAmount ?? 0;

    /*
     * Partial capture.
     *
     * The whole coupon is reserved at issue because nobody knows the order
     * value yet. Once the member tells us, only what they actually spent should
     * stay consumed — a ₹3,000 reservation against an ₹1,800 order was holding
     * ₹1,200 of their benefit against nothing, for the rest of the policy year.
     *
     * Without a figure we cannot split it, so the whole reservation stands.
     * That is the conservative direction: it never hands back money that may
     * have been spent.
     */
    const spent = orderValue === undefined ? reserved : Math.min(orderValue, reserved);
    const unspent = reserved - spent;
    const excess = orderValue === undefined ? 0 : Math.max(0, orderValue - reserved);

    if (unspent > 0) {
      await this.walletService.creditWallet(
        userId,
        unspent,
        VISION_WALLET_CATEGORY,
        (order._id as Types.ObjectId).toString(),
        'VISION',
        order.partnerName,
        `Released: unspent balance of vision coupon (order came to ${spent})`,
      );
    }

    order.status = VisionOrderStatus.USED;
    order.usedAt = new Date();
    order.orderValue = orderValue;
    order.excessAmount = excess;
    // Declared, never collected: this platform has no way to take it, and the
    // sheet puts that collection outside the member payment flow entirely.
    order.excessPaid = excess > 0;
    // What stays consumed is `spent`; the rest has just been credited back.
    order.eligibleAmount = spent;
    return order.save();
  }

  async cancel(orderId: string, userId: string, reason?: string): Promise<VisionOrder> {
    const order = await this.findOwned(orderId, userId);

    if (order.status === VisionOrderStatus.CANCELLED) {
      throw new BadRequestException('This order is already cancelled');
    }
    if (order.status === VisionOrderStatus.USED) {
      throw new BadRequestException(
        'You told us this coupon was used, so it cannot be cancelled. Contact support if that was a mistake.',
      );
    }

    /*
     * Release the reservation, but only if one was taken. A DRAFT order never
     * reserved anything, so crediting here would hand the member money they
     * were never charged.
     */
    const wasReserved =
      order.status === VisionOrderStatus.COUPON_ISSUED && order.eligibleAmount > 0;

    order.status = VisionOrderStatus.CANCELLED;
    order.cancelledAt = new Date();
    order.cancelReason = reason?.trim() || 'Cancelled by member';
    const cancelled = await order.save();

    if (wasReserved) {
      await this.walletService.creditWallet(
        userId,
        order.eligibleAmount,
        VISION_WALLET_CATEGORY,
        (order._id as Types.ObjectId).toString(),
        'VISION',
        order.partnerName,
        'Released: vision coupon cancelled',
      );
    }

    return cancelled;
  }

  async partnerFor(order: VisionOrder): Promise<VisionPartner | null> {
    return this.partnerModel.findOne({ partnerId: order.partnerId }).exec();
  }

  /** Remaining vision cover, or 0 when the plan carries none. */
  private async visionCoverFor(userId: string): Promise<number> {
    const wallet = await this.walletService.getUserWallet(userId);
    const category = (wallet?.categoryBalances ?? []).find(
      (entry: { categoryCode?: string }) =>
        VISION_CATEGORY_KEYS.includes(entry?.categoryCode ?? ''),
    );
    if (!category) return 0;
    // An unlimited category still has to quote a number on the coupon; the
    // remaining total balance is the only honest ceiling available.
    return category.isUnlimited
      ? (wallet?.totalBalance?.current ?? 0)
      : (category.current ?? 0);
  }

  private newOrderId(): string {
    return `VIS-ORD-${Date.now()}-${this.randomSuffix(9)}`;
  }

  /**
   * A local coupon code. Formatted to be read aloud and typed into someone
   * else's checkout field: uppercase, no ambiguous characters.
   *
   * Replace this with the partner's own issue call when an integration exists —
   * Lenskart has to recognise the code for it to be worth anything, and only
   * they can mint one that does.
   */
  private newCouponCode(): string {
    return `OPD-${this.randomSuffix(8)}`;
  }

  private randomSuffix(length: number): string {
    const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    return Array.from(
      { length },
      () => alphabet[Math.floor(Math.random() * alphabet.length)],
    ).join('');
  }
}
