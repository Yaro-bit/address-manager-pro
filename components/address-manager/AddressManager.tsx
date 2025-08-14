'use client';

import React, { useCallback, useEffect, useMemo, useState, memo } from 'react';
import { Address } from '@/lib/types';
import { importExcelFiles, exportCSVWeb } from '@/lib/excel';
import { isNativeCapacitor, saveDataToCSVNativeOrWeb } from '@/lib/native';
import Controls from './Controls';
import RegionList from './RegionList';
import EmptyState from './EmptyState';
import { BarChart3, Check, X, Target, MapPin } from 'lucide-react';

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

const Stat = memo(({ label, value, highlight }: { label: string; value: number; highlight?: 'green'|'amber'|'red' }) => {
  const color = useMemo(() => 
    highlight === 'green' ? 'text-emerald-600' :
    highlight === 'amber' ? 'text-amber-600' : 
    highlight === 'red' ? 'text-red-600' : 'text-gray-900',
    [highlight]
  );
  
  return (
    <div className="text-center p-4 bg-white/60 rounded-2xl">
      <div className={`text-3xl font-black ${color} mb-1`}>{value.toLocaleString('de-DE')}</div>
      <div className="text-sm font-medium text-gray-600">{label}</div>
    </div>
  );
});

// PLZ aus Adresse extrahieren
function extractPLZ(address: string): string {
  const plzMatch = address.match(/,\s*(\d{4}),/);
  return plzMatch ? plzMatch[1] : 'Unbekannt';
}

// Optimierte Filter-Funktion fokussiert auf Spalte I
const createAddressFilter = (searchTerm: string, filterBy: string) => {
  const searchLower = searchTerm.toLowerCase();
  
  return (address: Address) => {
    // Erweiterte Suche inkl. PLZ
    if (searchTerm) {
      const plz = extractPLZ(address.address);
      const matchesSearch = 
        address.address.toLowerCase().includes(searchLower) ||
        address.region.toLowerCase().includes(searchLower) ||
        address.notes.toLowerCase().includes(searchLower) ||
        (address.buildingCompany || '').toLowerCase().includes(searchLower) ||
        plz.includes(searchTerm);
      
      if (!matchesSearch) return false;
    }

    // Fokus auf Spalte I (wichtigster Filter)
    switch (filterBy) {
      case 'kein_vertrag': 
        return address.contractStatus === 0;
      case 'mit_vertrag': 
        return address.contractStatus > 0;
      case 'has_notes': 
        return !!address.notes;
      default: 
        return true;
    }
  };
};

