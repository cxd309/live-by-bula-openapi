# live-by-bula-openapi
#
# One spec per supported Live! line. openapi-<version>.yaml is the source of truth and
# `just build` generates docs/openapi-<version>.json from it, keeping the same name on
# both sides. Everything else in docs/ is served as-is by GitHub Pages
# (branch `main`, folder `/docs`).

# Published at https://cxd309.github.io/live-by-bula-openapi/, so serve behind the same
# path prefix locally. simple-file-server prepends the "/" itself, so no leading slash.
site_dir    := "docs"
port        := "8081"
path_prefix := "live-by-bula-openapi"
url         := "http://localhost:" + port + "/" + path_prefix + "/"
ruleset     := "vacuum-ruleset.yaml"

# List available recipes
default:
    @just --list

# Format everything with dprint
fmt:
    dprint fmt

# Check formatting without writing (use in CI)
fmt-check:
    dprint check

# List the spec versions found
versions:
    @for f in openapi-*.yaml; do v="${f#openapi-}"; echo "${v%.yaml}"; done

# Generate docs/openapi-<version>.json for every spec
build: fmt
    #!/usr/bin/env bash
    set -euo pipefail
    for f in openapi-*.yaml; do
        out="{{ site_dir }}/${f%.yaml}.json"
        yq -o=json -I 2 "$f" > "$out"
        echo "==> $f -> $out"
    done

# Fail if any generated JSON is out of date with its source (use in CI)
build-check:
    #!/usr/bin/env bash
    set -euo pipefail
    stale=0
    for f in openapi-*.yaml; do
        out="{{ site_dir }}/${f%.yaml}.json"
        if [ ! -f "$out" ]; then
            echo "==> $out is missing, run \`just build\`"; stale=1; continue
        fi
        if ! yq -o=json -I 2 "$f" | diff -u "$out" - > /dev/null; then
            echo "==> $out is stale, run \`just build\`"; stale=1
        else
            echo "==> $out is up to date"
        fi
    done
    exit $stale

# Lint every spec, failing on errors (drop -e to see warnings and hints too)
validate:
    #!/usr/bin/env bash
    set -euo pipefail
    for f in openapi-*.yaml; do
        echo "==> linting $f"
        vacuum lint -d -b -e -r {{ ruleset }} "$f"
    done

# Format, build and lint -- everything CI should check
check: fmt-check build-check validate

# Serve locally with the GitHub Pages path prefix
serve: build
    @echo "==> {{ url }}"
    simple-file-server {{ site_dir }} {{ port }} {{ path_prefix }}
