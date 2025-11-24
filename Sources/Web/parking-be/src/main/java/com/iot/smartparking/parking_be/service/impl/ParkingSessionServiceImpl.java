package com.iot.smartparking.parking_be.service.impl;

import com.iot.smartparking.parking_be.common.CheckStatus;
import com.iot.smartparking.parking_be.common.ParkStatus;
import com.iot.smartparking.parking_be.dto.AiResponse;
import com.iot.smartparking.parking_be.dto.response.CheckInResponseDTO;
import com.iot.smartparking.parking_be.dto.PageResponse;
import com.iot.smartparking.parking_be.dto.ParkingSessionDTO;
import com.iot.smartparking.parking_be.dto.request.admin.LogRequest;
import com.iot.smartparking.parking_be.dto.request.user.CheckRequest;
import com.iot.smartparking.parking_be.dto.response.CheckOutResponseDTO;
import com.iot.smartparking.parking_be.dto.response.StatisticsResponse;
import com.iot.smartparking.parking_be.exception.AppException;
import com.iot.smartparking.parking_be.exception.ErrorCode;
import com.iot.smartparking.parking_be.mapper.PageMapper;
import com.iot.smartparking.parking_be.mapper.ParkingSessionMapper;
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
import org.springframework.cglib.core.Local;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Schedulers;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Service
@RequiredArgsConstructor
@Slf4j
public class ParkingSessionServiceImpl implements ParkingSessionService {
    private final AIService aiService ;
    private final VehicleRepository vehicleRepository ;
    private final CardRepository cardRepository ;
    private final FileStorageService fileStorageService ;
    private final ParkingSessionRepository parkingSessionRepository ;
    private final ParkingSessionMapper parkingSessionMapper ;
    private final PageMapper pageMapper;

    @Data
    @Builder
    static class DbResult{
        RFIDCard card ;
        Vehicle vehicle ;
        ParkingSession parkingSession ;
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
                       ParkingSession parkingSession = ParkingSession.builder()
                                .vehicle(vehicle)
                                .imageIn(imageUrl)
                                .card(card)
                                .timeIn(LocalDateTime.now())
                                .status(ParkStatus.IN.name())
                                .build();
                       ParkingSession savedSession = parkingSessionRepository.save(parkingSession) ;
                        return CheckInResponseDTO.builder()
                                .ownerName(vehicle.getOwnerName())
                                .checkInAt(savedSession.getTimeIn())
                                .licensePlate(savedSession.getVehicle().getLicensePlate())
                                .status(CheckStatus.OPEN.name())
                                .imageUrl(imageUrl)
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
    @Override
    public PageResponse<ParkingSessionDTO> getLogs(LogRequest request , Pageable pageable){
        Vehicle vehicle = null ;
        if(request.getLicensePlate() != null) {
            vehicle = vehicleRepository.findByLicensePlate(request.getLicensePlate()).orElseThrow(
                    () -> new AppException(ErrorCode.VEHICLE_NOT_FOUND)
            );
        }

        Page<ParkingSession> page = parkingSessionRepository.getLogs(vehicle.getId() ,
                 request.getStatus(),  request.getFromDate() , request.getToDate() , pageable
        ) ;
        Page<ParkingSessionDTO> pageDto = page.map(parkingSessionMapper :: toDto) ;
        return pageMapper.toPageResponse(pageDto) ;
    }

    @Override
    public Mono<StatisticsResponse> getOverviewStatistics(){
        // Xác định thời gian "Hôm nay" (Từ 00:00:00 đến 23:59:59)
        LocalDateTime startOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MIN);
        LocalDateTime endOfDay = LocalDateTime.of(LocalDate.now(), LocalTime.MAX);

        // Task 1: Đếm tổng xe đăng ký
        Mono<Long> totalVehiclesTask = Mono.fromCallable(() ->
                vehicleRepository.count()
        ).subscribeOn(Schedulers.boundedElastic());

