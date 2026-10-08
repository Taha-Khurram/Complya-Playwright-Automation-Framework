"""Make a Playwright HTML report safe to publish.

Traces record request headers (including auth tokens) and screenshots and videos show
production data, so this deletes the report's attachment files and replaces each link to
one with a short note pointing to the full report artifact. Without this, clicking a
screenshot or trace in the published report leads to a 404.

Usage: python3 scripts/strip_report_attachments.py [report-dir]
"""
import base64
import io
import json
import os
import re
import shutil
import sys
import zipfile

report_dir = sys.argv[1] if len(sys.argv) > 1 else "playwright-report"
index_path = os.path.join(report_dir, "index.html")

run_url = (
    f"{os.environ['GITHUB_SERVER_URL']}/{os.environ['GITHUB_REPOSITORY']}/actions/runs/{os.environ['GITHUB_RUN_ID']}"
    if os.environ.get("GITHUB_RUN_ID")
    else "the workflow run"
)
note = f"Not published. Run `npm run report:ci` locally, or download the playwright-report artifact from {run_url}."

with open(index_path, encoding="utf-8") as f:
    html = f.read()

# The report's data is a zip of JSON files embedded in index.html as base64
match = re.search(r"data:application/zip;base64,([A-Za-z0-9+/=]+)", html)
if not match:
    sys.exit(f"No embedded report data found in {index_path}")

source = zipfile.ZipFile(io.BytesIO(base64.b64decode(match.group(1))))
output = io.BytesIO()
replaced = 0

with zipfile.ZipFile(output, "w", zipfile.ZIP_DEFLATED) as target:
    for name in source.namelist():
        data = json.loads(source.read(name))
        for test in data.get("tests", []):
            for result in test.get("results", []):
                attachments = result.get("attachments", [])
                # Steps refer to attachments by position, so replace them rather than remove them.
                # Renamed too: the report shows anything named "trace" or "screenshot" as a viewer or image.
                for i, attachment in enumerate(attachments):
                    if "path" in attachment:
                        label = f"{attachment['name']} (not published)"
                        attachments[i] = {"name": label, "contentType": "text/plain", "body": note}
                        replaced += 1
        target.writestr(name, json.dumps(data))

stripped = base64.b64encode(output.getvalue()).decode()
with open(index_path, "w", encoding="utf-8") as f:
    f.write(html[: match.start(1)] + stripped + html[match.end(1) :])

shutil.rmtree(os.path.join(report_dir, "data"), ignore_errors=True)
print(f"Replaced {replaced} attachments in {index_path}")
