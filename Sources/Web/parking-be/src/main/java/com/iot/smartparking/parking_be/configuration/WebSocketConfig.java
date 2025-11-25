package com.iot.smartparking.parking_be.configuration;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.simp.config.MessageBrokerRegistry;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;
import org.springframework.web.filter.CorsFilter;
import org.springframework.web.socket.config.annotation.EnableWebSocketMessageBroker;
import org.springframework.web.socket.config.annotation.StompEndpointRegistry;
import org.springframework.web.socket.config.annotation.WebSocketMessageBrokerConfigurer;

import java.util.Arrays;

@Configuration
@EnableWebSocketMessageBroker
public class WebSocketConfig implements WebSocketMessageBrokerConfigurer {

    @Override
    public void configureMessageBroker(MessageBrokerRegistry registry) {
        registry.enableSimpleBroker("/topic", "/queue");
        registry.setApplicationDestinationPrefixes("/app");
    }


    @Override
    public void registerStompEndpoints(StompEndpointRegistry registry) {
        registry.addEndpoint("/websocket")
                .setAllowedOriginPatterns(
                        "http://localhost:5500",
                        "http://127.0.0.1:5500",
                        "http://localhost:8080",
                        "http://127.0.0.1:8080",
                        "http://localhost:5173",
                        "https://deploy-jnp.vercel.app"
                )
                .withSockJS()
                .setSuppressCors(true)
                .setSessionCookieNeeded(true);

        registry.addEndpoint("/ws")
                .setAllowedOriginPatterns(
                        "http://localhost:5500",
                        "http://127.0.0.1:5500",
                        "http://localhost:8080",
                        "http://127.0.0.1:8080",
                        "http://localhost:5173",
                        "https://deploy-jnp.vercel.app"
                );
    }

    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();

        config.setAllowedOrigins(Arrays.asList("http://localhost:5173","https://deploy-jnp.vercel.app"));
        config.setAllowCredentials(true);
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return new CorsFilter(source);
    }
}
