"""Command-line entry point: python -m blooma"""

import argparse
import sys
import threading
import webbrowser


def main() -> None:
    if sys.version_info < (3, 10):  # noqa: UP036 - give a clear message on old interpreters
        sys.exit("Python 3.10 or newer is required.")
    for stream in (sys.stdout, sys.stderr):
        if hasattr(stream, "reconfigure"):
            stream.reconfigure(encoding="utf-8", errors="replace")

    parser = argparse.ArgumentParser(prog="blooma", description="Wildfire radar and Heat Circles")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8000)
    parser.add_argument("--no-browser", action="store_true", help="don't open a browser window")
    args = parser.parse_args()

    from .server import serve

    try:
        httpd = serve(args.host, args.port)
    except OSError:
        sys.exit(f"Port {args.port} is busy. Try: python run.py --port 8080")

    url = f"http://{args.host}:{args.port}"
    print(f"Blooma is running at {url} (Ctrl+C to stop)")
    if not args.no_browser:
        threading.Timer(0.8, webbrowser.open, args=(url,)).start()
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print()
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
