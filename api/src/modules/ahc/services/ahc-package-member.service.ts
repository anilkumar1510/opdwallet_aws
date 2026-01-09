import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { AhcPackage } from '../schemas/ahc-package.schema';

@Injectable()
export class AhcPackageMemberService {
  constructor(
    @InjectModel(AhcPackage.name)
    private ahcPackageModel: Model<AhcPackage>,
  ) {}

  /**
   * Get AHC package assigned to user's policy
   * Logic:
   * 1. Get user's assignment
   * 2. Get plan config for user's policy
   * 3. Resolve wellness benefit to get ahcPackageId
   * 4. Fetch package with populated lab and diagnostic services
   */
  async getUserAhcPackage(
    userId: string,
    assignmentsService: any,
    planConfigService: any,
    labServiceModel: any,
    diagnosticServiceModel: any,
  ): Promise<any> {
    // Get user's active assignments
    const assignments = await assignmentsService.getUserAssignments(userId);

    if (!assignments || assignments.length === 0) {
      throw new NotFoundException('No active policy assignment found for user');
    }

    // Get the first active assignment
    const assignment = assignments[0];

    if (!assignment) {
      throw new NotFoundException('No active policy assignment found for user');
    }

    // Extract policyId (it may be populated as an object)
    const policyId = typeof assignment.policyId === 'object' && assignment.policyId._id
      ? assignment.policyId._id.toString()
      : assignment.policyId.toString();

    // Get plan config for the policy
    const planConfig = await planConfigService.getConfig(policyId);

    if (!planConfig) {
      throw new NotFoundException('No plan configuration found for policy');
    }

    // Check if wellness benefit is enabled and has AHC package
    // Wellness is stored under CAT008 category code in benefits
    const wellnessBenefit = planConfig.benefits?.CAT008;

    if (!wellnessBenefit?.enabled) {
      throw new BadRequestException('Wellness benefit is not enabled for this policy');
    }

    if (!wellnessBenefit.ahcPackageId) {
      throw new NotFoundException('No AHC package assigned to this policy');
    }

    // Fetch the AHC package
    const ahcPackage = await this.ahcPackageModel.findOne({
      packageId: wellnessBenefit.ahcPackageId,
      isActive: true,
    });

    if (!ahcPackage) {
      throw new NotFoundException('AHC package not found or inactive');
    }

    // Check if package is within validity period
    const now = new Date();
    const effectiveFrom = new Date(ahcPackage.effectiveFrom);
    const effectiveTo = new Date(ahcPackage.effectiveTo);

    if (now < effectiveFrom || now > effectiveTo) {
      throw new BadRequestException('AHC package is not currently valid');
    }

    // Populate lab services (query by serviceId, not _id)
    const labServices = await labServiceModel.find({
      serviceId: { $in: ahcPackage.labServiceIds || [] },
    });

    // Populate diagnostic services (query by serviceId, not _id)
    const diagnosticServices = await diagnosticServiceModel.find({
      serviceId: { $in: ahcPackage.diagnosticServiceIds || [] },
    });

    return {
      _id: ahcPackage._id,
      packageId: ahcPackage.packageId,
      name: ahcPackage.name,
      effectiveFrom: ahcPackage.effectiveFrom,
      effectiveTo: ahcPackage.effectiveTo,
      labServices: labServices.map((service: any) => ({
        _id: service._id,
        serviceId: service.serviceId,
        name: service.name,
        code: service.code,
        category: service.category,
      })),
      diagnosticServices: diagnosticServices.map((service: any) => ({
        _id: service._id,
        serviceId: service.serviceId,
        name: service.name,
        code: service.code,
        category: service.category,
      })),
      totalLabTests: labServices.length,
      totalDiagnosticTests: diagnosticServices.length,
      totalTests: labServices.length + diagnosticServices.length,
    };
  }

