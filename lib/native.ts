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
  platform?: string;
  timestamp?: number;
} = {};

const CACHE_DURATION = 30000; // 30 seconds cache

/**
 * Optimized Capacitor native platform detection with caching
 */
export function isNativeCapacitor(): boolean {
  // Server-side rendering check
  if (typeof window === 'undefined') return false;
  
  const now = Date.now();
  
  // Return cached result if still valid
  if (platformCache.isNative !== undefined && 
      platformCache.timestamp && 
      (now - platformCache.timestamp) < CACHE_DURATION) {
    return platformCache.isNative;
  }
  
  const capacitor = window.Capacitor;
  
  try {
    if (!capacitor) {
      platformCache = { isNative: false, timestamp: now };
      return false;
    }
    
    // Primary detection method
    if (typeof capacitor.isNativePlatform === 'function') {
      const isNative = Boolean(capacitor.isNativePlatform());
      platformCache = { isNative, timestamp: now };
      return isNative;
    }
    
    // Fallback detection method
    const platform = capacitor.getPlatform?.();
    const isNative = platform === 'ios' || platform === 'android';
    
    platformCache = { 
      isNative, 
      platform: platform || 'web', 
      timestamp: now 
    };
    
    return isNative;
  } catch (error) {
    console.warn('Error detecting Capacitor platform:', error);
    platformCache = { isNative: false, timestamp: now };
    return false;
  }
}

/**
 * Get the current platform with caching
 */
export function getPlatform(): 'ios' | 'android' | 'web' {
  if (typeof window === 'undefined') return 'web';
  
  const now = Date.now();
  
  // Return cached platform if available and valid
  if (platformCache.platform && 
      platformCache.timestamp && 
      (now - platformCache.timestamp) < CACHE_DURATION) {
    return platformCache.platform as 'ios' | 'android' | 'web';
  }
  
  const capacitor = window.Capacitor;
  if (!capacitor?.getPlatform) return 'web';
  
  try {
    const platform = capacitor.getPlatform();
    platformCache.platform = platform;
    platformCache.timestamp = now;
    
    return (platform === 'ios' || platform === 'android') ? platform : 'web';
  } catch {
    return 'web';
  }
}

// Cache for XLSX module
let xlsxModuleCache: any = null;

/**
 * Optimized XLSX module loading with caching
 */
async function getXLSXModule(): Promise<any> {
  if (xlsxModuleCache) {
    return xlsxModuleCache;
  }
  
  try {
    const mod: any = await import('xlsx');
    xlsxModuleCache = mod?.default ?? mod;
    return xlsxModuleCache;
  } catch (error) {
    console.error('Failed to load XLSX module:', error);
    throw new Error('XLSX module is required for CSV generation');
  }
}

/**
 * Optimized CSV data transformation
 */
function transformAddressesToCSV(addresses: any[]): Record<string, any>[] {
  // Pre-allocate array for better performance
  const csvRows = new Array(addresses.length);
  
  const CHUNK_SIZE = 100;
  
  // Process in chunks to avoid blocking the main thread
  for (let i = 0; i < addresses.length; i += CHUNK_SIZE) {
    const chunk = addresses.slice(i, i + CHUNK_SIZE);
    
    for (let j = 0; j < chunk.length; j++) {
      const addr = chunk[j];
      csvRows[i + j] = {
        'Address Code': addr.addressCode || '',
        'Address': addr.address || '',
        'Region': addr.region || '',
        'Provider': addr.ano || '',
        'Status': addr.status || '',
        'Homes': addr.homes || 0,
        'Contract Status': addr.contractStatus || 0,
        'Price': addr.price || 0,
        'Provision Category': addr.provisionCategory || '',
        'Building Company': addr.buildingCompany || '',
        'KG Number': addr.kgNumber || '',
        'Completion Planned': addr.completionPlanned || '',
        'Completion Done': Boolean(addr.completionDone),
        'D2D Start': addr.d2dStart || '',
        'D2D End': addr.d2dEnd || '',
        'Outdoor Fee': addr.outdoorFee || '',
        'Notes': addr.notes || ''
      };
    }
  }
  
  return csvRows;
}

/**
 * Optimized native file operations with better error handling
 */
