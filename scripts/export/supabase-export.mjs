/**
 * Supabase Export Module
 * Queries the database and generates CSV exports for events, expenses, and other program data
 */

import { createClient } from '@supabase/supabase-js';
import { format } from 'date-fns';

/**
 * Create a Supabase client for server-side operations
 * @param {string} supabaseUrl - Supabase project URL
 * @param {string} serviceRoleKey - Service role key (for server-side access)
 * @returns {SupabaseClient} - Authenticated Supabase client
 */
export function createSupabaseClient(supabaseUrl, serviceRoleKey) {
  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Fetch all events with related data
 * @param {SupabaseClient} supabase - Supabase client
 * @returns {Promise<Array>} - Array of event records
 */
export async function fetchEvents(supabase) {
  console.log('  Fetching events...');
  
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('    Error fetching events:', error.message);
    throw error;
  }

  console.log(`    Found ${data.length} events`);
  return data || [];
}

/**
 * Fetch expenses (the main budget/expense tracking table)
 * @param {SupabaseClient} supabase - Supabase client
 * @returns {Promise<Array>} - Array of expense records
 */
export async function fetchExpenses(supabase) {
  console.log('  Fetching expenses...');
  
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('    Error fetching expenses:', error.message);
    throw error;
  }

  console.log(`    Found ${data.length} expenses`);
  return data || [];
}

/**
 * Fetch program expenses (alternative expense table)
 * @param {SupabaseClient} supabase - Supabase client
 * @returns {Promise<Array>} - Array of program expense records
 */
export async function fetchProgramExpenses(supabase) {
  console.log('  Fetching program expenses...');
  
  const { data, error } = await supabase
    .from('program_expenses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('    (program_expenses table not available)');
    return [];
  }

  console.log(`    Found ${data.length} program expenses`);
  return data || [];
}

/**
 * Fetch event attendance records
 * @param {SupabaseClient} supabase - Supabase client
 * @returns {Promise<Array>} - Array of event attendance records
 */
export async function fetchEventAttendance(supabase) {
  console.log('  Fetching event attendance...');
  
  const { data, error } = await supabase
    .from('event_attendance')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('    (event_attendance table not available)');
    return [];
  }

  console.log(`    Found ${data.length} attendance records`);
  return data || [];
}

/**
 * Fetch attendance breakdown (age/branch breakdown)
 * @param {SupabaseClient} supabase - Supabase client
 * @returns {Promise<Array>} - Array of attendance breakdown records
 */
export async function fetchAttendanceBreakdown(supabase) {
  console.log('  Fetching attendance breakdown...');
  
  const { data, error } = await supabase
    .from('attendance_breakdown')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('    (attendance_breakdown table not available)');
    return [];
  }

  console.log(`    Found ${data.length} attendance breakdown records`);
  return data || [];
}

/**
 * Fetch event milestones
 * @param {SupabaseClient} supabase - Supabase client
 * @returns {Promise<Array>} - Array of event milestone records
 */
export async function fetchEventMilestones(supabase) {
  console.log('  Fetching event milestones...');
  
  const { data, error } = await supabase
    .from('event_milestones')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('    (event_milestones table not available)');
    return [];
  }

  console.log(`    Found ${data.length} milestone records`);
  return data || [];
}

/**
 * Fetch fiscal years for context
 * @param {SupabaseClient} supabase - Supabase client
 * @returns {Promise<Array>} - Array of fiscal year records
 */
export async function fetchFiscalYears(supabase) {
  console.log('  Fetching fiscal years...');
  
  const { data, error } = await supabase
    .from('fiscal_years')
    .select('*')
    .order('fy', { ascending: false });

  if (error) {
    console.log('    (fiscal_years table not available)');
    return [];
  }

  console.log(`    Found ${data.length} fiscal years`);
  return data || [];
}

/**
 * Fetch travel records
 * @param {SupabaseClient} supabase - Supabase client
 * @returns {Promise<Array>} - Array of travel record records
 */
export async function fetchTravelRecords(supabase) {
  console.log('  Fetching travel records...');
  
  const { data, error } = await supabase
    .from('travel_records')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('    (travel_records table not available)');
    return [];
  }

  console.log(`    Found ${data.length} travel records`);
  return data || [];
}

/**
 * Fetch training records
 * @param {SupabaseClient} supabase - Supabase client
 * @returns {Promise<Array>} - Array of training record records
 */
