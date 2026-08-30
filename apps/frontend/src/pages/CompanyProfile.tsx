/**
 * CompanyProfile — /settings/company-profile
 *
 * Focused entry point for company identity and TIN settings.
 * Renders the Settings page with the 'profile' tab pre-selected via URL state,
 * keeping all company profile logic in the single Settings component.
 */
import React from 'react';
import { Navigate } from 'react-router-dom';

const CompanyProfile: React.FC = () => (
  <Navigate to="/settings?tab=profile" replace />
);

export default CompanyProfile;
