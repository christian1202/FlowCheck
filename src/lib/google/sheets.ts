import { google } from 'googleapis';
import { getDb } from '@/lib/db';
import { attendees, events } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Setup Google Auth
const getGoogleAuth = () => {
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    // Replace literal \n in env var with actual newlines
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });
};

const sheets = google.sheets('v4');
const drive = google.drive('v3');

/**
 * Provisions a new Google Sheet for an event and returns its ID and URL.
 */
export async function createEventSheet(eventTitle: string, adminEmails: string[]): Promise<{ id: string, url: string }> {
  const auth = getGoogleAuth();
  
  // 1. Create the spreadsheet
  const spreadsheet = await sheets.spreadsheets.create({
    auth,
    requestBody: {
      properties: {
        title: `FlowCheck: ${eventTitle} Attendance`,
      },
      sheets: [
        {
          properties: {
            title: 'Attendance',
            gridProperties: {
              frozenRowCount: 1,
            },
          },
        },
      ],
    },
  });

  const sheetId = spreadsheet.data.spreadsheetId!;
  const sheetUrl = spreadsheet.data.spreadsheetUrl!;

  // 2. Set up headers
  await sheets.spreadsheets.values.update({
    auth,
    spreadsheetId: sheetId,
    range: 'Attendance!A1:H1',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values: [['#', 'Name', 'Email', 'Local', 'District', 'Zone', 'Status', 'Checked In At']],
    },
  });

  // 3. Format header row (bold, background color)
  await sheets.spreadsheets.batchUpdate({
    auth,
    spreadsheetId: sheetId,
    requestBody: {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId: spreadsheet.data.sheets![0].properties!.sheetId,
              startRowIndex: 0,
              endRowIndex: 1,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 0.9, green: 0.9, blue: 0.9 },
                textFormat: { bold: true },
              },
            },
            fields: 'userEnteredFormat(backgroundColor,textFormat)',
          },
        },
      ],
    },
  });

  // 4. Share with admins
  for (const email of adminEmails) {
    if (email) {
      await drive.permissions.create({
        auth,
        fileId: sheetId,
        sendNotificationEmail: false,
        requestBody: {
          type: 'user',
          role: 'writer',
          emailAddress: email,
        },
      });
    }
  }

  return { id: sheetId, url: sheetUrl };
}

/**
 * Fully syncs all attendees for an event to the Google Sheet.
 * (Idempotent operation: overwrites all rows below header).
 */
export async function syncEventToSheet(eventId: string, sheetId: string): Promise<number> {
  const db = getDb();
  const auth = getGoogleAuth();

  // Fetch all attendees for the event
  const allAttendees = await db.select()
    .from(attendees)
    .where(eq(attendees.eventId, eventId))
    .orderBy(attendees.registeredAt); // Chronological order

  if (allAttendees.length === 0) {
    return 0; // Nothing to sync yet
  }

  // Format data for sheets
  const values = allAttendees.map((att, index) => [
    index + 1,
    att.name,
    att.email,
    att.local || '',
    att.district || '',
    att.zone || '',
    att.status,
    att.checkedInAt ? att.checkedInAt.toISOString() : '',
  ]);

  // Clear existing data (except header) before appending to ensure clean state
  await sheets.spreadsheets.values.clear({
    auth,
    spreadsheetId: sheetId,
    range: 'Attendance!A2:H',
  });

  // Append new data
  await sheets.spreadsheets.values.update({
    auth,
    spreadsheetId: sheetId,
    range: 'Attendance!A2',
    valueInputOption: 'USER_ENTERED',
    requestBody: {
      values,
    },
  });

  return values.length;
}
