import React from 'react';
import {
  AppPage, Btn, Icon,
} from '../components/ui';

const ComplianceSecurity: React.FC = () => {
  return (
    <AppPage
      title="Security Evaluator"
      subtitle="System security posture and compliance checks"
      actions={
        <Btn variant="secondary" size="sm" icon={<Icon name="REFRESH_CW" size={11} />}>
          Run Evaluation
        </Btn>
      }
    >
      <div className="text-center py-10 text-sm text-slate-400">
        Security evaluation module is initializing. Configure security policies in Settings.
      </div>
    </AppPage>
  );
};

export default ComplianceSecurity;
