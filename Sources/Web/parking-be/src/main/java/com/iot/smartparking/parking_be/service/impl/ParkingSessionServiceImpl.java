package com.iot.smartparking.parking_be.service.impl;

import com.iot.smartparking.parking_be.common.CheckStatus;
import com.iot.smartparking.parking_be.common.ParkStatus;
import com.iot.smartparking.parking_be.dto.AiResponse;
import com.iot.smartparking.parking_be.dto.CheckInResponseDTO;
import com.iot.smartparking.parking_be.dto.request.user.CheckRequest;
import com.iot.smartparking.parking_be.exception.AppException;
import com.iot.smartparking.parking_be.exception.ErrorCode;
import com.iot.smartparking.parking_be.model.ParkingSession;
import com.iot.smartparking.parking_be.model.RFIDCard;
import com.iot.smartparking.parking_be.model.Vehicle;
import com.iot.smartparking.parking_be.repository.CardRepository;
import com.iot.smartparking.parking_be.repository.ParkingSessionRepository;
import com.iot.smartparking.parking_be.repository.VehicleRepository;
import com.iot.smartparking.parking_be.service.AIService;
import com.iot.smartparking.parking_be.service.FileStorageService;
import com.iot.smartparking.parking_be.service.ParkingSessionService;
import jakarta.transaction.Transactional;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.LocalDateTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class ParkingSessionServiceImpl implements ParkingSessionService {
    private final AIService aiService ;
    private final VehicleRepository vehicleRepository ;
    private final CardRepository cardRepository ;
    private final FileStorageService fileStorageService ;
    private final ParkingSessionRepository parkingSessionRepository ;
    @Data
    @Builder
    static class DbResult{
        RFIDCard card ;
        Vehicle vehicle ;
    }
    @Transactional
    @Override
    public Mono<CheckInResponseDTO> checkIn(CheckRequest request , MultipartFile image ){
        String rfidUid = request.getRfidCard();
        Mono<DbResult> dbTask = Mono.fromCallable(() -> {
            // Tìm thẻ
            RFIDCard card = cardRepository.findRFIDCardByCode(rfidUid)
                    .orElseThrow(() -> new AppException(ErrorCode.CARD_NOT_FOUND));

            // Tìm xe
            Vehicle vehicle = vehicleRepository.findByCardId(card.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.VEHICLE_NOT_FOUND));

            // Kiểm tra xe có trong bãi không
            boolean isAlreadyIn = parkingSessionRepository.existsParkingSessionByCardAndStatus(card.getId(), ParkStatus.IN.name());
            if (isAlreadyIn) {
                throw new AppException(ErrorCode.VEHICLE_ALREADY_IN);
            }

            return DbResult.builder().card(card).vehicle(vehicle).build();
        }).subscribeOn(Schedulers.boundedElastic());
        // 2. Task AI: Gọi nhận dạng biển số (Chạy song song)
        Mono<String> aiTask = Mono.fromCallable(() -> {
            AiResponse response = aiService.recognizePlate(image);
            return (response != null && response.getPlateText() != null) ? response.getPlateText() : "UNKNOWN";
        }).subscribeOn(Schedulers.boundedElastic());

        // 3. Task File: Lưu ảnh (Chạy song song)
        Mono<String> fileTask = Mono.fromCallable(() -> {
            String fileName = fileStorageService.storeFile(image, "iot");
            return fileStorageService.getFileUrl(fileName, "iot");
        }).subscribeOn(Schedulers.boundedElastic());

        // 4. Kết hợp cả 3 Task chạy song song bằng Mono.zip
        return Mono.zip(dbTask, aiTask, fileTask)
                .flatMap(tuple -> {
                    // Lấy kết quả từ Tuple
                    DbResult dbResult = tuple.getT1();
                    String detectedPlate = tuple.getT2();
                    String imageUrl = tuple.getT3();

                    Vehicle vehicle = dbResult.getVehicle();
                    RFIDCard card = dbResult.getCard();

                    log.info("DB Plate: {} - AI Plate: {}", vehicle.getLicensePlate(), detectedPlate);

                    // Logic so sánh biển số
                    if (!isPlateMatching(vehicle.getLicensePlate(), detectedPlate)) {
                        // Từ chối nhưng không lưu Session (hoặc lưu session REJECT tùy logic)
                        return Mono.just(CheckInResponseDTO.builder()
                                .licensePlate(detectedPlate)
                                .checkInAt(LocalDateTime.now())
                                .status(CheckStatus.DENIED.name())
                                .ownerName("Unknown") // Thêm trường này để tránh null pointer ở FE
                                .build());
                    }

                    // Logic Thành công -> Lưu vào DB
                    // Lưu ý: Save DB cũng là blocking nên cần bọc lại
                    return Mono.fromCallable(() -> {
                        ParkingSession session = ParkingSession.builder()
                                .licensePlate(detectedPlate)
                                .imageIn(imageUrl)
                                .card(card)
                                .timeIn(LocalDateTime.now())
                                .status(ParkStatus.IN.name())
                                .build();

                        ParkingSession savedSession = parkingSessionRepository.save(session);

                        return CheckInResponseDTO.builder()
                                .ownerName(vehicle.getOwnerName())
                                .checkInAt(savedSession.getTimeIn())
                                .licensePlate(savedSession.getLicensePlate())
                                .status(CheckStatus.OPEN.name())
                                .build();
                    }).subscribeOn(Schedulers.boundedElastic());
                });
    }
    private boolean isPlateMatching(String dbPlate, String aiPlate) {
        if ("UNKNOWN".equals(aiPlate)) return false;
        // Xóa dấu chấm, gạch ngang, khoảng trắng
        String cleanDb = dbPlate.replace(".", "").replace("-", "").replace(" ", "").toUpperCase();
        String cleanAi = aiPlate.replace(".", "").replace("-", "").replace(" ", "").toUpperCase();
        return cleanDb.equals(cleanAi);
    }
}

