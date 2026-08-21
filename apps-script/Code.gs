/**
 * Backend de "Pendências" rodando como Google Apps Script Web App,
 * usando uma aba do Google Sheets como banco de dados.
 *
 * Configuração:
 *   1. Crie uma Google Sheet.
 *   2. Renomeie a primeira aba para "Pendencias".
 *   3. Extensões > Apps Script, cole este arquivo substituindo o Code.gs padrão.
 *   4. Implantar > Nova implantação > tipo "App da Web".
 *      - Executar como: Eu
 *      - Quem pode acessar: Qualquer pessoa
 *   5. Copie a URL gerada e cole na tela inicial do index.html.
 *
 * O cabeçalho da planilha é criado/validado automaticamente na primeira
 * chamada, então não é necessário digitar as colunas manualmente.
 */

var SHEET_NAME = 'Pendencias';
var HEADERS = [
  'ID',
  'Titulo',
  'Descricao',
  'Responsavel',
  'Status',
  'Prazo',
  'CriadoEm',
  'AtualizadoEm',
  'EditadoPor'
];

var VALID_STATUSES = ['Pendente', 'Em andamento', 'Concluído', 'Cancelado'];

function getSheet_() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(SHEET_NAME);
  }
  var firstRow = sheet.getRange(1, 1, 1, HEADERS.length).getValues()[0];
  var hasHeaders = HEADERS.every(function (h, i) { return firstRow[i] === h; });
  if (!hasHeaders) {
    sheet.getRange(1, 1, 1, HEADERS.length).setValues([HEADERS]);
  }
  return sheet;
}

function rowsToObjects_(sheet) {
  var lastRow = sheet.getLastRow();
  if (lastRow < 2) return [];
  var values = sheet.getRange(2, 1, lastRow - 1, HEADERS.length).getValues();
  var result = [];
  for (var i = 0; i < values.length; i++) {
    var row = values[i];
    if (!row[0]) continue; // pula linhas vazias
    var obj = {};
    for (var j = 0; j < HEADERS.length; j++) {
      var value = row[j];
      if (value instanceof Date) {
        value = Utilities.formatDate(value, Session.getScriptTimeZone(), 'yyyy-MM-dd');
      }
      obj[HEADERS[j]] = value;
    }
    obj._row = i + 2; // linha real na planilha, útil para update/delete
    result.push(obj);
  }
  return result;
}

function findRowById_(sheet, id) {
  var items = rowsToObjects_(sheet);
  for (var i = 0; i < items.length; i++) {
    if (String(items[i].ID) === String(id)) return items[i]._row;
  }
  return null;
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function nowIso_() {
  return Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyy-MM-dd'T'HH:mm:ss");
}

function doGet(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var sheet = getSheet_();
    var items = rowsToObjects_(sheet).map(function (item) {
      delete item._row;
      return item;
    });
    return jsonResponse_({ ok: true, items: items, statuses: VALID_STATUSES });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    var body = JSON.parse(e.postData.contents);
    var action = body.action;
    var sheet = getSheet_();

    if (action === 'create') {
      var id = Utilities.getUuid();
      var now = nowIso_();
      var status = VALID_STATUSES.indexOf(body.status) >= 0 ? body.status : 'Pendente';
      sheet.appendRow([
        id,
        body.titulo || '',
        body.descricao || '',
        body.responsavel || '',
        status,
        body.prazo || '',
        now,
        now,
        body.editadoPor || body.responsavel || ''
      ]);
      return jsonResponse_({ ok: true, id: id });
    }

    if (action === 'update') {
      var row = findRowById_(sheet, body.id);
      if (!row) return jsonResponse_({ ok: false, error: 'Pendência não encontrada' });

      var fieldMap = {
        titulo: 'Titulo',
        descricao: 'Descricao',
        responsavel: 'Responsavel',
        status: 'Status',
        prazo: 'Prazo'
      };
      Object.keys(fieldMap).forEach(function (key) {
        if (Object.prototype.hasOwnProperty.call(body, key)) {
          var col = HEADERS.indexOf(fieldMap[key]) + 1;
          sheet.getRange(row, col).setValue(body[key]);
        }
      });
      sheet.getRange(row, HEADERS.indexOf('AtualizadoEm') + 1).setValue(nowIso_());
      sheet.getRange(row, HEADERS.indexOf('EditadoPor') + 1).setValue(body.editadoPor || '');
      return jsonResponse_({ ok: true });
    }

    if (action === 'delete') {
      var rowToDelete = findRowById_(sheet, body.id);
      if (!rowToDelete) return jsonResponse_({ ok: false, error: 'Pendência não encontrada' });
      sheet.deleteRow(rowToDelete);
      return jsonResponse_({ ok: true });
    }

    return jsonResponse_({ ok: false, error: 'Ação desconhecida: ' + action });
  } catch (err) {
    return jsonResponse_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}
