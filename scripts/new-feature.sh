#!/usr/bin/env bash
#
# new-feature.sh — scaffold a new feature with the canonical structure.
#
# Usage:   ./scripts/new-feature.sh <feature-name>
# Example: ./scripts/new-feature.sh bank-accounts
#
# Creates src/features/<feature-name>/ with all 8 canonical subfolders and
# stub files, so every feature has an identical shape and a working barrel.
# See AGENTS.md / docs/ARCHITECTURE.md for why all 8 always exist.
#
set -euo pipefail

# --- locate the repo (works no matter where you run this from) -------------
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(dirname "$SCRIPT_DIR")"          # scripts/ lives at repo root
FEATURES_DIR="$ROOT/src/features"

# --- validate the argument -------------------------------------------------
if [[ $# -ne 1 ]]; then
  echo "Usage: ./scripts/new-feature.sh <feature-name>" >&2
  echo "Example: ./scripts/new-feature.sh bank-accounts" >&2
  exit 1
fi

NAME="$1"

# kebab-case only: starts with a letter, then lowercase letters/digits/hyphens
if [[ ! "$NAME" =~ ^[a-z][a-z0-9-]*$ ]]; then
  echo "Error: feature name must be kebab-case (e.g. bank-accounts), got '$NAME'." >&2
  exit 1
fi

DIR="$FEATURES_DIR/$NAME"
if [[ -e "$DIR" ]]; then
  echo "Error: $DIR already exists. Refusing to overwrite." >&2
  exit 1
fi

# --- derive PascalCase + camelCase (portable: perl is on macOS & Linux) ----
PASCAL="$(echo "$NAME" | perl -pe 's/(^|-)(\w)/\U$2/g')"   # bank-accounts -> BankAccounts
CAMEL="$(echo "${PASCAL:0:1}" | tr '[:upper:]' '[:lower:]')${PASCAL:1}"  # -> bankAccounts

echo "Scaffolding feature '$NAME'  (Type: $PASCAL, service: ${CAMEL}Service)"

# --- create the 8 canonical subfolders -------------------------------------
mkdir -p "$DIR"/{api,components,constants,hooks,schemas,store,types,utils}

# subfolders that start empty get a .gitkeep so git tracks them and the
# "all 8 always exist" invariant survives a clone
for sub in components constants hooks schemas store utils; do
  touch "$DIR/$sub/.gitkeep"
done

# --- types stub ------------------------------------------------------------
cat > "$DIR/types/$NAME.ts" <<'EOF'
// Types specific to the FEATURE_KEBAB feature.
// Promote a type to src/types/ only when a SECOND feature needs it.

export interface FEATURE_PASCAL {
  id: string;
  // TODO: fill in the real shape
}

export interface FEATURE_PASCALListParams {
  page?: number;
  limit?: number;
  // TODO: add filters
  // Index signature keeps this assignable to the client's query-param type.
  [key: string]: string | number | boolean | undefined;
}
EOF

# --- service stub ----------------------------------------------------------
cat > "$DIR/api/$NAME.service.ts" <<'EOF'
import { api } from "@/lib/api/client";
// import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type { FEATURE_PASCAL, FEATURE_PASCALListParams } from "../types/FEATURE_KEBAB";

export const FEATURE_CAMELService = {
  // The client unwraps the response envelope (ADR-0007), so api.* returns the
  // inner payload directly — no `response.data` access.
  list: (params?: FEATURE_PASCALListParams) =>
    // TODO: replace the literal path with API_ENDPOINTS.<group>.<endpoint>
    api.get<{ items: FEATURE_PASCAL[]; total: number }>("/FEATURE_KEBAB", {
      params,
    }),

  getById: (id: string) =>
    api.get<FEATURE_PASCAL>(`/FEATURE_KEBAB/${id}`),
};
EOF

# --- React Query hooks stub ------------------------------------------------
cat > "$DIR/api/$NAME.queries.ts" <<'EOF'
import { useQuery } from "@tanstack/react-query";
import { FEATURE_CAMELService } from "./FEATURE_KEBAB.service";
import type { FEATURE_PASCALListParams } from "../types/FEATURE_KEBAB";

export const FEATURE_CAMELKeys = {
  all: ["FEATURE_KEBAB"] as const,
  list: (params: FEATURE_PASCALListParams) =>
    [...FEATURE_CAMELKeys.all, "list", params] as const,
  detail: (id: string) => [...FEATURE_CAMELKeys.all, "detail", id] as const,
};

export function useFEATURE_PASCAL(params: FEATURE_PASCALListParams = {}) {
  return useQuery({
    queryKey: FEATURE_CAMELKeys.list(params),
    queryFn: () => FEATURE_CAMELService.list(params),
  });
}

export function useFEATURE_PASCALById(id: string) {
  return useQuery({
    queryKey: FEATURE_CAMELKeys.detail(id),
    queryFn: () => FEATURE_CAMELService.getById(id),
    enabled: Boolean(id),
  });
}
EOF

# --- barrel (the ONLY public entry point) ----------------------------------
cat > "$DIR/index.ts" <<'EOF'
// Public API of the FEATURE_KEBAB feature.
// Export ONLY what routes or other layers need. Everything else stays internal.

// Views consumed by route pages (uncomment when built):
// export { FEATURE_PASCALListView } from "./components/FEATURE_KEBAB-list-view";

// Cross-feature types (keep internal unless a second feature needs them):
// export type { FEATURE_PASCAL } from "./types/FEATURE_KEBAB";

// Query hooks pages call directly:
export { useFEATURE_PASCAL, useFEATURE_PASCALById } from "./api/FEATURE_KEBAB.queries";
EOF

# --- substitute the tokens in every generated .ts file ---------------------
find "$DIR" -type f -name '*.ts' -print0 \
  | xargs -0 perl -pi -e "s/FEATURE_PASCAL/${PASCAL}/g; s/FEATURE_CAMEL/${CAMEL}/g; s/FEATURE_KEBAB/${NAME}/g;"

# --- done ------------------------------------------------------------------
echo "Created:"
find "$DIR" -type f | sed "s|$ROOT/||" | sort | sed 's/^/   /'
cat <<EOF

Next steps:
  1. Fill in src/features/$NAME/types/$NAME.ts with the real data shape.
  2. Add the endpoint(s) to src/lib/api/endpoints.ts and wire them into
     src/features/$NAME/api/$NAME.service.ts.
  3. Build the View component(s) in src/features/$NAME/components/ and export
     them from index.ts.
  4. Create the route shell at src/app/(staff)/$NAME/page.tsx.
  5. Add a nav entry in src/config/nav.ts if it needs a sidebar link.
  6. Run: npm run lint && npx tsc --noEmit && npm run build
EOF
