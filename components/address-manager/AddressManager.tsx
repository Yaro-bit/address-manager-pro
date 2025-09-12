'use client';

import React, { useCallback, useEffect, useMemo, useState, memo } from 'react';
import { Address } from '@/lib/types';
import { importExcelFiles, exportCSVWeb } from '@/lib/excel';
import { isNativeCapacitor, saveDataToCSVNativeOrWeb } from '@/lib/native';
import Controls from './Controls';
import RegionList from './RegionList';
import EmptyState from './EmptyState';
import { BarChart3, Check, X, Target, MapPin } from 'lucide-react';

/** ----------------------------------------------------------------
 *  Helpers (safe string ops, comparisons, optimized PLZ detection)
 *  ---------------------------------------------------------------- */
const safe = (s?: string) => (s ?? '').toLowerCase();
const cmpStr = (a?: string, b?: string) => (a ?? '').localeCompare(b ?? '', 'de');
const cmpNumDesc = (a?: number, b?: number) => (b ?? 0) - (a ?? 0);

// Austrian postal code ranges for validation
const AUSTRIAN_PLZ_RANGES = {
  vienna: { min: 1010, max: 1230 },
  lower_austria: { min: 1000, max: 3943 },
  upper_austria: { min: 4000, max: 4992 }, // Your Adlwang examples (4541)
  salzburg: { min: 5020, max: 5671 },
  tyrol: { min: 6020, max: 6992 },
  vorarlberg: { min: 6700, max: 6992 },
  carinthia: { min: 9020, max: 9991 },
  styria: { min: 8010, max: 8990 },
  burgenland: { min: 7000, max: 7551 }
};

// Cache for PLZ validation results (memory management)
const plzValidationCache = new Map<string, boolean>();

function isValidAustrianPLZ(plz: string): boolean {
  if (plzValidationCache.has(plz)) {
    return plzValidationCache.get(plz)!;
  }
  
  const num = parseInt(plz, 10);
  if (isNaN(num) || plz.length !== 4) {
    plzValidationCache.set(plz, false);
    return false;
  }
  
  // Check against Austrian postal code ranges
  const isValid = Object.values(AUSTRIAN_PLZ_RANGES).some(
    range => num >= range.min && num <= range.max
  );
  
  plzValidationCache.set(plz, isValid);
  return isValid;
}

// Optimized PLZ detection for your address format: "Emsenhuber Straße 1, 4541, Adlwang"
function detectPLZ(text: string): string {
  if (!text) return 'Unbekannt';
  
  // Your addresses follow the pattern: "Street, PLZ, City"
  // First try to find PLZ after a comma (most reliable for your format)
  const commaMatch = text.match(/,\s*([1-9]\d{3})\s*,/);
  if (commaMatch && isValidAustrianPLZ(commaMatch[1])) {
    return commaMatch[1];
  }
  
  // Fallback: look for any 4-digit Austrian postal code
  const allMatches = text.match(/\b([1-9]\d{3})\b/g);
  if (allMatches) {
    for (const match of allMatches) {
      if (isValidAustrianPLZ(match)) {
        return match;
      }
    }
  }
  
  return 'Unbekannt';
}

// Optimized PLZ indexing for large datasets
function buildPlzIndex(addresses: Address[]): Map<number | string, string> {
  console.time('PLZ Index Build');
  const map = new Map<number | string, string>();
  
  // Process in chunks to avoid blocking the UI with large datasets like yours
  const CHUNK_SIZE = 2000;
  let processed = 0;
  
  for (let i = 0; i < addresses.length; i += CHUNK_SIZE) {
    const chunk = addresses.slice(i, i + CHUNK_SIZE);
    
    for (const address of chunk) {
      const key = (address as any).id as number | string;
      if (!map.has(key)) {
        map.set(key, detectPLZ(address.address));
      }
    }
    
    processed += chunk.length;
    
    // Log progress for large datasets
    if (processed % (CHUNK_SIZE * 10) === 0 && addresses.length > 10000) {
      console.log(`PLZ indexing: ${processed.toLocaleString()}/${addresses.length.toLocaleString()} addresses processed`);
    }
  }
  
  console.timeEnd('PLZ Index Build');
  if (addresses.length > 1000) {
    console.log(`PLZ Index complete: ${map.size.toLocaleString()} addresses indexed`);
  }
  
  return map;
}

