"""Serve the repository locally with enough backlog for parallel model requests."""
import argparse
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


class AuditServer(ThreadingHTTPServer):
    request_queue_size = 128


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=8766)
    args = parser.parse_args()
    directory = Path(__file__).resolve().parents[2]
    handler = partial(SimpleHTTPRequestHandler, directory=str(directory))
    with AuditServer(("127.0.0.1", args.port), handler) as server:
        print(f"Town audit: http://127.0.0.1:{args.port}/johansson-town/", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
