import { JWT } from 'google-auth-library';
import { getDb } from '@/lib/db';
import { attendees } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

// Setup Google Auth using lightweight google-auth-library
const getGoogleAuth = () => {
  const credentials = {
    client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    // Replace literal \n in env var with actual newlines
    private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  };

  return new JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });
};

/**
 * Provisions a new Google Sheet for an event and returns its ID and URL.
 */
export async function createEventSheet(eventTitle: string, adminEmails: string[]): Promise<{ id: string, url: string }> {
  const auth = getGoogleAuth();
  
  // 1. Create the spreadsheet via Google Sheets REST API v4
  const spreadsheetRes = await auth.request<{
    spreadsheetId: string;
    spreadsheetUrl: string;
    sheets: { properties: { sheetId: number } }[];
  }>({
    url: 'https://sheets.googleapis.com/v4/spreadsheets',
    method: 'POST',
    data: {
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

  const sheetId = spreadsheetRes.data.spreadsheetId;
  const sheetUrl = spreadsheetRes.data.spreadsheetUrl;
  const gridSheetId = spreadsheetRes.data.sheets?.[0]?.properties?.sheetId ?? 0;

  // 2. Set up headers
  await auth.request({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Attendance!A1:H1?valueInputOption=USER_ENTERED`,
    method: 'PUT',
    data: {
      values: [['#', 'Name', 'Email', 'Local', 'District', 'Zone', 'Status', 'Checked In At']],
    },
  });

  // 3. Format header row (bold, background color)
  await auth.request({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}:batchUpdate`,
    method: 'POST',
    data: {
      requests: [
        {
          repeatCell: {
            range: {
              sheetId: gridSheetId,
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

  // 4. Share with admins via Google Drive REST API v3
  for (const email of adminEmails) {
    if (email) {
      try {
        await auth.request({
          url: `https://www.googleapis.com/drive/v3/files/${sheetId}/permissions?sendNotificationEmail=false`,
          method: 'POST',
          data: {
            type: 'user',
            role: 'writer',
            emailAddress: email,
          },
        });
      } catch (err) {
        console.error(`Failed to share Google Sheet with ${email}:`, err);
      }
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
  await auth.request({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Attendance!A2:H:clear`,
    method: 'POST',
  });

  // Append new data
  await auth.request({
    url: `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/Attendance!A2?valueInputOption=USER_ENTERED`,
    method: 'PUT',
    data: {
      values,
    },
  });

  return values.length;
}
