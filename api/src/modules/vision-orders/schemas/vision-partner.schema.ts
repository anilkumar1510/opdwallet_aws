import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

/**
 * An empanelled vision partner — patient-flows flow 3 step 4, "Partners come
 * from the empanelled vision network".
 *
 * Deliberately thin compared with a vaccination vendor. Vision partners hold no
 * slots, no pricing and no serviceable pincodes, because the member never books
 * anything here: they receive a coupon and buy on the partner's own site. The
 * `Vision Backend` tab is explicit that everything from checkout onward runs on
 * the partner's platform.
 */
@Schema({ timestamps: true, collection: 'vision_partners' })
export class VisionPartner extends Document {
  @Prop({ required: true, unique: true })
  partnerId: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true, unique: true, uppercase: true })
  code: string;

  /**
   * Where the member is sent to spend the coupon. Stored per partner rather
   * than hardcoded, because it is the partner's URL and will change without
   * anything here changing.
   */
  @Prop({ required: true })
  storeUrl: string;

  /**
   * Which purchase modes this partner supports. A partner with no physical
   * shops offers ONLINE only, and the order screen must not offer IN_STORE for
   * them.
   */
  @Prop({ type: [String], default: ['ONLINE', 'IN_STORE'] })
  modes: string[];

  @Prop()
  description?: string;

  @Prop({ default: true })
  isActive: boolean;
}

export const VisionPartnerSchema = SchemaFactory.createForClass(VisionPartner);
