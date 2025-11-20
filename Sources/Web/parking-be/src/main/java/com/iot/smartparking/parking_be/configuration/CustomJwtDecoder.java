package com.iot.smartparking.parking_be.configuration;

import com.iot.smartparking.parking_be.dto.request.auth.IntrospectRequest;
import com.iot.smartparking.parking_be.service.AuthService;
import com.iot.smartparking.parking_be.service.UserService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.oauth2.jose.jws.MacAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtException;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.stereotype.Component;

import javax.crypto.spec.SecretKeySpec;
import java.util.Objects;

@Component
@RequiredArgsConstructor
public class CustomJwtDecoder implements JwtDecoder {
    private final AuthService authService;
    private NimbusJwtDecoder nimbusJwtDecoder = null ;

    @Value("${spring.jwt.signerKey}")
    private String signerKey ;
    @Override
    public Jwt decode(String token) throws JwtException {
        var response = authService.introspect(
                IntrospectRequest.builder().token(token).build()
        ) ;
        if(!response.isValid()){
            throw new JwtException("Token is invalid") ;
        }
        if (Objects.isNull(nimbusJwtDecoder)){
            SecretKeySpec secretKeySpec = new SecretKeySpec(signerKey.getBytes(), "HS256");
            nimbusJwtDecoder = NimbusJwtDecoder.withSecretKey(secretKeySpec)
                    .macAlgorithm(MacAlgorithm.HS256)
                    .build();
        }
        return nimbusJwtDecoder.decode(token) ;
    }
}