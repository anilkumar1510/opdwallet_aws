export interface CreateAhcPackageDto {
  name: string;
  effectiveFrom: string;
  effectiveTo: string;
  labServiceIds: string[];
  diagnosticServiceIds: string[];
}

export interface UpdateAhcPackageDto {
  name?: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  labServiceIds?: string[];
  diagnosticServiceIds?: string[];
}
