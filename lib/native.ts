// lib/native.ts

// Enhanced global interface with better typing
declare global {
  interface Window {
    Capacitor?: {
      isNativePlatform?: () => boolean;
      getPlatform?: () => string;
      Plugins?: {
        Filesystem?: any;
        Share?: any;
      };
    };
  }
}

// Cached platform detection results
let platformCache: {
  isNative?: boolean;
  platform?: 'ios' | 'android' | 'web';
  timestamp?: number;
} = {};

const CACHE_DURATION = 30_000; // 30 seconds

/* -------------------------------------------------------------------------- */
/*                   Capacitor platform detection (cached)                    */
/* -------------------------------------------------------------------------- */

/**
 * Optimized Capacitor native platform detection with caching
 */
export function isNativeCapacitor(): boolean {
  if (typeof window === 'undefined') return false;

  const now = Date.now();

  if (
    platformCache.isNative !== undefined &&
    platformCache.timestamp &&
    now - platformCache.timestamp < CACHE_DURATION
  ) {
    return platformCache.isNative;
  }

  const capacitor = window.Capacitor;

  try {
    if (!capacitor) {
      platformCache = { isNative: false, platform: 'web', timestamp: now };
      return false;
    }

    if (typeof capacitor.isNativePlatform === 'function') {
      const isNative = Boolean(capacitor.isNativePlatform());
      platformCache = { isNative, platform: getPlatform(), timestamp: now };
      return isNative;
    }

    const p = capacitor.getPlatform?.();
    const platform = p === 'ios' || p === 'android' ? (p as 'ios' | 'android') : 'web';
    const isNative = platform !== 'web';

    platformCache = { isNative, platform, timestamp: now };
    return isNative;
  } catch (error) {
    console.warn('Error detecting Capacitor platform:', error);
    platformCache = { isNative: false, platform: 'web', timestamp: now };
    return false;
  }
}

/**
 * Get the current platform with caching
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web';

  const now = Date.now();
  if (
    platformCache.platform &&
    platformCache.timestamp &&
    now - platformCache.timestamp < CACHE_DURATION
  ) {
    return platformCache.platform;
  }

  const capacitor = window.Capacitor;
  if (!capacitor?.getPlatform) {
    platformCache.platform = 'web';
    platformCache.timestamp = now;
    return 'web';
  }

  try {
    const p = capacitor.getPlatform();
    const platform = p === 'ios' || p === 'android' ? (p as 'ios' | 'android') : 'web';
    platformCache.platform = platform;
    platformCache.timestamp = now;
    return platform;
  } catch {
    platformCache.platform = 'web';
    platformCache.timestamp = now;
    return 'web';
  }
}

/* -------------------------------------------------------------------------- */
/*                               XLSX lazy load                               */
/* -------------------------------------------------------------------------- */

let xlsxModuleCache: any = null;

async function getXLSXModule(): Promise<any> {
  if (xlsxModuleCache) return xlsxModuleCache;
  try {
    const mod: any = await import('xlsx');
    xlsxModuleCache = mod?.default ?? mod;
    return xlsxModuleCache;
  } catch (error) {
    console.error('Failed to load XLSX module:', error);
    throw new Error('XLSX module is required for CSV generation');
  }
}

/* -------------------------------------------------------------------------- */
/*                         CSV transformation (native)                        */
/* -------------------------------------------------------------------------- */

/**
 * Transform to CSV rows using the SAME headers as the web exporter,
 * so exports round-trip cleanly with your import FIELD_MAPPINGS.
 * (German column names retained for consistency.)
 */
