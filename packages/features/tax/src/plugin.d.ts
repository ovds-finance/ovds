import React from 'react';
import type { IconType } from '@ovds/shared';
export interface ModuleUIRegistration {
    id: string;
    title: string;
    navigationPath: string;
    icon: IconType;
    dashboardWidgets: Array<{
        id: string;
        component: React.ComponentType<any>;
        gridSize: string;
    }>;
    settingsPanel?: React.ComponentType<any>;
}
export declare function VatDashboardWidget(props: {
    companyId?: string;
}): React.DetailedReactHTMLElement<{
    style: {
        padding: string;
        border: string;
        borderRadius: string;
    };
}, HTMLElement>;
export declare function VatSettingsPanel(props: {
    moduleKey?: string;
}): React.DetailedReactHTMLElement<{
    style: {
        padding: string;
        border: string;
        borderRadius: string;
    };
}, HTMLElement>;
export declare const VatPluginConfig: ModuleUIRegistration;
//# sourceMappingURL=plugin.d.ts.map