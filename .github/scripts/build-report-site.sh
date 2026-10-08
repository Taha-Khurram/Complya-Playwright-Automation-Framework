#!/usr/bin/env bash
# Builds the GitHub Pages site from the newest Playwright reports of this workflow:
#   <out>/index.html         list of runs, newest first
#   <out>/runs/<run id>/     that run's full HTML report
#   <out>/latest/            redirects to the newest report
# Reports come from each run's "playwright-report" artifact, so only runs whose artifact
# has not expired (retention-days in playwright.yml) can be listed.
# Needs GH_TOKEN, GITHUB_REPOSITORY and GITHUB_RUN_ID (set by Actions).
set -euo pipefail

out=${1:-site}
max_runs=${MAX_RUNS:-5}
# Pages sites are limited to 1 GB
max_bytes=${MAX_BYTES:-$((800 * 1024 * 1024))}
workflow=playwright.yml

# Retries dropped connections. Fails at once for runs without a report artifact (expired,
# or the test job never got that far).
download_report() {
  local id=$1 dir=$2 attempt
  if ! gh api "repos/$GITHUB_REPOSITORY/actions/runs/$id/artifacts" \
      -q '.artifacts[] | select(.name == "playwright-report" and (.expired | not)) | .id' | grep -q .; then
    echo "Run $id: no report artifact" >&2
    return 1
  fi
  for attempt in 1 2 3; do
    rm -rf "$dir"
    gh run download "$id" -R "$GITHUB_REPOSITORY" -n playwright-report -D "$dir" && return 0
    echo "Run $id: download attempt $attempt failed" >&2
    sleep $((attempt * 10))
  done
  return 1
}

rm -rf "$out"
mkdir -p "$out/runs"
rows=""
kept=0
total=0

# This run first (still in progress, so it is not always first in the list), then older ones
ids=$( { echo "$GITHUB_RUN_ID"; gh run list -R "$GITHUB_REPOSITORY" --workflow "$workflow" -L 30 --json databaseId -q '.[].databaseId'; } | awk '!seen[$0]++')

for id in $ids; do
  [ "$kept" -ge "$max_runs" ] && break
  dir="$out/runs/$id"
  if ! download_report "$id" "$dir"; then
    rm -rf "$dir"
    # Without this run's own report there is nothing new to publish
    if [ "$id" = "$GITHUB_RUN_ID" ]; then
      echo "Could not download this run's report" >&2
      exit 1
    fi
    continue
  fi
  size=$(du -sb "$dir" | cut -f1)
  # Always keep this run's report; drop older ones that would push the site over the limit
  if [ "$id" != "$GITHUB_RUN_ID" ] && [ $((total + size)) -gt "$max_bytes" ]; then
    rm -rf "$dir"
    break
  fi
  total=$((total + size))
  kept=$((kept + 1))

  # Suite and result of the test job, e.g. "Playwright (goals)" -> goals
  info=$(gh run view "$id" -R "$GITHUB_REPOSITORY" --json createdAt,headSha,event,jobs -q '
    (.jobs[] | select(.name | startswith("Playwright")) | "\(.name | ltrimstr("Playwright (") | rtrimstr(")"))\t\(.conclusion)") as $job
    | "\(.createdAt)\t\(.headSha[0:7])\t\(.event)\t\($job)"')
  IFS=$'\t' read -r created sha event suite result <<<"$info"
  if [ "$kept" -eq 1 ]; then latest=$id; fi
  rows+="<tr><td><a href=\"runs/$id/\">#$id</a></td><td>${created/T/ }</td><td>$suite</td><td class=\"$result\">${result:-unknown}</td><td>$sha</td><td>$event</td></tr>"$'\n'
done

if [ "$kept" -eq 0 ]; then
  echo "No report artifacts found" >&2
  exit 1
fi

mkdir -p "$out/latest"
cat > "$out/latest/index.html" <<HTML
<!doctype html><meta charset="utf-8"><title>Latest report</title>
<meta http-equiv="refresh" content="0; url=../runs/$latest/">
<a href="../runs/$latest/">Latest report</a>
HTML

cat > "$out/index.html" <<HTML
<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>E2E test reports</title>
<style>
  body { font-family: system-ui, sans-serif; margin: 2rem auto; max-width: 900px; padding: 0 16px; color: #1f2328; }
  table { border-collapse: collapse; width: 100%; }
  th, td { text-align: left; padding: .5rem; border-bottom: 1px solid #d0d7de; }
  .success { color: #1a7f37; } .failure { color: #cf222e; } .cancelled, .unknown { color: #6e7781; }
</style>
</head>
<body>
<h1>E2E test reports</h1>
<p>Newest first. Each report stays at its own link while it is listed here. <a href="latest/">Open the latest report</a>.</p>
<table>
<tr><th>Run</th><th>Started (UTC)</th><th>Suite</th><th>Tests</th><th>Commit</th><th>Trigger</th></tr>
$rows</table>
</body>
</html>
HTML

echo "Published $kept report(s), $((total / 1024 / 1024)) MB"
