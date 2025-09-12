'use client';

import { ChevronDown, ChevronRight, MapPin, Building, DollarSign, Edit3, Save, X, User, Calendar, FileCheck, Home, Check } from 'lucide-react';
import { Address } from '@/lib/types';
import React, { memo, useMemo, useCallback, useState, KeyboardEvent } from 'react';

/* ------------------------------- Enhanced Badges ------------------------------ */
const StatusBadge = memo(({ status }: { status?: string }) => {
  const s = status || '';
  const isActive = s.includes('100 In Betrieb') || s.includes('100');
  const displayConfig = {
    text: isActive ? 'Aktiv' : 'Ausstehend',
    icon: isActive ? '✓' : '⏳',
    className: isActive 
      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
      : 'bg-amber-100 text-amber-800 border border-amber-200'
  };
  
  return (
    <div className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 min-h-[36px] ${displayConfig.className}`}>
      <span aria-hidden="true">{displayConfig.icon}</span>
      <span className="hidden sm:inline">{displayConfig.text}</span>
    </div>
  );
});

const ContractBadge = memo(({ contractStatus }: { contractStatus: number }) => {
  const hasContract = (contractStatus ?? 0) > 0;
  const config = {
    text: hasContract ? 'Vertrag' : 'Kein Vertrag',
    icon: hasContract ? '✓' : '✗',
    className: hasContract 
      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
      : 'bg-gray-100 text-gray-700 border border-gray-200'
  };
  
  return (
    <div className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 min-h-[36px] ${config.className}`}>
      <span aria-hidden="true">{config.icon}</span>
      <span className="hidden sm:inline">{config.text}</span>
    </div>
  );
});

const HomesBadge = memo(({ homes }: { homes: number }) => {
  const value = homes ?? 0;
  const className = `w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm ${
    value > 0 ? 'bg-blue-100 text-blue-800 border border-blue-200' : 'bg-gray-100 text-gray-600 border border-gray-200'
  }`;
  return (
    <div className={className} title={`${value} Homes`}>
      {value}
    </div>
  );
});

const PriceBadge = memo(({ price }: { price: number }) => {
  const value = price ?? 0;
  return (
    <div className="text-sm font-bold bg-purple-100 text-purple-800 px-3 py-2 rounded-xl border border-purple-200 min-h-[36px] flex items-center justify-center">
      €{value.toLocaleString('de-DE')}
    </div>
  );
});

/* -------------------------------- Customer Tracking Checkboxes ------------------------------ */
const BooleanCheckbox = memo(({ 
  value, 
  onChange, 
  label, 
  icon, 
  trueColor = 'text-green-600', 
  falseColor = 'text-gray-400' 
}: {
  value?: boolean;
  onChange: (value: boolean) => void;
  label: string;
  icon: React.ReactNode;
  trueColor?: string;
  falseColor?: string;
}) => (
  <div className="flex flex-col items-center gap-1 min-w-[80px]">
    <button
      onClick={() => onChange(!value)}
      className={`p-2 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${
        value 
          ? 'bg-green-50 border-green-200 hover:bg-green-100' 
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
      }`}
      title={`${label}: ${value ? 'Ja' : 'Nein'}`}
    >
      <div className={`flex items-center justify-center ${value ? trueColor : falseColor}`}>
        {value ? <Check className="w-5 h-5" /> : <X className="w-5 h-5" />}
      </div>
    </button>
    <div className="text-xs text-center font-medium text-gray-600 leading-tight">
      {label.split(' ').map((word, i) => (
        <div key={i}>{word}</div>
      ))}
    </div>
  </div>
));

