# Address Manager Pro

**Version 0.0.4**

A professional address portfolio management application built with Next.js and TypeScript. Import, organize, analyze, and export large datasets with enterprise-grade performance and customer relationship tracking.

🚀 **[Live Demo](https://address-manager-pro.vercel.app/)**

---

## Overview

Address Manager Pro transforms complex address management into a streamlined workflow with integrated customer tracking. Built for **datasets of 78,000+ addresses**, the app delivers **fast importing, intelligent deduplication, advanced filtering, customer relationship management, and professional exports** — all in a responsive Next.js environment.

---

## Features

### Data Management
- Import `.xlsx`, `.xls`, and `.csv` files  
- Automatic deduplication during import  
- Persistent portfolio storage with auto-save  
- Local browser storage for offline access

### Customer Relationship Tracking
- **Customer Contact Status**: Track customer meetings, appointments, contract signings, and object availability
- **Visual Status Indicators**: Intuitive yes/no toggles with instant feedback
- **Conversion Analytics**: Monitor customer contact rates and sales conversion metrics
- **Lead Management**: Identify active leads and untapped potential

### Analysis & Search
- Real-time search across all fields  
- Advanced filters including customer tracking status
- PLZ grouping and regional mapping  
- Enhanced KPI dashboard with customer metrics
- Conversion rate tracking and sales analytics

### Organization
- Group by postal code or region  
- Flexible column sorting  
- Inline note editing with rich text support
- Customer tracking alongside traditional data
- Bulk operations and batch updates

### Export
- Export filtered data to CSV or Excel  
- Include customer tracking data in exports
- Preserve all modifications during export  
- Selective dataset export with custom fields

---

## New in Version 0.0.4

- **Customer Tracking Fields**: Four new boolean fields for comprehensive customer relationship management
- **Enhanced Analytics**: Customer contact rates, conversion metrics, and lead pipeline tracking
- **Auto-Save Functionality**: Automatic persistence of customer tracking updates
- **Advanced Filtering**: Filter by customer contact status, appointments, and contract signatures
- **Improved UI**: Side-by-side layout with notes and customer tracking
- **Visual Feedback**: Color-coded status indicators and progress bars

---

## Tech Stack

- **Framework**: Next.js 14.2.5 (App Router)  
- **Language**: TypeScript 5.4.5  
- **Styling**: Tailwind CSS 3.4.7  
- **Data Processing**: `xlsx` for Excel/CSV parsing  
- **Storage**: Browser localStorage for persistent data
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

1. **Import** Excel/CSV file with address data
2. **Review** automatic deduplication results
3. **Track** customer interactions using the built-in CRM features
4. **Analyze** with search, filters, PLZ mapping, and customer metrics
5. **Export** results including customer tracking data as CSV or Excel

### Customer Tracking Workflow
1. Import your address database
2. Use the customer tracking checkboxes to record:
   - Customer meetings
   - Appointment scheduling
   - Contract signatures
   - Object availability
3. Monitor conversion rates and sales pipeline in real-time
4. Export comprehensive reports with all customer data

---

## Project Structure

```
address-manager-pro/
├── app/          # Next.js App Router pages/layouts
├── components/   # React components (import, filters, analysis, export)
├── lib/          # Utilities (excel, storage, types, native)
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
- Instant search and filtering across all fields
- Real-time customer tracking updates
- Optimized memory management for large datasets
- Responsive across desktop and mobile devices
- Auto-save functionality prevents data loss

---

## Browser Support

- Chrome 90+ (recommended)  
- Firefox 88+  
- Safari 14+  
- Edge 90+  

---

## Use Cases

- **ISP/Telecommunications**: Manage broadband deployment addresses with customer acquisition tracking
- **Real Estate**: Track property contacts and sales pipeline
- **Field Sales**: Monitor door-to-door sales activities and conversion rates
- **Service Providers**: Manage service area coverage with customer relationship data
- **Logistics**: Coordinate delivery routes with customer interaction history

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

**Professional address management with integrated customer relationship tracking for modern sales workflows.**