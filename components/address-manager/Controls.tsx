'use client';

import { Upload, Download, Search, Filter, TrendingUp, Building2, FileSpreadsheet } from 'lucide-react';
import React, { memo, useCallback, useRef, useMemo, ChangeEvent } from 'react';

// Fokus auf die wichtigsten Filter
type FilterOption = 'all' | 'kein_vertrag' | 'mit_vertrag' | 'has_notes';
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

// Memoized Header component
const AppHeader = memo(({ isNative }: { isNative: boolean }) => {
  const iconElement = useMemo(() => 
    <Building2 className="w-6 h-6" />, 
    []
  );

  return (
    <div className="flex items-center gap-3">
      <div className="w-12 h-12 bg-gradient-to-br from-blue-600 via-purple-600 to-cyan-600 rounded-2xl flex items-center justify-center text-white">
        {iconElement}
      </div>
      <div>
        <h1 className="text-3xl font-black">
          Adress <span className="text-blue-700">Manager</span>
        </h1>
        <p className="text-gray-600">Verkaufsadressen nach PLZ verwalten</p>
      </div>
    </div>
  );
});

// Memoized Action Buttons component
const ActionButtons = memo(({ 
  isImporting, 
  allowExport, 
  isNative, 
  onImportClick, 
  onExport 
}: {
  isImporting: boolean;
  allowExport: boolean;
  isNative: boolean;
  onImportClick: () => void;
  onExport: () => void;
}) => {
  const importButtonText = useMemo(() => 
    isImporting ? 'Wird geladen...' : 'Excel/CSV hochladen',
    [isImporting]
  );

  const exportButtonText = useMemo(() => 
    'CSV exportieren',
    []
  );

  return (
    <div className="flex flex-wrap gap-3">
      <button
        onClick={onImportClick}
        disabled={isImporting}
        className="bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-2xl font-bold shadow-md disabled:opacity-60 transition-all duration-200 hover:shadow-lg disabled:cursor-not-allowed"
        type="button"
        aria-label={importButtonText}
      >
        <span className="inline-flex items-center gap-2">
          <FileSpreadsheet className="w-5 h-5" /> {importButtonText}
        </span>
      </button>

      {allowExport && (
        <button
          onClick={onExport}
          className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-3 rounded-2xl font-bold shadow-md transition-all duration-200 hover:shadow-lg"
          type="button"
          aria-label={exportButtonText}
        >
          <span className="inline-flex items-center gap-2">
            <Download className="w-5 h-5" /> {exportButtonText}
          </span>
        </button>
      )}
    </div>
  );
});

// Memoized Search Input component
const SearchInput = memo(({ 
  searchTerm, 
  onSearchChange 
}: {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}) => {
  const handleInputChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    onSearchChange(e.target.value);
  }, [onSearchChange]);

  return (
    <div className="relative md:col-span-2">
      <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
      <input
        type="text"
        placeholder="Suche: PLZ, Adresse, Region, Baufirma..."
        value={searchTerm}
        onChange={handleInputChange}
        className="w-full pl-12 pr-4 py-4 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500 bg-white/80 transition-all duration-200 focus:border-blue-300"
        autoComplete="off"
        spellCheck="false"
      />
    </div>
  );
});

// Memoized Filter Select component - fokussiert auf wichtigste Filter
const FilterSelect = memo(({ 
  filterBy, 
  onFilterChange 
}: {
  filterBy: FilterOption;
  onFilterChange: (value: FilterOption) => void;
}) => {
  // Wichtigste Filter basierend auf Spalte I
  const filterOptions = useMemo(() => [
    { value: 'all' as const, label: 'Alle Adressen' },
    { value: 'kein_vertrag' as const, label: '🎯 Kein Vertrag (Spalte I = 0)' },
    { value: 'mit_vertrag' as const, label: '✅ Mit Vertrag (Spalte I = 1)' },
    { value: 'has_notes' as const, label: '📝 Mit Notizen' }
  ], []);

  const handleSelectChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    onFilterChange(e.target.value as FilterOption);
  }, [onFilterChange]);

  return (
    <div className="relative">
      <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
      <select
        value={filterBy}
        onChange={handleSelectChange}
        className="w-full pl-12 pr-4 py-4 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500 bg-white/80 transition-all duration-200 focus:border-blue-300 cursor-pointer"
        aria-label="Adressen filtern"
      >
        {filterOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
});

