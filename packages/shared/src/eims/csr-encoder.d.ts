/**
 * Minimal DER/ASN.1 encoder for CSR generation.
 * Built on Node.js Buffer operations — no external dependencies.
 */
export declare function generateCsrPem(privateKeyPem: string, csrConfig: {
    countryName: string;
    stateOrProvinceName: string;
    localityName: string;
    organizationName: string;
    organizationalUnitName: string;
    commonName: string;
    serialNumber: string;
    emailAddress: string;
}): Promise<string>;
//# sourceMappingURL=csr-encoder.d.ts.map