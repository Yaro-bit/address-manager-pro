'use client';

import { FileSpreadsheet, Smartphone } from 'lucide-react';
import React, { memo } from 'react';

/* ------------------------------ Types ------------------------------------- */
interface EmptyStateProps {
  isNative: boolean;
}

interface FeatureCardProps {
  icon: React.ReactNode;
  title: string;
  desc: string;
  highlight?: boolean;
}

/* ------------------------------ Feature Card ------------------------------ */
const FeatureCard = memo(function FeatureCard({
  icon,
  title,
  desc,
  highlight = false,
}: FeatureCardProps) {
  return (
    <div
      tabIndex={0}
      className={`p-6 rounded-2xl border transition-all duration-200 touch-target select-none
      motion-safe:transition-transform motion-reduce:transition-none
      md:[@media(hover:hover)]:hover:scale-[1.03] md:[@media(hover:hover)]:hover:shadow-lg
      active:scale-[0.98] focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-400/60
      ${highlight
        ? 'bg-blue-50/80 border-blue-200/60 md:[@media(hover:hover)]:hover:bg-blue-50'
        : 'bg-white/60 border-gray-200/60 md:[@media(hover:hover)]:hover:bg-white/80'}`}
    >
      <div
        className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${
          highlight ? 'bg-blue-100' : 'bg-gray-100'
        }`}
        aria-hidden="true"
      >
        {icon}
      </div>
      <h4 className="font-bold text-base md:text-lg mb-2 text-center">{title}</h4>
      <p className="text-sm md:text-base text-gray-700 text-center leading-relaxed">{desc}</p>
    </div>
  );
});

/* ------------------------------ Header ------------------------------------ */
const EmptyStateHeader = memo(function EmptyStateHeader({ isNative }: EmptyStateProps) {
  const icon = isNative ? (
    <Smartphone className="w-16 h-16 text-blue-500" aria-hidden="true" />
  ) : (
    <FileSpreadsheet className="w-16 h-16 text-blue-500" aria-hidden="true" />
  );

  const title = isNative ? 'Bereit für mobilen Import' : 'Bereit für Excel-Import';
  const description = isNative
    ? 'Nutze die nativen iOS/Android-Funktionen für optimale Performance mit deinen Excel-Dateien und bis zu 1.000.000+ Adressen.'
    : 'Importiere deine ISP/Telekom-Adressdateien und manage bis zu 78.000+ Adressen mit professionellen Analyse-Tools.';

  return (
    <div className="text-center mb-8">
      <div
        className="w-32 h-32 bg-gradient-to-br from-blue-100 via-purple-100 to-cyan-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner"
        aria-hidden="true"
      >
        {icon}
      </div>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-black mb-4 text-gray-900">{title}</h2>
      <p className="text-gray-700 text-base md:text-lg mb-6 max-w-2xl mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
});

/* ------------------------------ Feature Cards ------------------------------ */
const FeatureCards = ({ isNative }: EmptyStateProps) => {
  const items = [
    {
      title: isNative ? 'Schneller Datei-Import' : 'Excel-Import',
      desc: isNative
        ? 'Direkt aus der Dateien-App oder geteilten Inhalten.'
        : 'Lade .xlsx/.csv hoch und starte sofort.',
      highlight: true,
      icon: isNative ? (
        <Smartphone className="w-6 h-6" aria-hidden="true" />
      ) : (
        <FileSpreadsheet className="w-6 h-6" aria-hidden="true" />
      ),
    },
    {
      title: 'Analyse-Tools',
      desc: 'Filter, PLZ-Mapping und KPI-Übersichten.',
      highlight: false,
      icon: <FileSpreadsheet className="w-6 h-6" aria-hidden="true" />,
    },
    {
      title: 'Teilen & Exportieren',
      desc: 'Ergebnisse als CSV/Excel weitergeben.',
      highlight: false,
      icon: <FileSpreadsheet className="w-6 h-6" aria-hidden="true" />,
    },
  ];

  return (
    <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 [contain:content]">
      {items.map((it, i) => (
        <li key={i}>
          <FeatureCard
            icon={it.icon}
            title={it.title}
            desc={it.desc}
            highlight={it.highlight}
          />
        </li>
      ))}
    </ul>
  );
};

/* -------------------------- Getting Started Section ------------------------ */
const GettingStartedSection = ({ isNative }: EmptyStateProps) => {
  return (
    <div className="mt-8 text-sm text-gray-700">
      {isNative
        ? 'Tippe auf „Teilen“ in einer Excel-Datei und wähle diese App, um den Import zu starten.'
        : 'Klicke auf „Datei hochladen“, um deine Excel- oder CSV-Datei zu importieren.'}
    </div>
  );
};

/* ------------------------------- Footer ----------------------------------- */
function AppFooter() {
  return (
    <footer className="mt-16 border-t border-gray-200 pt-6 text-sm text-gray-600 text-center">
      <p className="mb-2">
        © {new Date().getFullYear()} Address Manager Pro · Veröffentlicht unter{' '}
        <a
          href="https://opensource.org/licenses/MIT"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          MIT-Lizenz
        </a>
      </p>
      <nav className="flex justify-center gap-6">
        <a
          href="https://github.com/Yaro-bit"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-600"
        >
          GitHub
        </a>
        <a
          href="https://www.linkedin.com/in/yaroslav-v-b7876a211/"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-600"
        >
          LinkedIn
        </a>
        <a
          href="https://yaro-bit.github.io"
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-blue-600"
        >
          Website
        </a>
      </nav>
    </footer>
  );
}


/* --------------------------------- Export --------------------------------- */
export default function EmptyState({ isNative }: EmptyStateProps) {
  return (
    <section
      aria-labelledby="empty-state-title"
      className="p-8 md:p-12 lg:p-16 text-center rounded-3xl shadow-2xl border
      bg-white/90 border-white/30
      supports-[backdrop-filter:blur(0px)]:bg-white/70 supports-[backdrop-filter:blur(0px)]:backdrop-blur-xl"
      style={{
        paddingTop: 'env(safe-area-inset-top)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        paddingLeft: 'env(safe-area-inset-left)',
        paddingRight: 'env(safe-area-inset-right)',
      }}
    >
      <h2 id="empty-state-title" className="sr-only">
        Leerer Zustand
      </h2>
      <EmptyStateHeader isNative={isNative} />
      <FeatureCards isNative={isNative} />
      <GettingStartedSection isNative={isNative} />
      <AppFooter />
    </section>
  );
}
