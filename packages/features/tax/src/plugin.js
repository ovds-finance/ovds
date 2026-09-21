"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VatPluginConfig = void 0;
exports.VatDashboardWidget = VatDashboardWidget;
exports.VatSettingsPanel = VatSettingsPanel;
const react_1 = __importDefault(require("react"));
function VatDashboardWidget(props) {
    return react_1.default.createElement('div', { style: { padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' } }, react_1.default.createElement('h3', { style: { margin: '0 0 8px' } }, 'VAT Dashboard'), react_1.default.createElement('p', { style: { margin: 0, color: '#6b7280' } }, props.companyId ? `Company: ${props.companyId}` : 'Select a company to view VAT declarations'));
}
function VatSettingsPanel(props) {
    return react_1.default.createElement('div', { style: { padding: '16px', border: '1px solid #e5e7eb', borderRadius: '8px' } }, react_1.default.createElement('h3', { style: { margin: '0 0 8px' } }, 'VAT Settings'), react_1.default.createElement('p', { style: { margin: 0, color: '#6b7280' } }, props.moduleKey ? `Module: ${props.moduleKey}` : 'Configure VAT settings and filing frequencies'));
}
exports.VatPluginConfig = {
    id: 'tax',
    title: 'Tax & VAT',
    navigationPath: '/tax/vat',
    icon: 'RECEIPT',
    dashboardWidgets: [
        {
            id: 'vat.dashboard',
            component: VatDashboardWidget,
            gridSize: 'full',
        },
    ],
    settingsPanel: VatSettingsPanel,
};
//# sourceMappingURL=plugin.js.map