'use client';

import { FileSpreadsheet, Smartphone, Upload, BarChart3, Share2, Zap } from 'lucide-react';
import React, { memo, useMemo } from 'react';

// Memoized Card component to prevent unnecessary re-renders
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

// Memoized Header component
const EmptyStateHeader = memo(({ isNative }: { isNative: boolean }) => {
  const { icon, title, description } = useMemo(() => {
    if (isNative) {
      return {
        icon: <Smartphone className="w-12 h-12 text-gray-500" />,
        title: 'Ready for Native Import',
        description: 'Use the native iOS file system to import your Excel files and manage addresses with premium features'
      };
    }
    
    return {
      icon: <FileSpreadsheet className="w-12 h-12 text-gray-500" />,
      title: 'Ready to Import',
      description: 'Import your Excel files to get started with professional address management'
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

// Memoized Feature Cards component
const FeatureCards = memo(({ isNative }: { isNative: boolean }) => {
  const cards = useMemo(() => [
    {
      id: 'import',
      icon: <Upload className="w-6 h-6" />,
      title: 'Smart Import',
      desc: 'Advanced Excel processing with duplicate detection and data validation'
    },
    {
      id: 'analytics',
      icon: <BarChart3 className="w-6 h-6" />,
      title: 'Analytics',
      desc: 'Real-time statistics and insights about your address portfolio'
    },
    {
      id: 'export',
      icon: <Share2 className="w-6 h-6" />,
      title: isNative ? 'Native Sharing' : 'Export Options',
      desc: isNative 
        ? 'iOS Share Sheet integration for seamless data sharing'
        : 'Export to CSV with custom formatting options'
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

// Memoized Getting Started section
const GettingStartedSection = memo(({ isNative }: { isNative: boolean }) => {
  const content = useMemo(() => {
    const sectionTitle = isNative ? 'Native Features' : 'Getting Started';
    
    const features = isNative ? [
      'iOS File System: Direct access to your device files',
      'Share Sheet: Native iOS sharing capabilities', 
      'Touch Optimized: Perfect for iPad and iPhone',
      'Offline Ready: Works without internet connection'
    ] : [
      'Step 1: Click "Import Excel" to upload your .xlsx or .xls files',
      'Step 2: Review imported data with advanced filtering and search',
      'Step 3: Add notes and manage your address portfolio',
      'Step 4: Export your enhanced data as CSV'
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

// Main EmptyState component with performance optimizations
export default function EmptyState({ isNative }: { isNative: boolean }) {
  return (
    <div className="p-16 text-center bg-white/70 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/30">
      <EmptyStateHeader isNative={isNative} />
      <FeatureCards isNative={isNative} />
      <GettingStartedSection isNative={isNative} />
    </div>
  );
}
