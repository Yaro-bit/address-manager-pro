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
/*                    Updated Field Mappings for Your Files                   */
/* -------------------------------------------------------------------------- */

const FIELD_MAPPINGS = {
  address: ['Adresse', 'Address'],
  addressCode: ['adrcd-subcd', 'ID'],
  region: ['Region'],
  ano: ['ANO', 'Provider'],
  status: ['Status'],
  homes: ['Anzahl der Homes', 'Homes'],
  // Your file has separate contract columns - we'll combine them
  l1OfferSent: ['L1-Angebot gesendet'],
  salesContract: ['Verkaufsauftrag vorhanden'],
  // Fallback for files with combined column
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
/*                      Enhanced Address Creation for Your Data                */
/* -------------------------------------------------------------------------- */

function createAddress(row: Record<string, unknown>, id: number): Address {
  const homesRaw = (row as any)[FIELD_MAPPINGS.homes[0]] ?? (row as any)[FIELD_MAPPINGS.homes[1]];
  const priceRaw = (row as any)[FIELD_MAPPINGS.price[0]] ?? (row as any)[FIELD_MAPPINGS.price[1]];
  const doneRaw = (row as any)[FIELD_MAPPINGS.completionDone[0]] ?? false;
  
  // Handle your file's separate contract columns
  const l1OfferRaw = (row as any)[FIELD_MAPPINGS.l1OfferSent[0]] ?? 0;
  const salesContractRaw = (row as any)[FIELD_MAPPINGS.salesContract[0]] ?? 0;
  const combinedContractRaw = (row as any)[FIELD_MAPPINGS.contractStatus[0]] ?? 0;
  
  // Calculate contract status: use combined if available, otherwise combine separate columns
  let contractStatus = 0;
  if (combinedContractRaw > 0) {
    contractStatus = safeParseInt(combinedContractRaw, 0);
  } else {
    const l1Offer = safeParseInt(l1OfferRaw, 0);
    const salesContract = safeParseInt(salesContractRaw, 0);
    contractStatus = Math.max(l1Offer, salesContract);
  }

  return {
    id,
    addressCode: getFieldValue(row, FIELD_MAPPINGS.addressCode),
    address: getFieldValue(row, FIELD_MAPPINGS.address),
    region: getFieldValue(row, FIELD_MAPPINGS.region),
    ano: getFieldValue(row, FIELD_MAPPINGS.ano),
    status: getFieldValue(row, FIELD_MAPPINGS.status),
    homes: safeParseInt(homesRaw, 0),
    contractStatus,
    price: safeParseFloat(priceRaw, 0),
    provisionCategory: getFieldValue(row, FIELD_MAPPINGS.provisionCategory),
    buildingCompany: getFieldValue(row, FIELD_MAPPINGS.buildingCompany),
    kgNumber: getFieldValue(row, FIELD_MAPPINGS.kgNumber),
    completionPlanned: getFieldValue(row, FIELD_MAPPINGS.completionPlanned),
    completionDone: safeParseBoolean(doneRaw),
    d2dStart: getFieldValue(row, FIELD_MAPPINGS.d2dStart),
    d2dEnd: getFieldValue(row, FIELD_MAPPINGS.d2dEnd),
    outdoorFee: getFieldValue(row, FIELD_MAPPINGS.outdoorFee),
    notes: getFieldValue(row, FIELD_MAPPINGS.notes), // Will be empty for your files
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
/*                    Optimized Import for Large Datasets                     */
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
    console.log(`Starting import of ${files.length} file(s)`);
    
    const results = await Promise.all(
      files.map(async (file, fileIndex) => {
        console.log(`Processing file ${fileIndex + 1}/${files.length}: ${file.name}`);
        
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

        console.log(`Processing ${rows.length.toLocaleString()} rows from ${file.name}`);

        const fileAddresses: Address[] = [];
        let fileDuplicates = 0;

        // Increased chunk size for better performance with large datasets like yours
        const CHUNK_SIZE = 500;
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

            const id = baseId + fileIndex * 1_000_000 + fileAddresses.length;
            const address = createAddress(row, id);
            fileAddresses.push(address);
            duplicateChecker.add(addressText);
          }

          // Progress logging for large files like yours (78K+ rows)
          if (i % (CHUNK_SIZE * 20) === 0) {
            const progress = Math.round(((i + CHUNK_SIZE) / rows.length) * 100);
            console.log(`Progress: ${progress}% (${(i + CHUNK_SIZE).toLocaleString()}/${rows.length.toLocaleString()} rows)`);
            // Yield control back to the event loop
            await new Promise(r => setTimeout(r, 1));
          }
        }

        console.log(`Completed ${file.name}: ${fileAddresses.length.toLocaleString()} imported, ${fileDuplicates.toLocaleString()} duplicates skipped`);
        return { addresses: fileAddresses, processed: rows.length, duplicates: fileDuplicates };
      })
    );

    for (const r of results) {
      allNew.push(...r.addresses);
      totalProcessed += r.processed;
      duplicates += r.duplicates;
    }
    
    console.log(`Import complete: ${allNew.length.toLocaleString()} addresses imported, ${duplicates.toLocaleString()} duplicates skipped`);
  } catch (error) {
    console.error('Error processing Excel files:', error);
    throw new Error(
      `Failed to process Excel files: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  } finally {
    // Clear caches to prevent memory leaks with large datasets
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
    console.log(`Exporting ${addresses.length.toLocaleString()} addresses to CSV`);
    
    const data = new Array(addresses.length);

    // Process in chunks for better performance with large datasets
    const CHUNK_SIZE = 1000;
    for (let i = 0; i < addresses.length; i += CHUNK_SIZE) {
      const chunk = addresses.slice(i, i + CHUNK_SIZE);

      for (let j = 0; j < chunk.length; j++) {
        const a = chunk[j];
        data[i + j] = {
          'adrcd-subcd': a.addressCode || '',
          'Adresse': a.address || '',
          'Region': a.region || '',
          'ANO': a.ano || '',
          'Status': a.status || '',
          'Anzahl der Homes': a.homes ?? 0,
          'Vertrag auf Adresse vorhanden oder L1-Angebot gesendet': a.contractStatus ?? 0,
          'Preis Standardprodukt (€)': a.price ?? 0,
          'Provisions-Kategorie': a.provisionCategory || '',
          'Baufirma': a.buildingCompany || '',
          'KG Nummer': a.kgNumber || '',
          'Fertigstellung Bau (aktueller Plan)': a.completionPlanned || '',
          'Fertigstellung Bau erfolgt': a.completionDone ? 'Yes' : '',
          'D2D-Vertrieb Start': a.d2dStart || '',
          'D2D-Vertrieb Ende': a.d2dEnd || '',
          'Outdoor-Pauschale vorhanden': a.outdoorFee || '',
          'Notes': a.notes || '',
        };
      }

      // Yield control for large datasets
      if (i % (CHUNK_SIZE * 5) === 0) {
        await new Promise(r => setTimeout(r, 1));
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

    // Prepend BOM for Excel compatibility (fixes German characters)
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
      
      console.log('CSV export completed successfully');
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