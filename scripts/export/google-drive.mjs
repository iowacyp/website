/**
 * Google Drive Upload Module
 * Handles authentication and file uploads to Google Drive using Service Account
 */

import { google } from 'googleapis';

/**
 * Create an authenticated Google Drive client using Service Account credentials
 * @param {object} credentials - Service account credentials object
 * @returns {Promise<google.drive_v3.Drive>} - Authenticated Drive client
 */
export async function createDriveClient(credentials) {
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });

  const drive = google.drive({ version: 'v3', auth });
  return drive;
}

/**
 * Upload a file to Google Drive
 * @param {google.drive_v3.Drive} drive - Authenticated Drive client
 * @param {string} folderId - Target folder ID
 * @param {string} fileName - Name for the uploaded file
 * @param {string|Buffer} content - File content (string or Buffer)
 * @param {string} mimeType - MIME type (default: text/csv)
 * @returns {Promise<object>} - Uploaded file metadata
 */
export async function uploadFile(drive, folderId, fileName, content, mimeType = 'text/csv') {
  const requestBody = {
    name: fileName,
    parents: [folderId],
  };

  const media = {
    mimeType,
    body: content,
  };

  const response = await drive.files.create({
    requestBody,
    media,
    fields: 'id, name, webViewLink',
  });

  return response.data;
}

/**
 * Check if a file with the same name already exists in the folder
 * @param {google.drive_v3.Drive} drive - Authenticated Drive client
 * @param {string} folderId - Folder ID to search in
 * @param {string} fileName - File name to search for
 * @returns {Promise<string|null>} - File ID if found, null otherwise
 */
export async function findExistingFile(drive, folderId, fileName) {
  const response = await drive.files.list({
    q: `'${folderId}' in parents and name = '${fileName}' and trashed = false`,
    fields: 'files(id, name)',
    spaces: 'drive',
  });

  if (response.data.files && response.data.files.length > 0) {
    return response.data.files[0].id;
  }
  return null;
}

/**
 * Update an existing file in Google Drive
 * @param {google.drive_v3.Drive} drive - Authenticated Drive client
 * @param {string} fileId - File ID to update
 * @param {string|Buffer} content - New file content
 * @param {string} mimeType - MIME type (default: text/csv)
 * @returns {Promise<object>} - Updated file metadata
 */
export async function updateFile(drive, fileId, content, mimeType = 'text/csv') {
  const media = {
    mimeType,
    body: content,
  };

  const response = await drive.files.update({
    fileId,
    media,
    fields: 'id, name, webViewLink',
  });

  return response.data;
}

/**
 * Upload or update a file in Google Drive
 * If file with same name exists, it will be updated; otherwise, a new file is created
 * @param {google.drive_v3.Drive} drive - Authenticated Drive client
 * @param {string} folderId - Target folder ID
 * @param {string} fileName - Name for the uploaded file
 * @param {string|Buffer} content - File content
 * @param {string} mimeType - MIME type (default: text/csv)
 * @returns {Promise<object>} - Uploaded/updated file metadata
 */
export async function upsertFile(drive, folderId, fileName, content, mimeType = 'text/csv') {
  const existingFileId = await findExistingFile(drive, folderId, fileName);

  if (existingFileId) {
    console.log(`  Updating existing file: ${fileName}`);
    return await updateFile(drive, existingFileId, content, mimeType);
  } else {
    console.log(`  Creating new file: ${fileName}`);
    return await uploadFile(drive, folderId, fileName, content, mimeType);
  }
}

/**
 * Get folder ID from a shareable link
 * @param {string} folderLink - Google Drive folder link
 * @returns {string} - Folder ID
 */
export function extractFolderId(folderLink) {
  // Handle various Google Drive link formats:
  // https://drive.google.com/drive/u/0/folders/1SdmKfN6VHEo5zSI1p43rJI_2x9vNlMcn
  // https://drive.google.com/drive/folders/1SdmKfN6VHEo5zSI1p43rJI_2x9vNlMcn
  const match = folderLink.match(/folders\/([a-zA-Z0-9_-]+)/);
  if (match) {
    return match[1];
  }
  return folderLink;
}

