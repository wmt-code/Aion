package dev.aion;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;

import org.flywaydb.core.Flyway;
import org.junit.jupiter.api.Test;
import org.springframework.boot.builder.SpringApplicationBuilder;
import org.springframework.boot.web.server.context.WebServerApplicationContext;
import org.springframework.context.ConfigurableApplicationContext;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.jdbc.core.JdbcTemplate;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.postgresql.PostgreSQLContainer;
import org.testcontainers.utility.DockerImageName;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
class AionApplicationTest {

    @Container
    static final PostgreSQLContainer POSTGRES = new PostgreSQLContainer("postgres:17.6-alpine");

    @Container
    static final GenericContainer<?> REDIS = new GenericContainer<>(DockerImageName.parse("redis:7.4.5-alpine"))
            .withExposedPorts(6379);

    @Test
    void apiExposesOnlyHealthAndConnectsToInfrastructure() throws Exception {
        try (ConfigurableApplicationContext context = start("api", REDIS.getMappedPort(6379))) {
            assertThat(context).isInstanceOf(WebServerApplicationContext.class);
            HttpResponse<String> health = get(context, "/actuator/health");
            assertThat(health.statusCode()).isEqualTo(200);
            assertThat(health.body()).contains("\"status\":\"UP\"").doesNotContain("components", "details");
            assertThat(get(context, "/actuator/health/liveness").statusCode()).isEqualTo(200);
            assertThat(get(context, "/actuator/health/readiness").statusCode()).isEqualTo(200);
            assertThat(get(context, "/actuator/env").statusCode()).isEqualTo(403);
            assertThat(get(context, "/api/workspaces").statusCode()).isEqualTo(403);

            StringRedisTemplate redis = context.getBean(StringRedisTemplate.class);
            redis.opsForValue().set("aion:test:connection", "ok", Duration.ofSeconds(30));
            assertThat(redis.opsForValue().get("aion:test:connection")).isEqualTo("ok");
        }
    }

    @Test
    void workerStartsWithoutHttpAndMigrationCanBeRepeated() {
        try (ConfigurableApplicationContext context = start("worker", REDIS.getMappedPort(6379))) {
            assertThat(context).isNotInstanceOf(WebServerApplicationContext.class);
            assertThat(context.containsBean("securityFilterChain")).isFalse();
            assertThat(context.getBean(Flyway.class).migrate().migrationsExecuted).isZero();
            Integer migrations = context.getBean(JdbcTemplate.class).queryForObject(
                    "SELECT count(*) FROM aion.flyway_schema_history WHERE version = '1' AND success", Integer.class);
            assertThat(migrations).isEqualTo(1);
        }
    }

    @Test
    void redisFailureDoesNotBlockLivenessOrDatabaseReadiness() throws Exception {
        try (ConfigurableApplicationContext context = start("api", 1)) {
            assertThat(get(context, "/actuator/health/liveness").statusCode()).isEqualTo(200);
            assertThat(get(context, "/actuator/health/readiness").statusCode()).isEqualTo(200);
            HttpResponse<String> health = get(context, "/actuator/health");
            assertThat(health.statusCode()).isEqualTo(503);
            assertThat(health.body()).contains("\"status\":\"DOWN\"").doesNotContain("components", "details");
        }
    }

    private ConfigurableApplicationContext start(String role, int redisPort) {
        return new SpringApplicationBuilder(AionApplication.class).profiles(role).run(
                "--spring.datasource.url=" + POSTGRES.getJdbcUrl(),
                "--spring.datasource.username=" + POSTGRES.getUsername(),
                "--spring.datasource.password=" + POSTGRES.getPassword(),
                "--spring.data.redis.host=" + REDIS.getHost(),
                "--spring.data.redis.port=" + redisPort,
                "--spring.data.redis.password=",
                "--spring.main.keep-alive=false",
                "--server.port=0");
    }

    private HttpResponse<String> get(ConfigurableApplicationContext context, String path) throws Exception {
        int port = ((WebServerApplicationContext) context).getWebServer().getPort();
        HttpRequest request = HttpRequest.newBuilder(URI.create("http://localhost:" + port + path))
                .timeout(Duration.ofSeconds(10)).GET().build();
        try (HttpClient client = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(5)).build()) {
            return client.send(request, HttpResponse.BodyHandlers.ofString());
        }
    }
}
