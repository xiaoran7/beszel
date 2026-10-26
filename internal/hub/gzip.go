package hub

import (
	"strings"

	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/hook"
)

// GzipMiddlewareId is the identifier for the Beszel gzip middleware.
const GzipMiddlewareId = "beszelGzip"

// isNonCompressibleExtension checks if a URL path points to an already compressed format.
func isNonCompressibleExtension(path string) bool {
	// Strip query parameters if present
	if idx := strings.IndexByte(path, '?'); idx != -1 {
		path = path[:idx]
	}
	dotIdx := strings.LastIndexByte(path, '.')
	if dotIdx == -1 {
		return false
	}
	ext := strings.ToLower(path[dotIdx:])
	switch ext {
	case ".png", ".jpg", ".jpeg", ".webp", ".gif", ".ico", ".svgz",
		".woff2", ".woff", ".ttf", ".eot",
		".mp4", ".webm", ".mp3", ".ogg",
		".zip", ".gz", ".br", ".zst", ".7z", ".tar", ".tgz":
		return true
	default:
		return false
	}
}

// pbUIStaticPrefix is PocketBase's own UI route, which already binds apis.Gzip()
// inside apis.Serve. Compressing it here as well wraps the body twice.
const pbUIStaticPrefix = "/_/"

// newGzipMiddleware returns a middleware that compresses HTTP responses using Gzip.
// It safely skips:
// 1. PocketBase's own /_/ UI route, which is already gzipped by apis.Serve
// 2. WebSocket upgrade requests (Upgrade: websocket)
// 3. Server-Sent Events (/api/realtime or Accept: text/event-stream) to avoid proxy buffering delays
// 4. Already compressed file formats (PNG, JPG, WebP, WOFF2, zip, etc.)
// 5. Responses smaller than 256 bytes
func newGzipMiddleware() *hook.Handler[*core.RequestEvent] {
	pbGzip := apis.GzipWithConfig(apis.GzipConfig{
		MinLength: 256,
	})

	return &hook.Handler[*core.RequestEvent]{
		Id: GzipMiddlewareId,
		Func: func(e *core.RequestEvent) error {
			// Skip PocketBase's own UI route, already compressed by apis.Serve
			if strings.HasPrefix(e.Request.URL.Path, pbUIStaticPrefix) {
				return e.Next()
			}

			// Skip WebSocket requests
			if strings.EqualFold(e.Request.Header.Get("Upgrade"), "websocket") {
				return e.Next()
			}

			// Skip Server-Sent Events (SSE)
			if strings.HasPrefix(e.Request.URL.Path, "/api/realtime") ||
				strings.Contains(e.Request.Header.Get("Accept"), "text/event-stream") {
				return e.Next()
			}

			// Skip already compressed file extensions
			if isNonCompressibleExtension(e.Request.URL.Path) {
				return e.Next()
			}

			return pbGzip.Func(e)
		},
	}
}
