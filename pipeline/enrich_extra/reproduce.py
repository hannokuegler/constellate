"""Run the existing pipeline with a robots-aware network guard, without editing it.

Usage: uv run --project pipeline python pipeline/enrich_extra/reproduce.py fetch
The GitHub REST release-asset API is used instead of robots-disallowed web downloads.
"""
from __future__ import annotations

import argparse
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import subprocess
import sys
import time

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "pipeline"))


def load(name):
    spec = importlib.util.spec_from_file_location("reproduce_step", ROOT / "pipeline" / name)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("step", choices=["fetch", "build", "enrich", "analytics", "compare"])
    args = parser.parse_args()
    out = ROOT / "data/enrich"
    out.mkdir(parents=True, exist_ok=True)
    started = time.monotonic()
    result = {"step": args.step}
    if args.step == "fetch":
        from enrich_extra.common import fetch_json, fetch_document
        import httpx
        module = load("01_fetch.py")
        assets = {}
        for repo in ["obophenotype/human-phenotype-ontology", "monarch-initiative/mondo"]:
            release = fetch_json("github", f"https://api.github.com/repos/{repo}/releases/latest")
            for asset in release.data["assets"]:
                if asset["name"] in module.SOURCES:
                    assets[asset["name"]] = asset
        # Only a public, documented REST API replaces the web download URL.
        original = dict(module.SOURCES)
        for name, asset in assets.items():
            module.SOURCES[name] = (asset["url"], original[name][1])
        original_download = module.download

        def download(url, target, client):
            # Resolve redirects one at a time and check robots before requesting each host.
            from enrich_extra.common import check_robots
            current = url
            for _ in range(10):
                check_robots(current)
                with client.stream("GET", current, follow_redirects=False,
                                   headers={"Accept": "application/octet-stream"}) as response:
                    if response.is_redirect:
                        current = str(response.url.join(response.headers["location"]))
                        continue
                    response.raise_for_status()
                    tmp = target.with_suffix(target.suffix + ".part")
                    with tmp.open("wb") as handle:
                        for chunk in response.iter_bytes(1 << 20):
                            handle.write(chunk)
                    tmp.replace(target)
                    return
            raise RuntimeError("too many release download redirects")

        module.download = download
        result["exit_code"] = module.main()
        result["files"] = [{"file": name, "url": url,
                             "bytes": (module.RAW / name).stat().st_size,
                             "sha256": module.sha256(module.RAW / name)}
                            for name, (url, _) in module.SOURCES.items() if (module.RAW / name).exists()]
    elif args.step in {"build", "analytics"}:
        scripts = ["02_slice.py", "03_build_graph.py"] if args.step == "build" else ["07_analytics.py", "validate.py"]
        result["commands"] = []
        for script in scripts:
            code = subprocess.run(["uv", "run", "--project", "pipeline", "python", f"pipeline/{script}"], cwd=ROOT).returncode
            result["commands"].append({"script": script, "exit_code": code})
            if code:
                break
    elif args.step == "enrich":
        from enrich import http
        from enrich_extra.common import check_robots
        endpoints = {"ctgov": "https://clinicaltrials.gov/api/v2/studies",
                     "europepmc": "https://www.ebi.ac.uk/europepmc/webservices/rest/search",
                     "reporter": "https://api.reporter.nih.gov/v2/projects/search",
                     "opentargets": "https://api.platform.opentargets.org/api/v4/graphql",
                     "mygene": "https://mygene.info/v3/query",
                     "reactome": "https://reactome.org/ContentService/data/mapping/UniProt/X/pathways",
                     "clinvar": "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"}
        allowed, blocked = [], {}
        for source, url in endpoints.items():
            try:
                check_robots(url)
                allowed.append(source)
            except http.FetchError as exc:
                blocked[source] = str(exc)
        result.update(allowed=allowed, blocked=blocked)
        (out / "extra_phase_a_policy.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
        module = load("04_enrich_apis.py")
        sys.argv = ["04_enrich_apis.py", "--sources", ",".join(allowed)]
        result["exit_code"] = module.main()
    else:
        changed = subprocess.check_output(["git", "diff", "--name-only", "--", "app/public/data"], cwd=ROOT, text=True).splitlines()
        substantive, timestamp_only = [], []
        for name in changed:
            before = json.loads(subprocess.check_output(["git", "show", f"HEAD:{name}"], cwd=ROOT))
            after = json.loads((ROOT / name).read_text(encoding="utf-8"))
            if isinstance(before, dict):
                before.pop("built_at", None)
                after.pop("built_at", None)
            (timestamp_only if before == after else substantive).append(name)
        result.update(changed=len(changed), timestamp_only=timestamp_only, substantive_count=len(substantive),
                      substantive_examples=substantive[:20])
        print(json.dumps(result, indent=2))
    result["seconds"] = round(time.monotonic() - started, 3)
    (out / f"extra_phase_a_{args.step}.json").write_text(json.dumps(result, indent=2), encoding="utf-8")
    return result.get("exit_code", max((c["exit_code"] for c in result.get("commands", [])), default=0))


if __name__ == "__main__":
    raise SystemExit(main())
