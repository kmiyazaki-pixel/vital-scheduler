package com.vitalarea.scheduler.security;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;
import java.util.Map;

import org.springframework.core.convert.converter.Converter;
import org.springframework.security.authentication.AbstractAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.server.resource.authentication.JwtAuthenticationToken;

public class SupabaseJwtAuthenticationConverter implements Converter<Jwt, AbstractAuthenticationToken> {

    @Override
    public AbstractAuthenticationToken convert(Jwt jwt) {
        Collection<GrantedAuthority> authorities = new ArrayList<>();

        Object roleClaim = jwt.getClaims().get("role");
        if (roleClaim instanceof String role && !role.isBlank()) {
            authorities.add(new SimpleGrantedAuthority("ROLE_" + role.toUpperCase()));
        }

        Object appMetadataObj = jwt.getClaims().get("app_metadata");
        if (appMetadataObj instanceof Map<?, ?> appMetadata) {
            Object rolesObj = appMetadata.get("roles");
            if (rolesObj instanceof List<?> roles) {
                for (Object role : roles) {
                    if (role instanceof String roleText && !roleText.isBlank()) {
                        authorities.add(new SimpleGrantedAuthority("ROLE_" + roleText.toUpperCase()));
                    }
                }
            }
        }

        return new JwtAuthenticationToken(jwt, authorities, principalName(jwt));
    }

    private String principalName(Jwt jwt) {
        String email = jwt.getClaimAsString("email");
        if (email != null && !email.isBlank()) {
            return email;
        }
        return jwt.getSubject();
    }
}
