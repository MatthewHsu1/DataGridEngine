# Show every command in this file.
default:
    @just --list

# Run every check that CI runs.
check:
    npm run lint
    npm run typecheck
    npm run check:docs
    npm test
    npm run build

# Show the version here, the newest tag, and what npm has.
status:
    #!/usr/bin/env bash
    set -euo pipefail
    git fetch origin --prune --tags --quiet
    pkg="$(node -p "require('./package.json').version")"
    tag="$(git describe --tags --abbrev=0 2>/dev/null || echo none)"
    published="$(npm view "$(node -p "require('./package.json').name")" version 2>/dev/null || echo none)"
    echo "package.json : $pkg"
    echo "newest tag   : $tag"
    echo "on npm       : $published"

# Publish a new version. LEVEL is patch, minor, or major.
release level="patch":
    #!/usr/bin/env bash
    set -euo pipefail

    case "{{level}}" in
      patch|minor|major) ;;
      *) echo "error: level must be patch, minor, or major"; exit 1 ;;
    esac

    # A tag is only correct if it points at code that is already on GitHub.
    # Everything below refuses to tag until that is true.
    branch="$(git rev-parse --abbrev-ref HEAD)"
    if [ "$branch" != "main" ]; then
      echo "error: you are on '$branch'. Switch to main first."
      exit 1
    fi

    if [ -n "$(git status --porcelain)" ]; then
      echo "error: you have uncommitted changes. Commit or stash them first."
      git status --short
      exit 1
    fi

    git fetch origin --prune --tags
    if [ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]; then
      echo "error: main and origin/main are different. Push or pull first."
      exit 1
    fi

    # Never tag code that does not build. A bad tag cannot be unpublished.
    just check

    # npm version bumps package.json, commits, and tags -- in that order,
    # on the newest commit. Do not do these steps by hand.
    new="$(npm version {{level}} -m 'chore: release %s')"

    git push origin main
    git push origin "$new"

    echo ""
    echo "pushed $new. GitHub Actions is publishing it now."
