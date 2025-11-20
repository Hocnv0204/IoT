package com.iot.smartparking.parking_be.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
@EnableMethodSecurity
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity httpSecurity , CustomJwtDecoder customJwtDecoder) throws Exception{
        httpSecurity
                .csrf(AbstractHttpConfigurer :: disable)
                .authorizeHttpRequests( request -> request
                        .anyRequest().permitAll())
                .oauth2ResourceServer(
                        oauth2 -> oauth2
                                .jwt(
                                        jwtConfigurer -> jwtConfigurer.decoder(customJwtDecoder))
                                .authenticationEntryPoint(new JwtAuthenticationEntryPoint())
                ) ;

        return httpSecurity.build() ;
    }

    @Bean
    PasswordEncoder passwordEncoder (){
        return new BCryptPasswordEncoder(10 ) ;
    }
}
