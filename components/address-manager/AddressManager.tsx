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
 *  Helpers (safe string ops, comparisons, PLZ extraction & caching)
 *  ---------------------------------------------------------------- */
const safe = (s?: string) => (s ?? '').toLowerCase();
const cmpStr = (a?: string, b?: string) => (a ?? '').localeCompare(b ?? '', 'de');
const cmpNumDesc = (a?: number, b?: number) => (b ?? 0) - (a ?? 0);

// More permissive PLZ detector: first standalone 4-digit token (AT)
function detectPLZ(text: string): string {
  if (!text) return 'Unbekannt';
  const m = text.match(/(^|\D)(\d{4})(\D|$)/);
  return m ? m[2] : 'Unbekannt';
}

// Cache PLZ per address id to avoid repeated regex work
function buildPlzIndex(addresses: Address[]): Map<number | string, string> {
  const m = new Map<number | string, string>();
  for (const a of addresses) {
    const key = (a as any).id as number | string;
    if (!m.has(key)) m.set(key, detectPLZ(a.address));
  }
  return m;
}

type ImportStats =
  | { totalProcessed: number; imported: number; duplicatesSkipped: number; files: number; message?: string; error?: undefined }
  | { totalProcessed: number; imported: number; duplicatesSkipped: number; files: number; error: string; message?: undefined };

// Memoized components for better performance
const KPI = memo(({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) => (
  <div className="text-center p-6 bg-white/70 rounded-2xl border border-gray-200/50 shadow-sm">
    <div className="flex items-center justify-center gap-2 mb-2">
      {icon}
      <div className="text-4xl font-black">{value.toLocaleString('de-DE')}</div>
    </div>
    <div className="text-sm font-bold text-gray-700">{label}</div>
  </div>
));

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
      <div className={`text-3xl font-black ${color} mb-1`}>{value.toLocaleString('de-DE')}</div>
      <div className="text-sm font-medium text-gray-600">{label}</div>
    </div>
  );
});

/** ----------------------------------------------------------------
 *  Filtering & sorting (keeps existing API; safer & PLZ-aware)
 *  ---------------------------------------------------------------- */
