import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    host = os.environ.get("HOST", "0.0.0.0")
    reload = os.environ.get("RELOAD", "false").lower() == "true"
    print(f"[AGRIOS] Starting server on http://{host}:{port} (reload={reload})...")
    uvicorn.run(
        "app.main:app",
        host=host,
        port=port,
        reload=reload
    )
