# Compliance Documentation

This directory contains OVDS compliance artifacts for Ethiopian Ministry of Revenue (MoR) EIMS integration and INSA cybersecurity audit requirements.

## Documents

| Document | Purpose | Status |
|----------|---------|--------|
| [`master-compliance-checklist.md`](./master-compliance-checklist.md) | Master EIRMS rollout readiness checklist covering functional requirements, test cases, and OF/AEAD/001 alignment | DRAFT |
| [`of-aead-001-cybersecurity-audit-checklist.md`](./of-aead-001-cybersecurity-audit-checklist.md) | INSA cybersecurity audit checklist for ERP/POS/Electronic Invoice Machine security controls | DRAFT |
| [`mor-eims-gap-analysis.md`](./mor-eims-gap-analysis.md) | Functional requirements gap analysis against MoR EIMS Compliance Document v1.0 | DRAFT |
| [`compliance-status-dashboard.md`](./compliance-status-dashboard.md) | Consolidated compliance status dashboard with gap summary, remediation roadmap, and compliance score | DRAFT |

## Document Relationships

```
master-compliance-checklist.md (functional tests + rollout readiness)
    │
    ├──► of-aead-001-cybersecurity-audit-checklist.md (device/hardware security controls)
    │
    └──► mor-eims-gap-analysis.md (MoR EIMS functional requirements vs OVDS implementation)
            │
            └──► compliance-status-dashboard.md (consolidated status, gaps, remediation roadmap)
```

- **Master Compliance Checklist** is the primary document for EIRMS rollout readiness. It covers invoice registration, receipts, cancellations, credit/debit memos, negative tests, notification service, setup/configuration, printing, security, data management, API integration, performance, and system-type-specific tests.
- **OF/AEAD/001 Cybersecurity Audit Checklist** supplements the master checklist with device-level cybersecurity and hardware security controls defined by INSA.
- **MoR EIMS Functional Requirements Gap Analysis** maps the MoR EIMS Compliance Document v1.0 functional requirements to OVDS implementation status and identifies gaps.
- **Compliance Status Dashboard** provides a consolidated view of all compliance areas with gap summaries, remediation roadmaps, and compliance scores.

## Usage

1. Start with the **Master Compliance Checklist** for rollout readiness assessment
2. Reference the **OF/AEAD/001 checklist** for device-level security audits
3. Use the **MoR EIMS Gap Analysis** for functional requirements traceability and gap remediation planning
4. Review the **Compliance Status Dashboard** for consolidated gap summary, remediation roadmap, and compliance score

## Regulatory References

- Ministry of Revenue (MoR) Electronic Invoice Management System (EIMS)
- Information Network Security Administration (INSA) OF/AEAD/001
- Ethiopian Revenue and Customs Authority (ERCA)
- Federal Income Tax Proclamation No. 1395/2025
