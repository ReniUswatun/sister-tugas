# Stage 1: build Go binary
FROM golang:alpine AS builder

WORKDIR /app

# copy go mod & sum biar dependency cache
COPY go.mod go.sum ./

RUN go mod download

# copy semua source code
COPY . .

# build binary untuk Linux (supaya cocok di container)
RUN go build -o app .

# Stage 2: run binary
FROM alpine:3.22

WORKDIR /app

# copy binary & static folder
COPY --from=builder /app/app .
# COPY --from=builder /app/static ./static

EXPOSE 8080

CMD ["./app"]