  /**
   * Get eligible lab vendors for user's AHC package
   * Returns vendors that have pricing for ALL lab services in the package
   */
  async getEligibleLabVendors(
    userId: string,
    pincode: string,
    assignmentsService: any,
    planConfigService: any,
    labVendorService: any,
    labServiceModel: any,
  ): Promise<any[]> {
    // Get user's active assignments
    const assignments = await assignmentsService.getUserAssignments(userId);

    if (!assignments || assignments.length === 0) {
      throw new NotFoundException('No active policy assignment found for user');
    }

    const assignment = assignments[0];

    // Extract policyId (it may be populated as an object)
    const policyId = typeof assignment.policyId === 'object' && assignment.policyId._id
      ? assignment.policyId._id.toString()
      : assignment.policyId.toString();

    // Get plan config
    const planConfig = await planConfigService.getConfig(policyId);

    if (!planConfig) {
      throw new NotFoundException('No plan configuration found for policy');
    }

    // Get wellness benefit (CAT008)
    const wellnessBenefit = planConfig.benefits?.CAT008;

    if (!wellnessBenefit?.enabled || !wellnessBenefit.ahcPackageId) {
      throw new BadRequestException('No AHC package assigned to this policy');
    }

    // Fetch the AHC package
    const ahcPackage = await this.ahcPackageModel.findOne({
      packageId: wellnessBenefit.ahcPackageId,
      isActive: true,
    });

    if (!ahcPackage) {
      throw new NotFoundException('AHC package not found or inactive');
    }

    // Get lab service IDs from package (these are service codes like "LABS-001")
    const labServiceCodes = (ahcPackage.labServiceIds || []).map((id: any) => id.toString());
    console.log('[AHC] Lab service codes from package:', labServiceCodes);

    if (labServiceCodes.length === 0) {
      console.log('[AHC] No lab service codes found in package');
      return [];
    }

    // Fetch lab service documents to get their ObjectIds
    const labServices = await labServiceModel.find({
      serviceId: { $in: labServiceCodes },
    });
    console.log('[AHC] Found lab services:', labServices.length);
    console.log('[AHC] Lab services:', labServices.map((s: any) => ({ id: s._id, serviceId: s.serviceId, name: s.name })));

    if (labServices.length === 0) {
      console.log('[AHC] No lab services found matching the service codes');
      return [];
    }

    // Extract ObjectIds from lab services
    const labServiceObjectIds = labServices.map((service: any) => service._id.toString());
    console.log('[AHC] Lab service ObjectIds:', labServiceObjectIds);

    // Use lab vendor service to get eligible vendors with ObjectIds
    console.log('[AHC] Calling labVendorService.getEligibleVendors with:', { serviceIds: labServiceObjectIds, pincode });
    const eligibleVendors = await labVendorService.getEligibleVendors(
      labServiceObjectIds,
      pincode,
    );
    console.log('[AHC] Eligible vendors found:', eligibleVendors.length);

    return eligibleVendors;
  }

  /**
   * Get eligible diagnostic vendors for user's AHC package
   * Returns vendors that have pricing for ALL diagnostic services in the package
   */
  async getEligibleDiagnosticVendors(
    userId: string,
    pincode: string,
    assignmentsService: any,
    planConfigService: any,
    diagnosticVendorService: any,
    diagnosticServiceModel: any,
  ): Promise<any[]> {
    // Get user's active assignments
    const assignments = await assignmentsService.getUserAssignments(userId);

    if (!assignments || assignments.length === 0) {
      throw new NotFoundException('No active policy assignment found for user');
    }

    const assignment = assignments[0];

    // Extract policyId (it may be populated as an object)
    const policyId = typeof assignment.policyId === 'object' && assignment.policyId._id
      ? assignment.policyId._id.toString()
      : assignment.policyId.toString();

    // Get plan config
    const planConfig = await planConfigService.getConfig(policyId);

    if (!planConfig) {
      throw new NotFoundException('No plan configuration found for policy');
    }

    // Get wellness benefit (CAT008)
    const wellnessBenefit = planConfig.benefits?.CAT008;

    if (!wellnessBenefit?.enabled || !wellnessBenefit.ahcPackageId) {
      throw new BadRequestException('No AHC package assigned to this policy');
    }

    // Fetch the AHC package
    const ahcPackage = await this.ahcPackageModel.findOne({
      packageId: wellnessBenefit.ahcPackageId,
      isActive: true,
    });

    if (!ahcPackage) {
      throw new NotFoundException('AHC package not found or inactive');
    }

    // Get diagnostic service IDs from package (these are service codes like "DIAG-001")
    const diagnosticServiceCodes = (ahcPackage.diagnosticServiceIds || []).map((id: any) =>
      id.toString()
    );

    if (diagnosticServiceCodes.length === 0) {
      return [];
    }

    // Fetch diagnostic service documents to get their ObjectIds
    const diagnosticServices = await diagnosticServiceModel.find({
      serviceId: { $in: diagnosticServiceCodes },
    });

    if (diagnosticServices.length === 0) {
      return [];
    }

    // Extract ObjectIds from diagnostic services
    const diagnosticServiceObjectIds = diagnosticServices.map((service: any) =>
      service._id.toString()
    );

    // Use diagnostic vendor service to get eligible vendors with ObjectIds
    const eligibleVendors = await diagnosticVendorService.getEligibleVendors(
      diagnosticServiceObjectIds,
      pincode,
    );

    return eligibleVendors;
  }

  /**
   * Check if package has lab services
   */
  async packageHasLabServices(packageId: string): Promise<boolean> {
    const ahcPackage = await this.ahcPackageModel.findOne({
      packageId: packageId,
      isActive: true,
    });

    if (!ahcPackage) {
      return false;
    }

    return (ahcPackage.labServiceIds || []).length > 0;
  }

  /**
   * Check if package has diagnostic services
   */
  async packageHasDiagnosticServices(packageId: string): Promise<boolean> {
    const ahcPackage = await this.ahcPackageModel.findOne({
      packageId: packageId,
      isActive: true,
    });

    if (!ahcPackage) {
      return false;
    }

    return (ahcPackage.diagnosticServiceIds || []).length > 0;
  }
}
