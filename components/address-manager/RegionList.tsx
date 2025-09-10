'use client';

import { ChevronDown, ChevronRight, MapPin, Building, DollarSign, Edit3, Save, X } from 'lucide-react';
import { Address } from '@/lib/types';
import React, { memo, useMemo, useCallback, useState, KeyboardEvent } from 'react';

/* ------------------------------ Region Header ------------------------------ */
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

    return {
      totalHomes,
      avgPrice,
      addressCount,
      addressText: addressCount === 1 ? 'address' : 'addresses',
    };
  }, [rows]);

  const handleToggle = useCallback(() => {
    onToggle(region);
  }, [onToggle, region]);

  return (
    <button
      onClick={handleToggle}
      className="w-full px-8 py-8 flex items-center justify-between hover:bg-blue-50/30 transition-colors duration-200"
      aria-expanded={isExpanded}
      aria-controls={`region-${region}`}
      type="button"
    >
      <div className="flex items-center gap-6">
        <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg" aria-hidden>
          {isExpanded ? <ChevronDown /> : <ChevronRight />}
        </div>
        <div className="text-left">
          <h3 className="font-black text-2xl">{region}</h3>
          <p className="text-gray-500 mt-1 flex items-center gap-4">
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" aria-hidden /> 
              {regionStats.addressCount} {regionStats.addressText}
            </span>
            <span className="flex items-center gap-1">
              <Building className="w-4 h-4" aria-hidden /> 
              {regionStats.totalHomes} homes
            </span>
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <div className="text-right">
          <div className="text-2xl font-bold">
            €{regionStats.avgPrice.toLocaleString('de-DE')}
          </div>
          <div className="text-sm text-gray-500">avg. price</div>
        </div>
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-2xl flex items-center justify-center text-white font-bold text-xl">
          {regionStats.addressCount}
        </div>
      </div>
    </button>
  );
});

/* ------------------------------- Badges/Chips ------------------------------ */
const StatusBadge = memo(({ status }: { status?: string }) => {
  const s = status || '';
  const isActive = s.includes('100 In Betrieb') || s.includes('100');
  const displayText = s.includes('100') ? 'Active' : 'Pending';
  const className = `px-4 py-2 rounded-2xl text-xs font-bold ${
    isActive ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
  }`;
  return <div className={className}>{displayText}</div>;
});

const ContractBadge = memo(({ contractStatus }: { contractStatus: number }) => {
  const hasContract = (contractStatus ?? 0) > 0;
  const className = `px-4 py-2 rounded-2xl text-xs font-bold ${
    hasContract ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700'
  }`;
  return <div className={className}>{hasContract ? 'Yes' : 'No'}</div>;
});

const HomesBadge = memo(({ homes }: { homes: number }) => {
  const value = homes ?? 0;
  const className = `w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg ${
    value > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-600'
  }`;
  return <div className={className}>{value}</div>;
});

const PriceBadge = memo(({ price }: { price: number }) => {
  const value = price ?? 0;
  return (
    <div className="text-lg font-black bg-purple-100 px-4 py-2 rounded-2xl">
      €{value.toLocaleString('de-DE')}
    </div>
  );
});

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

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    }
  }, [handleSave, handleCancel]);

  const handleDraftChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setDraft(e.target.value);
  }, []);

  if (editing) {
    return (
      <div className="flex gap-3 items-center">
        <input
          value={draft}
          onChange={handleDraftChange}
          onKeyDown={handleKeyDown}
          className="flex-1 px-4 py-3 text-sm border border-blue-300 rounded-2xl focus:ring-2 focus:ring-blue-500 bg-white transition-all duration-200"
          autoFocus
          placeholder="Add your note here..."
        />
        <button
          onClick={handleSave}
          className="p-3 text-white bg-emerald-600 rounded-2xl hover:bg-emerald-700 transition-colors duration-200"
          title="Save note"
          type="button"
        >
          <Save className="w-5 h-5" aria-hidden />
        </button>
        <button
          onClick={handleCancel}
          className="p-3 text-gray-600 hover:bg-gray-100 rounded-2xl transition-colors duration-200"
          title="Cancel"
          type="button"
        >
          <X className="w-5 h-5" aria-hidden />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleStartEdit}
      className="flex items-center gap-3 text-gray-600 hover:text-blue-600 hover:bg-blue-50/50 w-full text-left p-4 rounded-2xl transition-all duration-200"
      type="button"
    >
      <div className="flex-1">
        {notes ? (
          <span className="text-sm font-medium text-gray-900">{notes}</span>
        ) : (
          <span className="text-sm text-gray-500 italic">Click to add note...</span>
        )}
      </div>
      <Edit3 className="w-5 h-5" aria-hidden />
    </button>
  );
});

/* ------------------------------- Address Row ------------------------------- */
const AddressRow = memo(({ 
  addr, 
  onUpdate 
}: { 
  addr: Address; 
  onUpdate: (id: number, patch: Partial<Address>) => void;
}) => {
  return (
    <div className="grid grid-cols-12 gap-6 py-6 border-b border-gray-100/50 hover:bg-white/40 rounded-2xl px-4 transition-colors duration-200">
      {/* Address Information */}
      <div className="col-span-4">
        <div className="font-bold text-lg">{addr.address}</div>
        <div className="text-gray-600 text-sm flex items-center gap-3">
          <span>{addr.ano ?? ''}</span>
        </div>
        {addr.addressCode && (
          <div className="text-xs text-gray-500 mt-2 font-mono bg-gray-100 px-2 py-1 rounded">
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
      <div className="col-span-1 flex justify-center">
        <ContractBadge contractStatus={addr.contractStatus ?? 0} />
      </div>

      {/* Price */}
      <div className="col-span-1 flex justify-center">
        <PriceBadge price={addr.price ?? 0} />
      </div>

      {/* Notes */}
      <div className="col-span-4">
        <NotesEditor 
          notes={addr.notes} 
          onUpdate={onUpdate} 
          addressId={addr.id as unknown as number} 
        />
      </div>
    </div>
  );
});

/* ------------------------------ Table Header ------------------------------- */
const TableHeader = memo(() => (
  <div className="grid grid-cols-12 gap-6 text-sm font-bold text-gray-700 mb-6 pb-4 border-b border-gray-200/50">
    <div className="col-span-4">Address & Provider</div>
    <div className="col-span-1 text-center">Homes</div>
    <div className="col-span-1 text-center">Status</div>
    <div className="col-span-1 text-center">Contract</div>
    <div className="col-span-1 text-center">
      <DollarSign className="inline w-4 h-4" aria-hidden /> Price
    </div>
    <div className="col-span-4">Notes</div>
  </div>
));

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
          <div key={region} className="hover:bg-gray-50/30 transition-colors duration-200">
            <RegionHeader
              region={region}
              rows={rows}
              isExpanded={isExpanded}
              onToggle={onToggle}
            />

            {isExpanded && (
              <div
                className="bg-gradient-to-r from-gray-50/50 to-blue-50/20 px-8 py-6"
                id={`region-${region}`}
                role="region"
                aria-label={`Addresses in ${region}`}
              >
                <TableHeader />
                {rows.map((addr) => (
                  <AddressRow 
                    key={addr.id as unknown as React.Key}
                    addr={addr}
                    onUpdate={onUpdate}
                  />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
