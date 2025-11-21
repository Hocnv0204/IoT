package com.iot.smartparking.parking_be.service.impl;

import com.iot.smartparking.parking_be.common.Role;
import com.iot.smartparking.parking_be.dto.request.auth.IntrospectRequest;
import com.iot.smartparking.parking_be.dto.request.auth.LoginRequest;
import com.iot.smartparking.parking_be.dto.request.auth.RegisterRequest;
import com.iot.smartparking.parking_be.dto.response.auth.AuthenticationResponse;
import com.iot.smartparking.parking_be.dto.response.auth.IntrospectResponse;
import com.iot.smartparking.parking_be.exception.AppException;
import com.iot.smartparking.parking_be.exception.ErrorCode;
import com.iot.smartparking.parking_be.mapper.UserMapper;
import com.iot.smartparking.parking_be.model.User;
import com.iot.smartparking.parking_be.repository.UserRepository;
import com.iot.smartparking.parking_be.service.AuthService;
import com.nimbusds.jose.*;
import com.nimbusds.jose.crypto.MACSigner;
import com.nimbusds.jose.crypto.MACVerifier;
import com.nimbusds.jwt.JWTClaimsSet;
import com.nimbusds.jwt.SignedJWT;
import lombok.RequiredArgsConstructor;
import lombok.experimental.NonFinal;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.text.ParseException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.Date;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {
    private final UserRepository userRepository ;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder ;
    @NonFinal
    @Value("${spring.jwt.signerKey}")
    protected String signerKey ;
    @Value("${spring.jwt.valid-duration}")
    protected long validDuration ;
    @Value("${spring.jwt.refreshable-duration}")
    protected long refreshableDuration ;

    @Override
    public String generateAccessToken(User user){
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS256) ;
        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getUsername())
                .claim("role" , user.getRole())
                .issuer("Hoc Nguyen")
                .issueTime(new Date())
                .expirationTime(
                        new Date(
                                Instant.now().plus(validDuration , ChronoUnit.SECONDS).toEpochMilli()
                        ))
                .jwtID(UUID.randomUUID().toString())
                .build() ;
        Payload payload = new Payload(jwtClaimsSet.toJSONObject()) ;
        JWSObject jwsObject = new JWSObject(header, payload) ;
        try{
            jwsObject.sign(new MACSigner(signerKey.getBytes()));
            return jwsObject.serialize() ;
        }catch(JOSEException e){
            throw new RuntimeException("Error when generate access token") ;
        }
    }
    @Override
    public String generateRefreshToken(User user){
        JWSHeader header = new JWSHeader(JWSAlgorithm.HS256) ;

        JWTClaimsSet jwtClaimsSet = new JWTClaimsSet.Builder()
                .subject(user.getUsername())
                .claim("role" , user.getRole())
                .issuer("Hoc Nguyen")
                .issueTime(new Date())
                .expirationTime(
                        new Date(
                                Instant.now().plus(refreshableDuration,ChronoUnit.SECONDS).toEpochMilli()
                        )
                )
                .jwtID(UUID.randomUUID().toString())
                .build() ;
        Payload payload = new Payload(jwtClaimsSet.toJSONObject()) ;
        JWSObject jwsObject = new JWSObject(header, payload) ;
        try{
            jwsObject.sign(new MACSigner(signerKey.getBytes()));
            return jwsObject.serialize();
        }catch(JOSEException e){
            throw new RuntimeException("Error when generate refresh token") ;
        }
    }

    private SignedJWT verifyToken(String token, boolean isRefresh) throws JOSEException, ParseException {
        JWSVerifier verifier = new MACVerifier(signerKey.getBytes()) ;
        SignedJWT signedJWT = SignedJWT.parse(token) ;

        Date expiryTime = (isRefresh)
                ? new Date(signedJWT.getJWTClaimsSet().getIssueTime()
                .toInstant().plus(refreshableDuration,ChronoUnit.SECONDS).toEpochMilli())
                : signedJWT.getJWTClaimsSet().getExpirationTime() ;
        var verified = signedJWT.verify(verifier) ;
        if(!(verified && expiryTime.after(new Date()))){
            throw new AppException(ErrorCode.UNAUTHORIZED) ;
        }
        return signedJWT ;
    }

    @Override
    public IntrospectResponse introspect(IntrospectRequest request){
        var token = request.getToken() ;
        boolean isValid = true;
        try{
            verifyToken(token, false) ;
        }catch(AppException e){
            isValid = false ;
        } catch (ParseException e) {
            throw new RuntimeException(e);
        } catch (JOSEException e) {
            throw new RuntimeException(e);
        }
        return IntrospectResponse.builder()
                .valid(isValid)
                .build();
    }
    @Override
    public AuthenticationResponse register(RegisterRequest registerRequest){
        User user = User.builder()
                .phone(registerRequest.getPhone())
                .email(registerRequest.getEmail())
                .username(registerRequest.getUsername())
                .name(registerRequest.getFullName())
                .password(passwordEncoder.encode(registerRequest.getPassword()))
                .role(Role.ROLE_USER.toString())
                .createdAt(LocalDateTime.now())
                .build() ;
        userRepository.save(user) ;
        return AuthenticationResponse.builder()
                .refreshToken(generateRefreshToken(user))
                .accessToken(generateAccessToken(user))
                .build();
    }

    @Override
    public AuthenticationResponse login(LoginRequest request){
        User user = userRepository.findByUsername(request.getUsername()).orElseThrow(
                () -> new AppException(ErrorCode.USER_NOT_FOUND)
        ) ;
        if(!passwordEncoder.matches(request.getPassword() , user.getPassword())){
            throw new AppException(ErrorCode.UNAUTHORIZED) ;
        }
        return AuthenticationResponse.builder()
                .accessToken(generateAccessToken(user))
                .refreshToken(generateRefreshToken(user))
                .build() ;

    }
}
