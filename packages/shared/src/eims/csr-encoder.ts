/**
 * Minimal DER/ASN.1 encoder for CSR generation.
 * Built on Node.js Buffer operations — no external dependencies.
 */

function encodeLength(len: number): Buffer {
  if (len < 128) {
    return Buffer.from([len]);
  }
  const bytes: number[] = [];
  let n = len;
  while (n > 0) {
    bytes.unshift(n & 0xff);
    n = Math.floor(n / 256);
  }
  return Buffer.concat([Buffer.from([0x80 | bytes.length]), Buffer.from(bytes)]);
}

function encodeTag(tag: number, constructed = false): Buffer {
  const cls = constructed ? 0x20 : 0x00;
  return Buffer.from([cls | tag]);
}

function encodeSequence(...elements: Buffer[]): Buffer {
  const content = Buffer.concat(elements);
  return Buffer.concat([encodeTag(0x10, true), encodeLength(content.length), content]);
}

function encodeSet(...elements: Buffer[]): Buffer {
  const content = Buffer.concat(elements);
  return Buffer.concat([encodeTag(0x11, true), encodeLength(content.length), content]);
}

function encodeInteger(value: number | bigint): Buffer {
  const hex = BigInt(value).toString(16);
  const padded = hex.length % 2 === 0 ? hex : '0' + hex;
  const bytes = Buffer.from(padded, 'hex');
  if (bytes[0] & 0x80) {
    return Buffer.concat([encodeTag(0x02), encodeLength(bytes.length + 1), Buffer.from([0x00]), bytes]);
  }
  return Buffer.concat([encodeTag(0x02), encodeLength(bytes.length), bytes]);
}

function encodeOctetString(data: Buffer): Buffer {
  return Buffer.concat([encodeTag(0x04), encodeLength(data.length), data]);
}

function encodeBitString(data: Buffer, unusedBits = 0): Buffer {
  const content = Buffer.concat([Buffer.from([unusedBits]), data]);
  return Buffer.concat([encodeTag(0x03), encodeLength(content.length), content]);
}

function encodeBoolean(value: boolean): Buffer {
  return Buffer.concat([encodeTag(0x01), encodeLength(1), Buffer.from([value ? 0xff : 0x00])]);
}

function encodeNull(): Buffer {
  return Buffer.from([0x05, 0x00]);
}

function encodeOid(oid: string): Buffer {
  const parts = oid.split('.').map(Number);
  const bytes: number[] = [40 * parts[0] + parts[1]];
  for (let i = 2; i < parts.length; i++) {
    const n = parts[i];
    if (n < 128) {
      bytes.push(n);
    } else if (n < 0x4000) {
      bytes.push(0x80 | (n >> 7), n & 0x7f);
    } else if (n < 0x200000) {
      bytes.push(0x80 | (n >> 14), 0x80 | ((n >> 7) & 0x7f), n & 0x7f);
    } else {
      bytes.push(0x80 | (n >> 21), 0x80 | ((n >> 14) & 0x7f), 0x80 | ((n >> 7) & 0x7f), n & 0x7f);
    }
  }
  return Buffer.concat([encodeTag(0x06), encodeLength(bytes.length), Buffer.from(bytes)]);
}

function encodeUtf8String(str: string): Buffer {
  const data = Buffer.from(str, 'utf8');
  return Buffer.concat([encodeTag(0x0c), encodeLength(data.length), data]);
}

function encodePrintableString(str: string): Buffer {
  const data = Buffer.from(str, 'ascii');
  return Buffer.concat([encodeTag(0x13), encodeLength(data.length), data]);
}

function encodeIA5String(str: string): Buffer {
  const data = Buffer.from(str, 'ascii');
  return Buffer.concat([encodeTag(0x16), encodeLength(data.length), data]);
}

function encodeContextTag(tag: number, ...elements: Buffer[]): Buffer {
  const content = Buffer.concat(elements);
  return Buffer.concat([encodeTag(tag, true), encodeLength(content.length), content]);
}

function encodeAttribute(typeOid: string, value: Buffer): Buffer {
  return encodeSequence(encodeOid(typeOid), encodeContextTag(0x00, value));
}

const OID_COMMON_NAME = '2.5.4.3';
const OID_SURNAME = '2.5.4.4';
const OID_SERIAL_NUMBER = '2.5.4.5';
const OID_COUNTRY = '2.5.4.6';
const OID_LOCALITY = '2.5.4.7';
const OID_STATE = '2.5.4.8';
const OID_ORGANIZATION = '2.5.4.10';
const OID_ORG_UNIT = '2.5.4.11';
const OID_EMAIL = '1.2.840.113549.1.9.1';
const OID_RSA_ENCRYPTION = '1.2.840.113549.1.1.1';

function buildName(config: {
  countryName: string;
  stateOrProvinceName: string;
  localityName: string;
  organizationName: string;
  organizationalUnitName: string;
  commonName: string;
  serialNumber: string;
  emailAddress: string;
}): Buffer {
  const attrs = [
    encodeAttribute(OID_COUNTRY, encodePrintableString(config.countryName)),
    encodeAttribute(OID_STATE, encodeUtf8String(config.stateOrProvinceName)),
    encodeAttribute(OID_LOCALITY, encodeUtf8String(config.localityName)),
    encodeAttribute(OID_ORGANIZATION, encodeUtf8String(config.organizationName)),
    encodeAttribute(OID_ORG_UNIT, encodeUtf8String(config.organizationalUnitName)),
    encodeAttribute(OID_SERIAL_NUMBER, encodePrintableString(config.serialNumber)),
    encodeAttribute(OID_COMMON_NAME, encodeUtf8String(config.commonName)),
    encodeAttribute(OID_EMAIL, encodeIA5String(config.emailAddress)),
  ];
  return encodeSequence(encodeSet(...attrs));
}

function buildSPKI(publicKeyDer: Buffer): Buffer {
  const algo = encodeSequence(encodeOid(OID_RSA_ENCRYPTION), encodeNull());
  const key = encodeBitString(publicKeyDer);
  return encodeSequence(algo, key);
}

export async function generateCsrPem(privateKeyPem: string, csrConfig: {
  countryName: string;
  stateOrProvinceName: string;
  localityName: string;
  organizationName: string;
  organizationalUnitName: string;
  commonName: string;
  serialNumber: string;
  emailAddress: string;
}): Promise<string> {
  const crypto = await import('crypto');

  const publicKeyDer = crypto.createPublicKey(privateKeyPem).export({ type: 'spki', format: 'der' });
  const name = buildName(csrConfig);
  const spki = buildSPKI(publicKeyDer);
  const cri = encodeSequence(encodeInteger(0), name, spki);

  const sign = crypto.createSign('SHA512');
  sign.update(cri);
  sign.end();
  const signature = sign.sign(privateKeyPem);

  const algoId = encodeSequence(encodeOid('1.2.840.113549.1.1.11'), encodeNull());
  const sig = encodeBitString(signature);
  const csr = encodeSequence(cri, algoId, sig);

  const b64 = csr.toString('base64');
  const lines = b64.match(/.{1,64}/g)?.join('\n') || b64;
  return `-----BEGIN CERTIFICATE REQUEST-----\n${lines}\n-----END CERTIFICATE REQUEST-----\n`;
}
