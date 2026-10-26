package hub

import (
	"bytes"
	"compress/gzip"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"

	"github.com/pocketbase/pocketbase/core"
	"github.com/pocketbase/pocketbase/tools/router"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func decompressGzip(t *testing.T, data []byte) string {
	t.Helper()
	reader, err := gzip.NewReader(bytes.NewReader(data))
	require.NoError(t, err)
	defer reader.Close()
	decompressed, err := io.ReadAll(reader)
	require.NoError(t, err)
	return string(decompressed)
}

func setupGzipTestRouter(t *testing.T) http.Handler {
	t.Helper()
	r := router.NewRouter(func(w http.ResponseWriter, req *http.Request) (*core.RequestEvent, router.EventCleanupFunc) {
		return &core.RequestEvent{
			Event: router.Event{
				Response: w,
				Request:  req,
			},
		}, nil
	})
	r.Bind(newGzipMiddleware())

	largeBody := strings.Repeat("console.log('hello beszel compressed assets');\n", 50)

	// Compressible static-like route
	r.GET("/assets/app.js", func(e *core.RequestEvent) error {
		e.Response.Header().Set("Content-Type", "application/javascript")
		return e.String(http.StatusOK, largeBody)
	})

	// Compressible HTML route
	r.GET("/", func(e *core.RequestEvent) error {
		return e.HTML(http.StatusOK, "<html><body>"+largeBody+"</body></html>")
	})

	// Compressible API JSON route
	r.GET("/api/test-data", func(e *core.RequestEvent) error {
		return e.JSON(http.StatusOK, map[string]string{
			"content": largeBody,
		})
	})

	// Non-compressible image route
	r.GET("/assets/logo.png", func(e *core.RequestEvent) error {
		e.Response.Header().Set("Content-Type", "image/png")
		return e.String(http.StatusOK, largeBody)
	})

	// Non-compressible WebP route
	r.GET("/assets/banner.webp", func(e *core.RequestEvent) error {
		e.Response.Header().Set("Content-Type", "image/webp")
		return e.String(http.StatusOK, largeBody)
	})

	// SSE route
	r.GET("/api/realtime", func(e *core.RequestEvent) error {
		e.Response.Header().Set("Content-Type", "text/event-stream")
		return e.String(http.StatusOK, "data: test\n\n")
	})

	// Short response route (< 256 bytes)
	r.GET("/api/short", func(e *core.RequestEvent) error {
		return e.String(http.StatusOK, "short")
	})

	// PocketBase UI route, gzipped by apis.Serve before this middleware runs
	r.GET("/_/{path...}", func(e *core.RequestEvent) error {
		return e.HTML(http.StatusOK, "<html><body>"+largeBody+"</body></html>")
	})

	mux, err := r.BuildMux()
	require.NoError(t, err)
	return mux
}

func TestGzipMiddleware(t *testing.T) {
	handler := setupGzipTestRouter(t)

	t.Run("compresses JS assets when Accept-Encoding gzip is present", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/assets/app.js", nil)
		req.Header.Set("Accept-Encoding", "gzip, deflate, br")
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Equal(t, "gzip", rec.Header().Get("Content-Encoding"))
		assert.Contains(t, rec.Header().Get("Vary"), "Accept-Encoding")

		decompressed := decompressGzip(t, rec.Body.Bytes())
		assert.Contains(t, decompressed, "console.log('hello beszel compressed assets');")
	})

	t.Run("compresses HTML when Accept-Encoding gzip is present", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/", nil)
		req.Header.Set("Accept-Encoding", "gzip")
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Equal(t, "gzip", rec.Header().Get("Content-Encoding"))

		decompressed := decompressGzip(t, rec.Body.Bytes())
		assert.Contains(t, decompressed, "<html><body>")
	})

	t.Run("compresses API JSON responses", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/test-data", nil)
		req.Header.Set("Accept-Encoding", "gzip")
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Equal(t, "gzip", rec.Header().Get("Content-Encoding"))

		decompressed := decompressGzip(t, rec.Body.Bytes())
		assert.Contains(t, decompressed, "hello beszel compressed assets")
	})

	t.Run("does not compress when client does not support gzip", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/assets/app.js", nil)
		// No Accept-Encoding header
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Empty(t, rec.Header().Get("Content-Encoding"))
		assert.Contains(t, rec.Body.String(), "console.log('hello beszel compressed assets');")
	})

	t.Run("skips compression for png images", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/assets/logo.png", nil)
		req.Header.Set("Accept-Encoding", "gzip")
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Empty(t, rec.Header().Get("Content-Encoding"))
	})

	t.Run("skips compression for webp images", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/assets/banner.webp?v=123", nil)
		req.Header.Set("Accept-Encoding", "gzip")
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Empty(t, rec.Header().Get("Content-Encoding"))
	})

	t.Run("skips compression for SSE endpoint", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/realtime", nil)
		req.Header.Set("Accept-Encoding", "gzip")
		req.Header.Set("Accept", "text/event-stream")
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Empty(t, rec.Header().Get("Content-Encoding"))
	})

	t.Run("skips compression for websocket upgrade", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/assets/app.js", nil)
		req.Header.Set("Accept-Encoding", "gzip")
		req.Header.Set("Upgrade", "websocket")
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Empty(t, rec.Header().Get("Content-Encoding"))
	})

	t.Run("skips PocketBase UI route so apis.Serve does not compress it twice", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/_/", nil)
		req.Header.Set("Accept-Encoding", "gzip")
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Empty(t, rec.Header().Get("Content-Encoding"))
		assert.Contains(t, rec.Body.String(), "<html><body>")
	})

	t.Run("skips compression for responses below minLength", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/api/short", nil)
		req.Header.Set("Accept-Encoding", "gzip")
		rec := httptest.NewRecorder()

		handler.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusOK, rec.Code)
		assert.Empty(t, rec.Header().Get("Content-Encoding"))
		assert.Equal(t, "short", rec.Body.String())
	})
}

