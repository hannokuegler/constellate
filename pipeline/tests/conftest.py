"""Shared fixtures: load the numbered pipeline scripts as modules and fake the OpenAI client (no network, no key)."""
from __future__ import annotations

import hashlib
import importlib.util
import sys
from pathlib import Path
from types import SimpleNamespace

import numpy as np
import pytest

PIPELINE = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(PIPELINE))


def load_script(file_name: str, module_name: str):
    if module_name in sys.modules:
        return sys.modules[module_name]
    spec = importlib.util.spec_from_file_location(module_name, PIPELINE / file_name)
    module = importlib.util.module_from_spec(spec)
    sys.modules[module_name] = module
    spec.loader.exec_module(module)
    return module


@pytest.fixture(scope="session")
def extract_mod():
    return load_script("05_openai_extract.py", "openai_extract")


@pytest.fixture(scope="session")
def reconcile_mod():
    return load_script("06_openai_reconcile.py", "openai_reconcile")


@pytest.fixture(scope="session")
def sample_mod():
    return load_script("extract_sample.py", "extract_sample")


@pytest.fixture(autouse=True)
def no_real_openai(monkeypatch, tmp_path):
    """Never read the repo's .env.local and never see a real key or model from the shell."""
    import openai_config

    monkeypatch.setattr(openai_config, "ENV_FILE", tmp_path / "no.env")
    for var in ["OPENAI_API_KEY", *openai_config.MODEL_VARS.values(), *openai_config.REASONING_VARS.values(),
                "OPENAI_PRICE_EXTRACT", "OPENAI_PRICE_JUDGE", "OPENAI_PRICE_EMBED"]:
        monkeypatch.delenv(var, raising=False)


def trigram_vector(text: str, dims: int = 512) -> list[float]:
    """Deterministic fake embedding: hashed character trigrams, so similar names get similar vectors."""
    vector = np.zeros(dims, dtype=np.float32)
    padded = f"  {text.lower()}  "
    for i in range(len(padded) - 2):
        vector[int(hashlib.md5(padded[i:i + 3].encode()).hexdigest(), 16) % dims] += 1.0
    return vector.tolist()


class FakeResponses:
    def __init__(self, handler):
        self.handler = handler
        self.calls: list[dict] = []

    def parse(self, **kwargs):
        self.calls.append(kwargs)
        payload = self.handler(kwargs)
        if isinstance(payload, Exception):
            raise payload
        return SimpleNamespace(output_parsed=kwargs["text_format"].model_validate(payload),
                               usage=SimpleNamespace(input_tokens=1000, output_tokens=200))


class FakeEmbeddings:
    def __init__(self):
        self.calls: list[list[str]] = []

    def create(self, model, input):  # noqa: A002 - SDK signature
        self.calls.append(list(input))
        return SimpleNamespace(data=[SimpleNamespace(index=i, embedding=trigram_vector(t)) for i, t in enumerate(input)],
                               usage=SimpleNamespace(prompt_tokens=5 * len(input), total_tokens=5 * len(input)))


class FakeClient:
    def __init__(self, handler=None, model_ids=None):
        self.responses = FakeResponses(handler or (lambda kwargs: {"claims": []}))
        self.embeddings = FakeEmbeddings()
        self.models = SimpleNamespace(list=lambda: SimpleNamespace(data=[SimpleNamespace(id=m) for m in (model_ids or [])]))


@pytest.fixture
def fake_client():
    return FakeClient