export async function fetchTrainingRecords(supabase) {
  console.log('  Fetching training records...');
  
  const { data, error } = await supabase
    .from('training_records')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('    (training_records table not available)');
    return [];
  }

  console.log(`    Found ${data.length} training records`);
  return data || [];
}

/**
 * Fetch FY budgets
 * @param {SupabaseClient} supabase - Supabase client
 * @returns {Promise<Array>} - Array of FY budget records
 */
export async function fetchFyBudgets(supabase) {
  console.log('  Fetching FY budgets...');
  
  const { data, error } = await supabase
    .from('fy_budgets')
    .select('*')
    .order('fy_year', { ascending: false });

  if (error) {
    console.log('    (fy_budgets table not available)');
    return [];
  }

  console.log(`    Found ${data.length} FY budgets`);
  return data || [];
}

/**
 * Fetch event templates
 * @param {SupabaseClient} supabase - Supabase client
 * @returns {Promise<Array>} - Array of event template records
 */
export async function fetchEventTemplates(supabase) {
  console.log('  Fetching event templates...');
  
  const { data, error } = await supabase
    .from('event_templates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.log('    (event_templates table not available)');
    return [];
  }

  console.log(`    Found ${data.length} event templates`);
  return data || [];
}

/**
 * Convert array of objects to CSV string
 * @param {Array} data - Array of objects to convert
 * @param {Array} columns - Array of column names to include (optional - uses all keys if not provided)
 * @returns {string} - CSV formatted string
 */
export function toCSV(data, columns = null) {
  if (!data || data.length === 0) {
    return '';
  }

  // If columns not specified, derive from first row
  const keys = columns || Object.keys(data[0]);
  
  // Build header row
  const headerRow = keys.join(',');
  
  // Build data rows
  const dataRows = data.map(row => {
    return keys.map(key => {
      const value = row[key];
      
      if (value === null || value === undefined) {
        return '';
      }
      
      // Handle different types
      if (typeof value === 'object') {
        // JSON objects/arrays
        const jsonStr = JSON.stringify(value);
        // Escape quotes and wrap in quotes if contains comma, quote, or newline
        if (jsonStr.includes(',') || jsonStr.includes('"') || jsonStr.includes('\n')) {
          return `"${jsonStr.replace(/"/g, '""')}"`;
        }
        return jsonStr;
      }
      
      const strValue = String(value);
      
      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      if (strValue.includes(',') || strValue.includes('"') || strValue.includes('\n') || strValue.includes('\r')) {
        return `"${strValue.replace(/"/g, '""')}"`;
      }
      
      return strValue;
    }).join(',');
  });
  
  return [headerRow, ...dataRows].join('\r\n');
}

/**
 * Generate timestamp for file naming
 * @param {Date} date - Date object (default: current date)
 * @returns {string} - Formatted timestamp
 */
export function generateTimestamp(date = new Date()) {
  return format(date, 'yyyy-MM-dd_HHmmss');
}

/**
 * Generate monthly report filename
 * @param {string} dataType - Type of data (events, expenses, etc.)
 * @param {Date} date - Date object (default: current date)
 * @returns {string} - Filename with timestamp
 */
export function generateFilename(dataType, date = new Date()) {
  const timestamp = generateTimestamp(date);
  return `${dataType}_export_${timestamp}.csv`;
}

/**
 * Fetch all data and prepare exports
 * @param {SupabaseClient} supabase - Supabase client
 * @returns {Promise<Object>} - Object containing all export data
 */
export async function fetchAllExportData(supabase) {
  console.log('\n📊 Fetching data from Supabase...\n');
  
  const [events, expenses, programExpenses, eventAttendance, attendanceBreakdown, eventMilestones, fiscalYears, fyBudgets, travelRecords, trainingRecords, eventTemplates] = await Promise.all([
    fetchEvents(supabase),
    fetchExpenses(supabase),
    fetchProgramExpenses(supabase),
    fetchEventAttendance(supabase),
    fetchAttendanceBreakdown(supabase),
    fetchEventMilestones(supabase),
    fetchFiscalYears(supabase),
    fetchFyBudgets(supabase),
    fetchTravelRecords(supabase),
    fetchTrainingRecords(supabase),
    fetchEventTemplates(supabase),
  ]);

  return {
    events,
    expenses,
    programExpenses,
    eventAttendance,
    attendanceBreakdown,
    eventMilestones,
    fiscalYears,
    fyBudgets,
    travelRecords,
    trainingRecords,
    eventTemplates,
  };
}

