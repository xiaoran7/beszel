//go:build !development

package hub

import (
	"io/fs"
	"net/http"
	"strings"

	"github.com/henrygd/beszel/internal/hub/utils"
	"github.com/henrygd/beszel/internal/site"

	"github.com/pocketbase/pocketbase/apis"
	"github.com/pocketbase/pocketbase/core"
)

// startServer sets up the production server for Beszel
func (h *Hub) startServer(se *core.ServeEvent) error {
	indexFile, _ := fs.ReadFile(site.DistDirFS, "index.html")
	html := modifyIndexHTML(h, indexFile)
	basePath := getPublicAppInfo(h).BASE_PATH
	// set up static asset serving
	staticPaths := [2]string{"/static/", "/assets/"}
	serveStatic := apis.Static(site.DistDirFS, false)
	// get CSP configuration
	csp, cspExists := utils.GetEnv("CSP")
	// add route
	se.Router.GET("/{path...}", func(e *core.RequestEvent) error {
		// serve static assets if path is in staticPaths
		for i := range staticPaths {
			if strings.Contains(e.Request.URL.Path, staticPaths[i]) {
				e.Response.Header().Set("Cache-Control", "public, max-age=2592000")
				return serveStatic(e)
			}
		}
		if cspExists {
			e.Response.Header().Del("X-Frame-Options")
			e.Response.Header().Set("Content-Security-Policy", csp)
		}
		// The HTML document must never be served from a stale cache. It points at
		// content-hashed bundles, so a cached copy pins an open tab to the bundle
		// it was built with, and that tab keeps running old code until it reloads.
		// The response carries no ETag or Last-Modified, so "no-cache" means the
		// browser re-fetches the document on every navigation.
		e.Response.Header().Set("Cache-Control", "no-cache")
		// still serve the app for unknown paths (it renders a 404 page),
		// but with a 404 status so scanners and fail2ban see the miss
		status := http.StatusOK
		if !isAppRoute(e.Request.URL.Path, basePath) {
			status = http.StatusNotFound
		}
		return e.HTML(status, html)
	})
	return nil
}
