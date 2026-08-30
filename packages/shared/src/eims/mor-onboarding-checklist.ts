/**
 * MoR EIMS Self-Onboarding & Source Registration checklist
 * Source: docs/01-getting-started/mor-eims-onboarding.md
 */

export interface MorOnboardingStep {
  id: string;
  phase: 'Taxpayer Portal' | 'Source Registration' | 'INSA Certificate' | 'BSP Submission';
  title: string;
  description: string;
  required: boolean;
  templateFile?: string;
  externalUrl?: string;
  ovdsSupport: string;
}

export const MOR_ONBOARDING_CHECKLIST: MorOnboardingStep[] = [
  {
    id: 'ONB-01',
    phase: 'Taxpayer Portal',
    title: 'Go to the portal signup page',
    description: 'Navigate to the MoR EIMS taxpayer portal signup page.',
    required: true,
    externalUrl: 'https://core.mor.gov.et',
    ovdsSupport: 'Direct user to MoR portal signup',
  },
  {
    id: 'ONB-02',
    phase: 'Taxpayer Portal',
    title: 'Enter TIN, choose notification option, and check terms and conditions',
    description: 'Enter your TIN, choose a notification option, and check the terms and conditions check box, then press register.',
    required: true,
    ovdsSupport: 'Company TIN stored in profile',
  },
  {
    id: 'ONB-03',
    phase: 'Taxpayer Portal',
    title: 'Enter verification code',
    description: 'You will receive a verification code via the notification option you have selected. For email, if you don\'t get it in the inbox, check the spam folder.',
    required: true,
    ovdsSupport: 'N/A — MoR portal flow',
  },
  {
    id: 'ONB-04',
    phase: 'Taxpayer Portal',
    title: 'Verify account',
    description: 'Enter the verification code and press verify.',
    required: true,
    ovdsSupport: 'N/A — MoR portal flow',
  },
  {
    id: 'ONB-05',
    phase: 'Taxpayer Portal',
    title: 'Receive login credentials',
    description: 'The system will register your TIN and send you login credentials to access the portal.',
    required: true,
    ovdsSupport: 'EIMS credentials stored in source system config',
  },
  {
    id: 'ONB-06',
    phase: 'Taxpayer Portal',
    title: 'Login to the system',
    description: 'Use this login credential to login to the system.',
    required: true,
    ovdsSupport: 'N/A — MoR portal flow',
  },
  {
    id: 'ONB-07',
    phase: 'Taxpayer Portal',
    title: 'Login to the portal',
    description: 'Go to the login page of the portal and enter those credentials.',
    required: true,
    ovdsSupport: 'N/A — MoR portal flow',
  },
  {
    id: 'ONB-08',
    phase: 'Taxpayer Portal',
    title: 'Enable Two-factor authentication',
    description: 'Enable Two-factor authentication on the MoR portal.',
    required: true,
    ovdsSupport: 'OVDS MFA enforced for admin users (OTP 2FA)',
  },
  {
    id: 'ONB-09',
    phase: 'Source Registration',
    title: 'Go to source management and choose enterprise',
    description: 'Go to the source management section and choose enterprise.',
    required: true,
    ovdsSupport: 'Enterprise selection tracked in source system record',
  },
  {
    id: 'ONB-10',
    phase: 'Source Registration',
    title: 'Choose establishment from establishments list',
    description: 'Then choose establishment from establishments list.',
    required: true,
    ovdsSupport: 'Establishment selection tracked in source system record',
  },
  {
    id: 'ONB-11',
    phase: 'Source Registration',
    title: 'Add source and select source system numbers',
    description: 'Then, click the add source button and select source system numbers from the drop-down and click search.',
    required: true,
    ovdsSupport: 'POST /api/eims/source-systems — system number assigned by MoR',
  },
  {
    id: 'ONB-12',
    phase: 'Source Registration',
    title: 'MoR officer approval',
    description: 'The source system will show the status as pending and will go to back office for approval which will then be approved by MoR officer.',
    required: true,
    ovdsSupport: 'PUT /api/eims/source-systems/:id/approve — status APPROVED',
  },
  {
    id: 'ONB-13',
    phase: 'INSA Certificate',
    title: 'Generate RSA 2048 Key Pair & CSR',
    description: 'Generate CSR per INSA certificate_guideline.pdf (CN=TIN, serialNumber=SystemNumber).',
    required: true,
    ovdsSupport: 'POST /api/eims/certificates/generate-csr',
  },
  {
    id: 'ONB-14',
    phase: 'INSA Certificate',
    title: 'Submit Certificate Request Form to INSA',
    description: 'Email CSR + Certificate Request Form v.1 to ica@insa.gov.et.',
    required: true,
    templateFile: 'Certificate  Request form v.1.docx',
    externalUrl: 'mailto:ica@insa.gov.et',
    ovdsSupport: 'POST /api/eims/certificates/:id/submit-csr',
  },
  {
    id: 'ONB-15',
    phase: 'INSA Certificate',
    title: 'Install INSA-Issued Digital Certificate',
    description: 'Upload PEM certificate after INSA approval; verify expiry date parsed.',
    required: true,
    ovdsSupport: 'POST /api/eims/certificates/:id/install',
  },
  {
    id: 'ONB-16',
    phase: 'BSP Submission',
    title: 'Letter of Guarantee',
    description: 'Submit signed Letter of Guarantee per MoR BSP requirements.',
    required: true,
    templateFile: 'Letter of Gurantee-after comment-V1.2.docx',
    ovdsSupport: 'Document tracking in onboarding checklist (manual upload)',
  },
  {
    id: 'ONB-17',
    phase: 'BSP Submission',
    title: 'Commitment Form',
    description: 'Submit signed Commitment Form v1.1 for EIRMS integration.',
    required: true,
    templateFile: 'Commitment Form ?1.1.docx',
    ovdsSupport: 'Document tracking in onboarding checklist (manual upload)',
  },
  {
    id: 'ONB-18',
    phase: 'BSP Submission',
    title: 'Execute MoR BSP Test Cases',
    description: 'Complete IRC-P01 through IRC-P07 in sandbox; attach printouts with IRNs.',
    required: true,
    templateFile: 'MoR_BSP_Master.docx',
    ovdsSupport: 'GET /api/eims/compliance/bsp-checklist',
  },
];

/** INSA CSR field requirements per certificate_guideline.pdf */
export const INSA_CSR_REQUIREMENTS = {
  keyAlgorithm: 'RSA',
  keySize: 2048,
  signatureAlgorithm: 'SHA512withRSA',
  subjectFields: {
    C: 'Country (ET)',
    ST: 'State/Province',
    L: 'Locality',
    O: 'Organization Name (legal entity)',
    OU: 'Organizational Unit',
    CN: 'Common Name = TIN (10 digits)',
    serialNumber: 'MoR System Number',
    emailAddress: 'Contact email for INSA',
  },
  submissionEmail: 'ica@insa.gov.et',
  opensslCommand:
    'openssl req -new -key private_key.key -out csr.pem -config einvoice.cnf',
};

export type MorSourceRegistrationStep =
  | 'ENTERPRISE_SELECTED'
  | 'ESTABLISHMENT_SELECTED'
  | 'SOURCE_ADDED'
  | 'PENDING_APPROVAL'
  | 'APPROVED';
