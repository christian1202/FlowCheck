import { pgTable, uuid, text, timestamp, integer, boolean, pgEnum, primaryKey, uniqueIndex, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const eventStatusEnum = pgEnum('event_status', ['draft', 'open', 'closed', 'archived']);
export const eventAdminRoleEnum = pgEnum('event_admin_role', ['owner', 'editor', 'scanner']);
export const attendeeStatusEnum = pgEnum('attendee_status', ['registered', 'checked_in', 'cancelled']);
export const scanResultEnum = pgEnum('scan_result', ['success', 'duplicate', 'invalid_event', 'invalid_ticket']);
export const syncStatusEnum = pgEnum('sync_status', ['pending', 'processing', 'completed', 'failed']);

// Tables
export const admins = pgTable('admins', {
  id: uuid('id').primaryKey(), // Maps to auth.users.id from Supabase
  email: text('email').notNull().unique(),
  fullName: text('full_name'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
});

export const events = pgTable('events', {
  id: uuid('id').defaultRandom().primaryKey(),
  createdBy: uuid('created_by').notNull().references(() => admins.id),
  title: text('title').notNull(),
  slug: text('slug').notNull().unique(),
  description: text('description'),
  date: timestamp('date', { withTimezone: true }).notNull(),
  location: text('location'),
  maxAttendees: integer('max_attendees'),
  status: eventStatusEnum('status').default('draft').notNull(),
  googleSheetId: text('google_sheet_id'),
  googleSheetUrl: text('google_sheet_url'),
  createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  idxTitle: index('idx_event_title').on(t.title),
}));

export const eventAdmins = pgTable('event_admins', {
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  adminId: uuid('admin_id').notNull().references(() => admins.id, { onDelete: 'cascade' }),
  role: eventAdminRoleEnum('role').default('scanner').notNull(),
  addedAt: timestamp('added_at', { withTimezone: true }).defaultNow().notNull(),
}, (t) => ({
  pk: primaryKey({ columns: [t.eventId, t.adminId] }),
}));

export const attendees = pgTable('attendees', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  scanToken: uuid('scan_token').defaultRandom().notNull().unique(),
  name: text('name').notNull(),
  email: text('email').notNull(),
  local: text('local'),      // e.g., Mabolo, Mandaue
  district: text('district'), // e.g., North, South
  zone: text('zone'),         // e.g., 1, 2, 3
  duty: text('duty'),         // e.g., Volunteer, Staff
  status: attendeeStatusEnum('status').default('registered').notNull(),
  registeredAt: timestamp('registered_at', { withTimezone: true }).defaultNow().notNull(),
  checkedInAt: timestamp('checked_in_at', { withTimezone: true }),
  checkedInBy: uuid('checked_in_by').references(() => admins.id, { onDelete: 'set null' }),
}, (t) => ({
  unqEventEmail: uniqueIndex('unq_event_email').on(t.eventId, t.email),
  idxName: index('idx_attendee_name').on(t.name),
  idxEmail: index('idx_attendee_email').on(t.email),
  idxEvent: index('idx_attendee_event').on(t.eventId),
}));

export const scanLogs = pgTable('scan_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  attendeeId: uuid('attendee_id').references(() => attendees.id, { onDelete: 'set null' }),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  scannedBy: uuid('scanned_by').notNull().references(() => admins.id),
  result: scanResultEnum('result').notNull(),
  scannedAt: timestamp('scanned_at', { withTimezone: true }).defaultNow().notNull(),
});

export const sheetSyncLogs = pgTable('sheet_sync_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  eventId: uuid('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
  status: syncStatusEnum('status').default('pending').notNull(),
  rowsSynced: integer('rows_synced').default(0).notNull(),
  errorMessage: text('error_message'),
  startedAt: timestamp('started_at', { withTimezone: true }),
  completedAt: timestamp('completed_at', { withTimezone: true }),
});
