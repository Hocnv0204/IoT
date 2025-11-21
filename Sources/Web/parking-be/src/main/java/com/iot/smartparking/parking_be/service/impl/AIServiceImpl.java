package com.iot.smartparking.parking_be.service.impl;

import com.iot.smartparking.parking_be.dto.AiResponse;
import com.iot.smartparking.parking_be.service.AIService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.http.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class AIServiceImpl implements AIService {

    private final RestTemplate restTemplate ;

    @Value("${spring.ai.server.url}")
    private String aiUrl ;

    @Value("${spring.ai.server.threadshold}")
    private Double confidenceThreshold ;

    @Override
    public AiResponse recognizePlate(MultipartFile imageFile){
        try{
            HttpHeaders httpHeaders = new HttpHeaders() ;
            httpHeaders.setContentType(MediaType.MULTIPART_FORM_DATA);
            // 2. Xử lý file để gửi đi
            // Lưu ý: Phải Override phương thức getFilename() của ByteArrayResource,
            // nếu không request sẽ bị lỗi do server bên kia không nhận được tên file.
            ByteArrayResource fileResource = new ByteArrayResource(imageFile.getBytes()) {
                @Override
                public String getFilename() {
                    return imageFile.getOriginalFilename() != null ? imageFile.getOriginalFilename() : "image.jpg";
                }
            };

            // 3. Tạo Body request
            // Key ở đây là "file" (hoặc "image"). Bạn CẦN KIỂM TRA code Python xem nó request.files['key_name'] là gì.
            // Thông thường là "file" hoặc "image". Ở đây tôi giả định là "file".
            MultiValueMap<String, Object> body = new LinkedMultiValueMap<>();
            body.add("file", fileResource);

            HttpEntity<MultiValueMap<String, Object>> requestEntity = new HttpEntity<>(body, httpHeaders);

            // 4. Gửi POST request
            log.info("Calling AI Server at: {}", aiUrl);
            ResponseEntity<AiResponse> response = restTemplate.postForEntity(
                    aiUrl,
                    requestEntity,
                    AiResponse.class
            );

            // 5. Xử lý kết quả trả về
            if (response.getStatusCode() == HttpStatus.OK && response.getBody() != null) {
                AiResponse result = response.getBody();
                log.info("AI Response: Plate={}, Confidence={}", result.getPlateText(), result.getConfidence());

                // Kiểm tra độ tin cậy (Optional)
                if (result.getConfidence() < confidenceThreshold) {
                    log.warn("AI confidence too low: {}", result.getConfidence());
                    return null; // Hoặc ném exception tùy logic
                }
                return result;
            }
        }catch (Exception e){
            log.error("Error calling Ai server" , e);
        }
        return null ;
    }
}
