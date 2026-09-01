export const PrescriptionSource = {
  /** Issued by a doctor in the platform; has structured medicines. */
  Digital: 'DIGITAL',
  /** Uploaded by the member; a file, not structured data. */
  Uploaded: 'UPLOADED',
} as const;

export type PrescriptionSource = (typeof PrescriptionSource)[keyof typeof PrescriptionSource];

export interface Medicine {
  readonly name: string;
  /** "500mg · BD (Twice Daily) · 5 days", pre-composed for display. */
  readonly schedule: string;
  readonly instructions: string | null;
}

export interface Prescription {
  readonly id: string;
  readonly reference: string;
  readonly source: PrescriptionSource;
  readonly sourceLabel: string;
  readonly patientName: string;
  readonly doctorName: string;
  readonly doctorSpecialty: string | null;
  readonly diagnosis: string | null;
  readonly chiefComplaint: string | null;
  readonly medicines: readonly Medicine[];
  readonly labTestCount: number;
  readonly issuedAt: Date | null;
  readonly followUpDate: Date | null;
  readonly isEmergency: boolean;
  /** A PDF exists to download for this record. */
  readonly hasDownload: boolean;
  /** Path segment for the download route, which differs per source. */
  readonly downloadPath: string | null;
}
