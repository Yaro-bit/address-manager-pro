'use client';

import { FileSpreadsheet, Smartphone, Upload, BarChart3, Share2, Zap, Target, MapPin } from 'lucide-react';
import React, { memo, useMemo } from 'react';

/* ------------------------------ Enhanced Card ------------------------------ */
const FeatureCard = memo(({ 
  icon, 
  title, 
  desc,
  highlight = false
}: { 
  icon: React.ReactNode; 
  title: string; 
  desc: string;
  highlight?: boolean;
}) => {
  return (
    <div className={`p-6 rounded-2xl border transition-all duration-200 hover:scale-105 hover:shadow-lg touch-target ${
      highlight 
        ? 'bg-blue-50/80 border-blue-200/50 hover:bg-blue-50' 
        : 'bg-white/60 border-gray-200/50 hover:bg-white/80'
    }`}>
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4 ${
        highlight ? 'bg-blue-100' : 'bg-gray-100'
      }`} aria-hidden="true">
        {icon}
      </div>
      <h4 className="font-bold text-base md:text-lg mb-2 text-center">{title}</h4>
      <p className="text-sm md:text-base text-gray-600 text-center leading-relaxed">{desc}</p>
    </div>
  );
});

/* ------------------------------ Header Section ----------------------------- */
const EmptyStateHeader = memo(({ isNative }: { isNative: boolean }) => {
  const { icon, title, description } = useMemo(() => {
    if (isNative) {
      return {
        icon: <Smartphone className="w-16 h-16 text-blue-500" aria-hidden="true" />,
        title: 'Bereit für mobilen Import',
        description: 'Nutze die nativen iOS/Android-Funktionen für optimale Performance mit deinen Excel-Dateien und bis zu 78.000+ Adressen.',
      };
    }
    return {
      icon: <FileSpreadsheet className="w-16 h-16 text-blue-500" aria-hidden="true" />,
      title: 'Bereit für Excel-Import',
      description: 'Importiere deine ISP/Telekom-Adressdateien und manage bis zu 78.000+ Adressen mit professionellen Analyse-Tools.',
    };
  }, [isNative]);

  return (
    <div className="text-center mb-8">
      <div className="w-32 h-32 bg-gradient-to-br from-blue-100 via-purple-100 to-cyan-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner" aria-hidden="true">
        {icon}
      </div>
      <h2 className="text-2xl md:text-3xl lg:text-4xl font-black mb-4 text-gray-900">{title}</h2>
      <p className="text-gray-600 text-base md:text-lg mb-6 max-w-2xl mx-auto leading-relaxed">
        {description}
      </p>
    </div>
  );
});

/* ------------------------------ Feature Cards ------------------------------ */
const FeatureCards = memo(({ isNative }: { isNative: boolean }) => {
  const cards = useMemo(
    () => [
      {
        id: 'import',
        icon: <Upload className="w-6 h-6 text-blue-600" aria-hidden="true" />,
        title: 'Intelligenter Import',
        desc: 'Automatische Erkennung österreichischer PLZ, Duplikat-Vermeidung und Verarbeitung großer Dateien (78K+ Zeilen)',
        highlight: true
      },
      {
        id: 'analytics',
        icon: <BarChart3 className="w-6 h-6 text-green-600" aria-hidden="true" />,
        title: 'ISP Analytics',
        desc: 'Echtzeit-Statistiken zu Verträgen, PLZ-Bereichen, operativen Status und Verkaufspotential',
        highlight: false
      },
      {
        id: 'plz',
        icon: <MapPin className="w-6 h-6 text-purple-600" aria-hidden="true" />,
        title: 'PLZ-Optimierung',
        desc: 'Automatische Gruppierung nach Postleitzahlen für optimale regionale D2D-Bearbeitung',
        highlight: false
      },
      {
        id: 'export',
        icon: <Share2 className="w-6 h-6 text-orange-600" aria-hidden="true" />,
        title: isNative ? 'Native Freigabe' : 'CSV Export',
        desc: isNative
          ? 'Integration mit iOS/Android Share-Funktionen für nahtloses Teilen der Adressdaten'
          : 'Export als CSV mit korrekter Zeichenkodierung für Excel-Kompatibilität',
        highlight: false
      },
    ],
    [isNative]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto mb-10">
      {cards.map((card) => (
        <FeatureCard 
          key={card.id} 
          icon={card.icon} 
          title={card.title} 
          desc={card.desc}
          highlight={card.highlight}
        />
      ))}
    </div>
  );
});

/* --------------------------- Getting Started Section -------------------------- */
const GettingStartedSection = memo(({ isNative }: { isNative: boolean }) => {
  const content = useMemo(() => {
    const sectionTitle = isNative ? 'Mobile Features' : 'Erste Schritte';

    const features = isNative
      ? [
          'iOS/Android Dateisystem: Direkter Zugriff auf Excel-Dateien deines Geräts',
          'Share Sheet: Native Freigabefunktionen für einfaches Teilen der Daten',
          'Touch-Optimiert: Perfekt angepasst für iPad und iPhone mit 44px Touch-Targets',
          'Offline-Fähig: Funktioniert ohne Internetverbindung für maximale Flexibilität',
        ]
      : [
          'Schritt 1: Klicke "Excel/CSV hochladen" und wähle deine ISP/Telekom-Dateien aus',
          'Schritt 2: Automatische PLZ-Erkennung und Duplikat-Vermeidung beim Import',
          'Schritt 3: Nutze Suche und Filter um gezielt nach Verkaufspotential zu suchen',
          'Schritt 4: Exportiere bearbeitete Daten als CSV für weitere Verwendung',
        ];

    return { sectionTitle, features };
  }, [isNative]);

  return (
    <div className="max-w-4xl mx-auto">
      {/* Main Getting Started */}
      <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 rounded-2xl p-6 md:p-8 border border-blue-200/50 shadow-sm mb-8">
        <h3 className="font-bold text-lg md:text-xl mb-4 flex items-center gap-2 text-gray-900">
          <Zap className="w-5 h-5 md:w-6 md:h-6 text-blue-600" aria-hidden="true" /> 
          {content.sectionTitle}
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {content.features.map((feature, index) => (
            <div key={index} className="flex items-start gap-3">
              <span className="text-blue-600 text-lg font-bold mt-0.5 flex-shrink-0" aria-hidden="true">
                {index + 1}
              </span>
              <span className="text-sm md:text-base text-gray-700">{feature}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Supported File Formats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-emerald-50/80 rounded-2xl p-6 border border-emerald-200/50">
          <h4 className="font-bold text-lg mb-3 flex items-center gap-2 text-emerald-800">
            <FileSpreadsheet className="w-5 h-5" aria-hidden="true" />
            Unterstützte Formate
          </h4>
          <ul className="space-y-2 text-sm text-emerald-700">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" aria-hidden="true"></span>
              Excel (.xlsx, .xls) - Bis zu 78.000+ Zeilen
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" aria-hidden="true"></span>
              CSV - Mit automatischer Kodierungserkennung
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" aria-hidden="true"></span>
              Mehrere Dateien gleichzeitig
            </li>
          </ul>
        </div>

        <div className="bg-amber-50/80 rounded-2xl p-6 border border-amber-200/50">
          <h4 className="font-bold text-lg mb-3 flex items-center gap-2 text-amber-800">
            <Target className="w-5 h-5" aria-hidden="true" />
            Optimiert für ISP-Daten
          </h4>
          <ul className="space-y-2 text-sm text-amber-700">
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full" aria-hidden="true"></span>
              Automatische PLZ-Erkennung für Österreich
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full" aria-hidden="true"></span>
              Vertragsstatus-Analyse (L1-Angebote + Verkaufsverträge)
            </li>
            <li className="flex items-center gap-2">
              <span className="w-2 h-2 bg-amber-500 rounded-full" aria-hidden="true"></span>
              D2D-Verkaufspotential-Berechnung
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
});

/* --------------------------------- Export --------------------------------- */
export default function EmptyState({ isNative }: { isNative: boolean }) {
  return (
    <div className="p-8 md:p-12 lg:p-16 text-center bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30">
      <EmptyStateHeader isNative={isNative} />
      <FeatureCards isNative={isNative} />
      <GettingStartedSection isNative={isNative} />
    </div>
  );
}