function transformAddressesToCSV(addresses: Array<Record<string, any>>): Record<string, any>[] {
  const out = new Array(addresses.length);
  const CHUNK_SIZE = 500;

  for (let i = 0; i < addresses.length; i += CHUNK_SIZE) {
    const chunk = addresses.slice(i, i + CHUNK_SIZE);
    for (let j = 0; j < chunk.length; j++) {
      const a = chunk[j];
      out[i + j] = {
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
  }

  return out;
}

/* -------------------------------------------------------------------------- */
/*                         Native file IO + share sheet                        */
/* -------------------------------------------------------------------------- */

async function saveAndShareNativeFile(
  csvContent: string,
  fileName: string,
  addressCount: number
): Promise<void> {
  const cap = window.Capacitor!;
  const { Filesystem, Share } = cap.Plugins || {};

  if (!Filesystem || !Share) {
    throw new Error('Required Capacitor plugins not available');
  }

  // Prepend BOM for Excel compatibility on mobile as well
  const contentWithBOM = '\uFEFF' + csvContent;

  // Basic filename hardening
  const safeFileName = fileName.replace(/[^\w.\-]+/g, '_');

  try {
    await Filesystem.writeFile({
      path: safeFileName,
      data: contentWithBOM,
      directory: 'DOCUMENTS', // avoids importing Capacitor types; string literal works at runtime
      encoding: 'utf8',
    });

    const uriResult = await Filesystem.getUri({
      directory: 'DOCUMENTS',
      path: safeFileName,
    });

    if (!uriResult?.uri) throw new Error('Failed to get file URI');

    await Share.share({
      title: 'Address Manager Pro Export',
      text: `Address data export - ${addressCount.toLocaleString()} addresses`,
      url: uriResult.uri,
      dialogTitle: 'Share Address Data',
    });
  } catch (error) {
    console.error('Native file operation failed:', error);
    throw error;
  }
}

/* -------------------------------------------------------------------------- */
/*                          Public API: saveData… (native/web)                */
/* -------------------------------------------------------------------------- */

/**
 * Enhanced save function with graceful web fallback.
 * Signature unchanged to avoid breaking callers.
 */
export async function saveDataToCSVNativeOrWeb(
  addresses: any[],
  webFallback: () => void | Promise<void>
): Promise<void> {
  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new Error('No addresses provided for export');
  }

  // Prefer native path when available; otherwise fall back immediately
  if (!isNativeCapacitor()) {
    return await webFallback();
  }

  const cap = window.Capacitor;
  if (!cap?.Plugins?.Filesystem || !cap?.Plugins?.Share) {
    return await webFallback();
  }

  try {
    const xlsx = await getXLSXModule();

    const rows = transformAddressesToCSV(addresses);
    const ws = xlsx.utils.json_to_sheet(rows);
    const csv = xlsx.utils.sheet_to_csv(ws, {
      FS: ',',
      RS: '\n',
    });

    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `address-data-${timestamp}.csv`;

    await saveAndShareNativeFile(csv, fileName, addresses.length);
  } catch (error) {
    // If native flow fails for any reason, try the web path
    try {
      await webFallback();
    } catch (fallbackError) {
      console.error('Web fallback also failed:', fallbackError);
      throw new Error('Both native and web export methods failed');
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                              Plugin availability                            */
/* -------------------------------------------------------------------------- */

export function getAvailablePlugins(): {
  filesystem: boolean;
  share: boolean;
  isNative: boolean;
} {
  const isNative = isNativeCapacitor();
  const cap = typeof window !== 'undefined' ? window.Capacitor : undefined;
  const plugins = cap?.Plugins;

  return {
    filesystem: Boolean(plugins?.Filesystem && isNative),
    share: Boolean(plugins?.Share && isNative),
    isNative,
  };
}

/* -------------------------------------------------------------------------- */
/*                                   Debug                                    */
/* -------------------------------------------------------------------------- */

export function clearNativeCaches(): void {
  platformCache = {};
  xlsxModuleCache = null;
}

export function getPlatformInfo(): {
  isNative: boolean;
  platform: string;
  cached: boolean;
  plugins: ReturnType<typeof getAvailablePlugins>;
} {
  const now = Date.now();
  const cached =
    Boolean(platformCache.timestamp) &&
    now - (platformCache.timestamp as number) < CACHE_DURATION;

  return {
    isNative: isNativeCapacitor(),
    platform: getPlatform(),
    cached,
    plugins: getAvailablePlugins(),
  };
}
