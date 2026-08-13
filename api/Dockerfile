FROM golang:1.22-alpine AS builder

WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -trimpath -ldflags="-s -w" -o /out/drone-api .

FROM alpine:3.21

RUN addgroup -S app && adduser -S -G app app
WORKDIR /app
COPY --from=builder /out/drone-api ./drone-api
USER app
EXPOSE 8080
ENTRYPOINT ["/app/drone-api"]
