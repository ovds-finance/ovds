import React, { useState, useCallback } from 'react';
import { AppPage, AppTabs, Btn } from '@ovds/ui';
import { BarChart3, Plus, FileText } from 'lucide-react';
import {
  ReportGallery,
  ReportViewer,
  ReportBuilder,
  ScheduledDeliveryModal,
} from '@ovds/features/reporting';
import type { ReportCategory, ReportTemplate, ReportConfig } from '@ovds/features/reporting';
import { defaultPeriod } from '@ovds/features/reporting';

type Screen = 'gallery' | 'view' | 'builder' | 'delivery';

export default function ReportsDashboard() {
  const [screen, setScreen] = useState<Screen>('gallery');
  const [category, setCategory] = useState<ReportCategory | 'all'>('all');
  const [selectedReport, setSelectedReport] = useState<ReportTemplate | null>(null);
  const [config, setConfig] = useState<ReportConfig>({
    reportId: 'profit-and-loss',
    basis: 'accrual',
    period: defaultPeriod(),
  });
  const [returnTo, setReturnTo] = useState<Screen>('gallery');

  const openViewer = useCallback((t: ReportTemplate) => {
    setSelectedReport(t);
    const basis = t.basisSupported.includes('accrual') ? 'accrual' : t.basisSupported[0] || 'accrual';
    setConfig({ reportId: t.id, basis, period: defaultPeriod() });
    setScreen('view');
  }, []);

  const openBuilder = useCallback(() => {
    setReturnTo(screen);
    setScreen('builder');
  }, [screen]);

  const openDelivery = useCallback((from: Screen) => {
    setReturnTo(from);
    setScreen('delivery');
  }, []);

  const backToGallery = useCallback(() => {
    setSelectedReport(null);
    setScreen('gallery');
  }, []);

  const handleComplete = useCallback((t: ReportTemplate, c: ReportConfig) => {
    setSelectedReport(t);
    setConfig(c);
    setScreen('view');
  }, []);

  const galleryTabs = [
    { key: 'all', label: 'All reports' },
    { key: 'standard', label: 'Standard core reports' },
    { key: 'modular', label: 'App module reports' },
  ];

  return (
    <AppPage
      title="Reports Dashboard"
      subtitle="Akaunting-style financial, tax, inventory, payroll and CRM reports — with a custom report builder and scheduled email delivery."
      icon={<BarChart3 size={16} className="text-white" />}
      iconBg="bg-indigo-600"
      crumbs={[{ label: 'Reports Dashboard' }]}
      actions={
        <>
          <Btn size="xs" variant="ghost" onClick={() => openDelivery('gallery')}>
            <FileText size={13} className="mr-1" />
            Scheduled exports
          </Btn>
          <Btn size="xs" onClick={openBuilder}>
            <Plus size={13} className="mr-1" />
            New report
          </Btn>
        </>
      }
    >
      {screen === 'gallery' && (
        <>
          <div className="mb-4">
            <AppTabs
              tabs={galleryTabs}
              active={category}
              onChange={(k) => setCategory(k as ReportCategory | 'all')}
              accent="indigo"
            />
          </div>
          <ReportGallery category={category} onSelect={openViewer} />
        </>
      )}

      {screen === 'view' && selectedReport && (
        <ReportViewer
          template={selectedReport}
          config={config}
          onBack={backToGallery}
          onSchedule={() => openDelivery('view')}
        />
      )}

      {screen === 'builder' && (
        <ReportBuilder onBack={() => setScreen(returnTo)} onComplete={handleComplete} />
      )}

      {screen === 'delivery' && <ScheduledDeliveryModal onBack={() => setScreen(returnTo)} />}
    </AppPage>
  );
}
