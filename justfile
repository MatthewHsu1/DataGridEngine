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

# Step 1 of 2. Bump the version and open the release pull request.
# LEVEL is patch, minor, or major. This tags nothing.
release level="patch":
    #!/usr/bin/env bash
    set -euo pipefail

    case "{{level}}" in
      patch|minor|major) ;;
      *) echo "error: level must be patch, minor, or major"; exit 1 ;;
    esac

    if ! command -v gh >/dev/null 2>&1; then
      echo "error: the GitHub CLI is missing. Install it from https://cli.github.com"
      exit 1
    fi

    # main is protected: it only takes commits through a pull request. So the
    # bump is made on its own branch and merged the normal way.
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

    # Never open a release pull request for code that does not build.
    just check

    # --no-git-tag-version: bump package.json and the lockfile, nothing else,
    # and print the new version. The tag is made later by `just release-tag`,
    # once the merged commit exists. A tag made now would point at a commit
    # that a squash or rebase merge throws away, and a wrong tag cannot be
    # unpublished.
    tag="$(npm version {{level}} --no-git-tag-version)"
    version="${tag#v}"
    release_branch="chore/release-$version"

    if git rev-parse -q --verify "refs/heads/$release_branch" >/dev/null; then
      git checkout -- package.json package-lock.json
      echo "error: branch $release_branch already exists. Finish or delete it first."
      exit 1
    fi

    # The bumped files are uncommitted, so they follow us onto the new branch
    # and main is left exactly as it was.
    git switch --create "$release_branch"
    git commit --all --message "chore: release $version"
    git push --set-upstream origin "$release_branch"

    body="$(printf '%s\n\n%s\n' \
      "Version bump to $version, made by \`just release {{level}}\`." \
      "Merging this does not publish anything. After it merges, run \`git switch main && just release-tag\` to tag $tag, which is what starts the npm publish.")"

    gh pr create --base main --title "chore: release $version" --body "$body"

    echo ""
    echo "opened the pull request for $version. Merging it does NOT publish."
    echo "next: merge it, then run  git switch main && just release-tag"

# Step 2 of 2. Tag the merged release and start the npm publish.
release-tag:
    #!/usr/bin/env bash
    set -euo pipefail

    branch="$(git rev-parse --abbrev-ref HEAD)"
    if [ "$branch" != "main" ]; then
      echo "error: you are on '$branch'. Run: git switch main"
      exit 1
    fi

    if [ -n "$(git status --porcelain)" ]; then
      echo "error: you have uncommitted changes. Commit or stash them first."
      git status --short
      exit 1
    fi

    git fetch origin --prune --tags
    git merge --ff-only origin/main

    version="$(node -p "require('./package.json').version")"
    tag="v$version"

    if git rev-parse -q --verify "refs/tags/$tag" >/dev/null; then
      # A tag left over from an earlier run. It is only correct if the code it
      # points at is the code that is now on main.
      if ! git merge-base --is-ancestor "$tag" origin/main; then
        echo "error: tag $tag exists but its commit is not on main."
        echo "delete it and run this again:  git tag --delete $tag"
        exit 1
      fi
      echo "reusing the existing tag $tag."
    else
      git tag --annotate "$tag" --message "chore: release $version"
    fi

    if git ls-remote --exit-code --tags origin "$tag" >/dev/null 2>&1; then
      echo "error: $tag is already on GitHub. This release is already done."
      exit 1
    fi

    git push origin "$tag"

    echo ""
    echo "pushed $tag. GitHub Actions is publishing it now."
