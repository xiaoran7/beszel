import { describe, expect, it } from "vitest"
import { normalizeScriptSrc, parseHTMLFingerprint } from "./version-checker"

describe("version-checker fingerprint extraction", () => {
	it("normalizes script paths correctly", () => {
		expect(normalizeScriptSrc("./assets/index-BrcKYWAo.js")).toBe("assets/index-BrcKYWAo.js")
		expect(normalizeScriptSrc("/assets/index-BrcKYWAo.js")).toBe("assets/index-BrcKYWAo.js")
		expect(normalizeScriptSrc("assets/index-BrcKYWAo.js")).toBe("assets/index-BrcKYWAo.js")
		expect(normalizeScriptSrc("/assets/index-BrcKYWAo.js?t=12345")).toBe("assets/index-BrcKYWAo.js")
	})

	it("extracts scriptSrc and HUB_VERSION from Hub production HTML", () => {
		const html = `<!doctype html>
<html lang="en">
<head>
	<script>
		globalThis.BESZEL = {"BASE_PATH":"/","HUB_VERSION":"0.21.2","HUB_URL":"https://beszel.tannerlab.xyz"}
	</script>
	<script type="module" crossorigin src="/assets/index-BrcKYWAo.js"></script>
	<link rel="stylesheet" crossorigin href="/assets/index-BZzuMrJv.css">
</head>
<body><div id="app"></div></body>
</html>`

		const parsed = parseHTMLFingerprint(html)
		expect(parsed.version).toBe("0.21.2")
		expect(parsed.scriptSrc).toBe("/assets/index-BrcKYWAo.js")
		expect(normalizeScriptSrc(parsed.scriptSrc)).toBe("assets/index-BrcKYWAo.js")
	})

	it("extracts scriptSrc from dist HTML before Hub injection", () => {
		const html = `<!doctype html>
<html lang="en">
<head>
	<script>
		globalThis.BESZEL = "{info}"
	</script>
	<script type="module" crossorigin src="./assets/index-D1EjlUHJ.js"></script>
</head>
<body><div id="app"></div></body>
</html>`

		const parsed = parseHTMLFingerprint(html)
		expect(parsed.version).toBe("")
		expect(parsed.scriptSrc).toBe("./assets/index-D1EjlUHJ.js")
		expect(normalizeScriptSrc(parsed.scriptSrc)).toBe("assets/index-D1EjlUHJ.js")
	})

	it("handles reversed script attribute order", () => {
		const html = `<script src="/assets/index-NewHash99.js" type="module" crossorigin></script>`
		const parsed = parseHTMLFingerprint(html)
		expect(parsed.scriptSrc).toBe("/assets/index-NewHash99.js")
	})

	it("handles HTML with no matching scripts gracefully", () => {
		const html = `<html><head><title>502 Bad Gateway</title></head><body>Server offline</body></html>`
		const parsed = parseHTMLFingerprint(html)
		expect(parsed.version).toBe("")
		expect(parsed.scriptSrc).toBe("")
	})
})