/* -------------------------------- NotesEditor ------------------------------ */
const NotesEditor = memo(({ 
  notes, 
  onUpdate, 
  addressId 
}: { 
  notes?: string; 
  onUpdate: (id: number, patch: Partial<Address>) => void;
  addressId: number;
}) => {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(notes || '');

  const handleStartEdit = useCallback(() => {
    setEditing(true);
    setDraft(notes || '');
  }, [notes]);

  const handleSave = useCallback(() => {
    onUpdate(addressId, { notes: draft });
    setEditing(false);
  }, [onUpdate, addressId, draft]);

  const handleCancel = useCallback(() => {
    setEditing(false);
    setDraft(notes || '');
  }, [notes]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && e.ctrlKey) {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  const handleDraftChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setDraft(e.target.value);
  }, []);

  if (editing) {
    return (
      <div className="flex gap-2 items-start w-full">
        <textarea
          value={draft}
          onChange={handleDraftChange}
          onKeyDown={handleKeyDown}
          className="flex-1 px-3 py-2 text-sm border border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white transition-all duration-200 resize-none"
          rows={3}
          autoFocus
          placeholder="Notiz hinzufügen..."
          aria-label="Notiz bearbeiten"
        />
        <div className="flex flex-col gap-1">
          <button
            onClick={handleSave}
            className="p-2 text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition-colors duration-200 min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Speichern (Strg+Enter)"
            type="button"
            aria-label="Notiz speichern"
          >
            <Save className="w-4 h-4" aria-hidden="true" />
          </button>
          <button
            onClick={handleCancel}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors duration-200 min-h-[36px] min-w-[36px] flex items-center justify-center"
            title="Abbrechen (Esc)"
            type="button"
            aria-label="Bearbeitung abbrechen"
          >
            <X className="w-4 h-4" aria-hidden="true" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleStartEdit}
      className="flex items-center gap-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 w-full text-left p-3 rounded-xl transition-all duration-200 min-h-[44px]"
      type="button"
      aria-label={notes ? `Notiz bearbeiten: ${notes}` : 'Notiz hinzufügen'}
    >
      <div className="flex-1 min-w-0">
        {notes ? (
          <span className="text-sm font-medium text-gray-900 break-words whitespace-pre-wrap">{notes}</span>
        ) : (
          <span className="text-sm text-gray-500 italic">Klicken für Notiz...</span>
        )}
      </div>
      <Edit3 className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
    </button>
  );
});

