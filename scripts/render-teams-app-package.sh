#!/usr/bin/env bash
set -eu

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="${ENV_FILE:-$ROOT_DIR/.env}"
OUTPUT_DIR="${OUTPUT_DIR:-$ROOT_DIR/build/teams-app-package}"
ZIP_PATH="${ZIP_PATH:-$ROOT_DIR/build/meeting-recorder-teams-app.zip}"

if [ ! -f "$ENV_FILE" ]; then
  echo "Expected env file at $ENV_FILE" >&2
  exit 1
fi

set -a
. "$ENV_FILE"
set +a

BOT_APP_ID_VALUE="${BOT_APP_ID:-${AZURE_CLIENT_ID:-}}"
TEAMS_APP_ID_VALUE="${TEAMS_APP_ID:-$BOT_APP_ID_VALUE}"
BOT_SUPPORTS_VIDEO_VALUE="${BOT_SUPPORTS_VIDEO:-false}"
VALID_DOMAIN_VALUE="$(printf '%s' "${TEAMS_APP_WEBSITE_URL:-}" | sed -E 's#^https?://([^/:]+).*$#\1#')"

required_vars=(
  BOT_APP_ID_VALUE
  TEAMS_APP_ID_VALUE
  TEAMS_APP_SHORT_NAME
  TEAMS_APP_FULL_NAME
  TEAMS_APP_SHORT_DESCRIPTION
  TEAMS_APP_FULL_DESCRIPTION
  TEAMS_APP_DEVELOPER_NAME
  TEAMS_APP_WEBSITE_URL
  TEAMS_APP_PRIVACY_URL
  TEAMS_APP_TERMS_URL
  VALID_DOMAIN_VALUE
)

for required_var in "${required_vars[@]}"; do
  if [ -z "${!required_var:-}" ]; then
    echo "Missing required Teams app package value: $required_var" >&2
    exit 1
  fi
done

escape_sed() {
  printf '%s' "$1" | sed -e 's/[\/&]/\\&/g'
}

mkdir -p "$OUTPUT_DIR"
mkdir -p "$(dirname "$ZIP_PATH")"

sed \
  -e "s/__TEAMS_APP_ID__/$(escape_sed "$TEAMS_APP_ID_VALUE")/g" \
  -e "s/__BOT_APP_ID__/$(escape_sed "$BOT_APP_ID_VALUE")/g" \
  -e "s/__BOT_SUPPORTS_VIDEO__/$(escape_sed "$BOT_SUPPORTS_VIDEO_VALUE")/g" \
  -e "s/__TEAMS_APP_SHORT_NAME__/$(escape_sed "${TEAMS_APP_SHORT_NAME}")/g" \
  -e "s/__TEAMS_APP_FULL_NAME__/$(escape_sed "${TEAMS_APP_FULL_NAME}")/g" \
  -e "s/__TEAMS_APP_SHORT_DESCRIPTION__/$(escape_sed "${TEAMS_APP_SHORT_DESCRIPTION}")/g" \
  -e "s/__TEAMS_APP_FULL_DESCRIPTION__/$(escape_sed "${TEAMS_APP_FULL_DESCRIPTION}")/g" \
  -e "s/__TEAMS_APP_DEVELOPER_NAME__/$(escape_sed "${TEAMS_APP_DEVELOPER_NAME}")/g" \
  -e "s#__TEAMS_APP_WEBSITE_URL__#$(escape_sed "${TEAMS_APP_WEBSITE_URL}")#g" \
  -e "s#__TEAMS_APP_PRIVACY_URL__#$(escape_sed "${TEAMS_APP_PRIVACY_URL}")#g" \
  -e "s#__TEAMS_APP_TERMS_URL__#$(escape_sed "${TEAMS_APP_TERMS_URL}")#g" \
  -e "s/__VALID_DOMAIN__/$(escape_sed "$VALID_DOMAIN_VALUE")/g" \
  "$ROOT_DIR/appPackage/manifest.template.json" > "$OUTPUT_DIR/manifest.json"

cp "$ROOT_DIR/appPackage/color.png" "$OUTPUT_DIR/color.png"
cp "$ROOT_DIR/appPackage/outline.png" "$OUTPUT_DIR/outline.png"
rm -f "$ZIP_PATH"

(
  cd "$OUTPUT_DIR"
  zip -q -r "$ZIP_PATH" manifest.json color.png outline.png
)

echo "Rendered Teams app package to $ZIP_PATH"
