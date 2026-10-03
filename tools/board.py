#!/usr/bin/env python3
"""board.py: CLI fuer das Constellate-Teamboard (nur Standardbibliothek).

  board.py state [--json]
  board.py status [--done X ...] [--doing X ...] [--blocked X ...] [--next TEXT] [--by NAME]
                  (nicht genannte Felder bleiben wie sie sind; Liste leeren: --blocked "")
  board.py upsert <collection> <json | - | @datei> [--replace]
  board.py delete <collection> <id>
  board.py log [--since ISO | --since last] [--exclude-who NAME ...] [--json]
  board.py upload <datei>
  board.py docs [<pfad>]
  board.py mark-sync

Env: TEAMBOARD_USER und TEAMBOARD_PASS (Pflicht, Login steht im Team-Chat, nie ins Repo schreiben),
     TEAMBOARD_URL (Default https://constellate.flowary.at, lokal: http://127.0.0.1:8787),
     TEAMBOARD_WHO (Autor-Stempel, Default Orchestrator),
     TEAMBOARD_SYNC_FILE (Default ~/.constellate-board-last-sync)
Keine Secrets ins Board schreiben.
"""
import base64
import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request
import uuid
from datetime import datetime, timezone

URL = os.environ.get("TEAMBOARD_URL", "https://constellate.flowary.at").rstrip("/")
USER = os.environ.get("TEAMBOARD_USER", "")
PASSWORD = os.environ.get("TEAMBOARD_PASS", "")
WHO = os.environ.get("TEAMBOARD_WHO", "Orchestrator")
SYNC_FILE = os.path.expanduser(os.environ.get("TEAMBOARD_SYNC_FILE", "~/.constellate-board-last-sync"))


def require_credentials():
    missing = [name for name, value in (("TEAMBOARD_USER", USER), ("TEAMBOARD_PASS", PASSWORD)) if not value]
    if missing:
        sys.exit(
            "Fehlt in der Umgebung: " + ", ".join(missing) + ".\n"
            "Das Login fuers Teamboard steht im Team-Chat (nicht im Repo). Setzen mit:\n"
            "  export TEAMBOARD_USER=...  TEAMBOARD_PASS=...\n"
            "oder in der Cloud-Session als Secret/Umgebungsvariable hinterlegen. Nie committen."
        )


