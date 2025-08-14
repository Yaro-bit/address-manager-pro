'use client';

import React, { useCallback, useEffect, useMemo, useState, memo } from 'react';
import { Address } from '@/lib/types';
import { importExcelFiles, exportCSVWeb } from '@/lib/excel';
import { isNativeCapacitor, saveDataToCSVNativeOrWeb } from '@/lib/native';
import Controls from './Controls';
import RegionList from './RegionList';
import EmptyState from './EmptyState';
import { BarChart3, Check, X } from 'lucide-react';

type ImportStats =
  | { totalProcessed: number; imported: number; duplicatesSkipped: number; files: number; message?: string; error?: undefined }
  | { totalProcessed: number; imported: number; duplicatesSkipped: number; files: number; error: string; message?: undefined };

// Memoized components for better performance - German labels
const KPI = memo(({ label, value }: { label: string; value: number }) => (
  <div className="text-center p-6 bg-white/70 rounded-2xl border border-gray-200/50 shadow-sm">
    <div className="text-4xl font-black">{value.toLocaleString('de-DE')}</div>
    <div className="text-sm font-bold text-gray-700">{label}</div>
  </div>
));

const Stat = memo(({ label, value, highlight }: { label: string; value: number; highlight?: 'green'|'amber' }) => {
  const color = useMemo(() => 
    highlight === 'green' ? 'text-emerald-600' :
    highlight === 'amber' ? 'text-amber-600' : 'text-gray-900',
    [highlight]
  );
  
  return (
    <div className="text-center p-4 bg-white/60 rounded-2xl">
      <div className={`text-3xl font-black ${color} mb-1`}>{value.toLocaleString('de-DE')}</div>
      <div className="text-sm font-medium text-gray-600">{label}</div>
    </div>
  );
});

// Filter-Funktion mit Excel-Spaltennamen
const createAddressFilter = (searchTerm: string, filterBy: string) => {
  const searchLower = searchTerm.toLowerCase();
  
  return (address: Address) => {
    // Erweiterte Suche über alle relevanten Excel-Felder
    if (searchTerm) {
      const matchesSearch = 
        address.address.toLowerCase().includes(searchLower) ||
        address.region.toLowerCase().includes(searchLower) ||
        address.notes.toLowerCase().includes(searchLower) ||
        (address.ano || '').toLowerCase().includes(searchLower) ||
        (address.status || '').toLowerCase().includes(searchLower) ||
        (address.buildingCompany || '').toLowerCase().includes(searchLower) ||
        (address.kgNumber || '').toLowerCase().includes(searchLower) ||
        (address.provisionCategory || '').toLowerCase().includes(searchLower) ||
        (address.addressCode || '').toLowerCase().includes(searchLower);
      
      if (!matchesSearch) return false;
    }

    // Filter basierend auf Excel-Spalten
    switch (filterBy) {
      case 'has_contract': 
        return address.contractStatus > 0;
      case 'no_contract': 
        return address.contractStatus === 0;
      case 'fertigstellung_erfolgt': 
        return address.completionDone === true;
      case 'has_notes': 
        return !!address.notes;
      case 'high_value': 
        return address.price > 50;
      case 'large_projects': 
        return address.homes > 10;
      case 'outdoor_fee': 
        return !!(address.outdoorFee && address.outdoorFee.trim());
      case 'provision_category': 
        return !!(address.provisionCategory && address.provisionCategory.trim());
      default: 
        return true;
    }
  };
};

