import asyncio
import base64
import hashlib
import os
import time
from collections import defaultdict
from typing import Literal, Optional

import requests
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel, Field


HF_API_BASE = "https://api-inference.huggingface.co/models"
DEFAULT_MODEL = os.environ.get("HUGGING_FACE_MODEL", "stabilityai/stable-diffusion-2-1")
RATE_LIMIT = int(os.environ.get("AI_IMAGE_RATE_LIMIT", 5))
RATE_LIMIT_WINDOW_SECONDS = int(os.environ.get("AI_IMAGE_RATE_LIMIT_WINDOW_SECONDS", 60))
CACHE_TTL_SECONDS = int(os.environ.get("AI_IMAGE_CACHE_TTL_SECONDS", 600))
REQUEST_TIMEOUT_SECONDS = int(os.environ.get("AI_IMAGE_REQUEST_TIMEOUT_SECONDS", 45))

image_generation_router = APIRouter(prefix="/api", tags=["image-generation"])

request_log = defaultdict(list)
generation_cache = {}


class ImageGenerationRequest(BaseModel):
    prompt: str = Field(min_length=3, max_length=500)
    style: str = Field(default="Realistic", max_length=60)
    width: Literal[512, 768, 1024] = 512
    height: Literal[512, 768, 1024] = 512
    guidance_scale: float = Field(default=8.5, ge=7, le=20)
    num_inference_steps: int = Field(default=30, ge=20, le=50)
    seed: Optional[int] = Field(default=None, ge=0, le=2147483647)
    model: str = Field(default=DEFAULT_MODEL, min_length=3, max_length=120)


def _clean_expired_records(ip_address: str, now: float) -> None:
    request_log[ip_address] = [
        ts for ts in request_log[ip_address] if now - ts < RATE_LIMIT_WINDOW_SECONDS
    ]


def _clean_expired_cache(now: float) -> None:
    expired_keys = [
        key for key, value in generation_cache.items() if now - value["timestamp"] >= CACHE_TTL_SECONDS
    ]
    for key in expired_keys:
        generation_cache.pop(key, None)


def _build_cache_key(payload: ImageGenerationRequest) -> str:
    raw_key = (
        f"{payload.prompt}|{payload.style}|{payload.width}x{payload.height}|"
        f"{payload.guidance_scale}|{payload.num_inference_steps}|{payload.seed}|{payload.model}"
    )
    return hashlib.sha256(raw_key.encode("utf-8")).hexdigest()


def _append_style_to_prompt(prompt: str, style: str) -> str:
    return f"{prompt}. Style: {style.lower()}"


async def _request_image(model: str, token: str, payload: dict, timeout_at: float) -> bytes:
    """Request an image from Hugging Face with retries for model-loading (503) responses.

    The function keeps retrying while there is time remaining before ``timeout_at``.
    It waits for the API's estimated loading time (bounded) between retries.
    """
    headers = {"Authorization": "Bearer " + token}
    endpoint = f"{HF_API_BASE}/{model}"

    while time.time() < timeout_at:
        remaining = max(2, int(timeout_at - time.time()))
        response = await asyncio.to_thread(
            requests.post,
            endpoint,
            headers=headers,
            json=payload,
            timeout=remaining,
        )

        if response.status_code == 200:
            return response.content

        if response.status_code == 503:
            details = {}
            try:
                details = response.json()
            except ValueError:
                details = {}
            wait_time = int(details.get("estimated_time", 2))
            await asyncio.sleep(max(1, min(wait_time, 8)))
            continue

        message = "Image generation failed. Please try again."
        try:
            error_payload = response.json()
            message = error_payload.get("error", message)
        except ValueError:
            if response.text:
                message = response.text
        raise HTTPException(status_code=502, detail=message)

    raise HTTPException(status_code=504, detail="Image generation timed out. Please try again in a few moments.")


@image_generation_router.post("/generate-image")
async def generate_image(payload: ImageGenerationRequest, request: Request):
    token = os.environ.get("HUGGING_FACE_API_KEY")
    if not token:
        raise HTTPException(status_code=500, detail="Image generation is not configured yet. Please add HUGGING_FACE_API_KEY.")

    client_ip = request.client.host if request.client else "unknown"
    now = time.time()
    _clean_expired_records(client_ip, now)
    _clean_expired_cache(now)
    if len(request_log[client_ip]) >= RATE_LIMIT:
        raise HTTPException(status_code=429, detail=f"Rate limit reached: {RATE_LIMIT} images per minute. Please wait before trying again.")
    request_log[client_ip].append(now)

    cache_key = _build_cache_key(payload)
    cached = generation_cache.get(cache_key)
    if cached and now - cached["timestamp"] < CACHE_TTL_SECONDS:
        cached_response = {**cached["response"], "cached": True}
        return cached_response

    hf_payload = {
        "inputs": _append_style_to_prompt(payload.prompt.strip(), payload.style),
        "parameters": {
            "width": payload.width,
            "height": payload.height,
            "guidance_scale": payload.guidance_scale,
            "num_inference_steps": payload.num_inference_steps,
        },
        "options": {"wait_for_model": True, "use_cache": True},
    }
    if payload.seed is not None:
        hf_payload["parameters"]["seed"] = payload.seed

    timeout_at = time.time() + REQUEST_TIMEOUT_SECONDS
    image_bytes = await _request_image(payload.model, token, hf_payload, timeout_at)
    image_base64 = base64.b64encode(image_bytes).decode("utf-8")
    response = {
        "imageBase64": image_base64,
        "mimeType": "image/png",
        "seed": payload.seed,
        "model": payload.model,
        "cached": False,
    }
    generation_cache[cache_key] = {"timestamp": now, "response": response}
    return response
