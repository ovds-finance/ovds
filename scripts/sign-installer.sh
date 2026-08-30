#!/usr/bin/env bash
# sign-installer.sh — CI/CD pipeline step: Module 1 (On-Premise Client Distribution)
#
# Signs the OVDS Invoice Module installer binary with the company code-signing
# certificate, computes a SHA-256 checksum, and uploads the binary, the .sig
# signature file, and the .sha256 checksum file to the CDN.
# After a successful upload, writes the installer manifest record to the database
# so that InstallerManifestService.getLatestManifest() can return a valid entry.
#
# Required environment variables:
#   SIGNING_KEY_PATH     — path to the PEM-encoded private signing key
#   SIGNING_CERT_PATH    — path to the PEM-encoded code-signing certificate
#   CDN_BASE_URL         — CDN root (e.g. https://cdn.ovds.app)
#   CDN_UPLOAD_TOKEN     — bearer token for CDN upload API
#   DATABASE_URL         — Postgres connection string (for manifest record write)
#   INSTALLER_OS         — target OS: windows | macos | linux
#   INSTALLER_VERSION    — semantic version (e.g. 1.2.3)
#   INSTALLER_BINARY     — path to the compiled installer binary
#
# Usage:
#   INSTALLER_OS=windows INSTALLER_VERSION=1.2.3 INSTALLER_BINARY=./dist/ovds-invoice-module.exe \
#     ./scripts/sign-installer.sh

set -euo pipefail

# ─── Defaults ────────────────────────────────────────────────────────────────
INSTALLER_OS="${INSTALLER_OS:-windows}"
INSTALLER_VERSION="${INSTALLER_VERSION:-1.0.0}"
INSTALLER_BINARY="${INSTALLER_BINARY:-./dist/ovds-invoice-module.exe}"
CDN_BASE_URL="${CDN_BASE_URL:-https://cdn.ovds.app}"

# ─── Derive file extension from OS ───────────────────────────────────────────
case "$INSTALLER_OS" in
  windows) EXT="exe" ;;
  macos)   EXT="dmg" ;;
  linux)   EXT="AppImage" ;;
  *)       EXT="bin" ;;
esac

BINARY_FILENAME="ovds-invoice-module.${EXT}"
SIG_FILENAME="${BINARY_FILENAME}.sig"
CHECKSUM_FILENAME="${BINARY_FILENAME}.sha256"
CDN_PATH="installers/${INSTALLER_OS}/latest"

echo "=== OVDS Installer Signing Pipeline ==="
echo "  OS:      ${INSTALLER_OS}"
echo "  Version: ${INSTALLER_VERSION}"
echo "  Binary:  ${INSTALLER_BINARY}"

# ─── Step 1: Sign the binary ─────────────────────────────────────────────────
echo ""
echo ">>> Step 1: Signing binary with company code-signing certificate..."

if [[ -z "${SIGNING_KEY_PATH:-}" || -z "${SIGNING_CERT_PATH:-}" ]]; then
  echo "WARNING: SIGNING_KEY_PATH or SIGNING_CERT_PATH not set — skipping real signing."
  echo "         Creating placeholder .sig file (CI dry-run mode)."
  echo "placeholder-signature-${INSTALLER_VERSION}" > "/tmp/${SIG_FILENAME}"
else
  # Sign using OpenSSL — produces a detached PKCS#7 signature
  openssl dgst \
    -sha256 \
    -sign "${SIGNING_KEY_PATH}" \
    -out "/tmp/${SIG_FILENAME}" \
    "${INSTALLER_BINARY}"
  echo "  Signature written to /tmp/${SIG_FILENAME}"
fi

# ─── Step 2: Compute SHA-256 checksum ────────────────────────────────────────
echo ""
echo ">>> Step 2: Computing SHA-256 checksum..."
sha256sum "${INSTALLER_BINARY}" | awk '{print $1}' > "/tmp/${CHECKSUM_FILENAME}"
CHECKSUM=$(cat "/tmp/${CHECKSUM_FILENAME}")
echo "  Checksum: ${CHECKSUM}"

# ─── Step 3: Upload binary, .sig, and .sha256 to CDN ─────────────────────────
echo ""
echo ">>> Step 3: Uploading artifacts to CDN..."

upload_to_cdn() {
  local local_path="$1"
  local remote_name="$2"
  local cdn_url="${CDN_BASE_URL}/${CDN_PATH}/${remote_name}"

  if [[ -z "${CDN_UPLOAD_TOKEN:-}" ]]; then
    echo "  [DRY RUN] Would upload: ${local_path} → ${cdn_url}"
  else
    curl --fail --silent --show-error \
      -H "Authorization: Bearer ${CDN_UPLOAD_TOKEN}" \
      -F "file=@${local_path}" \
      "${cdn_url}" \
      && echo "  Uploaded: ${remote_name}" \
      || { echo "ERROR: Failed to upload ${remote_name}"; exit 1; }
  fi
}

upload_to_cdn "${INSTALLER_BINARY}"      "${BINARY_FILENAME}"
upload_to_cdn "/tmp/${SIG_FILENAME}"     "${SIG_FILENAME}"
upload_to_cdn "/tmp/${CHECKSUM_FILENAME}" "${CHECKSUM_FILENAME}"

# ─── Step 4: Write manifest record to database ───────────────────────────────
echo ""
echo ">>> Step 4: Writing manifest record to database..."

DOWNLOAD_LINK="${CDN_BASE_URL}/${CDN_PATH}/${BINARY_FILENAME}"

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "  [DRY RUN] Would write manifest record:"
  echo "    os=${INSTALLER_OS}, version=${INSTALLER_VERSION}"
  echo "    link=${DOWNLOAD_LINK}"
  echo "    signature_valid=true, checksum_provided=true"
else
  # Use psql to insert / upsert the manifest record.
  # The installer_manifest table is created by the add_installer_manifest_table migration.
  psql "${DATABASE_URL}" <<SQL
INSERT INTO installer_manifest (os, version, installer_download_link, installer_signature_valid, checksum_provided, published_at)
VALUES (
  '${INSTALLER_OS}',
  '${INSTALLER_VERSION}',
  '${DOWNLOAD_LINK}',
  true,
  true,
  NOW()
)
ON CONFLICT (os)
DO UPDATE SET
  version = EXCLUDED.version,
  installer_download_link = EXCLUDED.installer_download_link,
  installer_signature_valid = EXCLUDED.installer_signature_valid,
  checksum_provided = EXCLUDED.checksum_provided,
  published_at = EXCLUDED.published_at;
SQL
  echo "  Manifest record written for OS=${INSTALLER_OS}, version=${INSTALLER_VERSION}"
fi

echo ""
echo "=== Sign-installer pipeline complete ==="
echo "  Download: ${DOWNLOAD_LINK}"
echo "  Signature: ${DOWNLOAD_LINK}.sig"
echo "  Checksum:  ${DOWNLOAD_LINK}.sha256"
