# Tạo môi trường Conda (Python 3.11 ổn định hơn 3.13)
conda create --name licenseocr python=3.11 -y
conda activate licenseocr

# Cài torch (bản CUDA 12.6, nếu bạn có GPU)
# pip install torch torchvision --index-url https://download.pytorch.org/whl/cu126
# Nếu chỉ dùng CPU:
pip install torch torchvision

# Paddle (chọn GPU hoặc CPU tùy môi trường)
# GPU:
# pip install paddlepaddle-gpu==3.1.1 -i https://www.paddlepaddle.org.cn/packages/stable/cu126/
# Hoặc CPU:
pip install paddlepaddle

# Cài phần còn lại
pip install ultralytics paddleocr fastapi uvicorn opencv-python matplotlib numpy onnxruntime dill python-multipart