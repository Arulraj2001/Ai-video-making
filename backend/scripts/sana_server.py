"""
SANA-Sprint 1.6B Local Inference Microservice
Runs a standalone FastAPI server on port 8001.

Usage:
    python backend/scripts/sana_server.py
"""

import argparse
import base64
from io import BytesIO
import logging
import os
import sys

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

logging.basicConfig(level=logging.INFO, format="%(asctime)s - [%(levelname)s] - %(message)s")
logger = logging.getLogger("sana_server")

app = FastAPI(title="SANA-Sprint 1.6B Local Server", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline = None

class GenerateRequest(BaseModel):
    prompt: str
    width: int = 1024
    height: int = 1024
    num_inference_steps: int = 2
    guidance_scale: float = 1.0

def load_pipeline():
    global pipeline
    try:
        import torch
        from diffusers import SanaSprintPipeline

        model_id = "Efficient-Large-Model/Sana_Sprint_1.6B_1024px_diffusers"
        logger.info(f"Loading SANA-Sprint model: {model_id}...")
        
        device = "cuda" if torch.cuda.is_available() else ("mps" if torch.backends.mps.is_available() else "cpu")
        dtype = torch.bfloat16 if device == "cuda" else torch.float32

        hf_token = os.getenv("HF_API_KEY") or os.getenv("HUGGINGFACE_API_KEY")
        kwargs = {"dtype": dtype}
        if hf_token:
            kwargs["token"] = hf_token

        pipe = SanaSprintPipeline.from_pretrained(model_id, **kwargs)
        if device == "cuda":
            try:
                pipe.enable_model_cpu_offload()
                logger.info("Enabled CPU offload for optimal VRAM usage (<8GB)")
            except Exception:
                pipe.to(device)
        else:
            pipe.to(device)

        pipeline = pipe
        logger.info(f"SANA-Sprint model loaded successfully on {device}!")
    except ImportError as e:
        logger.warning(
            f"PyTorch or Diffusers with SanaSprintPipeline not installed ({e}). "
            "Server running in placeholder mode."
        )
        pipeline = "placeholder"
    except Exception as e:
        logger.error(f"Failed to load SANA-Sprint weights: {e}")
        pipeline = "placeholder"

@app.on_event("startup")
def startup_event():
    import threading
    thread = threading.Thread(target=load_pipeline, daemon=True)
    thread.start()

from fastapi.responses import HTMLResponse

@app.get("/", response_class=HTMLResponse)
def index():
    is_ready = pipeline is not None and pipeline != "placeholder"
    status_badge = "Ready (GPU Active)" if is_ready else ("Loading Model..." if pipeline is None else "Placeholder Mode")
    color = "#10b981" if is_ready else "#f59e0b"
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>SANA-Sprint 1.6B GPU Server</title>
        <style>
            body {{ font-family: system-ui, sans-serif; background: #0f172a; color: #f8fafc; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; }}
            .card {{ background: #1e293b; padding: 2rem; border-radius: 1rem; border: 1px solid #334155; max-width: 480px; text-align: center; box-shadow: 0 10px 25px rgba(0,0,0,0.5); }}
            h1 {{ font-size: 1.5rem; margin-bottom: 0.5rem; }}
            .badge {{ display: inline-block; padding: 0.35rem 0.75rem; border-radius: 9999px; font-weight: 600; font-size: 0.85rem; background: {color}; color: #000; margin: 1rem 0; }}
            p {{ color: #94a3b8; font-size: 0.9rem; line-height: 1.5; }}
            code {{ background: #0f172a; padding: 0.2rem 0.4rem; border-radius: 0.25rem; font-family: monospace; color: #38bdf8; }}
        </style>
    </head>
    <body>
        <div class="card">
            <h1>🚀 SANA-Sprint 1.6B GPU Server</h1>
            <div class="badge">{status_badge}</div>
            <p>Target Device: <strong>NVIDIA GeForce RTX 2050</strong></p>
            <p>Inference Endpoint: <code>/generate</code></p>
            <p>Health Endpoint: <a href="/health" style="color: #38bdf8;">/health</a></p>
        </div>
    </body>
    </html>
    """

@app.get("/health")
def health():
    is_ready = pipeline is not None
    is_real = pipeline is not None and pipeline != "placeholder"
    return {
        "status": "ready" if is_ready else "loading",
        "model": "SANA-Sprint 1.6B",
        "engine": "diffusers" if is_real else "placeholder",
    }

@app.post("/generate")
def generate(req: GenerateRequest):
    if pipeline is None:
        raise HTTPException(status_code=503, detail="Model is still loading...")

    try:
        if pipeline == "placeholder":
            from PIL import Image, ImageDraw
            img = Image.new("RGB", (req.width, req.height), color=(20, 24, 33))
            draw = ImageDraw.Draw(img)
            draw.text((40, 40), f"[SANA-Sprint 1.6B Placeholder]\n{req.prompt[:80]}", fill=(220, 230, 245))
        else:
            result = pipeline(
                prompt=req.prompt,
                height=req.height,
                width=req.width,
                num_inference_steps=req.num_inference_steps,
                guidance_scale=req.guidance_scale,
            )
            img = result.images[0]

        buffer = BytesIO()
        img.save(buffer, format="PNG")
        b64_str = base64.b64encode(buffer.getvalue()).decode("utf-8")
        return {"image_base64": b64_str}
    except Exception as e:
        logger.error(f"Generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="SANA-Sprint 1.6B Local Server")
    parser.add_argument("--host", default="127.0.0.1", help="Host IP")
    parser.add_argument("--port", type=int, default=8001, help="Port")
    args = parser.parse_args()

    uvicorn.run(app, host=args.host, port=args.port)
