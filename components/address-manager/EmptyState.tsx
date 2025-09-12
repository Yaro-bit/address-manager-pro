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
