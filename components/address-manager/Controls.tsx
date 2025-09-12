'use client';

import { Download, Search, Filter, TrendingUp, Building2, FileSpreadsheet } from 'lucide-react';
import React, { memo, useCallback, useRef, useMemo, ChangeEvent } from 'react';

// Enhanced filter options with customer tracking
type FilterOption = 'all' | 'kein_vertrag' | 'mit_vertrag' | 'has_notes' | 'customer_met' | 'appointment_set' | 'contract_signed';
type SortOption = 'PLZ' | 'Region' | 'Adresse' | 'Anzahl der Homes' | 'Preis Standardprodukt (€)';

interface ControlsProps {
  isImporting: boolean;
  onExcelChosen: (files: File[]) => void;
  allowExport: boolean;
  onExport: () => void;
  isNative: boolean;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  filterBy: FilterOption;
  setFilterBy: (v: FilterOption) => void;
  sortBy: SortOption;
  setSortBy: (v: SortOption) => void;
}

/* ----------------------------- Subcomponents ----------------------------- */

// Enhanced App Header with better responsive design
const AppHeader = memo(({ isNative }: { isNative: boolean }) => {
  return (
    <div className="flex items-center gap-3">
      <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-600 rounded-2xl flex items-center justify-center text-white flex-shrink-0">
        <Building2 className="w-5 h-5 md:w-6 md:h-6" aria-hidden="true" />
      </div>
      <div className="min-w-0">
        <h1 className="text-2xl md:text-3xl font-black text-gray-900 truncate">
          Address <span className="text-blue-700">Manager</span>
        </h1>
        <p className="text-sm md:text-base text-gray-600 hidden sm:block">
          Verkaufsadressen mit Customer Tracking verwalten
        </p>
      </div>
    </div>
  );
});

// Enhanced Action Buttons with better mobile layout
const ActionButtons = memo(({
  isImporting,
  allowExport,
  isNative: _isNative,
  onImportClick,
  onExport,
}: {
  isImporting: boolean;
  allowExport: boolean;
  isNative: boolean;
  onImportClick: () => void;
  onExport: () => void;
}) => {
  const importButtonText = useMemo(
    () => (isImporting ? 'Wird geladen...' : 'Excel/CSV hochladen'),
    [isImporting]
  );

  return (
    <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
      <button
        onClick={onImportClick}
        disabled={isImporting}
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-4 md:px-6 py-3 rounded-2xl font-bold shadow-md disabled:opacity-60 transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed min-h-[44px] w-full sm:w-auto flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        type="button"
        aria-label={importButtonText}
        aria-disabled={isImporting}
      >
        <FileSpreadsheet className="w-5 h-5" aria-hidden="true" />
        <span className="text-sm md:text-base">{importButtonText}</span>
      </button>

      {allowExport && (
        <button
          onClick={onExport}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 md:px-6 py-3 rounded-2xl font-bold shadow-md transition-all duration-200 hover:shadow-lg min-h-[44px] w-full sm:w-auto flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          type="button"
          aria-label="CSV exportieren"
        >
          <Download className="w-5 h-5" aria-hidden="true" />
          <span className="text-sm md:text-base">CSV exportieren</span>
        </button>
      )}
    </div>
  );
});

// Enhanced Search Input with better accessibility
const SearchInput = memo(({
  searchTerm,
  onSearchChange,
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}) => {
  const handleInputChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      onSearchChange(e.target.value);
    },
    [onSearchChange]
  );

  return (
    <div className="relative col-span-full lg:col-span-2">
      <label htmlFor="search-input" className="sr-only">
        Suche nach PLZ, Adresse, Region oder Baufirma
      </label>
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" aria-hidden="true" />
      <input
        id="search-input"
        type="text"
        placeholder="Suche: PLZ, Adresse, Region, Baufirma..."
        value={searchTerm}
        onChange={handleInputChange}
        className="w-full pl-12 pr-4 py-3 md:py-4 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white/80 transition-all duration-200 focus:border-blue-300 text-sm md:text-base min-h-[44px]"
        autoComplete="off"
        spellCheck="false"
        role="searchbox"
        aria-describedby="search-help"
      />
      <div id="search-help" className="sr-only">
        Durchsuchen Sie Adressen nach Postleitzahl, Adresstext, Region oder Baufirma
      </div>
    </div>
  );
});

