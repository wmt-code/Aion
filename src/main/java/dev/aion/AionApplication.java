package dev.aion;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

/**
 * API 与 Worker 共用的应用入口，部署角色由 Spring profile 指定。
 */
@SpringBootApplication
public class AionApplication {

    public static void main(String[] args) {
        SpringApplication.run(AionApplication.class, args);
    }
}
