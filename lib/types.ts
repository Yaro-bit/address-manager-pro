// lib/types.ts
export type Address = {
  id: number; // unique identifier, required
  addressCode: string; // external ID (adrcd-subcd)
  address: string; // human-readable address
  region: string; // grouping key (e.g. PLZ or region name)

  ano?: string; // provider / ANO field
  status?: string; // free text, e.g. "100 In Betrieb"

  homes: number; // required count, default 0 if missing
  contractStatus: number; // required, 0 = none, >0 = has contract(s)
  price: number; // required, 0 allowed

  provisionCategory?: string;
  buildingCompany?: string;
  kgNumber?: string;
  completionPlanned?: string;
  completionDone?: boolean;
  d2dStart?: string;
  d2dEnd?: string;
  outdoorFee?: string;

  notes: string; // required, can be empty string
  imported?: boolean; // system flag

  // New customer tracking fields
  customerMet?: boolean;      // kunde angetroffen ja/nein
  appointmentSet?: boolean;   // termin ja/nein
  contractSigned?: boolean;   // vertragsabschluss ja/nein
  objectAvailable?: boolean;  // objekt vorhanden ja/nein
};