// ============================================================
// Code.gs — Google Apps Script for order and event storage
// Deploy as: Web app → Execute as: Me → Who has access: Anyone
// ============================================================

// ---- Configuration ----
const CONFIG = {
  SHEET_ID: '',           // Leave empty to use the spreadsheet this script is bound to
  EMAIL_ON_ORDER: false,  // Set true to email owner on each new order
  OWNER_EMAIL: '',        // Owner email (required if EMAIL_ON_ORDER is true)
  DEDUPE_MINUTES: 10      // Ignore duplicate phone+items within this window
};

// ---- Sheet names ----
const ORDERS_SHEET = 'Orders';
const EVENTS_SHEET = 'Events';

/**
 * doGet — Health check only. Never returns sheet data.
 */
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ ok: true, message: 'Service is running.' }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * doPost — Main entry point. Routes on `type`: order, waitlist, event.
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const type = body.type;

    if (!type || !['order', 'waitlist', 'event'].includes(type)) {
      return jsonResponse(false, 'Invalid type');
    }

    // Honeypot check
    if (body.website) {
      return jsonResponse(true); // Silently accept but don't save
    }

    if (type === 'order') {
      return handleOrder(body);
    } else if (type === 'waitlist') {
      return handleWaitlist(body);
    } else if (type === 'event') {
      return handleEvent(body);
    }

  } catch (err) {
    return jsonResponse(false, 'Server error: ' + err.message);
  }
}

/**
 * Handle order submission
 */
function handleOrder(data) {
  // Validate required fields
  if (!data.name || !data.phone || !data.governorate || !data.area || !data.address || !data.delivery_day) {
    return jsonResponse(false, 'Missing required fields');
  }

  // Validate phone format
  const phone = sanitizePhone(data.phone);
  if (!/^01[0125]\d{8}$/.test(phone)) {
    return jsonResponse(false, 'Invalid phone number');
  }

  // Validate lengths
  if (data.name.length < 2 || data.name.length > 60) {
    return jsonResponse(false, 'Name must be 2-60 characters');
  }
  if (data.address.length < 5 || data.address.length > 200) {
    return jsonResponse(false, 'Address must be 5-200 characters');
  }
  if (data.notes && data.notes.length > 300) {
    data.notes = data.notes.substring(0, 300);
  }

  // Dedupe check
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getSheet(ORDERS_SHEET);

    if (isDuplicate(sheet, phone, data.items_summary)) {
      lock.releaseLock();
      return jsonResponse(true); // Accept silently
    }

    const row = [
      new Date().toISOString(),                    // timestamp
      sanitize(data.order_id || ''),               // order_id
      'order',                                      // type
      'new',                                        // status
      sanitize(data.name),                          // name
      sanitize(phone),                              // phone
      sanitize(data.governorate || ''),             // governorate
      sanitize(data.area || ''),                    // area
      sanitize(data.address || ''),                 // address
      sanitize(data.delivery_day || ''),            // delivery_day
      sanitize(data.notes || ''),                   // notes
      sanitize(data.items_json || ''),              // items_json
      sanitize(data.items_summary || ''),           // items_summary
      data.est_total != null ? data.est_total : '', // est_total
      data.in_delivery_area ? 'TRUE' : 'FALSE',    // in_delivery_area
      sanitize(data.lang || ''),                    // lang
      sanitize(data.utm_source || ''),              // utm_source
      sanitize(data.utm_medium || ''),              // utm_medium
      sanitize(data.utm_campaign || ''),            // utm_campaign
      sanitize(data.utm_content || ''),             // utm_content
      sanitize(data.referrer || ''),                // referrer
      sanitize(data.device || ''),                  // device
      data.consent ? 'TRUE' : 'FALSE'              // consent
    ];

    sheet.appendRow(row);

    // Email notification
    if (CONFIG.EMAIL_ON_ORDER && CONFIG.OWNER_EMAIL) {
      try {
        MailApp.sendEmail({
          to: CONFIG.OWNER_EMAIL,
          subject: 'طلب جديد: ' + (data.order_id || ''),
          body: 'طلب جديد من ' + data.name + '\n' +
                'الموبايل: ' + phone + '\n' +
                'المحافظة: ' + data.governorate + '\n' +
                'الطلب:\n' + (data.items_summary || '') + '\n' +
                'الإجمالي: ' + (data.est_total || 'غير محدد')
        });
      } catch (mailErr) {
        // Don't fail the order if email fails
      }
    }

    lock.releaseLock();
    return jsonResponse(true);

  } catch (err) {
    lock.releaseLock();
    return jsonResponse(false, 'Write error: ' + err.message);
  }
}

/**
 * Handle waitlist submission
 */
