/**
 * CompanyProfile — /settings/company-profile (legacy alias kept for back-compat)
 *
 * The route now maps directly to CompanyProfilePage.  This file is no longer
 * used as a redirect; it stays here only so any old bookmarks or external
 * links to /settings/company-profile continue to work — app.tsx maps that
 * path straight to CompanyProfilePage.
 *
 * @deprecated Import CompanyProfilePage directly instead.
 */
export { default } from './settings/CompanyProfilePage';