// Sort-Funktion mit exakten Excel-Spaltennamen
const createAddressSorter = (sortBy: string) => {
  switch (sortBy) {
    case 'Region': 
      return (a: Address, b: Address) => a.region.localeCompare(b.region) || a.address.localeCompare(b.address);
    case 'Adresse': 
      return (a: Address, b: Address) => a.address.localeCompare(b.address);
    case 'Anzahl der Homes': 
      return (a: Address, b: Address) => b.homes - a.homes;
    case 'Preis Standardprodukt (€)': 
      return (a: Address, b: Address) => b.price - a.price;
    case 'Vertrag auf Adresse vorhanden oder L1-Angebot gesendet': 
      return (a: Address, b: Address) => b.contractStatus - a.contractStatus;
    case 'ANO': 
      return (a: Address, b: Address) => (a.ano || '').localeCompare(b.ano || '');
    case 'Status': 
      return (a: Address, b: Address) => (a.status || '').localeCompare(b.status || '');
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
  const [filterBy, setFilterBy] = useState<'all'|'has_contract'|'no_contract'|'fertigstellung_erfolgt'|'has_notes'|'high_value'|'large_projects'|'outdoor_fee'|'provision_category'>('all');
  const [sortBy, setSortBy] = useState<'Region'|'Adresse'|'Anzahl der Homes'|'Preis Standardprodukt (€)'|'Vertrag auf Adresse vorhanden oder L1-Angebot gesendet'|'ANO'|'Status'>('Region');
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());
  const [isNative, setIsNative] = useState(false);

  useEffect(() => {
    setIsNative(isNativeCapacitor());
  }, []);

  // Memoize filter and sort functions
  const filterFn = useMemo(() => createAddressFilter(searchTerm, filterBy), [searchTerm, filterBy]);
  const sortFn = useMemo(() => createAddressSorter(sortBy), [sortBy]);

  // Optimized groupedAddresses with better memoization
  const groupedAddresses = useMemo(() => {
    // Use filter and sort functions
    const filtered = addresses.filter(filterFn);
    filtered.sort(sortFn);

    // Group efficiently
    const grouped: Record<string, Address[]> = {};
    for (const address of filtered) {
      if (!grouped[address.region]) {
        grouped[address.region] = [];
      }
      grouped[address.region].push(address);
    }
    return grouped;
  }, [addresses, filterFn, sortFn]);

  // Erweiterte Statistiken mit Excel-Feldern
  const statistics = useMemo(() => {
    const totalHomes = addresses.reduce((sum, address) => sum + address.homes, 0);
    const withContract = addresses.filter(address => address.contractStatus > 0).length;
    const withNotes = addresses.filter(address => !!address.notes).length;
    const completionDone = addresses.filter(address => address.completionDone === true).length;
    const withOutdoorFee = addresses.filter(address => !!(address.outdoorFee && address.outdoorFee.trim())).length;
    const withProvisionCategory = addresses.filter(address => !!(address.provisionCategory && address.provisionCategory.trim())).length;
    const highValue = addresses.filter(address => address.price > 50).length;
    const largeProjects = addresses.filter(address => address.homes > 10).length;
    const totalValue = addresses.reduce((sum, address) => sum + address.price, 0);
    
    const completePct = addresses.length === 0 ? 0 : Math.round(
      (addresses.filter(address => address.notes && address.contractStatus > 0).length / addresses.length) * 100
    );
    
    return {
      totalHomes,
      withContract,
      withNotes,
      completionDone,
      withOutdoorFee,
      withProvisionCategory,
      highValue,
      largeProjects,
      totalValue,
      completePct,
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

      {/* Import Status - Deutsche Texte */}
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

      {/* Import Results - Deutsche Texte */}
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

          {/* Stats Dashboard - Mit Excel-Feldern */}
          <div className="mt-8 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8">
            <h3 className="text-2xl font-black flex items-center gap-2">
              <BarChart3 /> Portfolio Übersicht
            </h3>
            
            {/* Haupt-KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 my-6">
              <KPI label="Adressen gesamt" value={statistics.totalAddresses} />
              <KPI label="Regionen" value={statistics.totalRegions} />
              <KPI label="Anzahl der Homes" value={statistics.totalHomes} />
              <KPI label="Vertrag vorhanden" value={statistics.withContract} />
            </div>

            {/* Excel-basierte Statistiken */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Stat label="Fertigstellung erfolgt" value={statistics.completionDone} highlight="green" />
              <Stat label="Outdoor-Pauschale" value={statistics.withOutdoorFee} />
              <Stat label="Provisions-Kategorie" value={statistics.withProvisionCategory} />
              <Stat label="Mit Notizen" value={statistics.withNotes} highlight="green" />
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              <Stat label="Preis >50€" value={statistics.highValue} highlight="amber" />
              <Stat label="Homes >10" value={statistics.largeProjects} />
              <Stat label="Gesamtwert (€)" value={Math.round(statistics.totalValue)} />
            </div>

            {/* Fortschrittsbalken */}
            <div>
              <div className="flex items-center justify-between mb-2 font-bold">
                <span>Bearbeitungsfortschritt</span>
                <span>{statistics.completePct}%</span>
              </div>
              <div className="w-full h-6 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-6 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 transition-all duration-500 ease-out" 
                  style={{ width: `${statistics.completePct}%` }} 
                />
              </div>
              <p className="text-sm text-gray-600 mt-2">
                Adressen mit Notizen und Vertrag gelten als vollständig bearbeitet.
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
