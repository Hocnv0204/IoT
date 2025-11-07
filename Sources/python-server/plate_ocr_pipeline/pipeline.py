"""Pipeline nhận diện và đọc biển số xe sử dụng mô hình sẵn có trong dự án.

Quy trình:
- Nhận đường dẫn ảnh đầu vào.
- Dùng mô hình YOLO đã huấn luyện (`weights/plate_yolov8n_320_2024.pt`) để tìm
  toạ độ biển số trong ảnh.
- Cắt vùng biển số và đọc ký tự bằng PaddleOCR.

Chạy thử:

```
python -m plate_ocr_pipeline.pipeline --image image/xe1.jpg
```
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
from typing import Optional, Tuple

import cv2
import numpy as np
import torch
from paddleocr import PaddleOCR
from ultralytics import YOLO

from utils.utils import crop_expanded_plate


@dataclass
class PlateOCRResult:
    """Kết quả đọc biển số."""

    text: str
    confidence: float
    bbox_xyxy: Tuple[int, int, int, int]
    crop_path: Optional[Path] = None


class PlateOCRPipeline:
    """Pipeline nhận diện biển số và OCR."""

    def __init__(
        self,
        plate_weight: str = "weights/plate_yolov8n_320_2024.pt",
        device: str = "auto",
        conf_thres: float = 0.3,
        expand_ratio: float = 0.2,
        ocr_kwargs: Optional[dict] = None,
    ) -> None:
        self.device = self._resolve_device(device)
        self.conf_thres = conf_thres
        self.expand_ratio = expand_ratio

        self.detector = YOLO(plate_weight, task="detect")
        try:
            self.detector.to(self.device)
        except Exception:
            pass

        ocr_settings = dict(
            use_doc_orientation_classify=False,
            use_doc_unwarping=False,
            use_textline_orientation=False,
        )
        if ocr_kwargs:
            ocr_settings.update(ocr_kwargs)

        if self.device.startswith("cuda") and torch.cuda.is_available():
            ocr_settings.setdefault("use_gpu", True)

        self.ocr = PaddleOCR(**ocr_settings)

    def _resolve_device(self, requested: Optional[str]) -> str:
        if not requested or requested.lower() == "auto":
            return "cuda:0" if torch.cuda.is_available() else "cpu"
        requested = requested.strip().lower()
        if requested.isdigit():
            return f"cuda:{requested}" if torch.cuda.is_available() else "cpu"
        if requested == "cuda" and torch.cuda.is_available():
            return "cuda:0"
        if requested.startswith("cuda") and not torch.cuda.is_available():
            return "cpu"
        return requested

    def _ensure_rgb(self, image: np.ndarray) -> np.ndarray:
        if image.ndim == 2:
            return cv2.cvtColor(image, cv2.COLOR_GRAY2BGR)
        if image.shape[2] == 3:
            return image
        if image.shape[2] == 4:
            return cv2.cvtColor(image, cv2.COLOR_BGRA2BGR)
        raise ValueError("Ảnh đầu vào không hợp lệ")

    def _clip_box(self, box: np.ndarray, shape: Tuple[int, int, int]) -> Tuple[int, int, int, int]:
        h, w = shape[:2]
        x1, y1, x2, y2 = box
        x1 = int(max(0, min(w, x1)))
        y1 = int(max(0, min(h, y1)))
        x2 = int(max(0, min(w, x2)))
        y2 = int(max(0, min(h, y2)))
        if x2 <= x1 or y2 <= y1:
            raise ValueError("Vùng biển số sau khi cắt không hợp lệ")
        return x1, y1, x2, y2

    def detect_plate(self, image: np.ndarray) -> Tuple[np.ndarray, Tuple[int, int, int, int]]:
        detections = self.detector(
            image,
            imgsz=320,
            conf=self.conf_thres,
            device=self.device,
            verbose=False,
        )[0]

        boxes = detections.boxes
        if boxes is None or len(boxes) == 0:
            raise ValueError("Không phát hiện được biển số trong ảnh")

        confidences = boxes.conf.cpu().numpy()
        best_idx = int(confidences.argmax())
        best_box = boxes.xyxy[best_idx].cpu().numpy().astype(int)
        clipped_box = self._clip_box(best_box, image.shape)
        plate_crop = crop_expanded_plate(np.array(clipped_box), image, self.expand_ratio)
        if plate_crop.size == 0:
            raise ValueError("Không thể cắt được vùng biển số")
        return plate_crop, clipped_box

    def read_plate(self, plate_image: np.ndarray) -> Tuple[str, float]:
        results = self.ocr.predict(input=plate_image)
        if not results:
            return "", 0.0

        rec_texts = results[0].get("rec_texts", [])
        rec_scores = results[0].get("rec_scores", [])

        text = " ".join(rec_texts) if rec_texts else ""
        if text:
            text = "".join(ch for ch in text if ch.isalnum() or ch in "-." )
            if len(text) > 2 and text[0].isalpha() and text[2] == "C":
                text = text[:2] + "0" + text[3:]

        confidence = float(sum(rec_scores) / len(rec_scores)) if rec_scores else 0.0
        return text, confidence

    def __call__(self, image: np.ndarray, save_crop_to: Optional[Path] = None) -> PlateOCRResult:
        image = self._ensure_rgb(image)
        crop, bbox = self.detect_plate(image)
        text, conf = self.read_plate(crop)

        saved_path: Optional[Path] = None
        if save_crop_to:
            save_crop_to = save_crop_to.expanduser().resolve()
            save_crop_to.parent.mkdir(parents=True, exist_ok=True)
            cv2.imwrite(str(save_crop_to), crop)
            saved_path = save_crop_to

        return PlateOCRResult(text=text, confidence=conf, bbox_xyxy=bbox, crop_path=saved_path)


def _load_image(path: Path) -> np.ndarray:
    image = cv2.imread(str(path))
    if image is None:
        raise FileNotFoundError(f"Không thể đọc ảnh từ {path}")
    return image


def _cli() -> None:
    parser = argparse.ArgumentParser(description="Nhận diện và OCR biển số xe từ ảnh")
    parser.add_argument("--image", required=True, help="Đường dẫn tới ảnh đầu vào")
    parser.add_argument("--device", default="auto", help="Thiết bị inference (auto/cpu/cuda[:id])")
    parser.add_argument("--conf", type=float, default=0.3, help="Ngưỡng confidence cho YOLO")
    parser.add_argument(
        "--save-crop",
        default=None,
        help="Đường dẫn lưu ảnh biển số đã cắt (tuỳ chọn)",
    )
    args = parser.parse_args()

    pipeline = PlateOCRPipeline(device=args.device, conf_thres=args.conf)
    image_path = Path(args.image)
    image = _load_image(image_path)

    crop_destination = Path(args.save_crop) if args.save_crop else None
    result = pipeline(image, save_crop_to=crop_destination)

    print(
        {
            "plate_text": result.text,
            "confidence": round(result.confidence, 4),
            "bbox_xyxy": result.bbox_xyxy,
            "crop_path": str(result.crop_path) if result.crop_path else None,
        }
    )


if __name__ == "__main__":
    _cli()

