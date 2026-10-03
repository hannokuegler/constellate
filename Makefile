.PHONY: setup fetch slice build enrich extract reconcile analytics reproduce dev
PY=uv run --project pipeline python

setup:          ## install python + node deps
	cd pipeline && uv sync
	cd app && npm install

fetch:          ## download HPO, MONDO, Orphanet (cached in data/raw, logged in data/MANIFEST.md)
	$(PY) pipeline/01_fetch.py
slice:          ## pick the LSD cluster (MONDO:0002561 subtree) + 2-hop neighbours
	$(PY) pipeline/02_slice.py
build:          ## nodes + edges + evidence from HPO/Orphanet/MONDO
	$(PY) pipeline/03_build_graph.py
enrich:         ## ClinicalTrials, RePORTER, Europe PMC, Open Targets, Reactome
	$(PY) pipeline/04_enrich_apis.py
extract:        ## OpenAI: abstracts -> claims (needs OPENAI_API_KEY)
	$(PY) pipeline/05_openai_extract.py
reconcile:      ## OpenAI: org names -> MONDO ids (needs OPENAI_API_KEY)
	$(PY) pipeline/06_openai_reconcile.py
analytics:      ## similarity, clusters, counterexamples, coverage -> data/graph.json
	$(PY) pipeline/07_analytics.py

reproduce: fetch slice build enrich extract reconcile analytics  ## full dataset from raw sources

dev:            ## run the app locally
	cd app && npm run dev
