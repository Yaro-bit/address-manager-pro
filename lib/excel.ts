import type { Address } from './types';

/* -------------------------------------------------------------------------- */
/*                               XLSX lazy import                             */
/* -------------------------------------------------------------------------- */

let xlsxCache: any = null;

async function getXLSX() {
  if (xlsxCache) return xlsxCache;
  const mod: any = await import('xlsx');
  xlsxCache = mod?.default ?? mod;
  return xlsxCache;
}

/* -------------------------------------------------------------------------- */
/*                              Field name mapping                            */
/* -------------------------------------------------------------------------- */

const FIELD_MAPPINGS = {
  address: ['Adresse', 'Address'],
  addressCode: ['adrcd-subcd', 'ID'],
  region: ['Region'],
  ano: ['ANO', 'Provider'],
  status: ['Status'],
  homes: ['Anzahl der Homes', 'Homes'],
  contractStatus: ['Vertrag auf Adresse vorhanden oder L1-Angebot gesendet', 'Contract'],
  price: ['Preis Standardprodukt (€)', 'Price'],
  provisionCategory: ['Provisions-Kategorie'],
  buildingCompany: ['Baufirma'],
  kgNumber: ['KG Nummer'],
  completionPlanned: ['Fertigstellung Bau (aktueller Plan)'],
  completionDone: ['Fertigstellung Bau erfolgt'],
  d2dStart: ['D2D-Vertrieb Start'],
  d2dEnd: ['D2D-Vertrieb Ende'],
  outdoorFee: ['Outdoor-Pauschale vorhanden'],
  notes: ['Notes'],
} as const;

type MappingKey = keyof typeof FIELD_MAPPINGS;

/* -------------------------------------------------------------------------- */
/*                                 Utilities                                  */
/* -------------------------------------------------------------------------- */

function getFieldValue(row: Record<string, unknown>, fieldNames: readonly string[]): string {
  for (const name of fieldNames) {
    const v = row[name as keyof typeof row];
    if (v !== undefined && v !== null && String(v).trim() !== '') return String(v);
  }
  return '';
}

// Normalize numbers that might contain thousand separators and commas
function normalizeNumberLike(value: unknown): string {
  const s = String(value ?? '').trim();
  // Remove spaces and thousands separators, convert comma to dot
  return s.replace(/\s/g, '').replace(/\.(?=\d{3}(\D|$))/g, '').replace(',', '.');
}

const parseIntCache = new Map<string, number>();
const parseFloatCache = new Map<string, number>();

function safeParseInt(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return Math.trunc(value);
  const key = normalizeNumberLike(value);
  if (!key) return fallback;
  const hit = parseIntCache.get(key);
  if (hit !== undefined) return hit;
  const parsed = parseInt(key, 10);
  const out = Number.isFinite(parsed) ? parsed : fallback;
  parseIntCache.set(key, out);
  return out;
}

function safeParseFloat(value: unknown, fallback = 0): number {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  const key = normalizeNumberLike(value);
  if (!key) return fallback;
  const hit = parseFloatCache.get(key);
  if (hit !== undefined) return hit;
  const parsed = parseFloat(key);
  const out = Number.isFinite(parsed) ? parsed : fallback;
  parseFloatCache.set(key, out);
  return out;
}

function safeParseBoolean(value: unknown): boolean {
  if (typeof value === 'boolean') return value;
  const s = String(value ?? '').trim().toLowerCase();
  return s === 'yes' || s === 'true' || s === '1' || s === 'ja' || s === 'y' || s === 'x';
}

// Generate a stable, simple normalization key for duplicate detection
function normalizeAddressKey(s: string): string {
  return s
    .normalize('NFKC')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[.,;:()]/g, '')
    .trim();
}

/* -------------------------------------------------------------------------- */
/*                               Row → Address                                */
/* -------------------------------------------------------------------------- */