// Clear PLZ cache when needed (memory management)
export function clearPLZCache(): void {
  plzValidationCache.clear();
}

type ImportStats =
  | { totalProcessed: number; imported: number; duplicatesSkipped: number; files: number; message?: string; error?: undefined }
  | { totalProcessed: number; imported: number; duplicatesSkipped: number; files: number; error: string; message?: undefined };

// Enhanced KPI component with variants and proper accessibility
const KPI = memo(({ 
  label, 
  value, 
  icon, 
  variant = 'default' 
}: { 
  label: string; 
  value: number; 
  icon?: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'error';
}) => {
  const variants = {
    default: 'bg-white/70 border-gray-200/50 text-gray-900',
    success: 'bg-emerald-50/70 border-emerald-200/50 text-emerald-800',
    warning: 'bg-amber-50/70 border-amber-200/50 text-amber-800',
    error: 'bg-red-50/70 border-red-200/50 text-red-800',
  };

  return (
    <div className={`text-center p-6 rounded-2xl border shadow-sm min-h-[120px] flex flex-col justify-center ${variants[variant]}`}>
      <div className="flex items-center justify-center gap-2 mb-2">
        {icon}
        <div className="text-3xl md:text-4xl font-black">{value.toLocaleString('de-DE')}</div>
      </div>
      <div className="text-sm font-bold">{label}</div>
    </div>
  );
});

const Stat = memo(({ label, value, highlight }: { label: string; value: number; highlight?: 'green' | 'amber' | 'red' }) => {
  const color =
    highlight === 'green'
      ? 'text-emerald-600'
      : highlight === 'amber'
      ? 'text-amber-600'
      : highlight === 'red'
      ? 'text-red-600'
      : 'text-gray-900';
  return (
    <div className="text-center p-4 bg-white/60 rounded-2xl">
      <div className={`text-2xl md:text-3xl font-black ${color} mb-1`}>{value.toLocaleString('de-DE')}</div>
      <div className="text-sm font-medium text-gray-600">{label}</div>
    </div>
  );
});

/** ----------------------------------------------------------------
 *  Fixed Filtering & Sorting (proper precedence and PLZ-aware)
 *  ---------------------------------------------------------------- */
const createAddressFilter = (searchTerm: string, filterBy: string, plzIndex: Map<number | string, string>) => {
  const q = (searchTerm || '').trim().toLowerCase();
  const qPlz = q.replace(/\D/g, ''); // numeric-only for PLZ intent

  return (address: Address) => {
    // First apply category filter
    let categoryMatch = true;
    
    switch (filterBy) {
      case 'kein_vertrag':
        categoryMatch = (address.contractStatus ?? 0) === 0;
        break;
      case 'mit_vertrag':
        categoryMatch = (address.contractStatus ?? 0) > 0;
        break;
      case 'has_notes':
        categoryMatch = !!(address.notes?.trim());
        break;
      case 'all':
      default:
        categoryMatch = true;
        break;
    }
    
    // If category doesn't match, exclude immediately
    if (!categoryMatch) return false;

    // Then apply search filter if present
    if (q) {
      const id = (address as any).id as number | string;
      const plz = plzIndex.get(id) || 'Unbekannt';
      
      const matchesSearch = 
        safe(address.address).includes(q) ||
        safe(address.region).includes(q) ||
        safe(address.notes).includes(q) ||
        safe(address.buildingCompany).includes(q) ||
        (qPlz && plz.includes(qPlz));
        
      return matchesSearch;
    }

    return true;
  };
};

