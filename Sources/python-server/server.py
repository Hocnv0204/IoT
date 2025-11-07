"""FastAPI server cung cấp API OCR biển số xe."""

from __future__ import annotations

import asyncio
import time
from typing import Any, Dict

import cv2
import numpy as np
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.concurrency import run_in_threadpool
from fastapi.middleware.cors import CORSMiddleware

from plate_ocr_pipeline.pipeline import PlateOCRPipeline, PlateOCRResult


app = FastAPI(title="Plate OCR API", version="1.0.0")

# Tuỳ chọn: cho phép truy cập từ frontend bên ngoài
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

pipeline: PlateOCRPipeline | None = None
pipeline_lock = asyncio.Lock()


@app.on_event("startup")
async def _load_pipeline() -> None:
    """Khởi tạo mô hình một lần khi server start."""

    global pipeline
    pipeline = await run_in_threadpool(PlateOCRPipeline)


def _bytes_to_image(data: bytes) -> np.ndarray:
    if not data:
        raise ValueError("File ảnh trống")

    array = np.frombuffer(data, dtype=np.uint8)
    image = cv2.imdecode(array, cv2.IMREAD_COLOR)
    if image is None:
        raise ValueError("Không thể giải mã file ảnh. Đảm bảo định dạng hợp lệ (jpg/png ...)")
    return image


def _result_to_dict(result: PlateOCRResult, processing_ms: float) -> Dict[str, Any]:
    return {
        "plate_text": result.text,
        "confidence": result.confidence,
        "bbox_xyxy": list(result.bbox_xyxy),
        "crop_path": str(result.crop_path) if result.crop_path else None,
        "processing_time_ms": processing_ms,
    }


@app.post("/api/plate-ocr")
async def predict_plate(file: UploadFile = File(...)) -> Dict[str, Any]:
    """Nhận file ảnh (multipart/form-data) và trả về kết quả OCR."""

    if pipeline is None:
        raise HTTPException(status_code=503, detail="Mô hình đang khởi tạo, vui lòng thử lại sau")

    try:
        file_bytes = await file.read()
        image = await run_in_threadpool(_bytes_to_image, file_bytes)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    start = time.perf_counter()
    try:
        async with pipeline_lock:
            result = await run_in_threadpool(pipeline, image)
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from exc
    except Exception as exc:  # pragma: no cover - lỗi không mong muốn
        raise HTTPException(status_code=500, detail="Lỗi nội bộ khi xử lý mô hình") from exc
    finally:
        processing_ms = (time.perf_counter() - start) * 1000

    return _result_to_dict(result, processing_ms)


@app.get("/health")
async def health_check() -> Dict[str, str]:
    if pipeline is None:
        return {"status": "initializing"}
    return {"status": "ok"}