/**
 * Generate CSV files from export data
 * @param {Object} data - Export data object
 * @param {Date} date - Date for filename (default: current date)
 * @returns {Object} - Object containing filename and CSV content for each type
 */
export function generateCSVExports(data, date = new Date()) {
  console.log('\n📄 Generating CSV exports...\n');
  
  const exports = {};
  
  // Events CSV
  if (data.events && data.events.length > 0) {
    const filename = generateFilename('events', date);
    exports.events = {
      filename,
      content: toCSV(data.events),
      count: data.events.length,
    };
    console.log(`  Events: ${filename} (${data.events.length} records)`);
  }
  
  // Expenses CSV
  if (data.expenses && data.expenses.length > 0) {
    const filename = generateFilename('expenses', date);
    exports.expenses = {
      filename,
      content: toCSV(data.expenses),
      count: data.expenses.length,
    };
    console.log(`  Expenses: ${filename} (${data.expenses.length} records)`);
  }
  
  // Program Expenses CSV
  if (data.programExpenses && data.programExpenses.length > 0) {
    const filename = generateFilename('program_expenses', date);
    exports.programExpenses = {
      filename,
      content: toCSV(data.programExpenses),
      count: data.programExpenses.length,
    };
    console.log(`  Program Expenses: ${filename} (${data.programExpenses.length} records)`);
  }
  
  // Event Attendance CSV
  if (data.eventAttendance && data.eventAttendance.length > 0) {
    const filename = generateFilename('event_attendance', date);
    exports.eventAttendance = {
      filename,
      content: toCSV(data.eventAttendance),
      count: data.eventAttendance.length,
    };
    console.log(`  Event Attendance: ${filename} (${data.eventAttendance.length} records)`);
  }
  
  // Attendance Breakdown CSV
  if (data.attendanceBreakdown && data.attendanceBreakdown.length > 0) {
    const filename = generateFilename('attendance_breakdown', date);
    exports.attendanceBreakdown = {
      filename,
      content: toCSV(data.attendanceBreakdown),
      count: data.attendanceBreakdown.length,
    };
    console.log(`  Attendance Breakdown: ${filename} (${data.attendanceBreakdown.length} records)`);
  }
  
  // Event Milestones CSV
  if (data.eventMilestones && data.eventMilestones.length > 0) {
    const filename = generateFilename('event_milestones', date);
    exports.eventMilestones = {
      filename,
      content: toCSV(data.eventMilestones),
      count: data.eventMilestones.length,
    };
    console.log(`  Event Milestones: ${filename} (${data.eventMilestones.length} records)`);
  }
  
  // Fiscal Years CSV
  if (data.fiscalYears && data.fiscalYears.length > 0) {
    const filename = generateFilename('fiscal_years', date);
    exports.fiscalYears = {
      filename,
      content: toCSV(data.fiscalYears),
      count: data.fiscalYears.length,
    };
    console.log(`  Fiscal Years: ${filename} (${data.fiscalYears.length} records)`);
  }
  
  // FY Budgets CSV
  if (data.fyBudgets && data.fyBudgets.length > 0) {
    const filename = generateFilename('fy_budgets', date);
    exports.fyBudgets = {
      filename,
      content: toCSV(data.fyBudgets),
      count: data.fyBudgets.length,
    };
    console.log(`  FY Budgets: ${filename} (${data.fyBudgets.length} records)`);
  }
  
  // Travel Records CSV
  if (data.travelRecords && data.travelRecords.length > 0) {
    const filename = generateFilename('travel_records', date);
    exports.travelRecords = {
      filename,
      content: toCSV(data.travelRecords),
      count: data.travelRecords.length,
    };
    console.log(`  Travel Records: ${filename} (${data.travelRecords.length} records)`);
  }
  
  // Training Records CSV
  if (data.trainingRecords && data.trainingRecords.length > 0) {
    const filename = generateFilename('training_records', date);
    exports.trainingRecords = {
      filename,
      content: toCSV(data.trainingRecords),
      count: data.trainingRecords.length,
    };
    console.log(`  Training Records: ${filename} (${data.trainingRecords.length} records)`);
  }
  
  // Event Templates CSV
  if (data.eventTemplates && data.eventTemplates.length > 0) {
    const filename = generateFilename('event_templates', date);
    exports.eventTemplates = {
      filename,
      content: toCSV(data.eventTemplates),
      count: data.eventTemplates.length,
    };
    console.log(`  Event Templates: ${filename} (${data.eventTemplates.length} records)`);
  }
  
  return exports;
}

