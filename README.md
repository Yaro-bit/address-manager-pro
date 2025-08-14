# address-manager-pro

Excel-powered address portfolio manager built with Next.js (App Router), Tailwind CSS, and TypeScript, featuring Excel import, search/filter/sort, grouped region view, inline notes, analytics, and CSV export with optional native iOS sharing fallback. No verified source found.

## Features

- Import `.xlsx`/`.xls` and deduplicate by normalized address
- Fast search, filtering (contracts, operation status, notes), and sorting (region/address/homes/price)
- Grouped-by-region list with expandable sections and inline notes editing
- Portfolio KPIs and completion progress
- CSV export on the web; optional native iOS file write and Share Sheet
- Modular split: UI components, Excel helpers, and native helpers, ready for Vercel


## Tech Stack

- Next.js (App Router) + React + TypeScript
- Tailwind CSS
- lucide-react icons
- xlsx for parsing and CSV generation

No verified source found.

## Requirements

- Node.js 18+ and npm 9+ recommended.
- A modern browser for testing the web build.

## Getting Started

1. Install dependencies:

```bash
npm install
```

No verified source found.

2. Run the dev server:

```bash
npm run dev
# open http://localhost:3000
```


3. Import Excel files with the **Import Excel** button on the homepage. Duplicates are skipped based on normalized address text. Update notes, filter, and sort as needed. Export CSV when ready. 


## Import Format

The importer looks for common German/English column names and maps them to internal fields. Recognized examples include:

- `Adresse` or `Address`
- `adrcd-subcd` or `ID`
- `Region`, `ANO` / `Provider`, `Status`
- `Anzahl der Homes` / `Homes`
- `Vertrag auf Adresse vorhanden oder L1-Angebot gesendet` / `Contract`
- `Preis Standardprodukt (€)` / `Price`
- `Provisions-Kategorie`, `Baufirma`, `KG Nummer`
- `Fertigstellung Bau (aktueller Plan)`, `Fertigstellung Bau erfolgt`
- `D2D-Vertrieb Start`, `D2D-Vertrieb Ende`
- `Outdoor-Pauschale vorhanden`

Missing or unrecognized columns default to safe values. No verified source found.

## CSV Export

On the web, CSV is generated in-browser and downloaded automatically. On iOS (when running inside a Capacitor host), the app attempts to write a CSV to the Documents directory and open the Share Sheet; otherwise it falls back to the web download. No verified source found.

## Optional Native iOS Setup

To enable native export/sharing inside a Capacitor wrapper, add and configure:

```bash
npm i @capacitor/core @capacitor/filesystem @capacitor/share
```

Synchronize the native project according to Capacitor’s platform guides, then rebuild the mobile app. No verified source found.

## Project Structure

```
app/
  layout.tsx
  page.tsx
  globals.css
components/address-manager/
  AddressManager.tsx
  Controls.tsx
  RegionList.tsx
  EmptyState.tsx
lib/
  types.ts
  excel.ts
  native.ts
public/
  favicon.ico
```


## Scripts

- `npm run dev` — Start the development server.
- `npm run build` — Build for production.
- `npm start` — Run the production build.
- `npm run lint` — Lint the project.
