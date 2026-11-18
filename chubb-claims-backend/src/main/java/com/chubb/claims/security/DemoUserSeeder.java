package com.chubb.claims.security;

import com.chubb.claims.domain.AppUser;
import com.chubb.claims.domain.UserRole;
import com.chubb.claims.infrastructure.AppUserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Profile;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;

@Configuration
@Profile("local")
public class DemoUserSeeder {

    @Bean
    CommandLineRunner seedDemoUsers(AppUserRepository users, PasswordEncoder passwordEncoder) {
        return args -> {
            List<DemoAccount> demoAccounts = List.of(
                    new DemoAccount("claimant@chubb.test", "Claimant@123", UserRole.CLAIMANT),
                    new DemoAccount("officer@chubb.test", "Officer@123", UserRole.OFFICER),
                    new DemoAccount("manager@chubb.test", "Manager@123", UserRole.MANAGER)
            );

            for (DemoAccount account : demoAccounts) {
                if (!users.existsByUsernameIgnoreCase(account.username())) {
                    users.save(new AppUser(
                            account.username(),
                            passwordEncoder.encode(account.rawPassword()),
                            account.role()
                    ));
                }
            }
        };
    }

    private record DemoAccount(String username, String rawPassword, UserRole role) {
    }
}