function createAddress(row: Record<string, unknown>, id: number): Address {
  const homesRaw =
    (row as any)[FIELD_MAPPINGS.homes[0]] ?? (row as any)[FIELD_MAPPINGS.homes[1]];
  const contractRaw =
    (row as any)[FIELD_MAPPINGS.contractStatus[0]] ?? (row as any)[FIELD_MAPPINGS.contractStatus[1]];
  const priceRaw =
    (row as any)[FIELD_MAPPINGS.price[0]] ?? (row as any)[FIELD_MAPPINGS.price[1]];
  const doneRaw = (row as any)[FIELD_MAPPINGS.completionDone[0]] ?? false;

  return {
    id,
    addressCode: getFieldValue(row, FIELD_MAPPINGS.addressCode),
    address: getFieldValue(row, FIELD_MAPPINGS.address),
    region: getFieldValue(row, FIELD_MAPPINGS.region),
    ano: getFieldValue(row, FIELD_MAPPINGS.ano),
    status: getFieldValue(row, FIELD_MAPPINGS.status),
    homes: safeParseInt(homesRaw, 0),
    contractStatus: safeParseInt(contractRaw, 0),
    price: safeParseFloat(priceRaw, 0),
    provisionCategory: getFieldValue(row, FIELD_MAPPINGS.provisionCategory),
    buildingCompany: getFieldValue(row, FIELD_MAPPINGS.buildingCompany),
    kgNumber: getFieldValue(row, FIELD_MAPPINGS.kgNumber),
    completionPlanned: getFieldValue(row, FIELD_MAPPINGS.completionPlanned),
    completionDone: safeParseBoolean(doneRaw),
    d2dStart: getFieldValue(row, FIELD_MAPPINGS.d2dStart),
    d2dEnd: getFieldValue(row, FIELD_MAPPINGS.d2dEnd),
    outdoorFee: getFieldValue(row, FIELD_MAPPINGS.outdoorFee),
    notes: getFieldValue(row, FIELD_MAPPINGS.notes),
    imported: true,
  };
}

/* -------------------------------------------------------------------------- */
/*                          Duplicate detection (O(1))                        */
/* -------------------------------------------------------------------------- */

function createDuplicateChecker(existing: Address[]) {
  const existingKeys = new Set(existing.map(a => normalizeAddressKey(a.address || '')));
  const batchKeys = new Set<string>();

  return {
    isDuplicate(addr: string): boolean {
      const key = normalizeAddressKey(addr);
      return existingKeys.has(key) || batchKeys.has(key);
    },
    add(addr: string) {
      batchKeys.add(normalizeAddressKey(addr));
    },
    reset() {
      batchKeys.clear();
    },
  };
}

/* -------------------------------------------------------------------------- */
/*                                   Import                                   */
/* -------------------------------------------------------------------------- */

