# AI Engineering Prompt: Enterprise SaaS Architecture Alignment & Bug Fix

## 🎯 Objective
Refactor and repair the full-stack SaaS application built on **Nx Monorepo (React Frontend & NestJS Backend with Prisma ORM)**. Transition the system from temporary stubs to production-ready, real-world execution. The system must bridge the **OVDS Enterprise Modules** with the **Ethiopian Ministry of Revenues (MoR/ERCA) Electronic Invoice Information Management System**, fully complying with **IFRS** and **AABE** standards.

---

## 🏗️ 1. Architecture Blueprint & Domain Separation
Enforce strict domain separation and advanced architectural layers to handle complex enterprise-to-tax-authority (MoR) interactions.
* **Remove Stubs:** Wipe out all temporary mock functions, hardcoded variables, and static answers. Implement live production code.
* **UI/UX Logic:** Align all user interfaces and workflows with **Ovds SaaS** UX/UI design patterns.
* **Data Mapping Registry:** Implement a centralized data registry to map internal enterprise schemas to official MoR/ERCA data models.
* **Localized Ledger Protocols:** Build a compliance bridging layer specifically designed for Ethiopian tax law requirements.
 

## 🛠️ 2. Core Functionality & CRUD Operations
Ensure flawless data flow from user input to final output across the following areas:
* **End-to-End CRUD:** Guarantee frontend inputs map correctly to backend controllers, executing flawless database operations via Prisma.
* **Endpoint Mapping:** Match all HTTP Methods (`GET`, `POST`, `PUT`, `DELETE`) to their correct dedicated API controllers.
* **Frontend-Backend Sync:** Explicitly align frontend views with NestJS modules. Fix missing items on the application sidebar by binding them to active, authenticated backend endpoints.
* **State & Navigation:** Ensure accurate server-side redirecting and error-free frontend routing.

---

## 🧾 3. MoR / OVDS Integration Workflow
Automate and validate the electronic invoicing reporting loop:
1. **Invoice Summary Compilation:** Extract and aggregate compliant invoices from the OVDS SaaS ledger.
2. **Transmission:** Securely submit the invoice summary report from the OVDS platform to the MoR endpoint.
3. **Verification Hook:** Parse the official MoR server response, verify the digital cryptographic receipt, and log the confirmation status back into the local compliance ledger.

---

## 🔒 4. Security, Auth, & Access Control
* **Authentication:** Repair broken login, token renewal, and session-handling mechanisms.
* **HTTP Status Error Codes:** Implement standardized RESTful error handling (e.g., `401 Unauthorized`, `403 Forbidden`, `422 Unprocessable Entity`).
* **RBAC Engine:** Audit and enforce granular Access Control Lists (ACL) matching **Company**, **User**, and **Role** permissions.

---

## 🧹 5. Codebase Cleanup, Optimization, & Refactoring
Perform an aggressive code sanitation sweep across the Nx workspace:
* **De-duplication:** Delete all duplicate files, redundant code blocks, unused code, dead components, and mismatched modules.
* **Purge Trash:** Delete `temp`, `tmp`, `refused`, and orphaned configuration files.
* **Environment Sync:** Wipe and reinstall `node_modules`, refresh `package.json`, clear global browser caches, and resolve version conflicts.
* **De-hardcode:** Replace all hardcoded strings, URLs, and static keys inside the codebase with dynamic environment variables, configuration parameters, or database references.



This markdown document contains the fully organized, structured enterprise prompt optimized for your AI coding assistant. It outlines your comprehensive cleanup tasks, the Nx React/NestJS/Prisma architectural layers, and the Ethiopian Ministry of Revenues (MoR) integration logic based on IFRS/AABE guidelines.
Let me know if you would like me to begin generating the code templates for any specific layer outlined in the file (such as the MoR data mapping registry or the NestJS reporting controller).

