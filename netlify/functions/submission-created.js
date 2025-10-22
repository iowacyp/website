const { google } = require('googleapis');

const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;
const sheetTab = process.env.GOOGLE_SHEET_TAB || 'Sheet1';

exports.handler = async (event) => {
  try {
    const payload = JSON.parse(event.body);
    const submission = payload?.payload;

    if (!submission) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing Netlify submission payload.' }),
      };
    }

    if (!spreadsheetId) {
      console.warn('GOOGLE_SPREADSHEET_ID is not set.');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Spreadsheet ID not configured.' }),
      };
    }

    const credentials = process.env.GOOGLE_SERVICE_ACCOUNT;
    if (!credentials) {
      console.warn('GOOGLE_SERVICE_ACCOUNT is not set.');
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Google service account credentials not configured.' }),
      };
    }

    const serviceAccount = JSON.parse(credentials);
    const auth = new google.auth.JWT(
      serviceAccount.client_email,
      null,
      serviceAccount.private_key,
      ['https://www.googleapis.com/auth/spreadsheets']
    );

    await auth.authorize();

    const sheets = google.sheets({ version: 'v4', auth });

    const row = [
      submission.data?.email || '',
      submission.data?.branch || '',
      submission.data?.city || '',
      submission.data?.consent || '',
      submission.created_at || '',
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: `${sheetTab}!A:Z`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true }),
    };
  } catch (error) {
    console.error('Error syncing submission to Google Sheets', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to sync submission to Google Sheets.' }),
    };
  }
};