export async function importExcelFiles(
  files: File[],
  existing: Address[]
): Promise<{
  newAddresses: Address[];
  totalProcessed: number;
  duplicatesSkipped: number;
}> {
  const XLSX = await getXLSX();

  const allNew: Address[] = [];
  let totalProcessed = 0;
  let duplicates = 0;
  const baseId = Date.now();

  const duplicateChecker = createDuplicateChecker(existing);

  try {
    const results = await Promise.all(
      files.map(async (file, fileIndex) => {
        const buf = await file.arrayBuffer();
        const wb = XLSX.read(buf, {
          cellDates: true,
          raw: false,
          cellStyles: false,
          cellFormulas: false,
        });

        const ws = wb.Sheets[wb.SheetNames[0]];
        if (!ws) {
          console.warn(`File ${file.name}: No worksheet found`);
          return { addresses: [] as Address[], processed: 0, duplicates: 0 };
        }

        const rows: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, {
          raw: false,
          defval: '',
          blankrows: false,
        });

        const fileAddresses: Address[] = [];
        let fileDuplicates = 0;

        const CHUNK_SIZE = 100;
        for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
          const chunk = rows.slice(i, i + CHUNK_SIZE);

          for (let j = 0; j < chunk.length; j++) {
            const row = chunk[j];
            const addressText = getFieldValue(row, FIELD_MAPPINGS.address);
            if (!addressText.trim()) continue;

            if (duplicateChecker.isDuplicate(addressText)) {
              fileDuplicates++;
              continue;
            }

            // Stable-ish numeric id that won't collide across files in this batch
            const id = baseId + fileIndex * 1_000_000 + fileAddresses.length;
            const address = createAddress(row, id);
            fileAddresses.push(address);
            duplicateChecker.add(addressText);
          }

          if (i % (CHUNK_SIZE * 5) === 0) {
            // Yield control back to the event loop
            await new Promise(r => setTimeout(r, 0));
          }
        }

        return { addresses: fileAddresses, processed: rows.length, duplicates: fileDuplicates };
      })
    );

    for (const r of results) {
      allNew.push(...r.addresses);
      totalProcessed += r.processed;
      duplicates += r.duplicates;
    }
  } catch (error) {
    console.error('Error processing Excel files:', error);
    throw new Error(
      `Failed to process Excel files: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  } finally {
    parseIntCache.clear();
    parseFloatCache.clear();
  }

  return {
    newAddresses: allNew,
    totalProcessed,
    duplicatesSkipped: duplicates,
  };
}

/* -------------------------------------------------------------------------- */
/*                                   Export                                   */
/* -------------------------------------------------------------------------- */

export async function exportCSVWeb(addresses: Address[]): Promise<void> {
  if (addresses.length === 0) throw new Error('No addresses to export');

  const XLSX = await getXLSX();

  try {
    const data = new Array(addresses.length);

    const CHUNK_SIZE = 500;
    for (let i = 0; i < addresses.length; i += CHUNK_SIZE) {
      const chunk = addresses.slice(i, i + CHUNK_SIZE);

      for (let j = 0; j < chunk.length; j++) {
        const a = chunk[j];
        data[i + j] = {
          'adrcd-subcd': a.addressCode || '',
          Adresse: a.address || '',
          Region: a.region || '',
          ANO: a.ano || '',
          Status: a.status || '',
          'Anzahl der Homes': a.homes ?? 0,
          'Vertrag auf Adresse vorhanden oder L1-Angebot gesendet': a.contractStatus ?? 0,
          'Preis Standardprodukt (€)': a.price ?? 0,
          'Provisions-Kategorie': a.provisionCategory || '',
          Baufirma: a.buildingCompany || '',
          'KG Nummer': a.kgNumber || '',
          'Fertigstellung Bau (aktueller Plan)': a.completionPlanned || '',
          'Fertigstellung Bau erfolgt': a.completionDone ? 'Yes' : '',
          'D2D-Vertrieb Start': a.d2dStart || '',
          'D2D-Vertrieb Ende': a.d2dEnd || '',
          'Outdoor-Pauschale vorhanden': a.outdoorFee || '',
          Notes: a.notes || '',
        };
      }

      if (i % (CHUNK_SIZE * 2) === 0) {
        await new Promise(r => setTimeout(r, 0));
      }
    }

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Addresses');

    const csv = XLSX.write(wb, {
      type: 'string',
      bookType: 'csv',
      FS: ',',
      RS: '\n',
    });

    // Prepend BOM for Excel compatibility
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);

    try {
      const link = document.createElement('a');
      link.href = url;
      link.download = `address-data-${new Date().toISOString().split('T')[0]}.csv`;
      link.style.display = 'none';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('Error exporting CSV:', error);
    throw new Error(
      `Failed to export CSV: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/* -------------------------------------------------------------------------- */
/*                              Cache maintenance                              */
/* -------------------------------------------------------------------------- */

export function clearCaches(): void {
  parseIntCache.clear();
  parseFloatCache.clear();
  xlsxCache = null;
}
