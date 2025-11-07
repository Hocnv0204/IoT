# Cài đặt môi trường
Chạy lần lượt các lệnh trong script.sh

# Chạy test pipeline
```bash
python -m plate_ocr_pipeline.pipeline --image path/to/image.jpg --save-crop outputs/plate.jpg
```

# Chạy server tại cổng 8000
```bash
uvicorn server:app --host 0.0.0.0 --port 8000
```