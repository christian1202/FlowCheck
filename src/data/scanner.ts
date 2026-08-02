import { getDb } from '@/lib/db';
import { attendees, events, eventAdmins, scanLogs } from '@/lib/db/schema';
import { eq, and, inArray, sql } from 'drizzle-orm';
import { enqueueSheetSync } from '@/lib/queue/producer';
import { cache } from 'react';
import { getAdminAllowedEventIds } from './attendees';

export type ScanResultResponse = {
  result: 'success' | 'duplicate' | 'invalid_event' | 'event_closed' | 'invalid_ticket' | 'unauthorized';
  attendee?: {
    name: string;
    local: string | null;
    duty: string | null;
    checkedInAt?: Date | null;
  };
};

export async function processScan(
  eventId: string,
  adminId: string,
  scanToken: string
): Promise<ScanResultResponse> {
  const db = getDb();
  
  // 1. Execute atomic DB transaction
  const scanResult = await db.transaction(async (tx) => {
    // Consolidated single read query for admin authorization & event status
    const [accessRow] = await tx
      .select({
        role: eventAdmins.role,
        status: events.status,
        closesAt: events.closesAt,
      })
      .from(eventAdmins)
      .innerJoin(events, eq(eventAdmins.eventId, events.id))
      .where(and(eq(eventAdmins.eventId, eventId), eq(eventAdmins.adminId, adminId)))
      .limit(1);

    if (!accessRow) {
      return { result: 'unauthorized' as const };
    }

    if (accessRow.status === 'draft' || accessRow.status === 'archived') {
      return { result: 'invalid_event' as const };
    }

    if (accessRow.closesAt && new Date() > new Date(accessRow.closesAt)) {
      return { result: 'event_closed' as const };
    }

    // Find attendee by scanToken with minimal column projection
    const [attendee] = await tx.select({
      id: attendees.id,
      eventId: attendees.eventId,
      name: attendees.name,
      local: attendees.local,
      duty: attendees.duty,
      status: attendees.status,
      checkedInAt: attendees.checkedInAt,
    })
      .from(attendees)
      .where(eq(attendees.scanToken, scanToken))
      .limit(1);

    if (!attendee) {
      await tx.insert(scanLogs).values({
        eventId,
        scannedBy: adminId,
        result: 'invalid_ticket'
      });
      return { result: 'invalid_ticket' as const };
    }

    // Ensure attendee belongs to this specific event
    if (attendee.eventId !== eventId) {
      await tx.insert(scanLogs).values({
        eventId,
        attendeeId: attendee.id,
        scannedBy: adminId,
        result: 'invalid_event'
      });
      return { result: 'invalid_event' as const };
    }

    // Check if already checked in
    if (attendee.status === 'checked_in') {
      await tx.insert(scanLogs).values({
        eventId,
        attendeeId: attendee.id,
        scannedBy: adminId,
        result: 'duplicate'
      });
      return { 
        result: 'duplicate' as const,
        attendee: {
          name: attendee.name,
          local: attendee.local,
          duty: attendee.duty,
          checkedInAt: attendee.checkedInAt
        }
      };
    }

    // Update attendee status to checked_in
    const now = new Date();
    await tx.update(attendees)
      .set({ 
        status: 'checked_in', 
        checkedInAt: now,
        checkedInBy: adminId
      })
      .where(eq(attendees.id, attendee.id));

    // Log success scan
    await tx.insert(scanLogs).values({
      eventId,
      attendeeId: attendee.id,
      scannedBy: adminId,
      result: 'success'
    });

    return {
      result: 'success' as const,
      attendee: {
        name: attendee.name,
        local: attendee.local,
        duty: attendee.duty,
        checkedInAt: now
      }
    };
  });

  // 2. Enqueue Google Sheets sync OUTSIDE transaction boundary with isolated error handling
  if (scanResult.result === 'success') {
    try {
      await enqueueSheetSync(eventId);
    } catch (syncErr) {
      console.error('Sheet sync queueing failed post-scan:', syncErr);
    }
  }

  return scanResult;
}

export const getTotalScansForAdmin = cache(async (adminId: string): Promise<number> => {
  const db = getDb();
  
  const allowedIds = await getAdminAllowedEventIds(adminId);
  if (allowedIds.length === 0) return 0;

  const [{ count }] = await db.select({
    count: sql<number>`count(*)`
  })
    .from(attendees)
    .where(
      and(
        inArray(attendees.eventId, allowedIds),
        eq(attendees.status, 'checked_in')
      )
    );

  return Number(count || 0);
});

