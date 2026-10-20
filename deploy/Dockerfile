FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN addgroup -S aion && adduser -S aion -G aion
COPY --chown=aion:aion target/aion.jar /app/aion.jar
USER aion
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "/app/aion.jar"]