// Memoized Sort Select component - PLZ als wichtigste Sortierung
const SortSelect = memo(({ 
  sortBy, 
  onSortChange 
}: {
  sortBy: SortOption;
  onSortChange: (value: SortOption) => void;
}) => {
  // PLZ als wichtigste Sortierung
  const sortOptions = useMemo(() => [
    { value: 'PLZ' as const, label: '📍 Nach PLZ (wichtigste)' },
    { value: 'Region' as const, label: 'Nach Region' },
    { value: 'Adresse' as const, label: 'Nach Adresse' },
    { value: 'Anzahl der Homes' as const, label: 'Nach Anzahl der Homes' },
    { value: 'Preis Standardprodukt (€)' as const, label: 'Nach Preis' }
  ], []);

  const handleSelectChange = useCallback((e: ChangeEvent<HTMLSelectElement>) => {
    onSortChange(e.target.value as SortOption);
  }, [onSortChange]);

  return (
    <div className="relative">
      <TrendingUp className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5 pointer-events-none" />
      <select
        value={sortBy}
        onChange={handleSelectChange}
        className="w-full pl-12 pr-4 py-4 border border-gray-200/50 rounded-2xl focus:ring-2 focus:ring-blue-500 bg-white/80 transition-all duration-200 focus:border-blue-300 cursor-pointer"
        aria-label="Adressen sortieren"
      >
        {sortOptions.map(option => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
});

// Memoized File Input component
const FileInput = memo(({ 
  onFilesSelected,
  inputRef 
}: {
  onFilesSelected: (files: File[]) => void;
  inputRef: React.RefObject<HTMLInputElement>;
}) => {
  const handleFileChange = useCallback((e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      onFilesSelected(files);
    }
    // Reset the input value to allow selecting the same file again
    e.currentTarget.value = '';
  }, [onFilesSelected]);

  return (
    <input
      ref={inputRef}
      type="file"
      accept=".xlsx,.xls,.csv"
      multiple
      className="hidden"
      onChange={handleFileChange}
      aria-label="Excel- oder CSV-Dateien auswählen"
    />
  );
});

// Main Controls component
export default function Controls(props: ControlsProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Memoize the file picker handler
  const handleImportClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  // Memoize the search change handler
  const handleSearchChange = useCallback((value: string) => {
    props.setSearchTerm(value);
  }, [props.setSearchTerm]);

  // Memoize the filter change handler
  const handleFilterChange = useCallback((value: FilterOption) => {
    props.setFilterBy(value);
  }, [props.setFilterBy]);

  // Memoize the sort change handler
  const handleSortChange = useCallback((value: SortOption) => {
    props.setSortBy(value);
  }, [props.setSortBy]);

  // Memoize the file selection handler
  const handleFilesSelected = useCallback((files: File[]) => {
    props.onExcelChosen(files);
  }, [props.onExcelChosen]);

  return (
    <div className="mb-8 bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 p-8">
      {/* Header and Action Buttons */}
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <AppHeader isNative={props.isNative} />
        
        <ActionButtons
          isImporting={props.isImporting}
          allowExport={props.allowExport}
          isNative={props.isNative}
          onImportClick={handleImportClick}
          onExport={props.onExport}
        />
      </div>

      {/* Hidden File Input */}
      <FileInput 
        onFilesSelected={handleFilesSelected}
        inputRef={fileInputRef}
      />

      {/* Search and Filter Controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
        <SearchInput 
          searchTerm={props.searchTerm}
          onSearchChange={handleSearchChange}
        />
        
        <FilterSelect 
          filterBy={props.filterBy}
          onFilterChange={handleFilterChange}
        />
        
        <SortSelect 
          sortBy={props.sortBy}
          onSortChange={handleSortChange}
        />
      </div>
    </div>
  );
}
