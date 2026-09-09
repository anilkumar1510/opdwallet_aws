import { Booking } from './booking.model';

/**
 * DUMMY / STATIC bookings — zero backend.
 *
 * The bookings screen used to aggregate live data from appointments, service
 * bookings, lab, AHC and pharmacy endpoints. Those calls are removed.
 *
 * Kept intentionally EMPTY: the dummy wallet shows every category full and
 * undeducted, so there are no spends to reflect as bookings. The screen renders
 * its empty state ("Nothing here yet"). Seed rows here if a populated screen is
 * needed later. See REMOVED-APIS.md.
 */
export const STATIC_BOOKINGS: readonly Booking[] = [];
