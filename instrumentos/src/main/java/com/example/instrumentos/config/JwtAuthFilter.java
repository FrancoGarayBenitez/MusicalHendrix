package com.example.instrumentos.config;

import com.example.instrumentos.service.JwtService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.List;
import java.util.stream.Collectors;
import java.util.stream.Stream;
import java.util.Collection;
import org.springframework.security.core.authority.SimpleGrantedAuthority;

@Component
@RequiredArgsConstructor
@Slf4j
public class JwtAuthFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final UserDetailsService userDetailsService;

    @Override
    protected void doFilterInternal(HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain) throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String jwt = authHeader.substring(7);
        String username;
        try {
            username = jwtService.extractUsername(jwt);
        } catch (Exception e) {
            log.warn("⚠️ JWT inválido para path={} - {}", request.getRequestURI(), e.getMessage());
            filterChain.doFilter(request, response);
            return;
        }

        if (username != null && SecurityContextHolder.getContext().getAuthentication() == null) {
            UserDetails userDetails = userDetailsService.loadUserByUsername(username);

            if (jwtService.isTokenValid(jwt, userDetails)) {
                Collection<? extends GrantedAuthority> originalAuths = userDetails.getAuthorities();

                List<GrantedAuthority> normalizedAuthorities = originalAuths.stream()
                        .flatMap(a -> {
                            String auth = a.getAuthority();
                            if (auth == null || auth.isBlank())
                                return Stream.empty();
                            if (auth.startsWith("ROLE_")) {
                                String plain = auth.substring(5);
                                return Stream.of(
                                        new SimpleGrantedAuthority(auth),
                                        new SimpleGrantedAuthority(plain));
                            } else {
                                String withRole = "ROLE_" + auth;
                                return Stream.of(
                                        new SimpleGrantedAuthority(auth),
                                        new SimpleGrantedAuthority(withRole));
                            }
                        })
                        .distinct() // evita duplicados (SimpleGrantedAuthority implementa equals/hashCode por
                                    // authority)
                        .collect(Collectors.toList());

                UsernamePasswordAuthenticationToken authToken = new UsernamePasswordAuthenticationToken(userDetails,
                        null, normalizedAuthorities);
                authToken.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));
                SecurityContextHolder.getContext().setAuthentication(authToken);

                List<String> auths = normalizedAuthorities.stream()
                        .map(GrantedAuthority::getAuthority)
                        .collect(Collectors.toList());
                log.info("🔐 Auth OK user={} authorities={}", username, auths);
            } else {
                log.warn("⚠️ Token inválido para usuario {}", username);
            }
        }

        filterChain.doFilter(request, response);
    }
}
