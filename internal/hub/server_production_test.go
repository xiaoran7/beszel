//go:build testing

package hub_test

import (
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

// The HTML document points at content-hashed bundles, so a cached copy of the
// document pins an open tab to the bundle it was loaded with. The document must
// therefore be revalidated on every navigation, while the hashed assets
// themselves stay cacheable.
func TestAppDocumentCacheControl(t *testing.T) {
	hub, handler := firstUserTestMux(t)
	defer hub.Cleanup()

	t.Run("app routes are served with no-cache", func(t *testing.T) {
		for _, path := range []string{"/", "/containers", "/monitors"} {
			req := httptest.NewRequest(http.MethodGet, path, nil)
			rec := httptest.NewRecorder()
			handler.ServeHTTP(rec, req)

			assert.Equal(t, http.StatusOK, rec.Code, "path=%s", path)
			assert.Equal(t, "no-cache", rec.Header().Get("Cache-Control"), "path=%s", path)
			assert.Contains(t, rec.Header().Get("Content-Type"), "text/html", "path=%s", path)
		}
	})

	t.Run("unknown paths are served with no-cache", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/not-a-route", nil)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		assert.Equal(t, http.StatusNotFound, rec.Code)
		assert.Equal(t, "no-cache", rec.Header().Get("Cache-Control"))
	})

	t.Run("hashed assets stay cacheable", func(t *testing.T) {
		req := httptest.NewRequest(http.MethodGet, "/assets/index-abc123.js", nil)
		rec := httptest.NewRecorder()
		handler.ServeHTTP(rec, req)

		require.Equal(t, "public, max-age=2592000", rec.Header().Get("Cache-Control"))
	})
}