function handleWaitlist(data) {
  if (!data.name || !data.phone || !data.product_id) {
    return jsonResponse(false, 'Missing required fields');
  }

  const phone = sanitizePhone(data.phone);
  if (!/^01[0125]\d{8}$/.test(phone)) {
    return jsonResponse(false, 'Invalid phone number');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(10000);

  try {
    const sheet = getSheet(ORDERS_SHEET);

    const row = [
      new Date().toISOString(),                    // timestamp
      '',                                           // order_id (none for waitlist)
      'waitlist',                                   // type
      'new',                                        // status
      sanitize(data.name),                          // name
      sanitize(phone),                              // phone
      '',                                           // governorate
      '',                                           // area
      '',                                           // address
      '',                                           // delivery_day
      '',                                           // notes
      '',                                           // items_json
      sanitize(data.product_id || ''),              // items_summary (product ID)
      '',                                           // est_total
      '',                                           // in_delivery_area
      sanitize(data.lang || ''),                    // lang
      sanitize(data.utm_source || ''),              // utm_source
      sanitize(data.utm_medium || ''),              // utm_medium
      sanitize(data.utm_campaign || ''),            // utm_campaign
      sanitize(data.utm_content || ''),             // utm_content
      '',                                           // referrer
      sanitize(data.device || ''),                  // device
      ''                                            // consent
    ];

    sheet.appendRow(row);
    lock.releaseLock();
    return jsonResponse(true);

  } catch (err) {
    lock.releaseLock();
    return jsonResponse(false, 'Write error: ' + err.message);
  }
}

/**
 * Handle event tracking
 */
function handleEvent(data) {
  if (!data.event || !data.session_id) {
    return jsonResponse(false, 'Missing event or session_id');
  }

  const lock = LockService.getScriptLock();
  lock.waitLock(5000);

  try {
    const sheet = getSheet(EVENTS_SHEET);

    const row = [
      new Date().toISOString(),                    // timestamp
      sanitize(data.session_id || ''),             // session_id
      sanitize(data.event || ''),                  // event
      sanitize(data.product_id || ''),             // product_id
      sanitize(data.utm_source || ''),             // utm_source
      sanitize(data.utm_medium || ''),             // utm_medium
      sanitize(data.utm_campaign || ''),           // utm_campaign
      sanitize(data.utm_content || ''),            // utm_content
      sanitize(data.lang || ''),                   // lang
      sanitize(data.device || '')                  // device
    ];

    sheet.appendRow(row);
    lock.releaseLock();
    return jsonResponse(true);

  } catch (err) {
    lock.releaseLock();
    return jsonResponse(false, 'Write error: ' + err.message);
  }
}

// ---- Helpers ----

/**
 * Get or create a sheet by name
 */
function getSheet(name) {
  const ss = CONFIG.SHEET_ID
    ? SpreadsheetApp.openById(CONFIG.SHEET_ID)
    : SpreadsheetApp.getActiveSpreadsheet();

  let sheet = ss.getSheetByName(name);
  if (!sheet) {
    sheet = ss.insertSheet(name);
    // Add headers
    if (name === ORDERS_SHEET) {
      sheet.appendRow([
        'timestamp', 'order_id', 'type', 'status', 'name', 'phone',
        'governorate', 'area', 'address', 'delivery_day', 'notes',
        'items_json', 'items_summary', 'est_total', 'in_delivery_area',
        'lang', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
        'referrer', 'device', 'consent'
      ]);
    } else if (name === EVENTS_SHEET) {
      sheet.appendRow([
        'timestamp', 'session_id', 'event', 'product_id',
        'utm_source', 'utm_medium', 'utm_campaign', 'utm_content',
        'lang', 'device'
      ]);
    }
  }
  return sheet;
}

/**
 * Sanitize text: prevent spreadsheet formula injection
 * If a value starts with =, +, -, or @, prefix with apostrophe
 */
function sanitize(val) {
  if (typeof val !== 'string') return String(val);
  val = val.trim();
  if (/^[=+\-@]/.test(val)) {
    return "'" + val;
  }
  return val;
}

/**
 * Sanitize phone number
 */
function sanitizePhone(phone) {
  return String(phone).replace(/[^\d]/g, '');
}

/**
 * Dedupe check: ignore identical phone + items_summary within DEDUPE_MINUTES
 */
function isDuplicate(sheet, phone, itemsSummary) {
  const data = sheet.getDataRange().getValues();
  const cutoff = new Date(Date.now() - CONFIG.DEDUPE_MINUTES * 60 * 1000);

  for (let i = data.length - 1; i >= 1; i--) {
    const rowTimestamp = new Date(data[i][0]);
    if (rowTimestamp < cutoff) break; // Rows are chronological

    const rowPhone = String(data[i][5]).replace(/'/g, '');
    const rowItems = String(data[i][12]);

    if (rowPhone === phone && rowItems === itemsSummary) {
      return true;
    }
  }
  return false;
}

/**
 * Return JSON response
 */
function jsonResponse(ok, error) {
  const body = { ok };
  if (error) body.error = error;
  return ContentService
    .createTextOutput(JSON.stringify(body))
    .setMimeType(ContentService.MimeType.JSON);
}

