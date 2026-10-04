#!/usr/bin/env python3
"""tech_video.py: Motion tech-stack video + ElevenLabs voice-over -> finished MP4 (and SRT subtitles).

Blocks, start times and voice settings: pitch/tech_voice.json (docs: pitch/TECH-VIDEO-VOICE.md). Standard library + ffmpeg.

  python3 pitch/tech_video.py ~/Downloads/motion_tech.mp4                 # voices (missing only) + mix
  python3 pitch/tech_video.py VIDEO --force                                # all voices again
  python3 pitch/tech_video.py VIDEO --force V5 --honest-v5                 # one block again, honest V5 wording
  python3 pitch/tech_video.py VIDEO --short V2,V7 --force V2,V7            # shorter wording for blocks that run long
  python3 pitch/tech_video.py VIDEO --mix-only                             # MP3s already there (e.g. from the web app)

Key: ELEVENLABS_API_KEY from the environment or .env.local (repo root), never from this repo. Voice: ELEVENLABS_VOICE_TECH,
else voice_id in tech_voice.json, else the Consti voice in app/story/voices.json. MP3s land in <video folder>/tech_voice/
as V1.mp3 ... V8.mp3 (web-app downloads with these names work too). Output: <video folder>/constellate_tech.mp4 + .srt.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
import sys
import urllib.error
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CFG = json.loads((Path(__file__).with_name("tech_voice.json")).read_text(encoding="utf-8"))
API = "https://api.elevenlabs.io"
MAX_TEMPO = 1.05  # VOICE-ELEVENLABS.md: at most +5 % in the edit; beyond that, shorten the text
GAP = 0.2  # seconds of air before the next block starts

# spoken spelling -> written form for the subtitles
SUBS = [("H-P-O", "HPO"), ("U-V", "uv"), ("jay-son", "JSON"), ("Next J-S", "Next.js"),
        ("Clinical Trials dot gov", "ClinicalTrials.gov"), ("...", "…")]


def env(name: str) -> str | None:
    if os.environ.get(name):
        return os.environ[name].strip()
    f = ROOT / ".env.local"
    if f.exists():
        m = re.search(rf"^{name}=(.*)$", f.read_text(encoding="utf-8"), re.M)
        if m:
            return re.sub(r"\s+#.*$", "", m.group(1)).strip().strip("'\"") or None
    return None


def voice_id() -> str:
    v = env("ELEVENLABS_VOICE_TECH") or CFG.get("voice_id")
    if not v:
        story = ROOT / "app" / "story" / "voices.json"
        if story.exists():
            v = json.loads(story.read_text(encoding="utf-8")).get("consti", {}).get("voice_id")
    if not v:
        sys.exit("no voice: set ELEVENLABS_VOICE_TECH or voice_id in pitch/tech_voice.json")
    return v


def post(path: str, body: dict, key: str) -> tuple[int, bytes]:
    req = urllib.request.Request(f"{API}{path}", data=json.dumps(body).encode(), method="POST",
                                 headers={"xi-api-key": key, "Content-Type": "application/json", "Accept": "audio/mpeg"})
    try:
        with urllib.request.urlopen(req, timeout=120) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        return e.code, e.read()


def speak(text: str, key: str, vid: str) -> tuple[bytes, str]:
    """text-to-speech with v4, then text-to-dialogue with v4, then the fallback model without the audio tag."""
    fmt, model, seed = CFG["output_format"], CFG["model"], CFG.get("seed")
    settings = {"stability": CFG["stability"], "similarity_boost": CFG["similarity_boost"]}
    tries = [
        (f"tts {model}", f"/v1/text-to-speech/{vid}?output_format={fmt}",
         {"text": text, "model_id": model, "voice_settings": settings, "seed": seed}),
        (f"dialogue {model}", f"/v1/text-to-dialogue?output_format={fmt}",
         {"inputs": [{"text": text, "voice_id": vid}], "model_id": model, "settings": {"stability": CFG["stability"]}, "seed": seed}),
        (f"tts {CFG['fallback_model']}", f"/v1/text-to-speech/{vid}?output_format={fmt}",
         {"text": re.sub(r"\[[^\]]*\]\s*", "", text), "model_id": CFG["fallback_model"], "voice_settings": settings, "seed": seed}),
    ]
    errors = []
    for via, path, body in tries:
        status, data = post(path, body, key)
        if status == 200:
            return data, via
        msg = f"{via}: {status} {data[:300].decode(errors='replace')}"
        if status in (401, 403):
            sys.exit(msg)  # key or permission problem: the other tries would fail the same way
        errors.append(msg)
    sys.exit("\n".join(errors))


def duration(path: Path) -> float:
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         capture_output=True, text=True, check=True).stdout
    return float(out.strip())


def ids(arg: str | None) -> set[str]:
    return {s.strip().upper() for s in arg.split(",") if s.strip()} if arg else set()


def main() -> None:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("video", type=Path, help="silent Motion video (50 s)")
    ap.add_argument("--audio-dir", type=Path, help="where V1.mp3 ... V8.mp3 live (default <video folder>/tech_voice)")
    ap.add_argument("--out", type=Path, help="output MP4 (default <video folder>/constellate_tech.mp4)")
    ap.add_argument("--force", nargs="?", const="ALL", help="regenerate all blocks, or a list like V2,V5")
    ap.add_argument("--short", help="use the shorter wording for these blocks, e.g. V2,V4,V7")
    ap.add_argument("--honest-v5", action="store_true", help="V5 without claiming OpenAI already ran")
    ap.add_argument("--mix-only", action="store_true", help="no API calls, mix the MP3s that are there")
    a = ap.parse_args()

    video = a.video.expanduser().resolve()
    if not video.exists():
        sys.exit(f"video not found: {video}")
    adir = (a.audio_dir or video.parent / "tech_voice").expanduser().resolve()
    out = (a.out or video.parent / "constellate_tech.mp4").expanduser().resolve()
    adir.mkdir(parents=True, exist_ok=True)
    short, force = ids(a.short), ids(a.force)
    blocks = CFG["blocks"]

    def text_of(b: dict) -> str:
        if b["id"] == "V5" and a.honest_v5:
            return b["honest"]
        if b["id"] in short and b.get("short"):
            return b["short"]
        return b["text"]

    # 1. voices
    if not a.mix_only:
        todo = [b for b in blocks if "ALL" in force or b["id"] in force or not (adir / f"{b['id']}.mp3").exists()]
        if todo:
            key = env("ELEVENLABS_API_KEY")
            if not key:
                sys.exit("ELEVENLABS_API_KEY missing (environment variable or .env.local); or use --mix-only with your own MP3s")
            vid = voice_id()
            for b in todo:
                audio, via = speak(text_of(b), key, vid)
                (adir / f"{b['id']}.mp3").write_bytes(audio)
                print(f"{b['id']}  generated via {via}")
    missing = [b["id"] for b in blocks if not (adir / f"{b['id']}.mp3").exists()]
    if missing:
        sys.exit(f"missing MP3s in {adir}: {', '.join(missing)}")

    # 2. timing: each block must end GAP before the next starts; up to +5 % tempo, otherwise shorten the text
    vlen = duration(video)
    plan, problems = [], []
    print(f"\n{'block':6}{'start':>7}{'length':>8}{'room':>7}{'tempo':>7}  status")
    for i, b in enumerate(blocks):
        f = adir / f"{b['id']}.mp3"
        length = duration(f)
        nxt = blocks[i + 1]["start"] if i + 1 < len(blocks) else vlen
        room = nxt - b["start"] - (GAP if i + 1 < len(blocks) else 0.1)
        tempo = 1.0
        status = "ok"
        if length > room:
            tempo = min(MAX_TEMPO, length / room)
            if length / tempo > room + 0.01:
                status = "TOO LONG: rerun with --short " + b["id"] + " --force " + b["id"] if b.get("short") else "TOO LONG: shorten the text"
                problems.append(b["id"])
            else:
                status = f"sped up {round((tempo - 1) * 100, 1)} %"
        plan.append((b, f, tempo, length / tempo))
        print(f"{b['id']:6}{b['start']:7.1f}{length:8.2f}{room:7.2f}{tempo:7.3f}  {status}")
    if problems:
        print(f"\nnot mixed: {', '.join(problems)} would run into the next scene")
        sys.exit(1)

    # 3. mix: delay each block to its start, sum, loudness-normalise, keep the video stream untouched
    inputs, chains = ["-i", str(video)], []
    for n, (b, f, tempo, _) in enumerate(plan, start=1):
        inputs += ["-i", str(f)]
        ms = int(round(b["start"] * 1000))
        tempo_f = f",atempo={tempo:.4f}" if tempo > 1.0 else ""
        chains.append(f"[{n}:a]aresample=48000,aformat=channel_layouts=stereo{tempo_f},adelay={ms}|{ms}[a{n}]")
    mix = "".join(f"[a{n}]" for n in range(1, len(plan) + 1))
    lufs = CFG.get("loudness_lufs", -16)
    graph = ";".join(chains) + (f";{mix}amix=inputs={len(plan)}:normalize=0:dropout_transition=0,"
                                f"apad,atrim=0:{vlen:.3f},loudnorm=I={lufs}:TP=-1.5:LRA=11,aresample=48000[mix]")
    cmd = ["ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", graph, "-map", "0:v:0", "-map", "[mix]",
           "-c:v", "copy", "-c:a", "aac", "-b:a", "192k", "-t", f"{vlen:.3f}", "-movflags", "+faststart", str(out)]
    subprocess.run(cmd, check=True)

    # 4. subtitles from the spoken text, in written form
    def ts(t: float) -> str:
        ms = int(round(t * 1000))
        return f"{ms // 3600000:02}:{ms // 60000 % 60:02}:{ms // 1000 % 60:02},{ms % 1000:03}"

    srt = []
    for n, (b, _, _, length) in enumerate(plan, start=1):
        line = re.sub(r"\[[^\]]*\]\s*", "", text_of(b)).strip()
        for spoken, written in SUBS:
            line = line.replace(spoken, written)
        srt.append(f"{n}\n{ts(b['start'])} --> {ts(min(b['start'] + length, vlen))}\n{line}\n")
    out.with_suffix(".srt").write_text("\n".join(srt), encoding="utf-8")
    print(f"\n{out}  ({duration(out):.2f} s)\n{out.with_suffix('.srt')}")


if __name__ == "__main__":
    main()
