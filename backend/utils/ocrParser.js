
/**
 * Parses raw OCR text from Azure and extracts:
 * - pump_sno (Pump Serial Number)
 * - date and time (when the image was taken)
 * - nozzle readings: nozzle_id and cumulative_volume
 *
 * Assumes the OCR text follows some loose formatting:
 * - Lines may include "Pump S.No: 123456" or "Date: 01/06/2025" etc.
 * - Nozzle readings are like: "Nozzle 1: 12345.67", "2 - 45678", etc.
 */

function parseOcrText(ocrText) {
  const lines = ocrText.split('\n').map(line => line.trim()).filter(Boolean);

  let pump_sno = null;
  let date = null;
  let time = null;
  const nozzleReadings = [];

  const nozzleRegex = /(?:Nozzle\s*|^)(\d)[\s:=-]+(\d{2,6}(?:\.\d+)?)/i;
  const dateRegex = /(\d{2}[\/\-\.]\d{2}[\/\-\.]\d{4})/;
  const timeRegex = /(\d{1,2}[:.]\d{2}(?::\d{2})?)/;
  const pumpSnoRegex = /Pump\s*S\.?No[:\-]?\s*(\d{4,})/i;

  for (const line of lines) {
    // Extract Pump Serial Number
    if (!pump_sno) {
      const pumpMatch = line.match(pumpSnoRegex);
      if (pumpMatch) pump_sno = pumpMatch[1];
    }

    // Extract Date
    if (!date) {
      const dateMatch = line.match(dateRegex);
      if (dateMatch) {
        const parts = dateMatch[1].split(/[\/\-\.]/);
        date = `${parts[2]}-${parts[1]}-${parts[0]}`; // YYYY-MM-DD
      }
    }

    // Extract Time
    if (!time) {
      const timeMatch = line.match(timeRegex);
      if (timeMatch) time = timeMatch[1].replace('.', ':');
    }

    // Extract Nozzle Readings
    const nozzleMatch = line.match(nozzleRegex);
    if (nozzleMatch) {
      const nozzle_id = parseInt(nozzleMatch[1]);
      const cumulative_volume = parseFloat(nozzleMatch[2]);
      if (!isNaN(nozzle_id) && !isNaN(cumulative_volume)) {
        nozzleReadings.push({ nozzle_id, cumulative_volume });
      }
    }
  }

  return {
    pump_sno,
    date,
    time,
    nozzleReadings, // Example: [ { nozzle_id: 1, cumulative_volume: 12345.67 }, ... ]
  };
}

module.exports = { parseOcrText };
