// ═══════════════════════════════════════════════
// JOSE GASTOS — SERVICIO OCR PARA FACTURAS
// Usa OCR.space API (gratis) para leer facturas
// ═══════════════════════════════════════════════

const OCR_API_KEY = 'K84681581688957';
const OCR_API_URL = 'https://api.ocr.space/parse/image';

export interface InvoiceData {
  businessName: string;
  nit: string;
  total: number;
  subtotal: number;
  taxAmount: number;
  invoiceDate: string;
  items: { name: string; qty: number; price: number }[];
  rawText: string;
}

/**
 * Envía una imagen en base64 a OCR.space y devuelve el texto extraído
 */
export async function extractTextFromImage(base64Image: string): Promise<string> {
  try {
    const formData = new FormData();
    formData.append('apikey', OCR_API_KEY);
    formData.append('base64Image', `data:image/jpeg;base64,${base64Image}`);
    formData.append('language', 'spa');
    formData.append('isOverlayRequired', 'false');
    formData.append('OCREngine', '2'); 
    formData.append('scale', 'true');
    formData.append('detectOrientation', 'true');

    const response = await fetch(OCR_API_URL, {
      method: 'POST',
      body: formData,
    });

    const result = await response.json();

    if (result.OCRExitCode === 1 && result.ParsedResults?.length > 0) {
      return result.ParsedResults[0].ParsedText || '';
    }

    if (result.OCRExitCode !== 1) {
      const formData2 = new FormData();
      formData2.append('apikey', OCR_API_KEY);
      formData2.append('base64Image', `data:image/jpeg;base64,${base64Image}`);
      formData2.append('language', 'spa');
      formData2.append('OCREngine', '1');
      formData2.append('scale', 'true');

      const response2 = await fetch(OCR_API_URL, { method: 'POST', body: formData2 });
      const result2 = await response2.json();
      if (result2.OCRExitCode === 1 && result2.ParsedResults?.length > 0) {
        return result2.ParsedResults[0].ParsedText || '';
      }
    }

    return '';
  } catch (error) {
    console.error('Error en OCR:', error);
    return '';
  }
}

/**
 * Limpia un string de precio y lo convierte a número de forma robusta
 */
function parsePrice(priceStr: string): number {
  if (!priceStr) return 0;
  
  // Quitar todo lo que no sea número, coma o punto
  let clean = priceStr.replace(/[^\d.,]/g, '').trim();
  
  if (!clean) return 0;

  // Caso 1: Punto decimal (formato US: 474.29)
  if (clean.includes('.') && !clean.includes(',')) {
    // Verificar si es punto de miles o punto decimal
    const parts = clean.split('.');
    if (parts.length === 2 && parts[1].length === 2) {
      return parseFloat(clean);
    } else if (parts.length > 2 || parts[1].length === 3) {
      return parseFloat(clean.replace(/\./g, ''));
    }
    return parseFloat(clean);
  }

  // Caso 2: Coma decimal (formato Latino: 474,29)
  if (clean.includes(',') && !clean.includes('.')) {
    const parts = clean.split(',');
    if (parts.length === 2 && parts[1].length === 2) {
      return parseFloat(clean.replace(',', '.'));
    }
    return parseFloat(clean.replace(/,/g, ''));
  }

  // Caso 3: Ambos (formato mixto: 1.234,56 o 1,234.56)
  if (clean.includes('.') && clean.includes(',')) {
    if (clean.indexOf('.') < clean.indexOf(',')) {
      // 1.234,56
      return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
    } else {
      // 1,234.56
      return parseFloat(clean.replace(/,/g, ''));
    }
  }

  return parseFloat(clean) || 0;
}

/**
 * Analiza el texto crudo del OCR y extrae los datos de la factura
 */
export function parseInvoiceText(rawText: string): InvoiceData {
  const lines = rawText.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  const data: InvoiceData = {
    businessName: '', nit: '', total: 0, subtotal: 0, taxAmount: 0,
    invoiceDate: '', items: [], rawText,
  };

  // ══════════════════════════════════════
  // EXTRAER TOTAL (Prioridad Máxima)
  // ══════════════════════════════════════
  
  // 1. Buscar líneas que contienen "TOTAL" (pero no subtotal ni propina sugerida)
  for (let i = lines.length - 1; i >= 0; i--) {
    const line = lines[i].toUpperCase();
    if (line.includes('TOTAL') && !line.includes('SUB') && !line.includes('SUGERID')) {
      const nums = line.match(/[\d.,]{2,}/g);
      if (nums) {
        // Tomar el último número de la línea (generalmente el valor)
        const val = parsePrice(nums[nums.length - 1]);
        if (val > 100) { // Un total real suele ser > 100 en pesos o > 1 en dólares
          data.total = val;
          break;
        }
      }
      
      // Si no hay números en la línea, buscar en las 2 siguientes
      for (let j = 1; j <= 2; j++) {
        if (i + j < lines.length) {
          const nextNums = lines[i + j].match(/[\d.,]{2,}/g);
          if (nextNums) {
            const val = parsePrice(nextNums[nextNums.length - 1]);
            if (val > 100) {
              data.total = val;
              break;
            }
          }
        }
      }
      if (data.total > 0) break;
    }
  }

  // 2. Fallback: buscar el número más grande al final del documento
  if (data.total === 0) {
    const lastLines = lines.slice(Math.max(0, lines.length - 8));
    let maxVal = 0;
    for (const line of lastLines) {
      const nums = line.match(/[\d.,]{4,}/g);
      if (nums) {
        for (const n of nums) {
          const val = parsePrice(n);
          if (val > maxVal) maxVal = val;
        }
      }
    }
    data.total = maxVal;
  }

  return data;
}

/**
 * Función principal: toma base64, hace OCR, parsea y devuelve datos
 */
export async function scanInvoice(base64Image: string): Promise<InvoiceData> {
  const rawText = await extractTextFromImage(base64Image);
  if (!rawText) {
    return {
      businessName: '', nit: '', total: 0, subtotal: 0, taxAmount: 0,
      invoiceDate: '', items: [], rawText: 'No se pudo leer la imagen',
    };
  }
  console.log('=== RAW OCR TEXT ===\n', rawText);
  return parseInvoiceText(rawText);
}

export const OCRService = {
  scanInvoice,
};
