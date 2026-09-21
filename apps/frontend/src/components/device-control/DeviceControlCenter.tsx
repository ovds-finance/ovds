import {
  DEVICE_CONTROL_CATEGORY_META,
  DEVICE_CONTROL_CATEGORIES,
  type DeviceControlCategory,
  type DeviceControlPolicyDTO as DeviceControlPolicy,
  type DeviceControlSettings,
} from '@ovds/shared';
import { Card, Btn, StatusBadge } from '@ovds/ui';
import {
  Lock,
  ShieldCheck,
  Network,
  SlidersHorizontal,
  Pencil,
} from 'lucide-react';
import React from 'react';

import { useAuth } from '../../rbac/AuthContext';

const ICONS: Record<DeviceControlCategory, React.ReactNode> = {
  ENCRYPTION: <Lock size={18} />,
  APP_PERMISSION: <ShieldCheck size={18} />,
  NETWORK_POLICY: <Network size={18} />,
  ENFORCEMENT_RULE: <SlidersHorizontal size={18} />,
};

interface Props {
  policies: DeviceControlPolicy[];
  loading?: boolean;
  onPropose: (category: DeviceControlCategory, settings: DeviceControlSettings) => void;
}

export const DeviceControlCenter: React.FC<Props> = ({
  policies,
  loading,
  onPropose,
}) => {
  const { can } = useAuth();
  const canPropose = can('device_control:propose');

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12 text-slate-400 text-sm">
        Loading enforced controls…
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {DEVICE_CONTROL_CATEGORIES.map((cat) => {
        const policy = policies.find((p) => p.category === cat);
        const meta = DEVICE_CONTROL_CATEGORY_META[cat];
        const isEnforced = !!policy?.id;
        const settings = policy?.settings ?? {};
        const previewKeys = Object.keys(settings).slice(0, 4);

        return (
          <Card key={cat} className="flex flex-col">
            <div className="flex items-start justify-between gap-3 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-700 shadow-sm flex items-center justify-center text-white shrink-0">
                  {ICONS[cat]}
                </div>
                <div>
                  <h3 className="text-[13px] font-bold text-slate-800 dark:text-slate-100 leading-tight">
                    {meta.label}
                  </h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <StatusBadge status={isEnforced ? 'APPROVED' : 'DRAFT'} />
                    <span className="text-[10px] text-slate-400">
                      {isEnforced ? `v${policy?.version}` : 'default'} ·{' '}
                      {policy?.enforcedAt
                        ? new Date(policy.enforcedAt).toLocaleDateString()
                        : 'not yet enforced'}
                    </span>
                  </div>
                </div>
              </div>
              {canPropose && (
                <Btn
                  size="xs"
                  onClick={() => onPropose(cat, settings)}
                  icon={<Pencil size={12} />}
                >
                  Propose Change
                </Btn>
              )}
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-snug mb-3">
              {meta.description}
            </p>

            <div className="rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-3 py-2 mb-3">
              <dl className="space-y-1">
                {previewKeys.map((k) => (
                  <div key={k} className="flex items-center justify-between gap-2 text-[11px]">
                    <dt className="text-slate-400 capitalize">
                      {k.replace(/([A-Z])/g, ' $1').replace(/^./, (c) => c.toUpperCase())}
                    </dt>
                    <dd className="font-semibold text-slate-700 dark:text-slate-200 text-right truncate max-w-[60%]">
                      {Array.isArray(settings[k])
                        ? `${(settings[k] as unknown[]).length} item(s)`
                        : String(settings[k])}
                    </dd>
                  </div>
                ))}
              </dl>
            </div>

            <p className="mt-auto text-[10px] text-amber-600 dark:text-amber-400/80 leading-snug border-t border-slate-100 dark:border-slate-800 pt-2">
              {meta.riskNote}
            </p>
          </Card>
        );
      })}
    </div>
  );
};
