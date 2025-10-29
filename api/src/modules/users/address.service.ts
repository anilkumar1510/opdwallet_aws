import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Address } from './schemas/address.schema';
import { CreateAddressDto } from './dto/create-address.dto';

@Injectable()
export class AddressService {
  constructor(
    @InjectModel(Address.name)
    private addressModel: Model<Address>,
  ) {
    console.log('[ADDRESS-SERVICE] AddressService instantiated');
    console.log('[ADDRESS-SERVICE] addressModel:', this.addressModel ? 'INITIALIZED' : 'UNDEFINED');
    console.log('[ADDRESS-SERVICE] addressModel.modelName:', this.addressModel?.modelName);
    console.log('[ADDRESS-SERVICE] addressModel.collection.name:', this.addressModel?.collection?.name);
  }

  async createAddress(userId: Types.ObjectId, createDto: CreateAddressDto): Promise<Address> {
    console.log('[ADDRESS-SERVICE] ========== CREATE ADDRESS SERVICE START ==========');
    console.log('[ADDRESS-SERVICE] Input userId:', userId);
    console.log('[ADDRESS-SERVICE] userId type:', typeof userId);
    console.log('[ADDRESS-SERVICE] userId.toString():', userId.toString());
    console.log('[ADDRESS-SERVICE] Input createDto:', JSON.stringify(createDto, null, 2));

    try {
      // Generate addressId
      console.log('[ADDRESS-SERVICE] Generating addressId...');
      const timestamp = Date.now();
      const random = Math.random().toString(36).substr(2, 9).toUpperCase();
      const addressId = `ADDR-${timestamp}-${random}`;
      console.log('[ADDRESS-SERVICE] Generated addressId:', addressId);

      // Check if address model is available
      console.log('[ADDRESS-SERVICE] Checking addressModel...');
      console.log('[ADDRESS-SERVICE] addressModel exists:', !!this.addressModel);
      console.log('[ADDRESS-SERVICE] addressModel.modelName:', this.addressModel?.modelName);

      // If this address is marked as default, unset other default addresses
      if (createDto.isDefault) {
        console.log('[ADDRESS-SERVICE] Address is marked as default, unsetting other defaults...');
        const updateFilter = { userId, isDefault: true };
        console.log('[ADDRESS-SERVICE] Update filter:', updateFilter);

        const updateResult = await this.addressModel.updateMany(
          updateFilter,
          { isDefault: false }
        );
        console.log('[ADDRESS-SERVICE] UpdateMany result:', updateResult);
        console.log('[ADDRESS-SERVICE] Modified count:', updateResult.modifiedCount);
      } else {
        console.log('[ADDRESS-SERVICE] Address is NOT marked as default, skipping updateMany');
      }

      // Create new address document
      console.log('[ADDRESS-SERVICE] Creating new address document...');
      const addressData = {
        addressId,
        userId,
        ...createDto,
      };
      console.log('[ADDRESS-SERVICE] Address data to save:', JSON.stringify(addressData, null, 2));

      console.log('[ADDRESS-SERVICE] Instantiating address model...');
      const address = new this.addressModel(addressData);
      console.log('[ADDRESS-SERVICE] Address instance created:', address);
      console.log('[ADDRESS-SERVICE] Address._id:', address._id);
      console.log('[ADDRESS-SERVICE] Address.addressId:', address.addressId);

      console.log('[ADDRESS-SERVICE] Saving address to database...');
      const savedAddress = await address.save();
      console.log('[ADDRESS-SERVICE] ✅ Address saved successfully!');
      console.log('[ADDRESS-SERVICE] Saved address:', JSON.stringify(savedAddress, null, 2));
      console.log('[ADDRESS-SERVICE] Saved address._id:', savedAddress._id);
      console.log('[ADDRESS-SERVICE] Saved address.addressId:', savedAddress.addressId);
      console.log('[ADDRESS-SERVICE] ========== CREATE ADDRESS SERVICE COMPLETE ==========');

      return savedAddress;
    } catch (error) {
      console.error('[ADDRESS-SERVICE] ❌ ERROR in createAddress!');
      console.error('[ADDRESS-SERVICE] Error type:', error?.constructor?.name);
      console.error('[ADDRESS-SERVICE] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[ADDRESS-SERVICE] Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('[ADDRESS-SERVICE] Full error object:', error);

      // Check for MongoDB specific errors
      if (error && typeof error === 'object') {
        console.error('[ADDRESS-SERVICE] Error code:', (error as any).code);
        console.error('[ADDRESS-SERVICE] Error name:', (error as any).name);
        if ((error as any).errors) {
          console.error('[ADDRESS-SERVICE] Validation errors:', (error as any).errors);
        }
      }

      console.log('[ADDRESS-SERVICE] ========== CREATE ADDRESS SERVICE FAILED ==========');
      throw error;
    }
  }

  async getUserAddresses(userId: Types.ObjectId): Promise<Address[]> {
    console.log('[ADDRESS-SERVICE] ========== GET USER ADDRESSES SERVICE START ==========');
    console.log('[ADDRESS-SERVICE] Input userId:', userId);
    console.log('[ADDRESS-SERVICE] userId type:', typeof userId);
    console.log('[ADDRESS-SERVICE] userId.toString():', userId.toString());

    try {
      console.log('[ADDRESS-SERVICE] Checking addressModel...');
      console.log('[ADDRESS-SERVICE] addressModel exists:', !!this.addressModel);
      console.log('[ADDRESS-SERVICE] addressModel.modelName:', this.addressModel?.modelName);

      const query = { userId };
      console.log('[ADDRESS-SERVICE] Query filter:', query);

      console.log('[ADDRESS-SERVICE] Executing find query...');
      const addresses = await this.addressModel
        .find(query)
        .sort({ isDefault: -1, createdAt: -1 })
        .exec();

      console.log('[ADDRESS-SERVICE] ✅ Query executed successfully!');
      console.log('[ADDRESS-SERVICE] Number of addresses found:', addresses.length);
      console.log('[ADDRESS-SERVICE] Addresses:', JSON.stringify(addresses, null, 2));
      console.log('[ADDRESS-SERVICE] ========== GET USER ADDRESSES SERVICE COMPLETE ==========');

      return addresses;
    } catch (error) {
      console.error('[ADDRESS-SERVICE] ❌ ERROR in getUserAddresses!');
      console.error('[ADDRESS-SERVICE] Error type:', error?.constructor?.name);
      console.error('[ADDRESS-SERVICE] Error message:', error instanceof Error ? error.message : String(error));
      console.error('[ADDRESS-SERVICE] Error stack:', error instanceof Error ? error.stack : 'No stack');
      console.error('[ADDRESS-SERVICE] Full error object:', error);
      console.log('[ADDRESS-SERVICE] ========== GET USER ADDRESSES SERVICE FAILED ==========');
      throw error;
    }
  }

  async getAddressById(addressId: string): Promise<Address> {
    const address = await this.addressModel.findOne({ addressId });

    if (!address) {
      throw new NotFoundException(`Address ${addressId} not found`);
    }

    return address;
  }

  async setDefaultAddress(userId: Types.ObjectId, addressId: string): Promise<Address> {
    const address = await this.getAddressById(addressId);

    // Verify address belongs to user
    if (address.userId.toString() !== userId.toString()) {
      throw new ConflictException('Address does not belong to user');
    }

    // Unset other default addresses
    await this.addressModel.updateMany(
      { userId, isDefault: true },
      { isDefault: false }
    );

    // Set this address as default
    await this.addressModel.updateOne(
      { addressId },
      { isDefault: true }
    );
    return this.getAddressById(addressId);
  }

  async deleteAddress(userId: Types.ObjectId, addressId: string): Promise<void> {
    const address = await this.getAddressById(addressId);

    // Verify address belongs to user
    if (address.userId.toString() !== userId.toString()) {
      throw new ConflictException('Address does not belong to user');
    }

    await this.addressModel.deleteOne({ addressId });
  }
}