async function saveAndShareNativeFile(
  csvContent: string,
  fileName: string,
  addressCount: number
): Promise<void> {
  const capacitor = window.Capacitor!;
  const { Filesystem, Share } = capacitor.Plugins!;
  
  if (!Filesystem || !Share) {
    throw new Error('Required Capacitor plugins not available');
  }
  
  try {
    // Write file to device storage
    await Filesystem.writeFile({
      path: fileName,
      data: csvContent,
      directory: 'DOCUMENTS', // Use string literal to avoid type imports
      encoding: 'utf8'
    });
    
    // Get file URI for sharing
    const uriResult = await Filesystem.getUri({
      directory: 'DOCUMENTS',
      path: fileName
    });
    
    if (!uriResult?.uri) {
      throw new Error('Failed to get file URI');
    }
    
    // Share the file using native share sheet
    await Share.share({
      title: 'Address Manager Pro Export',
      text: `Address data export - ${addressCount.toLocaleString()} addresses`,
      url: uriResult.uri,
      dialogTitle: 'Share Address Data'
    });
    
  } catch (error) {
    console.error('Native file operation failed:', error);
    throw error;
  }
}

/**
 * Enhanced save function with performance optimizations and better error handling
 */
export async function saveDataToCSVNativeOrWeb(
  addresses: any[],
  webFallback: () => void | Promise<void>
): Promise<void> {
  // Input validation
  if (!Array.isArray(addresses) || addresses.length === 0) {
    throw new Error('No addresses provided for export');
  }
  
  // Check if native platform is available
  if (!isNativeCapacitor()) {
    console.log('Using web fallback for CSV export');
    return await webFallback();
  }
  
  const capacitor = window.Capacitor;
  if (!capacitor?.Plugins?.Filesystem || !capacitor?.Plugins?.Share) {
    console.warn('Required Capacitor plugins not available, using web fallback');
    return await webFallback();
  }
  
  try {
    // Load XLSX module with caching
    const xlsx = await getXLSXModule();
    
    // Transform data efficiently
    const csvRows = transformAddressesToCSV(addresses);
    
    // Generate worksheet and CSV content
    const ws = xlsx.utils.json_to_sheet(csvRows);
    const csvContent = xlsx.utils.sheet_to_csv(ws, {
      FS: ',', // Field separator
      RS: '\n' // Record separator
    });
    
    // Generate filename with timestamp
    const timestamp = new Date().toISOString().split('T')[0];
    const fileName = `address-data-${timestamp}.csv`;
    
    // Save and share file natively
    await saveAndShareNativeFile(csvContent, fileName, addresses.length);
    
    console.log(`Successfully exported ${addresses.length} addresses via native share`);
    
  } catch (error) {
    console.error('Native CSV export failed:', error);
    console.log('Falling back to web export');
    
    // Graceful fallback to web export
    try {
      await webFallback();
    } catch (fallbackError) {
      console.error('Web fallback also failed:', fallbackError);
      throw new Error('Both native and web export methods failed');
    }
  }
}

/**
 * Check if specific Capacitor plugins are available
 */
export function getAvailablePlugins(): {
  filesystem: boolean;
  share: boolean;
  isNative: boolean;
} {
  if (!isNativeCapacitor()) {
    return { filesystem: false, share: false, isNative: false };
  }
  
  const capacitor = window.Capacitor;
  const plugins = capacitor?.Plugins;
  
  return {
    filesystem: Boolean(plugins?.Filesystem),
    share: Boolean(plugins?.Share),
    isNative: true
  };
}

/**
 * Clear all caches (useful for testing or memory management)
 */
export function clearNativeCaches(): void {
  platformCache = {};
  xlsxModuleCache = null;
}

/**
 * Get cached platform info for debugging
 */
export function getPlatformInfo(): {
  isNative: boolean;
  platform: string;
  cached: boolean;
  plugins: ReturnType<typeof getAvailablePlugins>;
} {
  const now = Date.now();
  const isCached = Boolean(
    platformCache.timestamp && 
    (now - platformCache.timestamp) < CACHE_DURATION
  );
  
  return {
    isNative: isNativeCapacitor(),
    platform: getPlatform(),
    cached: isCached,
    plugins: getAvailablePlugins()
  };
}
