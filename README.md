# Address Manager Pro

**Version 0.0.3**

A professional address portfolio management application built with Next.js and TypeScript. Import, organize, analyze, and export large datasets with enterprise-grade performance.

🚀 **[Live Demo](https://address-manager-pro.vercel.app/)**

---

## Overview

Address Manager Pro transforms complex address management into a streamlined workflow. Built for **datasets of 78,000+ addresses**, the app delivers **fast importing, intelligent deduplication, advanced filtering, and professional exports** — all in a responsive Next.js environment.

---

## Features

### Data Management
- Import `.xlsx`, `.xls`, and `.csv` files  
- Automatic deduplication during import  
- Persistent portfolio storage  

### Analysis & Search
- Real-time search across all fields  
- Advanced filters (contract status, notes, regions, etc.)  
- PLZ grouping and regional mapping  
- KPI dashboard with portfolio metrics  

### Organization
- Group by postal code or region  
- Flexible column sorting  
- Inline note editing  
- Bulk operations  

### Export
- Export filtered data to CSV or Excel  
- Preserve modifications during export  
- Selective dataset export  

---

## Tech Stack

- **Framework**: Next.js 14.2.5 (App Router)  
- **Language**: TypeScript 5.4.5  
- **Styling**: Tailwind CSS 3.4.7  
- **Data Processing**: `xlsx` for Excel/CSV parsing  
- **Deployment**: Vercel (Edge Runtime, global CDN)  
- **Performance**: Turbo mode for development & optimized runtime  

---

## Installation

### Prerequisites
- Node.js 18+  
- npm or yarn  

### Setup
```bash
git clone https://github.com/Yaro-bit/address-manager-pro.git
cd address-manager-pro
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Usage

1. **Import** Excel/CSV file  
2. **Review** automatic deduplication  
3. **Analyze** with search, filters, and PLZ mapping  
4. **Export** results as CSV or Excel  

---

## Project Structure

```
address-manager-pro/
├── app/          # Next.js App Router pages/layouts
├── components/   # React components (import, filters, analysis, export)
├── lib/          # Utilities (excel, dedup, export)
├── public/       # Static assets
├── tailwind.config.ts
└── package.json
```

---

## Scripts

- `npm run dev` – Start development server  
- `npm run build` – Production build  
- `npm run start` – Run production server  
- `npm run lint` – Run ESLint  

---

## Performance

- Handles **78,000+ addresses** efficiently  
- Instant search and filtering  
- Optimized memory management  
- Responsive across desktop and mobile  

---

## Browser Support

- Chrome 90+ (recommended)  
- Firefox 88+  
- Safari 14+  
- Edge 90+  

---

## Known Issues

- **iPad iOS**: Icons may appear misaligned or missing due to Tailwind CSS rendering quirks.  

---

## Contributing

1. Fork repository  
2. Create a feature branch  
3. Commit & push  
4. Open a Pull Request  

---

## License

MIT License – see LICENSE file  

---

**Professional address management for modern workflows.**
