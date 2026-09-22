FROM golang:alpine AS builder

WORKDIR /app

# Install build tools
RUN apk add --no-cache git ca-certificates tzdata

# Cache go modules
COPY go.mod go.sum ./
RUN go mod download

# Copy full source including pre-built frontend dist in internal/site/dist
COPY . .

# Build statically linked binary
ARG TARGETOS=linux
ARG TARGETARCH=amd64
RUN CGO_ENABLED=0 GOOS=${TARGETOS} GOARCH=${TARGETARCH} go build \
    -ldflags "-w -s" \
    -o /beszel-hub ./internal/cmd/hub

# Minimal runtime image
FROM alpine:3.21

RUN apk add --no-cache ca-certificates tzdata curl

COPY --from=builder /beszel-hub /beszel

VOLUME ["/beszel_data"]

EXPOSE 8090

ENTRYPOINT ["/beszel"]
CMD ["serve", "--http=0.0.0.0:8090"]
