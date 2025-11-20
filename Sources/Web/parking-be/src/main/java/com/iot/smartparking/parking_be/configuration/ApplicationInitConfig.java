package com.iot.smartparking.parking_be.configuration;

import com.iot.smartparking.parking_be.common.ROLE;
import com.iot.smartparking.parking_be.model.User;
import com.iot.smartparking.parking_be.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Configuration
@RequiredArgsConstructor
public class ApplicationInitConfig {
    private final PasswordEncoder passwordEncoder ;
    private final UserRepository userRepository ;
    @Bean
    ApplicationRunner applicationRunner(){
        return args ->{
            if(userRepository.findByUsername("admin").isEmpty()){
                User user = User.builder()
                        .username("admin")
                        .name("admin")
                        .createdAt(LocalDateTime.now())
                        .password(passwordEncoder.encode("admin"))
                        .role(ROLE.ROLE_ADMIN.toString())
                        .build() ;
                userRepository.save(user) ;
            }
        } ;
    }
}
