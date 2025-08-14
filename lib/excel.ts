import type { Address } from './types';

// Cache for XLSX module to avoid repeated imports
let xlsxCache: any = null;

async function getXLSX() {
  if (xlsxCache) {
    return xlsxCache;
  }
  
  const mod: any = await import('xlsx');
  xlsxCache = mod?.default ?? mod;
  return xlsxCache;
}

// Optimized field mapping configuration
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
  notes: ['Notes'] // Added notes mapping for CSV import
} as const;

// Utility function to safely get field value with fallback
function getFieldValue(row: any, fieldNames: readonly string[]): string {
  for (const fieldName of fieldNames) {
    const value = row[fieldName];
    if (value !== undefined && value !== null) {
      return String(value);
    }
  }
  return '';
}

// Optimized number parsing with caching
const parseIntCache = new Map<string, number>();
const parseFloatCache = new Map<string, number>();

function safeParseInt(value: any, defaultValue: number = 0): number {
  if (typeof value === 'number') return Math.floor(value);
  if (!value) return defaultValue;
  
  const strValue = String(value).trim();
  if (!strValue) return defaultValue;
  
  if (parseIntCache.has(strValue)) {
    return parseIntCache.get(strValue)!;
  }
  
  const parsed = parseInt(strValue, 10);
  const result = isNaN(parsed) ? defaultValue : parsed;
  parseIntCache.set(strValue, result);
  return result;
}

function safeParseFloat(value: any, defaultValue: number = 0): number {
  if (typeof value === 'number') return value;
  if (!value) return defaultValue;
  
  const strValue = String(value).trim().replace(',', '.');
  if (!strValue) return defaultValue;
  
  if (parseFloatCache.has(strValue)) {
    return parseFloatCache.get(strValue)!;
  }
  
  const parsed = parseFloat(strValue);
  const result = isNaN(parsed) ? defaultValue : parsed;
  parseFloatCache.set(strValue, result);
  return result;
}

// Helper function to parse boolean values from various formats
function safeParseBoolean(value: any): boolean {
  if (typeof value === 'boolean') return value;
  if (!value) return false;
  
  const strValue = String(value).trim().toLowerCase();
  return strValue === 'yes' || strValue === 'true' || strValue === '1' || strValue === 'ja';
}

// Optimized address creation function
function createAddress(row: any, id: number): Address {
  return {
    id,
    addressCode: getFieldValue(row, FIELD_MAPPINGS.addressCode),
    address: getFieldValue(row, FIELD_MAPPINGS.address),
    region: getFieldValue(row, FIELD_MAPPINGS.region),
    ano: getFieldValue(row, FIELD_MAPPINGS.ano),
    status: getFieldValue(row, FIELD_MAPPINGS.status),
    homes: safeParseInt(row[FIELD_MAPPINGS.homes[0]] || row[FIELD_MAPPINGS.homes[1]]),
    contractStatus: safeParseInt(row[FIELD_MAPPINGS.contractStatus[0]] || row[FIELD_MAPPINGS.contractStatus[1]]),
    price: safeParseFloat(row[FIELD_MAPPINGS.price[0]] || row[FIELD_MAPPINGS.price[1]]),
    provisionCategory: getFieldValue(row, FIELD_MAPPINGS.provisionCategory),
    buildingCompany: getFieldValue(row, FIELD_MAPPINGS.buildingCompany),
    kgNumber: getFieldValue(row, FIELD_MAPPINGS.kgNumber),
    completionPlanned: getFieldValue(row, FIELD_MAPPINGS.completionPlanned),
    completionDone: safeParseBoolean(row[FIELD_MAPPINGS.completionDone[0]] || false),
    d2dStart: getFieldValue(row, FIELD_MAPPINGS.d2dStart),
    d2dEnd: getFieldValue(row, FIELD_MAPPINGS.d2dEnd),
    outdoorFee: getFieldValue(row, FIELD_MAPPINGS.outdoorFee),
    notes: getFieldValue(row, FIELD_MAPPINGS.notes), // Handle notes from CSV import
    imported: true
  };
}