        // Task 2: Đếm số xe đang đỗ (Current Occupancy)
        Mono<Long> currentOccupancyTask = Mono.fromCallable(() ->
                parkingSessionRepository.countByStatus(ParkStatus.IN.name())
        ).subscribeOn(Schedulers.boundedElastic());

        // Task 3: Đếm lượt vào hôm nay
        Mono<Long> todayCheckInTask = Mono.fromCallable(() ->
                parkingSessionRepository.countByTimeInBetween(startOfDay, endOfDay)
        ).subscribeOn(Schedulers.boundedElastic());

        // Task 4: Đếm lượt ra hôm nay
        Mono<Long> todayCheckOutTask = Mono.fromCallable(() ->
                parkingSessionRepository.countByTimeOutBetween(startOfDay, endOfDay)
        ).subscribeOn(Schedulers.boundedElastic());

        // Chạy song song cả 4 task và gộp kết quả
        return Mono.zip(totalVehiclesTask, todayCheckInTask, todayCheckOutTask, currentOccupancyTask)
                .map(tuple -> StatisticsResponse.builder()
                        .totalVehicleRegistered(tuple.getT1())
                        .totalCheckInsToday(tuple.getT2())
                        .totalCheckOutsToday(tuple.getT3())
                        .currentOccupancy(tuple.getT4())
                        .build()
                );
    }
    @Override
    public Mono<CheckOutResponseDTO> checkOut(CheckRequest request , MultipartFile image ){
        String rfidUid = request.getRfidCard();
        Mono<DbResult> dbTask = Mono.fromCallable(() -> {
            // Tìm thẻ
            RFIDCard card = cardRepository.findRFIDCardByCode(rfidUid)
                    .orElseThrow(() -> new AppException(ErrorCode.CARD_NOT_FOUND));

            // Tìm xe
            Vehicle vehicle = vehicleRepository.findByCardId(card.getId())
                    .orElseThrow(() -> new AppException(ErrorCode.VEHICLE_NOT_FOUND));

            ParkingSession parkingSession = parkingSessionRepository.findByCardIdAndStatus(card.getId() , ParkStatus.IN.name()).orElseThrow(
                    () -> new AppException(ErrorCode.VEHICLE_NOT_FOUND)
            ) ;
            // Kiểm tra xe có trong bãi không
            boolean isAlreadyIn = parkingSessionRepository.existsParkingSessionByCardAndStatus(card.getId(), ParkStatus.IN.name());
            if (!isAlreadyIn) {
                throw new AppException(ErrorCode.VEHICLE_ALREADY_OUT);
            }

            return DbResult.builder().card(card).parkingSession(parkingSession).vehicle(vehicle).build();
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
                        return Mono.just(CheckOutResponseDTO.builder()
                                .licensePlate(detectedPlate)
                                .checkOutAt(LocalDateTime.now())
                                .status(CheckStatus.DENIED.name())
                                .ownerName("Unknown") // Thêm trường này để tránh null pointer ở FE
                                .build());
                    }

                    // Logic Thành công -> Lưu vào DB
                    // Lưu ý: Save DB cũng là blocking nên cần bọc lại
                    return Mono.fromCallable(() -> {

                        ParkingSession session = dbResult.getParkingSession() ;
                        session.setImageOut(imageUrl);
                        session.setTimeOut(LocalDateTime.now());
                        session.setStatus(ParkStatus.OUT.name());

                        ParkingSession savedSession = parkingSessionRepository.save(session);

                        return CheckOutResponseDTO.builder()
                                .ownerName(vehicle.getOwnerName())
                                .checkOutAt(savedSession.getTimeIn())
                                .licensePlate(savedSession.getVehicle().getLicensePlate())
                                .status(CheckStatus.OPEN.name())
                                .imageUrl(imageUrl)
                                .build();
                    }).subscribeOn(Schedulers.boundedElastic());
                });
    }

}