//String rfidUid = request.getRfidCard();
//RFIDCard card = cardRepository.findRFIDCardByCode(rfidUid).orElseThrow(
//        () ->  new AppException(ErrorCode.CARD_NOT_FOUND)
//) ;
//Vehicle vehicle = vehicleRepository.findByCardId(card.getId()).orElseThrow(
//        () -> new AppException(ErrorCode.VEHICLE_NOT_FOUND)
//) ;
//String imageFileName = fileStorageService.storeFile(image , "iot");
//String imageUrl = fileStorageService.getFileUrl(imageFileName , "iot");
//AiResponse aiResponse = aiService.recognizePlate(image) ;
//String detectedPlate = (aiResponse != null && aiResponse.getPlateText() != null) ? aiResponse.getPlateText() : "UNKNOWN" ;
//        if(parkingSessionRepository.existsParkingSessionByCardAndStatus(card.getId() , ParkStatus.IN.name())){
//        throw new AppException(ErrorCode.VEHICLE_ALREADY_IN) ;
//        }
//                if(!vehicle.getLicensePlate().equals(detectedPlate)){
//        return CheckInResponseDTO.builder()
//                    .licensePlate(detectedPlate)
//                    .checkInAt(LocalDateTime.now())
//        .status(CheckStatus.DENIED.name())
//        .build() ;
//        }
//                System.out.println(vehicle.getLicensePlate());
//        System.out.println(detectedPlate);
//ParkingSession parkingSession = ParkingSession.builder()
//        .licensePlate(detectedPlate)
//        .imageIn(imageUrl)
//        .card(card)
//        .timeIn(LocalDateTime.now())
//        .status(ParkStatus.IN.name())
//        .build() ;
//        parkingSessionRepository.save(parkingSession) ;
//        return CheckInResponseDTO.builder()
//                .ownerName(vehicle.getOwnerName())
//        .checkInAt(parkingSession.getTimeIn())
//        .licensePlate(parkingSession.getLicensePlate())
//        .status(CheckStatus.OPEN.name())
//        .build() ;