const createAddressFilter = (searchTerm: string, filterBy: string, plzIndex: Map<number | string, string>) => {
  const q = (searchTerm || '').trim().toLowerCase();
  const qPlz = q.replace(/\D/g, ''); // numeric-only for PLZ intent

  return (address: Address) => {
    if (q) {
      const id = (address as any).id as number | string;
      const plz = plzIndex.get(id) || 'Unbekannt';
      const matches =
        safe(address.address).includes(q) ||
        safe(address.region).includes(q) ||
        safe(address.notes).includes(q) ||
        safe(address.buildingCompany).includes(q) ||
        (!!qPlz && plz.includes(qPlz));
      if (!matches) return false;
    }

    switch (filterBy) {
      case 'kein_vertrag':
        return (address.contractStatus ?? 0) === 0;
      case 'mit_vertrag':
        return (address.contractStatus ?? 0) > 0;
      case 'has_notes':
        return !!address.notes && address.notes.trim() !== '';
      default:
        return true;
    }
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

  // Single PLZ index for the current list
  const plzIndex = useMemo(() => buildPlzIndex(addresses), [addresses]);

  // Memoized filter and sort using the PLZ index
  const filterFn = useMemo(() => createAddressFilter(searchTerm, filterBy, plzIndex), [searchTerm, filterBy, plzIndex]);
  const sortFn = useMemo(() => createAddressSorter(sortBy, plzIndex), [sortBy, plzIndex]);

  // Grouping (PLZ priority; falls back to Region) — stable key order
  const groupedAddresses = useMemo(() => {
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
    return out;
  }, [addresses, filterFn, sortFn, sortBy, plzIndex]);

  // Statistics (defensive defaults)
  const statistics = useMemo(() => {
    const totalHomes = addresses.reduce((sum, a) => sum + (a.homes ?? 0), 0);
    const keinVertrag = addresses.filter(a => (a.contractStatus ?? 0) === 0).length;
    const mitVertrag = addresses.filter(a => (a.contractStatus ?? 0) > 0).length;
    const withNotes = addresses.filter(a => !!(a.notes && a.notes.trim())).length;
    const totalValue = addresses.reduce((sum, a) => sum + (a.price ?? 0), 0);

    const plzSet = new Set<string>();
    for (const a of addresses) plzSet.add(plzIndex.get((a as any).id as number | string) || 'Unbekannt');

    const potenzialPct = addresses.length ? Math.round((keinVertrag / addresses.length) * 100) : 0;

    return {
      totalHomes,
      keinVertrag,
      mitVertrag,
      withNotes,
      totalValue,
      potenzialPct,
      uniquePLZ: plzSet.size,
      totalAddresses: addresses.length,
      totalRegions: Object.keys(groupedAddresses).length,
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

  // Progress handling: simple interval that clears reliably
  const onExcelChosen = useCallback(
    async (files: File[]) => {
      setIsImporting(true);
      setImportProgress(0);
      let timer: ReturnType<typeof setInterval> | null = null;

      try {
        timer = setInterval(() => setImportProgress(p => Math.min(p + 7, 93)), 120);

        const { newAddresses, totalProcessed, duplicatesSkipped } = await importExcelFiles(files, addresses);

        setAddresses(prev => [...prev, ...newAddresses]);
        setImportStats({
          totalProcessed,
          imported: newAddresses.length,
          duplicatesSkipped,
          files: files.length,
          message: 'Daten erfolgreich geladen!',
        });

        setImportProgress(100);
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
        }, 300);
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

      {/* Import Status */}
      {isImporting && (
        <div className="my-8 bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8">
          <div className="mb-3 font-bold">Import läuft...</div>
          <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-4 bg-gradient-to-r from-blue-600 via-purple-600 to-cyan-600 transition-all duration-300 ease-out"
              style={{ width: `${importProgress}%` }}
            />
          </div>
          <div className="mt-2 text-sm text-gray-600">{importProgress}%</div>
        </div>
      )}

      {/* Import Results */}
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

          {/* Stats Dashboard */}
          <div className="mt-8 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8">
            <h3 className="text-2xl font-black flex items-center gap-2 mb-6">
              <BarChart3 /> Verkaufs-Übersicht
            </h3>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <KPI label="🎯 Kein Vertrag" value={statistics.keinVertrag} icon={<Target className="w-6 h-6 text-red-500" />} />
              <KPI label="✅ Mit Vertrag" value={statistics.mitVertrag} icon={<Check className="w-6 h-6 text-green-500" />} />
              <KPI label="📍 PLZ Bereiche" value={statistics.uniquePLZ} icon={<MapPin className="w-6 h-6 text-blue-500" />} />
              <KPI label="🏠 Homes gesamt" value={statistics.totalHomes} />
            </div>

            <div className="mb-8 p-6 bg-gradient-to-r from-orange-50 to-red-50 rounded-2xl border border-orange-200">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                  <Target className="w-5 h-5 text-red-500" />
                  Verkaufspotenzial
                </h4>
                <span className="text-3xl font-black text-red-600">{statistics.potenzialPct}%</span>
              </div>
              <div className="w-full h-4 bg-white rounded-full overflow-hidden mb-2">
                <div
                  className="h-4 bg-gradient-to-r from-orange-500 to-red-500 transition-all duration-500 ease-out"
                  style={{ width: `${statistics.potenzialPct}%` }}
                />
              </div>
              <p className="text-sm text-gray-700">
                <strong>{statistics.keinVertrag.toLocaleString('de-DE')} Adressen</strong> ohne Vertrag = Verkaufschancen!
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="Adressen gesamt" value={statistics.totalAddresses} />
              <Stat label="Mit Notizen" value={statistics.withNotes} highlight="green" />
              <Stat label="Gruppierungen" value={statistics.totalRegions} />
              <Stat label="Gesamtwert (€)" value={Math.round(statistics.totalValue)} />
            </div>

            {sortBy === 'PLZ' && (
              <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-200">
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
