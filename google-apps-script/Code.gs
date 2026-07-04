/**
 * ============================================================
 *  PROMPT MANAGER — Google Apps Script Backend
 *  Conecta el frontend SPA con Google Sheets como base de datos
 * ============================================================
 */

// ─── CONFIGURACIÓN ──────────────────────────────────────────
const SHEET_NAME = 'Prompts';
const HEADERS = ['Categoría', 'Nombre prompt', 'Prompt', 'Ejemplos', 'Fecha'];

// ─── INICIALIZACIÓN DE LA HOJA ──────────────────────────────
/**
 * Ejecuta esta función UNA VEZ para crear la hoja con la estructura correcta.
 * Menú: Ejecutar > setupSheet
 */
function setupSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(SHEET_NAME);

  // Crear la hoja si no existe
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }

  // Escribir headers en la primera fila
  const headerRange = sheet.getRange(1, 1, 1, HEADERS.length);
  headerRange.setValues([HEADERS]);

  // Formato de headers
  headerRange
    .setFontWeight('bold')
    .setFontSize(11)
    .setFontFamily('Inter')
    .setBackground('#6366f1')
    .setFontColor('#ffffff')
    .setHorizontalAlignment('center')
    .setBorder(true, true, true, true, true, true, '#4f46e5', SpreadsheetApp.BorderStyle.SOLID);

  // Ajustar ancho de columnas
  sheet.setColumnWidth(1, 180);  // Categoría
  sheet.setColumnWidth(2, 220);  // Nombre prompt
  sheet.setColumnWidth(3, 450);  // Prompt
  sheet.setColumnWidth(4, 350);  // Ejemplos
  sheet.setColumnWidth(5, 180);  // Fecha

  // Congelar la primera fila (headers)
  sheet.setFrozenRows(1);

  // Alineación vertical para toda la hoja
  sheet.getRange(1, 1, sheet.getMaxRows(), HEADERS.length)
    .setVerticalAlignment('top')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

  SpreadsheetApp.getUi().alert(
    '✅ Hoja "' + SHEET_NAME + '" configurada correctamente.\n\n' +
    'Columnas creadas:\n' +
    '• A: Categoría\n' +
    '• B: Nombre prompt\n' +
    '• C: Prompt\n' +
    '• D: Ejemplos\n' +
    '• E: Fecha'
  );
}

// ─── HANDLER GET ────────────────────────────────────────────
/**
 * Maneja peticiones GET desde el frontend
 * @param {Object} e - Evento de petición
 */
function doGet(e) {
  try {
    const action = e.parameter.action || 'getAll';

    switch (action) {
      case 'getAll':
        return sendJSON(getAllPrompts());

      case 'getCategories':
        return sendJSON(getCategories());

      default:
        return sendError('Acción no válida: ' + action);
    }
  } catch (error) {
    return sendError(error.message);
  }
}

// ─── HANDLER POST ───────────────────────────────────────────
/**
 * Maneja peticiones POST desde el frontend
 * @param {Object} e - Evento de petición
 */
function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const action = body.action;

    switch (action) {
      case 'create':
        return sendJSON(createPrompt(body.data));

      case 'update':
        return sendJSON(updatePrompt(body.row, body.data));

      case 'delete':
        return sendJSON(deletePrompt(body.row));

      default:
        return sendError('Acción no válida: ' + action);
    }
  } catch (error) {
    return sendError(error.message);
  }
}

// ─── OPERACIONES CRUD ───────────────────────────────────────

/**
 * Obtiene todos los prompts de la hoja
 * @returns {Object} Respuesta con array de prompts
 */
function getAllPrompts() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return { success: true, data: [] };
  }

  const dataRange = sheet.getRange(2, 1, lastRow - 1, HEADERS.length);
  const values = dataRange.getValues();

  const prompts = values.map(function(row, index) {
    let rawDate = row[4];
    let formattedDate = '';
    if (rawDate) {
      if (rawDate instanceof Date) {
        formattedDate = Utilities.formatDate(rawDate, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
      } else {
        formattedDate = rawDate.toString();
      }
    }
    return {
      row: index + 2, // Fila real en la hoja (1-indexed, skip header)
      categoria: row[0] || '',
      nombre: row[1] || '',
      prompt: row[2] || '',
      ejemplos: row[3] || '',
      fecha: formattedDate
    };
  });

  return { success: true, data: prompts };
}

/**
 * Obtiene lista única de categorías
 * @returns {Object} Respuesta con array de categorías
 */
function getCategories() {
  const sheet = getSheet();
  const lastRow = sheet.getLastRow();

  if (lastRow <= 1) {
    return { success: true, data: [] };
  }

  const categoryRange = sheet.getRange(2, 1, lastRow - 1, 1);
  const values = categoryRange.getValues();

  const categories = [];
  const seen = {};

  values.forEach(function(row) {
    const cat = (row[0] || '').toString().trim();
    if (cat && !seen[cat]) {
      seen[cat] = true;
      categories.push(cat);
    }
  });

  categories.sort();
  return { success: true, data: categories };
}