// Optimized duplicate detection using Map for O(1) lookups
function createDuplicateChecker(existing: Address[]) {
  const existingKeys = new Set(
    existing.map(address => address.address.trim().toLowerCase())
  );
  
  const currentBatchKeys = new Set<string>();
  
  return {
    isDuplicate(address: string): boolean {
      const key = address.trim().toLowerCase();
      return existingKeys.has(key) || currentBatchKeys.has(key);
    },
    
    addToCurrentBatch(address: string): void {
      const key = address.trim().toLowerCase();
      currentBatchKeys.add(key);
    },
    
    reset(): void {
      currentBatchKeys.clear();
    }
  };
}

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
  let currentId = Date.now();
  
  // Create optimized duplicate checker
  const duplicateChecker = createDuplicateChecker(existing);
  
  try {
    // Process files in parallel for better performance
    const fileProcessingPromises = files.map(async (file, fileIndex) => {
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { 
        cellDates: true, 
        raw: false,
        cellStyles: false, // Disable styles for faster parsing
        cellFormulas: false // Disable formulas for faster parsing
      });
      
      const ws = wb.Sheets[wb.SheetNames[0]];
      if (!ws) {
        console.warn(`File ${file.name}: No worksheet found`);
        return { addresses: [], processed: 0, duplicates: 0 };
      }
      
      const rows: any[] = XLSX.utils.sheet_to_json(ws, {
        raw: false,
        defval: '', // Default value for empty cells
        blankrows: false // Skip blank rows
      });
      
      const fileAddresses: Address[] = [];
      let fileDuplicates = 0;
      
      // Process rows in chunks to avoid blocking the main thread
      const CHUNK_SIZE = 100;
      for (let i = 0; i < rows.length; i += CHUNK_SIZE) {
        const chunk = rows.slice(i, i + CHUNK_SIZE);
        
        for (const row of chunk) {
          const addressText = getFieldValue(row, FIELD_MAPPINGS.address);
          
          if (!addressText.trim()) {
            continue;
          }
          
          if (duplicateChecker.isDuplicate(addressText)) {
            fileDuplicates++;
            continue;
          }
          
          // Create unique ID for each address
          const address = createAddress(row, currentId + fileIndex * 1000000 + fileAddresses.length);
          fileAddresses.push(address);
          duplicateChecker.addToCurrentBatch(addressText);
        }
        
        // Yield control to prevent blocking
        if (i % (CHUNK_SIZE * 5) === 0) {
          await new Promise(resolve => setTimeout(resolve, 0));
        }
      }
      
      return { 
        addresses: fileAddresses, 
        processed: rows.length, 
        duplicates: fileDuplicates 
      };
    });
    
    // Wait for all files to be processed
    const results = await Promise.all(fileProcessingPromises);
    
    // Combine results
    for (const result of results) {
      allNew.push(...result.addresses);
      totalProcessed += result.processed;
      duplicates += result.duplicates;
    }
    
  } catch (error) {
    console.error('Error processing Excel files:', error);
    throw new Error(`Failed to process Excel files: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    // Clear caches to free memory
    parseIntCache.clear();
    parseFloatCache.clear();
  }
  
  return { 
    newAddresses: allNew, 
    totalProcessed, 
    duplicatesSkipped: duplicates 
  };
}

// Updated CSV export function to match exact import format
export async function exportCSVWeb(addresses: Address[]): Promise<void> {
  if (addresses.length === 0) {
    throw new Error('No addresses to export');
  }
  
  const XLSX = await getXLSX();
  
  try {
    // Pre-allocate array for better performance
    const data = new Array(addresses.length);
    
    // Process in chunks to avoid blocking
    const CHUNK_SIZE = 500;
    for (let i = 0; i < addresses.length; i += CHUNK_SIZE) {
      const chunk = addresses.slice(i, i + CHUNK_SIZE);
      
      for (let j = 0; j < chunk.length; j++) {
        const address = chunk[j];
        // Use the exact same column names as the import field mappings
        data[i + j] = {
          'adrcd-subcd': address.addressCode || '',
          'Adresse': address.address || '',
          'Region': address.region || '',
          'ANO': address.ano || '',
          'Status': address.status || '',
          'Anzahl der Homes': address.homes || 0,
          'Vertrag auf Adresse vorhanden oder L1-Angebot gesendet': address.contractStatus || 0,
          'Preis Standardprodukt (€)': address.price || 0,
          'Provisions-Kategorie': address.provisionCategory || '',
          'Baufirma': address.buildingCompany || '',
          'KG Nummer': address.kgNumber || '',
          'Fertigstellung Bau (aktueller Plan)': address.completionPlanned || '',
          'Fertigstellung Bau erfolgt': address.completionDone ? 'Yes' : '',
          'D2D-Vertrieb Start': address.d2dStart || '',
          'D2D-Vertrieb Ende': address.d2dEnd || '',
          'Outdoor-Pauschale vorhanden': address.outdoorFee || '',
          'Notes': address.notes || ''
        };
      }
      
      // Yield control periodically
      if (i % (CHUNK_SIZE * 2) === 0) {
        await new Promise(resolve => setTimeout(resolve, 0));
      }
    }
    
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Addresses');
    
    const csv = XLSX.write(wb, { 
      type: 'string', 
      bookType: 'csv',
      FS: ',', // Field separator
      RS: '\n' // Record separator
    });
    
    // Use more efficient blob creation with BOM for Excel compatibility
    const BOM = '\uFEFF';
    const blob = new Blob([BOM + csv], { 
      type: 'text/csv;charset=utf-8' 
    });
    
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
      // Ensure URL is always revoked
      URL.revokeObjectURL(url);
    }
    
  } catch (error) {
    console.error('Error exporting CSV:', error);
    throw new Error(`Failed to export CSV: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Utility function to clear all caches (useful for memory management)
export function clearCaches(): void {
  parseIntCache.clear();
  parseFloatCache.clear();
  xlsxCache = null;
}