/* ----------------------------- Responsive Address Row ----------------------------- */
const AddressRow = memo(({ 
  addr, 
  onUpdate 
}: { 
  addr: Address; 
  onUpdate: (id: number, patch: Partial<Address>) => void;
}) => {
  const handleBooleanChange = useCallback((field: keyof Address, value: boolean) => {
    onUpdate(addr.id, { [field]: value });
  }, [onUpdate, addr.id]);

  return (
    <div className="p-4 md:p-6 border border-gray-100/50 hover:bg-white/40 rounded-2xl transition-colors duration-200 mb-4">
      {/* Mobile Layout (< lg) */}
      <div className="lg:hidden space-y-4">
        {/* Address Header */}
        <div>
          <div className="font-bold text-base md:text-lg mb-1 break-words">{addr.address}</div>
          <div className="text-gray-600 text-sm">
            {addr.ano && <span className="block">{addr.ano}</span>}
          </div>
          {addr.addressCode && (
            <div className="text-xs text-gray-500 mt-2 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
              ID: {addr.addressCode}
            </div>
          )}
        </div>
        
        {/* Mobile Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Homes:</span>
            <HomesBadge homes={addr.homes ?? 0} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">Preis:</span>
            <PriceBadge price={addr.price ?? 0} />
          </div>
        </div>
        
        {/* Mobile Status Badges */}
        <div className="flex flex-wrap gap-2">
          <StatusBadge status={addr.status} />
          <ContractBadge contractStatus={addr.contractStatus ?? 0} />
        </div>
        
        {/* Mobile Notes and Customer Tracking */}
        <div className="border-t border-gray-100 pt-3 space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Notizen</label>
            <NotesEditor 
              notes={addr.notes} 
              onUpdate={onUpdate} 
              addressId={addr.id} 
            />
          </div>
          
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Kundenkontakt Status</label>
            <div className="grid grid-cols-2 gap-3 p-3 bg-gray-50/50 rounded-lg">
              <BooleanCheckbox
                value={addr.customerMet}
                onChange={(value) => handleBooleanChange('customerMet', value)}
                label="Kunde angetroffen"
                icon={<User className="w-4 h-4" />}
              />
              <BooleanCheckbox
                value={addr.appointmentSet}
                onChange={(value) => handleBooleanChange('appointmentSet', value)}
                label="Termin"
                icon={<Calendar className="w-4 h-4" />}
              />
              <BooleanCheckbox
                value={addr.contractSigned}
                onChange={(value) => handleBooleanChange('contractSigned', value)}
                label="Vertragsabschluss"
                icon={<FileCheck className="w-4 h-4" />}
                trueColor="text-blue-600"
              />
              <BooleanCheckbox
                value={addr.objectAvailable}
                onChange={(value) => handleBooleanChange('objectAvailable', value)}
                label="Objekt vorhanden"
                icon={<Home className="w-4 h-4" />}
                trueColor="text-purple-600"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout (>= lg) */}
      <div className="hidden lg:block space-y-4">
        {/* Address Information */}
        <div className="grid grid-cols-12 gap-4 items-center">
          <div className="col-span-4">
            <div className="font-bold text-lg break-words">{addr.address}</div>
            <div className="text-gray-600 text-sm flex items-center gap-3 mt-1">
              <span>{addr.ano ?? ''}</span>
            </div>
            {addr.addressCode && (
              <div className="text-xs text-gray-500 mt-2 font-mono bg-gray-100 px-2 py-1 rounded inline-block">
                ID: {addr.addressCode}
              </div>
            )}
          </div>

          {/* Homes Count */}
          <div className="col-span-1 flex justify-center">
            <HomesBadge homes={addr.homes ?? 0} />
          </div>

          {/* Status */}
          <div className="col-span-1 flex justify-center">
            <StatusBadge status={addr.status} />
          </div>

          {/* Contract Status */}
          <div className="col-span-2 flex justify-center">
            <ContractBadge contractStatus={addr.contractStatus ?? 0} />
          </div>

          {/* Price */}
          <div className="col-span-1 flex justify-center">
            <PriceBadge price={addr.price ?? 0} />
          </div>

          {/* Quick Stats */}
          <div className="col-span-3 text-right text-sm text-gray-600">
            <span>Weitere Details unten</span>
          </div>
        </div>

        {/* Notes and Customer Tracking Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4 pt-4 border-t border-gray-100">
          {/* Notes Section */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">Notizen</label>
            <NotesEditor 
              notes={addr.notes} 
              onUpdate={onUpdate} 
              addressId={addr.id} 
            />
          </div>

          {/* Customer Tracking Fields */}
          <div className="flex flex-col">
            <label className="text-sm font-medium text-gray-700 mb-2">Kundenkontakt Status</label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-gray-50/50 rounded-lg">
              <BooleanCheckbox
                value={addr.customerMet}
                onChange={(value) => handleBooleanChange('customerMet', value)}
                label="Kunde angetroffen"
                icon={<User className="w-4 h-4" />}
              />
              <BooleanCheckbox
                value={addr.appointmentSet}
                onChange={(value) => handleBooleanChange('appointmentSet', value)}
                label="Termin"
                icon={<Calendar className="w-4 h-4" />}
              />
              <BooleanCheckbox
                value={addr.contractSigned}
                onChange={(value) => handleBooleanChange('contractSigned', value)}
                label="Vertragsabschluss"
                icon={<FileCheck className="w-4 h-4" />}
                trueColor="text-blue-600"
              />
              <BooleanCheckbox
                value={addr.objectAvailable}
                onChange={(value) => handleBooleanChange('objectAvailable', value)}
                label="Objekt vorhanden"
                icon={<Home className="w-4 h-4" />}
                trueColor="text-purple-600"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

/* ----------------------------- Responsive Table Header ----------------------------- */
const TableHeader = memo(() => (
  <div className="hidden lg:grid lg:grid-cols-12 gap-4 text-sm font-bold text-gray-700 mb-6 pb-4 border-b border-gray-200/50">
    <div className="col-span-4">Adresse & Anbieter</div>
    <div className="col-span-1 text-center">Homes</div>
    <div className="col-span-1 text-center">Status</div>
    <div className="col-span-2 text-center">Vertrag</div>
    <div className="col-span-1 text-center flex items-center justify-center gap-1">
      <DollarSign className="w-4 h-4" aria-hidden="true" /> Preis
    </div>
    <div className="col-span-3 text-center">Details</div>
  </div>
));

/* --------------------------- Enhanced Region Header --------------------------- */
const RegionHeader = memo(({ 
  region, 
  rows, 
  isExpanded, 
  onToggle 
}: {
  region: string;
  rows: Address[];
  isExpanded: boolean;
  onToggle: (region: string) => void;
}) => {
  const regionStats = useMemo(() => {
    const totalHomes = rows.reduce((sum, addr) => sum + (addr.homes ?? 0), 0);
    const totalPrice = rows.reduce((sum, addr) => sum + (addr.price ?? 0), 0);
    const addressCount = rows.length;
    const avgPrice = Math.round(addressCount ? (totalPrice / addressCount) : 0);
    const withContract = rows.filter(addr => (addr.contractStatus ?? 0) > 0).length;
    const inOperation = rows.filter(addr => addr.status?.includes('100 In Betrieb')).length;

    // Customer tracking stats
    const customersMet = rows.filter(addr => addr.customerMet).length;
    const appointmentsSet = rows.filter(addr => addr.appointmentSet).length;
    const contractsSigned = rows.filter(addr => addr.contractSigned).length;
    const objectsAvailable = rows.filter(addr => addr.objectAvailable).length;

    return {
      totalHomes,
      avgPrice,
      addressCount,
      withContract,
      inOperation,
      customersMet,
      appointmentsSet,
      contractsSigned,
      objectsAvailable,
      addressText: addressCount === 1 ? 'Adresse' : 'Adressen',
    };
  }, [rows]);

  const handleToggle = useCallback(() => {
    onToggle(region);
  }, [onToggle, region]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleToggle();
    }
  }, [handleToggle]);

  return (
    <button
      onClick={handleToggle}
      onKeyDown={handleKeyDown}
      className="w-full p-4 md:p-6 lg:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between hover:bg-blue-50/30 transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-inset"
      aria-expanded={isExpanded}
      aria-controls={`region-${region}`}
      type="button"
      aria-label={`${region} - ${regionStats.addressCount} ${regionStats.addressText} ${isExpanded ? 'zuklappen' : 'aufklappen'}`}
    >
      {/* Main Content */}
      <div className="flex items-center gap-4 md:gap-6 mb-4 lg:mb-0 w-full lg:w-auto">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg flex-shrink-0" aria-hidden="true">
          {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
        </div>
        <div className="text-left flex-1 min-w-0">
          <h3 className="font-black text-lg md:text-xl lg:text-2xl break-words">{region}</h3>
          <div className="text-gray-500 mt-1 flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 text-sm">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4 flex-shrink-0" aria-hidden="true" /> 
              {regionStats.addressCount} {regionStats.addressText}
            </span>
            <span className="flex items-center gap-1">
              <Building className="w-4 h-4 flex-shrink-0" aria-hidden="true" /> 
              {regionStats.totalHomes} Homes
            </span>
            {regionStats.inOperation > 0 && (
              <span className="text-emerald-600 flex items-center gap-1">
                ✓ {regionStats.inOperation} in Betrieb
              </span>
            )}
            {regionStats.customersMet > 0 && (
              <span className="text-blue-600 flex items-center gap-1">
                <User className="w-4 h-4" /> {regionStats.customersMet} Kunden getroffen
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="flex items-center justify-between lg:justify-end gap-4 md:gap-6 w-full lg:w-auto">
        {/* Price Info */}
        <div className="text-left lg:text-right">
          <div className="text-xl md:text-2xl font-bold text-gray-900">
            €{regionStats.avgPrice.toLocaleString('de-DE')}
          </div>
          <div className="text-xs md:text-sm text-gray-500">Ø Preis</div>
        </div>
        
        {/* Customer Tracking Preview */}
        <div className="hidden md:flex items-center gap-2 text-xs">
          {regionStats.customersMet > 0 && (
            <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
              👤 {regionStats.customersMet}
            </span>
          )}
          {regionStats.contractsSigned > 0 && (
            <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
              ✓ {regionStats.contractsSigned}
            </span>
          )}
        </div>

        {/* Address Count Badge */}
        <div className="w-12 h-12 md:w-16 md:h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-sm md:text-lg lg:text-xl flex-shrink-0">
          {regionStats.addressCount}
        </div>
      </div>
    </button>
  );
});

/* ------------------------------- Main Export ------------------------------- */
export default function RegionList({
  grouped,
  expanded,
  onToggle,
  onUpdate
}: {
  grouped: Record<string, Address[]>;
  expanded: Set<string>;
  onToggle: (region: string) => void;
  onUpdate: (id: number, patch: Partial<Address>) => void;
}) {
  const groupedEntries = useMemo(() => Object.entries(grouped), [grouped]);

  return (
    <div className="bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30 overflow-hidden divide-y divide-gray-100/50">
      {groupedEntries.map(([region, rows]) => {
        const isExpanded = expanded.has(region);

        return (
          <div key={region} className="hover:bg-gray-50/20 transition-colors duration-200">
            <RegionHeader
              region={region}
              rows={rows}
              isExpanded={isExpanded}
              onToggle={onToggle}
            />

            {isExpanded && (
              <div
                className="bg-gradient-to-r from-gray-50/50 to-blue-50/20 px-4 md:px-6 lg:px-8 py-6"
                id={`region-${region}`}
                role="region"
                aria-label={`Adressen in ${region}`}
              >
                <TableHeader />
                <div className="space-y-2">
                  {rows.map((addr) => (
                    <AddressRow 
                      key={addr.id as unknown as React.Key}
                      addr={addr}
                      onUpdate={onUpdate}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}