def request(method, path, body=None, content_type="application/json", raw=False):
    require_credentials()
    headers = {"Authorization": "Basic " + base64.b64encode(f"{USER}:{PASSWORD}".encode()).decode(), "X-Who": WHO,
               "User-Agent": "constellate-board/1.0 (+https://github.com/hannokuegler/constellate)"}
    data = None
    if body is not None:
        data = body if isinstance(body, bytes) else json.dumps(body, ensure_ascii=False).encode()
        headers["Content-Type"] = content_type
    req = urllib.request.Request(URL + path, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            payload = resp.read()
    except urllib.error.HTTPError as err:
        detail = err.read().decode("utf-8", "replace")
        sys.exit(f"HTTP {err.code} bei {method} {path}: {detail[:300]}")
    except urllib.error.URLError as err:
        sys.exit(f"Board nicht erreichbar unter {URL} ({err.reason}). TEAMBOARD_URL gesetzt?")
    return payload if raw else json.loads(payload.decode("utf-8"))


def fmt_time(iso):
    try:
        return datetime.fromisoformat(iso.replace("Z", "+00:00")).astimezone().strftime("%a %H:%M")
    except (ValueError, AttributeError):
        return iso or ""


def cmd_state(args):
    state = request("GET", "/api/state")
    if "--json" in args:
        print(json.dumps(state, ensure_ascii=False, indent=1))
        return
    status = state.get("status", {})
    print(f"STATUS (von {status.get('updated_by', '?')}, {fmt_time(status.get('updated_at'))})")
    for key, label in (("done", "fertig"), ("doing", "dran"), ("blocked", "blockiert")):
        print(f"  {label}: " + (" | ".join(status.get(key, [])) or "-"))
    print(f"  naechster Block: {status.get('next') or '-'}")
    print("\nAUFGABEN")
    for person in ("Hanno", "Osman", "Recep"):
        mine = [task for task in state["tasks"] if task.get("person") == person]
        done = sum(1 for task in mine if task["status"] == "fertig")
        print(f"  {person}: {done}/{len(mine)} fertig")
        for task in mine:
            if task["status"] != "fertig":
                print(f"    {task['id']:<3} [{task['status']:<9}] {task['title']} (bis {task.get('deadline', '?')})")
    open_todos = [todo for todo in state["todos"] if not todo.get("done")]
    print(f"\nTODOS offen: {len(open_todos)}")
    for todo in sorted(open_todos, key=lambda x: x.get("prio", "P9")):
        print(f"  {todo['id']} {todo.get('prio', '')} {todo.get('person', '')}: {todo['text'][:110]}  ({todo.get('by', '')})")
    open_decisions = [d for d in state["decisions"] if d.get("status") != "entschieden"]
    print(f"\nENTSCHEIDUNGEN offen: {len(open_decisions)}/{len(state['decisions'])}")
    for decision in state["decisions"]:
        mark = "ok " if decision.get("status") == "entschieden" else "?? "
        print(f"  {mark}{decision['id']} {decision['title']}" + (f" -> {decision['answer'][:100]}" if decision.get("answer") else ""))
    bugs = [bug for bug in state["bugs"] if not bug.get("done")]
    print(f"\nBUGS offen: {len(bugs)}")
    for bug in bugs:
        print(f"  [{bug.get('prio')}] {bug.get('screen')} | {bug.get('seen', '')} ({bug.get('by', '')})")
    print(f"\nDATEIEN: {len(state['files'])}")
    for item in state["files"]:
        print(f"  {item['name']} ({item['size']} B, {item['by']}, {fmt_time(item['ts'])})")
    print(f"\nNOTIZEN: {len(state['notes'])} (neueste 3)")
    for note in sorted(state["notes"], key=lambda x: x.get("created_at", ""), reverse=True)[:3]:
        print(f"  {note.get('by')} {fmt_time(note.get('created_at'))}: {note['text'][:140]}")


def collect(args, flag):
    values, rest, i = [], [], 0
    while i < len(args):
        if args[i] == flag and i + 1 < len(args):
            values.append(args[i + 1])
            i += 2
        else:
            rest.append(args[i])
            i += 1
    return values, rest


def cmd_status(args):
    flags = {name: collect(args, "--" + name) for name in ("done", "doing", "blocked", "next", "by")}
    current = request("GET", "/api/state").get("status", {})
    payload = {key: (flags[key][0] if flags[key][0] else current.get(key, [])) for key in ("done", "doing", "blocked")}
    payload["next"] = flags["next"][0][0] if flags["next"][0] else current.get("next", "")
    payload["updated_by"] = flags["by"][0][0] if flags["by"][0] else WHO
    print(json.dumps(request("PUT", "/api/status", payload)["status"], ensure_ascii=False))


def read_json_arg(text):
    if text == "-":
        text = sys.stdin.read()
    elif text.startswith("@"):
        with open(text[1:], encoding="utf-8") as handle:
            text = handle.read()
    try:
        return json.loads(text)
    except ValueError as err:
        sys.exit(f"Kein gueltiges JSON: {err}")


def cmd_upsert(args):
    if len(args) < 2:
        sys.exit("Aufruf: board.py upsert <collection> <json|-|@datei> [--replace]")
    query = "?replace=1" if "--replace" in args else ""
    result = request("POST", f"/api/items/{urllib.parse.quote(args[0])}{query}", read_json_arg(args[1]))
    print(json.dumps(result.get("item", result.get("items")), ensure_ascii=False))


def cmd_delete(args):
    if len(args) != 2:
        sys.exit("Aufruf: board.py delete <collection> <id>")
    print(json.dumps(request("DELETE", f"/api/items/{urllib.parse.quote(args[0])}/{urllib.parse.quote(args[1])}")))


def cmd_log(args):
    since, args = collect(args, "--since")
    excluded, args = collect(args, "--exclude-who")
    query = ""
    if since:
        value = since[0]
        if value == "last":
            value = open(SYNC_FILE, encoding="utf-8").read().strip() if os.path.exists(SYNC_FILE) else ""
        if value:
            query = "?" + urllib.parse.urlencode({"since": value})
    result = request("GET", "/api/log" + query)
    entries = [entry for entry in result["entries"] if entry.get("who") not in excluded and entry.get("who") != "system"]
    if "--json" in args:
        print(json.dumps({"now": result["now"], "entries": entries}, ensure_ascii=False, indent=1))
        return
    print(f"# {len(entries)} Aenderung(en) seit {urllib.parse.unquote(query[7:]) or 'Anfang'} (Board-Zeit jetzt: {result['now']})")
    for entry in entries:
        extra = ""
        if entry.get("changes"):
            extra = "  " + json.dumps(entry["changes"], ensure_ascii=False)[:200]
        print(f"{fmt_time(entry['ts'])} {entry['who']:<12} {entry['action']:<7} {entry.get('collection', '')}/{entry.get('id', '')} {entry.get('what', '')}{extra}")


def cmd_upload(args):
    if len(args) != 1:
        sys.exit("Aufruf: board.py upload <datei>")
    path = args[0]
    boundary = uuid.uuid4().hex
    with open(path, "rb") as handle:
        content = handle.read()
    name = os.path.basename(path)
    body = (f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{name}"\r\nContent-Type: application/octet-stream\r\n\r\n').encode() + content + f"\r\n--{boundary}--\r\n".encode()
    print(json.dumps(request("POST", "/api/upload", body, content_type=f"multipart/form-data; boundary={boundary}")["file"], ensure_ascii=False))


def cmd_docs(args):
    if args:
        sys.stdout.write(request("GET", "/api/docs/" + urllib.parse.quote(args[0]), raw=True).decode("utf-8"))
        return
    result = request("GET", "/api/docs")
    print("Docs aktiviert" if result["enabled"] else "Docs-Bereich aus (Board ohne --docs-dir)")
    for doc in result["docs"]:
        print(f"{doc['path']:<40} {doc['mtime']}  {doc['title']}")


def cmd_mark_sync(args):
    now = request("GET", "/api/log?limit=1")["now"]       # Board-Zeit, damit Uhren nicht auseinanderlaufen
    os.makedirs(os.path.dirname(SYNC_FILE), exist_ok=True)
    with open(SYNC_FILE, "w", encoding="utf-8") as handle:
        handle.write(now + "\n")
    print(f"letzter Lauf gemerkt: {now} ({SYNC_FILE})")


COMMANDS = {"state": cmd_state, "status": cmd_status, "upsert": cmd_upsert, "delete": cmd_delete,
            "log": cmd_log, "upload": cmd_upload, "docs": cmd_docs, "mark-sync": cmd_mark_sync}

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] not in COMMANDS:
        print(__doc__)
        sys.exit(2)
    COMMANDS[sys.argv[1]](sys.argv[2:])
