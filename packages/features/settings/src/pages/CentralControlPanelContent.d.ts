/**
 * CentralControlPanelContent — unified settings hub for Ovds SaaS
 *
 * Ovds SaaS sidebar-driven layout. All configuration sections
 * are accessible from one place: Company, Localization, Financial, Invoice,
 * Defaults, Currencies, Email/SMTP, Taxes, Users & Access, Modules, Developers.
 *
 * This is a thick feature-lib component. The app shell (Settings.tsx) is thin.
 * Data: orpc.settings.profile.* via TanStack Query through @ovds/features/settings hooks.
 */
import React from 'react';
export type SettingsSection = 'profile' | 'localization' | 'financial' | 'invoice' | 'defaults' | 'currency' | 'email' | 'taxes' | 'users' | 'modules' | 'developers' | 'integrations';
interface SectionMeta {
    id: SettingsSection;
    label: string;
    icon: React.ReactNode;
    description: string;
    group: 'general' | 'advanced' | 'system';
}
export declare const SETTINGS_SECTIONS: SectionMeta[];
export interface CentralControlPanelContentProps {
    /** orpc client bound to the app — passed in so the feature lib stays framework-neutral */
    orpc: any;
    canWrite: boolean;
    companyId: string | null | undefined;
    /**
     * Pin the panel to a specific section on mount.
     * When set the URL ?tab= param is still honoured if present, but this value
     * is used as the fallback instead of 'profile'.  Dedicated sub-pages pass
     * their own section key so the sidebar starts on the right item.
     */
    defaultSection?: SettingsSection;
}
export declare function CentralControlPanelContent({ orpc, canWrite, companyId, defaultSection }: CentralControlPanelContentProps): React.JSX.Element;
export default CentralControlPanelContent;
//# sourceMappingURL=CentralControlPanelContent.d.ts.map