// Enhanced Filter options with customer tracking
const FILTER_OPTIONS: ReadonlyArray<{ value: FilterOption; label: string; description: string }> = [
  { value: 'all', label: 'Alle Adressen', description: 'Alle Adressen anzeigen ohne Filterung' },
  { value: 'kein_vertrag', label: 'Kein Vertrag', description: 'Adressen ohne Verträge (Spalte I = 0)' },
  { value: 'mit_vertrag', label: 'Mit Vertrag', description: 'Adressen mit Verträgen (Spalte I > 0)' },
  { value: 'has_notes', label: 'Mit Notizen', description: 'Adressen die Notizen haben' },
  { value: 'customer_met', label: 'Kunde getroffen', description: 'Adressen wo Kunde bereits getroffen wurde' },
  { value: 'appointment_set', label: 'Termin gesetzt', description: 'Adressen mit gesetzten Terminen' },
  { value: 'contract_signed', label: 'Vertrag signiert', description: 'Adressen mit signierten Verträgen' },
] as const;

// Enhanced Filter Select with accessibility
const FilterSelect = memo(({
  filterBy,
  onFilterChange,
}: {
  filterBy: FilterOption;
  onFilterChange: (value: FilterOption) => void;
}) => {
  const handleSelectChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      onFilterChange(e.target.value as FilterOption);
    },
    [onFilterChange]
  );

  return (
    <div className="relative">
      <label htmlFor="filter-select" className="sr-only">
        Adressen nach Kategorie filtern
      </label>
      <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" aria-hidden="true" />
      <select
        id="filter-select"
        value={filterBy}
        onChange={handleSelectChange}
        className="w-full pl-12 pr-4 py-3 md:py-4 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white/80 transition-all duration-200 focus:border-blue-300 cursor-pointer text-sm md:text-base min-h-[44px]"
        aria-label="Adressen nach Kategorie filtern"
      >
        {FILTER_OPTIONS.map((option) => (
          <option key={option.value} value={option.value} title={option.description}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
});

// Enhanced Sort options with clearer labels
const SORT_OPTIONS: ReadonlyArray<{ value: SortOption; label: string; description: string }> = [
  { value: 'PLZ', label: 'Nach PLZ', description: 'Nach Postleitzahl gruppieren und sortieren' },
  { value: 'Region', label: 'Nach Region', description: 'Nach Regionsname gruppieren und sortieren' },
  { value: 'Adresse', label: 'Nach Adresse', description: 'Alphabetisch nach Adresse sortieren' },
  { value: 'Anzahl der Homes', label: 'Nach Homes', description: 'Nach Anzahl der Homes sortieren (höchste zuerst)' },
  { value: 'Preis Standardprodukt (€)', label: 'Nach Preis', description: 'Nach Preis sortieren (höchste zuerst)' },
] as const;

// Enhanced Sort Select with accessibility
const SortSelect = memo(({
  sortBy,
  onSortChange,
}: {
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
}) => {
  const handleSelectChange = useCallback(
    (e: ChangeEvent<HTMLSelectElement>) => {
      onSortChange(e.target.value as SortOption);
    },
    [onSortChange]
  );

  return (
    <div className="relative">
      <label htmlFor="sort-select" className="sr-only">
        Adressen nach verschiedenen Kriterien sortieren
      </label>
      <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" aria-hidden="true" />
      <select
        id="sort-select"
        value={sortBy}
        onChange={handleSelectChange}
        className="w-full pl-12 pr-4 py-3 md:py-4 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white/80 transition-all duration-200 focus:border-blue-300 cursor-pointer text-sm md:text-base min-h-[44px]"
        aria-label="Adressen nach verschiedenen Kriterien sortieren"
      >
        {SORT_OPTIONS.map((option) => (
          <option key={option.value} value={option.value} title={option.description}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
});

// Enhanced File Input with proper accessibility
const FileInput = memo(({
  onFilesSelected,
  inputRef,
}: {
  onFilesSelected: (files: File[]) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}) => {
  const handleFileChange = useCallback(
    (e: ChangeEvent<HTMLInputElement>) => {
      const files = Array.from(e.target.files || []);
      if (files.length > 0) {
        onFilesSelected(files);
      }
      // Reset the input value to allow selecting the same file again
      e.currentTarget.value = '';
    },
    [onFilesSelected]
  );

  return (
    <input
      ref={inputRef}
      type="file"
      accept=".xlsx,.xls,.csv"
      multiple
      className="hidden"
      onChange={handleFileChange}
      aria-label="Excel- oder CSV-Dateien auswählen"
      aria-describedby="file-input-help"
    />
  );
});

/* --------------------------------- Main Component ---------------------------------- */

export default function Controls(props: ControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const handleSearchChange = useCallback(
    (value: string) => {
      props.setSearchTerm(value);
    },
    [props.setSearchTerm]
  );

  const handleFilterChange = useCallback(
    (value: FilterOption) => {
      props.setFilterBy(value);
    },
    [props.setFilterBy]
  );

  const handleSortChange = useCallback(
    (value: SortOption) => {
      props.setSortBy(value);
    },
    [props.setSortBy]
  );

  const handleFilesSelected = useCallback(
    (files: File[]) => {
      props.onExcelChosen(files);
    },
    [props.onExcelChosen]
  );

  return (
    <div className="mb-6 md:mb-8 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-4 md:p-6 lg:p-8">
      {/* Header and Action Buttons */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 lg:gap-6 mb-6">
        <AppHeader isNative={props.isNative} />

        <ActionButtons
          isImporting={props.isImporting}
          allowExport={props.allowExport}
          isNative={props.isNative}
          onImportClick={handleImportClick}
          onExport={props.onExport}
        />
      </div>

      {/* Hidden File Input with accessibility */}
      <FileInput onFilesSelected={handleFilesSelected} inputRef={fileInputRef} />
      <div id="file-input-help" className="sr-only">
        Wählen Sie eine oder mehrere Excel- oder CSV-Dateien zum Importieren aus
      </div>

      {/* Search and Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <SearchInput searchTerm={props.searchTerm} onSearchChange={handleSearchChange} />

        <FilterSelect filterBy={props.filterBy} onFilterChange={handleFilterChange} />

        <SortSelect sortBy={props.sortBy} onSortChange={handleSortChange} />
        
        {/* Empty column for better spacing on desktop */}
        <div className="hidden lg:block"></div>
      </div>
  
      {/* Enhanced Help Section with Customer Tracking Info */}
      <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-200/50 space-y-3">
        {/* Icon + Title Row */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2 text-blue-800 font-medium text-sm">
            <span className="flex-shrink-0">💡</span>
            <span>Hilfe & Tipps</span>
          </div>
        </div>
      
        {/* Help Text */}
        <div className="text-blue-700 text-sm leading-relaxed space-y-3">
          <p>
            Nutze die <strong>Suche</strong>, um spezifische Adressen zu finden, und wende 
            anschließend <strong>Filter</strong> an, um nach Vertragsstatus oder Customer-Tracking-Status zu filtern.  
            Die <strong>PLZ-Ansicht</strong> gruppiert deine Daten optimal für regionale Bearbeitung.
          </p>
      
          <div>
            <p className="font-medium mb-1">So gehst du vor:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>
                <strong>CSV oder Excel importieren:</strong> Daten werden gespeichert, Duplikate automatisch entfernt.
              </li>
              <li>
                <strong>Customer Tracking:</strong> Markiere Kundenkontakte, Termine und Vertragsabschlüsse direkt bei jeder Adresse.
              </li>
              <li>
                <strong>Arbeiten:</strong> Sortiere, filtere und notiere wichtige Informationen.
              </li>
              <li>
                <strong>Exportieren:</strong> Speichere deine Änderungen und Customer-Tracking-Daten dauerhaft als CSV.
              </li>
            </ol>
          </div>

          <div className="pt-2 border-t border-blue-200/30">
            <p className="font-medium mb-1">Customer Tracking Features:</p>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <span>• Kunde angetroffen (ja/nein)</span>
              <span>• Termin gesetzt (ja/nein)</span>
              <span>• Vertragsabschluss (ja/nein)</span>
              <span>• Objekt vorhanden (ja/nein)</span>
            </div>
          </div>
        </div>

        {/* Quick Stats Preview */}
        {props.searchTerm && (
          <div className="mt-3 pt-3 border-t border-blue-200/30 text-xs text-blue-600">
            <span className="font-medium">Aktuelle Suche:</span> "{props.searchTerm}"
            {props.filterBy !== 'all' && (
              <span className="ml-2">
                | <span className="font-medium">Filter:</span> {FILTER_OPTIONS.find(opt => opt.value === props.filterBy)?.label}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}