// Sortierung mit PLZ als wichtigste Option
const createAddressSorter = (sortBy: string) => {
  switch (sortBy) {
    case 'PLZ': 
      return (a: Address, b: Address) => {
        const plzA = extractPLZ(a.address);
        const plzB = extractPLZ(b.address);
        return plzA.localeCompare(plzB) || a.address.localeCompare(b.address);
      };
    case 'Region': 
      return (a: Address, b: Address) => a.region.localeCompare(b.region) || a.address.localeCompare(b.address);
    case 'Adresse': 
      return (a: Address, b: Address) => a.address.localeCompare(b.address);
    case 'Anzahl der Homes': 
      return (a: Address, b: Address) => b.homes - a.homes;
    case 'Preis Standardprodukt (€)': 
      return (a: Address, b: Address) => b.price - a.price;
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
  const [filterBy, setFilterBy] = useState<'all'|'kein_vertrag'|'mit_vertrag'|'has_notes'>('all');
  const [sortBy, setSortBy] = useState<'PLZ'|'Region'|'Adresse'|'Anzahl der Homes'|'Preis Standardprodukt (€)'>('PLZ');
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(isNativeCapacitor());
  }, []);

  // Memoize filter and sort functions
  const filterFn = useMemo(() => createAddressFilter(searchTerm, filterBy), [searchTerm, filterBy]);
  const sortFn = useMemo(() => createAddressSorter(sortBy), [sortBy]);

  // PLZ-basierte Gruppierung als wichtigste Option
  const groupedAddresses = useMemo(() => {
    const filtered = addresses.filter(filterFn);
    filtered.sort(sortFn);

    const grouped: Record<string, Address[]> = {};
    
    // Gruppierung je nach Sortierung
    if (sortBy === 'PLZ') {
      // Nach PLZ gruppieren
      for (const address of filtered) {
        const plz = extractPLZ(address.address);
        const key = `PLZ ${plz}`;
        if (!grouped[key]) {
          grouped[key] = [];
        }
        grouped[key].push(address);
      }
    } else {
      // Nach Region gruppieren (wie bisher)
      for (const address of filtered) {
        if (!grouped[address.region]) {
          grouped[address.region] = [];
        }
        grouped[address.region].push(address);
      }
    }
    
    return grouped;
  }, [addresses, filterFn, sortFn, sortBy]);

  // Fokussierte Statistiken für Spalte I
  const statistics = useMemo(() => {
    const totalHomes = addresses.reduce((sum, address) => sum + address.homes, 0);
    const keinVertrag = addresses.filter(address => address.contractStatus === 0).length;
    const mitVertrag = addresses.filter(address => address.contractStatus > 0).length;
    const withNotes = addresses.filter(address => !!address.notes).length;
    const totalValue = addresses.reduce((sum, address) => sum + address.price, 0);
    
    // PLZ-Statistiken
    const plzMap = new Map();
    addresses.forEach(address => {
      const plz = extractPLZ(address.address);
      plzMap.set(plz, (plzMap.get(plz) || 0) + 1);
    });
    const uniquePLZ = plzMap.size;
    
    // Potenzial berechnen (Adressen ohne Vertrag)
    const potenzialPct = addresses.length === 0 ? 0 : Math.round((keinVertrag / addresses.length) * 100);
    
    return {
      totalHomes,
      keinVertrag,
      mitVertrag,
      withNotes,
      totalValue,
      potenzialPct,
      uniquePLZ,
      totalAddresses: addresses.length,
      totalRegions: Object.keys(groupedAddresses).length
    };
  }, [addresses, groupedAddresses]);

  // Optimized toggle function with useCallback
  const toggleRegion = useCallback((region: string) => {
    setExpandedRegions(prev => {
      const next = new Set(prev);
      if (next.has(region)) {
        next.delete(region);
      } else {
        next.add(region);
      }
      return next;
    });
  }, []);

  // Optimized update function with useCallback
  const updateAddress = useCallback((id: number, patch: Partial<Address>) => {
    setAddresses(prev => prev.map(address => 
      address.id === id ? { ...address, ...patch } : address
    ));
  }, []);

  // Debounced import progress update
  const updateImportProgress = useCallback((progress: number) => {
    setImportProgress(Math.min(progress, 100));
  }, []);

  const onExcelChosen = useCallback(async (files: File[]) => {
    setIsImporting(true);
    setImportProgress(0);
    
    try {
      const { newAddresses, totalProcessed, duplicatesSkipped } = await importExcelFiles(files, addresses);

      // Optimized progress simulation with requestAnimationFrame
      if (newAddresses.length > 0) {
        const step = Math.max(1, Math.round(newAddresses.length / 10));
        for (let i = 0; i < newAddresses.length; i += step) {
          const progress = Math.round(((i + step) / newAddresses.length) * 100);
          updateImportProgress(progress);
          await new Promise(resolve => requestAnimationFrame(() => setTimeout(resolve, 10)));
        }
      }

      setAddresses(prev => [...prev, ...newAddresses]);
      setImportStats({
        totalProcessed,
        imported: newAddresses.length,
        duplicatesSkipped,
        files: files.length,
        message: 'Daten erfolgreich geladen!',
      });
    } catch (error: any) {
      setImportStats({
        totalProcessed: 0,
        imported: 0,
        duplicatesSkipped: 0,
        files: files.length,
        error: 'Import fehlgeschlagen: ' + (error?.message || String(error)),
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  }, [addresses, updateImportProgress]);

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
        <div className={`my-8 rounded-3xl p-6 border ${importStats.error ? 'bg-red-50/80 border-red-200' : 'bg-emerald-50/80 border-emerald-200'}`}>
          <div className={`flex items-center gap-3 font-bold text-lg ${importStats.error ? 'text-red-800' : 'text-emerald-800'}`}>
            {importStats.error ? <X /> : <Check />}
            {importStats.error ? 'Import fehlgeschlagen' : (importStats.message || 'Import erfolgreich')}
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
          <RegionList
            grouped={groupedAddresses}
            expanded={expandedRegions}
            onToggle={toggleRegion}
            onUpdate={updateAddress}
          />

          {/* Stats Dashboard - Fokus auf Spalte I und PLZ */}
          <div className="mt-8 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8">
            <h3 className="text-2xl font-black flex items-center gap-2 mb-6">
              <BarChart3 /> Verkaufs-Übersicht
            </h3>
            
            {/* Wichtigste KPIs - Spalte I fokussiert */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
              <KPI label="🎯 Kein Vertrag" value={statistics.keinVertrag} icon={<Target className="w-6 h-6 text-red-500" />} />
              <KPI label="✅ Mit Vertrag" value={statistics.mitVertrag} icon={<Check className="w-6 h-6 text-green-500" />} />
              <KPI label="📍 PLZ Bereiche" value={statistics.uniquePLZ} icon={<MapPin className="w-6 h-6 text-blue-500" />} />
              <KPI label="🏠 Homes gesamt" value={statistics.totalHomes} />
            </div>

            {/* Potenzial-Anzeige */}
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

            {/* Zusätzliche Statistiken */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat label="Adressen gesamt" value={statistics.totalAddresses} />
              <Stat label="Mit Notizen" value={statistics.withNotes} highlight="green" />
              <Stat label="Gruppierungen" value={statistics.totalRegions} />
              <Stat label="Gesamtwert (€)" value={Math.round(statistics.totalValue)} />
            </div>

            {/* Hinweis zur PLZ-Sortierung */}
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
