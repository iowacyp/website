/**
 * Monthly Export to Google Drive
 * 
 * This script exports data from Supabase and uploads it to Google Drive.
 * It can be run manually or scheduled via GitHub Actions / Netlify Functions.
 * 
 * Usage:
 *   node scripts/export/run-monthly-export.mjs
 * 
 * Required Environment Variables:
 *   - SUPABASE_URL: Your Supabase project URL
 *   - SUPABASE_SERVICE_ROLE_KEY: Service role key for database access
 *   - GOOGLE_SERVICE_ACCOUNT_JSON: JSON string of Google service account credentials
 *   - GOOGLE_DRIVE_FOLDER_ID: Target Google Drive folder ID
 * 
 * Alternative (load from file):
 *   - GOOGLE_SERVICE_ACCOUNT_JSON can be a filepath to the JSON key file
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createSupabaseClient, fetchAllExportData, generateCSVExports } from './supabase-export.mjs';
import { createDriveClient, upsertFile, extractFolderId } from './google-drive.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Load environment variable, supporting both inline JSON and file paths
 */
function loadEnvVar(name, required = true) {
  let value = process.env[name];
  
  if (!value && required) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  
  // If it looks like a file path, try to read the file
  if (value && (value.startsWith('./') || value.startsWith('/') || value.includes('\\'))) {
    if (existsSync(value)) {
      value = readFileSync(value, 'utf-8');
    }
  }
  
  return value;
}

/**
 * Parse Google service account credentials
 * Handles both JSON string and file path
 */
function loadGoogleCredentials() {
  let credsJson = loadEnvVar('GOOGLE_SERVICE_ACCOUNT_JSON', true);
  
  // If it's a file path, read the file
  if (credsJson.startsWith('{')) {
    // Already JSON string
    return JSON.parse(credsJson);
  }
  
  // Try as file path
  if (existsSync(credsJson)) {
    return JSON.parse(readFileSync(credsJson, 'utf-8'));
  }
  
  // Try with .json extension
  if (existsSync(credsJson + '.json')) {
    return JSON.parse(readFileSync(credsJson + '.json', 'utf-8'));
  }
  
  throw new Error('Could not parse Google service account credentials');
}

/**
 * Main export function
 */
async function runExport() {
  console.log('='.repeat(60));
  console.log('🚀 Starting Monthly Export to Google Drive');
  console.log('='.repeat(60));
  console.log('');
  
  const startTime = new Date();
  
  try {
    // Load configuration
    console.log('📋 Loading configuration...');
    
    const supabaseUrl = loadEnvVar('SUPABASE_URL');
    const supabaseKey = loadEnvVar('SUPABASE_SERVICE_ROLE_KEY');
    const googleCreds = loadGoogleCredentials();
    const folderId = extractFolderId(loadEnvVar('GOOGLE_DRIVE_FOLDER_ID'));
    
    console.log(`  Supabase URL: ${supabaseUrl}`);
    console.log(`  Drive Folder ID: ${folderId}`);
    console.log('');
    
    // Initialize Supabase client
    console.log('🔌 Connecting to Supabase...');
    const supabase = createSupabaseClient(supabaseUrl, supabaseKey);
    console.log('');
    
    // Fetch all data
    const exportData = await fetchAllExportData(supabase);
    
    // Generate CSV exports
    const csvExports = generateCSVExports(exportData);
    
    if (Object.keys(csvExports).length === 0) {
      console.log('⚠️  No data to export. Exiting.');
      return;
    }
    
    console.log('');
    console.log('🔐 Connecting to Google Drive...');
    const drive = await createDriveClient(googleCreds);
    console.log('');
    
    // Upload each CSV to Google Drive
    console.log('📤 Uploading files to Google Drive...\n');
    
    const uploadedFiles = [];
    
    for (const [type, export_] of Object.entries(csvExports)) {
      console.log(`  Uploading ${type}...`);
      
      const result = await upsertFile(
        drive,
        folderId,
        export_.filename,
        export_.content,
        'text/csv'
      );
      
      uploadedFiles.push({
        type,
        filename: export_.filename,
        count: export_.count,
        link: result.webViewLink,
      });
      
      console.log(`    ✅ Uploaded: ${export_.filename}`);
      console.log(`       Records: ${export_.count}`);
      console.log(`       Link: ${result.webViewLink}`);
      console.log('');
    }
    
    // Summary
    const endTime = new Date();
    const duration = Math.round((endTime - startTime) / 1000);
    
    console.log('='.repeat(60));
    console.log('✅ Export Complete!');
    console.log('='.repeat(60));
    console.log('');
    console.log('📊 Summary:');
    console.log(`  Total files: ${uploadedFiles.length}`);
    console.log(`  Duration: ${duration} seconds`);
    console.log('');
    console.log('📁 Uploaded Files:');
    for (const file of uploadedFiles) {
      console.log(`  - ${file.filename} (${file.count} records)`);
    }
    console.log('');
    console.log('🔗 Google Drive Links:');
    for (const file of uploadedFiles) {
      console.log(`  ${file.type}: ${file.link}`);
    }
    console.log('');
    console.log('🎉 All exports completed successfully!');
    console.log('');
    
  } catch (error) {
    console.error('');
    console.error('❌ Export Failed!');
    console.error('='.repeat(60));
    console.error('');
    console.error('Error:', error.message);
    console.error('');
    
    if (error.message.includes('Missing required environment variable')) {
      console.error('Please ensure all required environment variables are set:');
      console.error('  - SUPABASE_URL');
      console.error('  - SUPABASE_SERVICE_ROLE_KEY');
      console.error('  - GOOGLE_SERVICE_ACCOUNT_JSON');
      console.error('  - GOOGLE_DRIVE_FOLDER_ID');
    }
    
    console.error('');
    process.exit(1);
  }
}

// Run the export
runExport();

