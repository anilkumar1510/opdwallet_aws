import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { PharmacyCart, PharmacyCartDocument, PharmacyCartStatus } from '../schemas/pharmacy-cart.schema';
import { PharmacyCatalogueService } from './pharmacy-catalogue.service';

@Injectable()
export class PharmacyCartService {
  constructor(
    @InjectModel(PharmacyCart.name) private cartModel: Model<PharmacyCartDocument>,
    private catalogue: PharmacyCatalogueService,
  ) {}

  /** One open cart per member at a time — reuses it rather than creating duplicates. */
  /**
   * The cart waiting for a member, if there is one.
   *
   * Read-only on purpose: the page asks this on entry, and creating a cart just
   * because someone opened the screen would hide the upload question behind an
   * empty cart. Returns null when nothing is waiting.
   */
  async findOpenCart(userId: string, patientId: string): Promise<PharmacyCartDocument | null> {
    return this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
      patientId,
      status: PharmacyCartStatus.CREATED,
    });
  }

  async getOrCreateCart(
    userId: string,
    patientId: string,
    patientName: string,
    prescriptionFileName?: string,
  ): Promise<PharmacyCartDocument> {
    const existing = await this.cartModel.findOne({
      userId: new Types.ObjectId(userId),
      patientId,
      status: PharmacyCartStatus.CREATED,
    });
    if (existing) return existing;

    const cartId = `PHCART-${Date.now()}`;
    return this.cartModel.create({
      cartId,
      userId: new Types.ObjectId(userId),
      patientId,
      patientName,
      prescriptionFileName,
      items: [],
      status: PharmacyCartStatus.CREATED,
    });
  }

  async getCart(cartId: string, userId: string): Promise<PharmacyCartDocument> {
    const cart = await this.cartModel.findOne({ cartId, userId: new Types.ObjectId(userId) });
    if (!cart) throw new NotFoundException('Cart not found');
    return cart;
  }

  /**
   * Flow 5 step 8 — "the member may reduce the cart, never increase it".
   *
   * Everything in the cart was put there by an adjudicator who read the
   * prescription and checked it against the policy, so a member adding an item
   * or raising a quantity would slip something past that check and into a cart
   * the wallet is already committed against. The sheet forbids it, and so does
   * this: quantity may only go DOWN, and reaching zero removes the line.
   *
   * The member's `addItem` route used to be the primary way a cart was built
   * at all. It is gone — see `PharmacyOpsService.buildCart`, which is where
   * items come from now.
   */
  async reduceItem(
    cartId: string,
    userId: string,
    medicineId: string,
    quantity: number,
  ): Promise<PharmacyCartDocument> {
    if (!Number.isFinite(quantity) || quantity < 0) {
      throw new BadRequestException('Quantity cannot be negative');
    }

    const cart = await this.getCart(cartId, userId);
    this.assertOpen(cart);

    const item = cart.items.find((line) => line.medicineId === medicineId);
    if (!item) throw new NotFoundException('That medicine is not in your cart');

    if (quantity >= item.quantity) {
      throw new BadRequestException(
        'You can only reduce this cart. Adding to it would skip the check we ran against your prescription.',
      );
    }

    if (quantity === 0) {
      cart.items = cart.items.filter((line) => line.medicineId !== medicineId);
    } else {
      item.quantity = quantity;
    }
    return cart.save();
  }

  async removeItem(cartId: string, userId: string, medicineId: string): Promise<PharmacyCartDocument> {
    const cart = await this.getCart(cartId, userId);
    // This had no status check at all, so a member could strip items out of a
    // cart that had already been ordered — leaving the order, which snapshots
    // its own items, permanently disagreeing with the cart it came from.
    this.assertOpen(cart);
    if (!cart.items.some((item) => item.medicineId === medicineId)) {
      throw new NotFoundException('That medicine is not in your cart');
    }
    cart.items = cart.items.filter((item) => item.medicineId !== medicineId);
    return cart.save();
  }

  /** A cart that has been ordered or cancelled is finished with. */
  private assertOpen(cart: PharmacyCartDocument): void {
    if (cart.status !== PharmacyCartStatus.CREATED) {
      throw new BadRequestException(
        cart.status === PharmacyCartStatus.ORDERED
          ? 'This cart has already been ordered'
          : 'This cart has been cancelled',
      );
    }
  }

  /**
   * Step 4 — the adjudicator writes the cart, on the member's behalf.
   *
   * Called from the ops surface only. Replaces whatever was there, because
   * adjudication is a decision about the whole prescription rather than a
   * series of edits.
   */
  async buildCart(
    cartId: string,
    lines: readonly { medicineId: string; quantity: number }[],
  ): Promise<PharmacyCartDocument> {
    const cart = await this.cartModel.findOne({ cartId });
    if (!cart) throw new NotFoundException('Cart not found');
    this.assertOpen(cart);

    const items = [] as PharmacyCartDocument['items'];
    for (const line of lines) {
      if (!Number.isFinite(line.quantity) || line.quantity < 1) {
        throw new BadRequestException('Every medicine needs a quantity of at least 1');
      }
      const medicine = await this.catalogue.findById(line.medicineId);
      if (!medicine) throw new NotFoundException(`Medicine ${line.medicineId} not found`);
      items.push({
        medicineId: medicine.medicineId,
        name: medicine.name,
        price: medicine.price,
        quantity: line.quantity,
        requiresPrescription: medicine.requiresPrescription,
      });
    }

    cart.items = items;
    return cart.save();
  }
}
