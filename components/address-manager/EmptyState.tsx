'use client';

import { FileSpreadsheet, Smartphone, Upload, BarChart3, Share2, Zap } from 'lucide-react';
import React, { memo, useMemo } from 'react';

// Memoisierte Card-Komponente, um unnötige Re-Renderings zu vermeiden
const Card = memo(({ 
  icon, 
  title, 
  desc 
}: { 
  icon: React.ReactNode; 
  title: string; 
  desc: string; 
}) => {
  return (
    <div className="p-6 bg-white/60 rounded-2xl border border-gray-200/50 transition-transform duration-200 hover:scale-105 hover:shadow-lg">
      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-3">
        {icon}
      </div>
      <h4 className="font-bold mb-1">{title}</h4>
      <p className="text-sm text-gray-600">{desc}</p>
    </div>
  );
});

// Memoisierte Header-Komponente
const EmptyStateHeader = memo(({ isNative }: { isNative: boolean }) => {
  const { icon, title, description } = useMemo(() => {
    if (isNative) {
      return {
        icon: <Smartphone className="w-12 h-12 text-gray-500" />,
        title: 'Bereit für nativen Import',
        description: 'Nutze das native iOS-Dateisystem, um deine Excel-Dateien zu importieren und Adressen mit Premiumfunktionen zu verwalten'
      };
    }
    
    return {
      icon: <FileSpreadsheet className="w-12 h-12 text-gray-500" />,
      title: 'Bereit zum Importieren',
      description: 'Importiere deine Excel-Dateien, um mit der professionellen Adressverwaltung zu beginnen'
    };
  }, [isNative]);

  return (
    <>
      <div className="w-24 h-24 bg-gradient-to-br from-blue-100 via-purple-100 to-cyan-100 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-inner">
        {icon}
      </div>
      <h3 className="text-3xl font-black mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-2xl mx-auto leading-relaxed">
        {description}
      </p>
    </>
  );
});

// Memoisierte FeatureCards-Komponente
const FeatureCards = memo(({ isNative }: { isNative: boolean }) => {
  const cards = useMemo(() => [
    {
      id: 'import',
      icon: <Upload className="w-6 h-6" />,
      title: 'Intelligenter Import',
      desc: 'Erweiterte Excel-Verarbeitung mit Duplikaterkennung und Datenvalidierung'
    },
    {
      id: 'analytics',
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analysen',
      desc: 'Echtzeitstatistiken und Einblicke in dein Adressportfolio'
    },
    {
      id: 'export',
      icon: <Share2 className="w-6 h-6" />,
      title: isNative ? 'Native Freigabe' : 'Exportoptionen',
      desc: isNative 
        ? 'Integration des iOS-Share-Sheets für nahtloses Teilen'
        : 'Export als CSV mit individuellen Formatierungsmöglichkeiten'
    }
  ], [isNative]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto mb-8">
      {cards.map((card) => (
        <Card 
          key={card.id}
          icon={card.icon} 
          title={card.title} 
          desc={card.desc} 
        />
      ))}
    </div>
  );
});

// Memoisierter "Erste Schritte"-Bereich
const GettingStartedSection = memo(({ isNative }: { isNative: boolean }) => {
  const content = useMemo(() => {
    const sectionTitle = isNative ? 'Native Funktionen' : 'Erste Schritte';
    
    const features = isNative ? [
      'iOS-Dateisystem: Direkter Zugriff auf die Dateien deines Geräts',
      'Share Sheet: Native iOS-Freigabefunktionen', 
      'Touch-Optimiert: Perfekt für iPad und iPhone',
      'Offlinefähig: Funktioniert ohne Internetverbindung'
    ] : [
      'Schritt 1: Klicke auf „Excel importieren“, um deine .xlsx- oder .xls-Dateien hochzuladen',
      'Schritt 2: Überprüfe die importierten Daten mit erweiterten Filter- und Suchfunktionen',
      'Schritt 3: Füge Notizen hinzu und verwalte dein Adressportfolio',
      'Schritt 4: Exportiere deine erweiterten Daten als CSV'
    ];

    return { sectionTitle, features };
  }, [isNative]);

  return (
    <div className="bg-gradient-to-r from-blue-50/80 to-purple-50/80 rounded-2xl p-6 max-w-2xl mx-auto border border-blue-200/50 shadow-sm">
      <h4 className="font-bold mb-3 flex items-center gap-2">
        <Zap className="w-5 h-5 text-blue-600" /> 
        {content.sectionTitle}
      </h4>
      <div className="text-sm text-gray-700 space-y-1 text-left">
        {content.features.map((feature, index) => (
          <p key={index} className="flex items-start">
            <span className="text-blue-600 mr-2 mt-0.5">•</span>
            <span>{feature}</span>
          </p>
        ))}
      </div>
    </div>
  );
});

// Hauptkomponente EmptyState mit Performance-Optimierungen
export default function EmptyState({ isNative }: { isNative: boolean }) {
  return (
    <div className="p-16 text-center bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30">
      <EmptyStateHeader isNative={isNative} />
      <FeatureCards isNative={isNative} />
      <GettingStartedSection isNative={isNative} />
    </div>
  );
}