const createAddressSorter = (sortBy: string, plzIndex: Map<number | string, string>) => {
  switch (sortBy) {
    case 'PLZ':
      return (a: Address, b: Address) => {
        const pa = plzIndex.get((a as any).id as number | string) || 'Unbekannt';
        const pb = plzIndex.get((b as any).id as number | string) || 'Unbekannt';
        return cmpStr(pa, pb) || cmpStr(a.address, b.address);
      };
    case 'Region':
      return (a: Address, b: Address) => cmpStr(a.region, b.region) || cmpStr(a.address, b.address);
    case 'Adresse':
      return (a: Address, b: Address) => cmpStr(a.address, b.address);
    case 'Anzahl der Homes':
      return (a: Address, b: Address) => cmpNumDesc(a.homes, b.homes);
    case 'Preis Standardprodukt (€)':
      return (a: Address, b: Address) => cmpNumDesc(a.price, b.price);
    default:
      return () => 0;
  }
};

export default function AddressManager() {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [importStats, setImportStats] = useState<ImportStats | null>(null);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'kein_vertrag' | 'mit_vertrag' | 'has_notes'>('all');
  const [sortBy, setSortBy] = useState<'PLZ' | 'Region' | 'Adresse' | 'Anzahl der Homes' | 'Preis Standardprodukt (€)'>('PLZ');
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(isNativeCapacitor());
  }, []);

  // Optimized PLZ index for the current list
  const plzIndex = useMemo(() => buildPlzIndex(addresses), [addresses]);

  // Memoized filter and sort using the PLZ index
  const filterFn = useMemo(() => createAddressFilter(searchTerm, filterBy, plzIndex), [searchTerm, filterBy, plzIndex]);
  const sortFn = useMemo(() => createAddressSorter(sortBy, plzIndex), [sortBy, plzIndex]);

  // Enhanced grouping with stable key order for large datasets
  const groupedAddresses = useMemo(() => {
    console.time('Address Grouping');
    
    const filtered = addresses.filter(filterFn);
    filtered.sort(sortFn);

    const grouped: Record<string, Address[]> = {};

    if (sortBy === 'PLZ') {
      for (const a of filtered) {
        const id = (a as any).id as number | string;
        const plz = plzIndex.get(id) || 'Unbekannt';
        const key = `PLZ ${plz}`;
        (grouped[key] ||= []).push(a);
      }
    } else {
      for (const a of filtered) {
        const key = a.region || 'Unbekannt';
        (grouped[key] ||= []).push(a);
      }
    }

    // Return an object with keys in sorted order to keep UI deterministic
    const sortedKeys = Object.keys(grouped).sort((a, b) => a.localeCompare(b, 'de'));
    const out: Record<string, Address[]> = {};
    for (const k of sortedKeys) out[k] = grouped[k];
    
    console.timeEnd('Address Grouping');
    return out;
  }, [addresses, filterFn, sortFn, sortBy, plzIndex]);

  // Enhanced statistics with ISP-specific metrics
  const statistics = useMemo(() => {
    console.time('Statistics Calculation');
    
    const stats = {
      totalHomes: 0,
      keinVertrag: 0,
      mitVertrag: 0,
      withNotes: 0,
      totalValue: 0,
      inOperation: 0, // "100 In Betrieb"
      completedBuilds: 0,
    };
    
    // Process in chunks for large datasets
    const CHUNK_SIZE = 5000;
    for (let i = 0; i < addresses.length; i += CHUNK_SIZE) {
      const chunk = addresses.slice(i, i + CHUNK_SIZE);
      
      for (const address of chunk) {
        stats.totalHomes += address.homes ?? 0;
        stats.totalValue += address.price ?? 0;
        
        const contractStatus = address.contractStatus ?? 0;
        if (contractStatus === 0) {
          stats.keinVertrag++;
        } else {
          stats.mitVertrag++;
        }
        
        if (address.notes?.trim()) {
          stats.withNotes++;
        }
        
        // ISP-specific stats
        if (address.status?.includes('100 In Betrieb')) {
          stats.inOperation++;
        }
        
        if (address.completionDone) {
          stats.completedBuilds++;
        }
      }
    }
    
    // Calculate derived stats
    const plzSet = new Set<string>();
    for (const address of addresses) {
      plzSet.add(plzIndex.get((address as any).id as number | string) || 'Unbekannt');
    }
    
    const potenzialPct = addresses.length ? Math.round((stats.keinVertrag / addresses.length) * 100) : 0;
    const operationalPct = addresses.length ? Math.round((stats.inOperation / addresses.length) * 100) : 0;
    
    console.timeEnd('Statistics Calculation');
    
    return {
      ...stats,
      potenzialPct,
      operationalPct,
      uniquePLZ: plzSet.size,
      totalAddresses: addresses.length,
      totalRegions: Object.keys(groupedAddresses).length,
      avgPricePerHome: stats.totalHomes ? Math.round(stats.totalValue / stats.totalHomes) : 0,
    };
  }, [addresses, groupedAddresses, plzIndex]);

  // Toggle expand/collapse for groups
  const toggleRegion = useCallback((region: string) => {
    setExpandedRegions(prev => {
      const next = new Set(prev);
      next.has(region) ? next.delete(region) : next.add(region);
      return next;
    });
  }, []);

  // Update a single address by id (keeps current id type)
  const updateAddress = useCallback((id: number, patch: Partial<Address>) => {
    setAddresses(prev => prev.map(a => ((a as any).id === id ? { ...a, ...patch } : a)));
  }, []);

  // Enhanced progress handling with better UX for large files
  const onExcelChosen = useCallback(
    async (files: File[]) => {
      setIsImporting(true);
      setImportProgress(0);
      let timer: ReturnType<typeof setInterval> | null = null;

      try {
        // Slower progress for large files to show actual processing time
        const progressIncrement = files.some(f => f.size > 10 * 1024 * 1024) ? 3 : 7; // 3% for large files, 7% for normal
        timer = setInterval(() => setImportProgress(p => Math.min(p + progressIncrement, 93)), 200);

        const { newAddresses, totalProcessed, duplicatesSkipped } = await importExcelFiles(files, addresses);

        setAddresses(prev => [...prev, ...newAddresses]);
        setImportStats({
          totalProcessed,
          imported: newAddresses.length,
          duplicatesSkipped,
          files: files.length,
          message: `Erfolgreich importiert: ${newAddresses.length.toLocaleString()} Adressen!`,
        });

        setImportProgress(100);
        
        // Clear PLZ cache if it gets too large
        if (plzValidationCache.size > 10000) {
          clearPLZCache();
        }
        
      } catch (error: any) {
        setImportStats({
          totalProcessed: 0,
          imported: 0,
          duplicatesSkipped: 0,
          files: files.length,
          error: 'Import fehlgeschlagen: ' + (error?.message || String(error)),
        });
      } finally {
        if (timer) clearInterval(timer);
        setTimeout(() => {
          setIsImporting(false);
          setImportProgress(0);
        }, 500); // Slightly longer delay to show completion
      }
    },
    [addresses]
  );

  const exportCSV = useCallback(() => {
    saveDataToCSVNativeOrWeb(addresses, () => exportCSVWeb(addresses));
  }, [addresses]);

  const hasAddresses = addresses.length > 0;
  const hasGroupedAddresses = Object.keys(groupedAddresses).length > 0;

  return (
    <div className="relative">
      <Controls
        isImporting={isImporting}
        onExcelChosen={onExcelChosen}
        allowExport={hasAddresses}
        onExport={exportCSV}
        isNative={isNative}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterBy={filterBy}
        setFilterBy={setFilterBy}
        sortBy={sortBy}
        setSortBy={setSortBy}
      />

      {/* Enhanced Import Status for Large Files */}
      {isImporting && (
        <div className="my-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8">
          <div className="mb-3 font-bold text-lg">Import läuft...</div>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-4 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 transition-all duration-300 ease-out"
              style={{ width: `${importProgress}%` }}
            />
          </div>
          <div className="mt-3 flex justify-between text-sm text-gray-600">
            <span>{importProgress}% abgeschlossen</span>
            {addresses.length > 50000 && (
              <span>Großes Dataset wird verarbeitet...</span>
            )}
          </div>
        </div>
      )}

      {/* Enhanced Import Results */}
      {importStats && (
        <div
          className={`my-8 rounded-3xl p-6 border ${
            importStats.error ? 'bg-red-50/80 border-red-200' : 'bg-emerald-50/80 border-emerald-200'
          }`}
        >
          <div
            className={`flex items-center gap-3 font-bold text-lg ${
              importStats.error ? 'text-red-800' : 'text-emerald-800'
            }`}
          >
            {importStats.error ? <X /> : <Check />}
            {importStats.error ? 'Import fehlgeschlagen' : importStats.message || 'Import erfolgreich'}
          </div>
          {!importStats.error && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <Stat label="Verarbeitet" value={importStats.totalProcessed} />
              <Stat label="Importiert" value={importStats.imported} highlight="green" />
              <Stat label="Duplikate übersprungen" value={importStats.duplicatesSkipped} highlight="amber" />
            </div>
          )}
          {importStats.error && (
            <div className="mt-4 p-4 bg-red-100 rounded-lg">
              <p className="text-red-800 text-sm">{importStats.error}</p>
            </div>
          )}
        </div>
      )}

      {/* Main content */}
      {!hasGroupedAddresses ? (
        <EmptyState isNative={isNative} />
      ) : (
        <>
          <RegionList grouped={groupedAddresses} expanded={expandedRegions} onToggle={toggleRegion} onUpdate={updateAddress} />

          {/* Enhanced Stats Dashboard with ISP-specific metrics */}
          <div className="mt-8 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-6 md:p-8">
            <h3 className="text-xl md:text-2xl font-black flex items-center gap-2 mb-6">
              <BarChart3 /> Verkaufs-Übersicht
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
              <KPI 
                label="Kein Vertrag" 
                value={statistics.keinVertrag} 
                icon={<Target className="w-5 h-5 md:w-6 md:h-6 text-red-500" />} 
                variant="error"
              />
              <KPI 
                label="Mit Vertrag" 
                value={statistics.mitVertrag} 
                icon={<Check className="w-5 h-5 md:w-6 md:h-6 text-green-500" />} 
                variant="success"
              />
              <KPI 
                label="PLZ Bereiche" 
                value={statistics.uniquePLZ} 
                icon={<MapPin className="w-5 h-5 md:w-6 md:h-6 text-blue-500" />} 
              />
              <KPI 
                label="Homes gesamt" 
                value={statistics.totalHomes} 
              />
            </div>

            {/* Enhanced Potential Section */}
            <div className="mb-8 p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-200">
              <div className="flex flex-col md:flex-row md:items-center justify-between mb-4 gap-4">
                <h4 className="text-lg md:text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Target className="w-5 h-5 text-red-500" />
                  Verkaufspotenzial
                </h4>
                <div className="text-right">
                  <span className="text-2xl md:text-3xl font-black text-red-600">{statistics.potenzialPct}%</span>
                  <div className="text-sm text-gray-600">der Adressen</div>
                </div>
              </div>
              <div className="w-full h-4 bg-white rounded-full overflow-hidden mb-3">
                <div
                  className="h-4 bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500 ease-out"
                  style={{ width: `${statistics.potenzialPct}%` }}
                />
              </div>
              <p className="text-sm text-gray-700">
                <strong>{statistics.keinVertrag.toLocaleString('de-DE')} Adressen</strong> ohne Vertrag = Verkaufschancen!
              </p>
            </div>

            {/* Enhanced Statistics Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="Adressen gesamt" value={statistics.totalAddresses} />
              <Stat label="In Betrieb" value={statistics.inOperation} highlight="green" />
              <Stat label="Mit Notizen" value={statistics.withNotes} />
              <Stat label="Gruppierungen" value={statistics.totalRegions} />
            </div>

            {/* Additional ISP-specific insights */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
              <Stat label="Ø Preis/Home (€)" value={statistics.avgPricePerHome} />
              <Stat label="Operationsrate (%)" value={statistics.operationalPct} highlight="green" />
            </div>

            {/* PLZ View Info */}
            {sortBy === 'PLZ' && (
              <div className="mt-6 p-4 bg-blue-50/80 rounded-2xl border border-blue-200">
                <p className="text-sm text-blue-800 flex items-center gap-2">
                  <MapPin className="w-4 h-4" />
                  <strong>PLZ-Ansicht aktiv:</strong> Adressen sind nach Postleitzahlen gruppiert für optimale regionale Bearbeitung.
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}