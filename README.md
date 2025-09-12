# Address Manager Pro

**Version 0.0.3**

A professional address portfolio management application built with Next.js and TypeScript. Streamline your address data workflow with Excel import, intelligent deduplication, and comprehensive analysis tools.

🚀 **[Live Demo](https://address-manager-pro.vercel.app/)**

## Overview

Address Manager Pro transforms complex address portfolio management into a streamlined, professional workflow. Built for handling large datasets (78,000+ addresses), this application provides enterprise-grade tools for address data analysis, filtering, and export.

## Features

### 📊 **Data Management**
- **Excel & CSV Import**: Seamless upload of `.xlsx`, `.xls`, and `.csv` files
- **Smart Deduplication**: Automatic duplicate detection and removal during import
- **Large Dataset Support**: Handle 78,000+ addresses with optimized performance
- **Data Persistence**: Secure storage and retrieval of your address portfolio

### 🔍 **Analysis & Search**
- **Real-time Search**: Instant search across all address fields
- **Advanced Filtering**: Filter by contract status, notes, regions, and custom criteria
- **PLZ Mapping**: Postal code grouping and regional analysis
- **Professional KPI Dashboard**: Comprehensive portfolio metrics and insights

### 🗂️ **Organization**
- **Regional Grouping**: Organize addresses by postal codes and geographic regions
- **Flexible Sorting**: Sort by any column with intelligent data handling
- **Inline Note Editing**: Add and edit notes directly within the interface
- **Bulk Operations**: Efficient management of large address sets

### 📤 **Export & Sharing**
- **CSV Export**: Export filtered results with all modifications preserved
- **Excel Export**: Professional spreadsheet output for further analysis
- **Selective Export**: Export only filtered/selected data sets

## Technical Stack

- **Framework**: Next.js 14.2.5 with App Router architecture
- **Language**: TypeScript 5.4.5 for type-safe development
- **Styling**: Tailwind CSS 3.4.7 with custom responsive design
- **Data Processing**: xlsx library for robust Excel/CSV parsing
- **Deployment**: Vercel for reliable hosting and performance
- **Performance**: Turbo mode enabled for optimal development experience

## Installation

### Prerequisites
- Node.js 18+ 
- npm or yarn package manager

### Local Development Setup
1. Clone the repository:
```bash
git clone https://github.com/Yaro-bit/address-manager-pro.git
cd address-manager-pro
```

2. Install dependencies:
```bash
npm install
# or
yarn install
```

3. Run the development server:
```bash
npm run dev
# or  
yarn dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage

### Getting Started
1. **Import Data**: Upload your Excel or CSV file containing address data
2. **Review Import**: Automatic deduplication removes duplicates during import
3. **Analyze**: Use search, filters, and PLZ mapping for data analysis
4. **Export**: Save your processed data as CSV or Excel

### Professional Workflow
- **ISP/Telekom Address Management**: Optimized for telecommunications address databases
- **Regional Analysis**: PLZ-based grouping for geographic insights  
- **Contract Status Tracking**: Filter and manage by contract status
- **Bulk Note Management**: Add contextual information to address records

### Advanced Features
- **Large Dataset Performance**: Optimized for 78,000+ address handling
- **Real-time Filtering**: Instant results with complex filter combinations
- **Professional Export**: Maintain data integrity across export formats

## Project Structure

```
address-manager-pro/
├── app/               # Next.js App Router pages and layouts
│   ├── page.tsx       # Main application interface
│   └── layout.tsx     # Root layout with global styles
├── components/        # React components
│   ├── import/        # Data import components
│   ├── analysis/      # Analysis and KPI components  
│   ├── filters/       # Search and filter components
│   └── export/        # Data export components
├── lib/               # Core utilities and helpers
│   ├── excel.ts       # Excel/CSV processing
│   ├── dedup.ts       # Deduplication algorithms
│   └── export.ts      # Export functionality
├── public/            # Static assets
├── tailwind.config.ts # Tailwind CSS configuration
└── package.json       # Project dependencies
```

## Available Scripts

- `npm run dev` - Start development server with Turbo mode
- `npm run build` - Create optimized production build
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality

## Performance

- **Large Dataset Optimization**: Handles 78,000+ addresses efficiently
- **Real-time Processing**: Instant search and filter responses
- **Memory Management**: Optimized for browser-based large data handling
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Browser Compatibility

- Chrome 90+ (Recommended)
- Firefox 88+  
- Safari 14+
- Edge 90+

## Known Issues

### iPad iOS
- **Icons/Tailwind Bug**: Icon rendering issues may occur on iPad iOS devices due to Tailwind CSS compatibility conflicts. Icons may appear misaligned or fail to display properly in certain UI components.

## Deployment

The application is deployed on Vercel with automatic deployments from the main branch:
- **Production**: https://address-manager-pro.vercel.app/
- **Performance**: Optimized with Next.js Edge Runtime
- **Reliability**: 99.9% uptime with global CDN

## Contributing

Contributions are welcome! This project maintains high code quality standards:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/enhancement`)
3. Commit your changes (`git commit -m 'Add feature enhancement'`)
4. Push to the branch (`git push origin feature/enhancement`)  
5. Open a Pull Request

## License

This project is available under the MIT License. See LICENSE file for details.

## Support

- **Live Application**: https://address-manager-pro.vercel.app/
- **Issues**: Open an issue in the GitHub repository
- **Documentation**: This README contains comprehensive usage information

---

**Professional address management for modern workflows.**