/**
 * Crea un nuevo prompt
 * @param {Object} data - Datos del prompt { categoria, nombre, prompt, ejemplos }
 * @returns {Object} Respuesta con el prompt creado
 */
function createPrompt(data) {
  if (!data) {
    throw new Error('No se recibieron datos para crear el prompt. Esta función no se puede ejecutar directamente desde el editor de Apps Script (presionando "Ejecutar"). Se activa automáticamente desde la Web App.');
  }
  if (!data.nombre || !data.prompt) {
    throw new Error('El nombre y el prompt son campos obligatorios');
  }

  const sheet = getSheet();
  const formattedDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  const newRow = [
    data.categoria || '',
    data.nombre,
    data.prompt,
    data.ejemplos || '',
    formattedDate
  ];

  sheet.appendRow(newRow);
  const lastRow = sheet.getLastRow();

  // Aplicar formato a la nueva fila
  sheet.getRange(lastRow, 1, 1, HEADERS.length)
    .setVerticalAlignment('top')
    .setWrapStrategy(SpreadsheetApp.WrapStrategy.WRAP);

  return {
    success: true,
    data: {
      row: lastRow,
      categoria: newRow[0],
      nombre: newRow[1],
      prompt: newRow[2],
      ejemplos: newRow[3],
      fecha: newRow[4]
    },
    message: 'Prompt creado exitosamente'
  };
}

/**
 * Actualiza un prompt existente
 * @param {number} row - Número de fila a actualizar
 * @param {Object} data - Nuevos datos del prompt
 * @returns {Object} Respuesta con el prompt actualizado
 */
function updatePrompt(row, data) {
  if (!row || !data) {
    throw new Error('Faltan parámetros (row o data). Esta función no se puede ejecutar directamente desde el editor de Apps Script (presionando "Ejecutar").');
  }
  if (row < 2) {
    throw new Error('Número de fila no válido');
  }

  if (!data.nombre || !data.prompt) {
    throw new Error('El nombre y el prompt son campos obligatorios');
  }

  const sheet = getSheet();
  const lastRow = sheet.getLastRow();

  if (row > lastRow) {
    throw new Error('La fila ' + row + ' no existe');
  }

  // Conservar la fecha original si ya existe en la columna 5
  let existingDate = sheet.getRange(row, 5).getValue();
  if (existingDate) {
    if (existingDate instanceof Date) {
      existingDate = Utilities.formatDate(existingDate, Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
    } else {
      existingDate = existingDate.toString();
    }
  } else {
    // Si estaba vacía por ser un registro viejo, le asignamos la fecha actual
    existingDate = Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd HH:mm:ss");
  }

  const updatedRow = [
    data.categoria || '',
    data.nombre,
    data.prompt,
    data.ejemplos || '',
    existingDate
  ];

  sheet.getRange(row, 1, 1, HEADERS.length).setValues([updatedRow]);

  return {
    success: true,
    data: {
      row: row,
      categoria: updatedRow[0],
      nombre: updatedRow[1],
      prompt: updatedRow[2],
      ejemplos: updatedRow[3],
      fecha: updatedRow[4]
    },
    message: 'Prompt actualizado exitosamente'
  };
}

/**
 * Elimina un prompt
 * @param {number} row - Número de fila a eliminar
 * @returns {Object} Respuesta de confirmación
 */
function deletePrompt(row) {
  if (!row || row < 2) {
    throw new Error('Número de fila no válido');
  }

  const sheet = getSheet();
  const lastRow = sheet.getLastRow();

  if (row > lastRow) {
    throw new Error('La fila ' + row + ' no existe');
  }

  sheet.deleteRow(row);

  return {
    success: true,
    message: 'Prompt eliminado exitosamente'
  };
}

// ─── FUNCIONES AUXILIARES ───────────────────────────────────

/**
 * Obtiene la hoja de cálculo activa
 * @returns {Sheet} Hoja de cálculo
 */
function getSheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(SHEET_NAME);

  if (!sheet) {
    throw new Error(
      'No se encontró la hoja "' + SHEET_NAME + '". ' +
      'Ejecuta la función setupSheet() primero.'
    );
  }

  return sheet;
}

/**
 * Envía respuesta JSON exitosa
 * @param {Object} data - Datos a enviar
 * @returns {TextOutput} Respuesta HTTP
 */
function sendJSON(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Envía respuesta JSON de error
 * @param {string} message - Mensaje de error
 * @returns {TextOutput} Respuesta HTTP
 */
function sendError(message) {
  const response = {
    success: false,
    error: message
  };

  return ContentService
    .createTextOutput(JSON.stringify(response))
    .setMimeType(ContentService.MimeType.JSON);
}
