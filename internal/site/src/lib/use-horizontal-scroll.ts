import { useCallback, useEffect, useRef } from "react"

/**
 * Enables wheel and click-drag scrolling for a horizontally overflowing strip.
 *
 * `scrollbar-hide` strips the scrollbar for the Aozora look, which leaves a
 * mouse user with no way to reach the chips past the right edge: a vertical
 * wheel does nothing on a horizontal scroller, and there is no visible thumb to
 * grab. This maps the vertical wheel to horizontal scroll while the cursor is
 * over the strip, and lets a mouse drag scroll it like a touch swipe.
 *
 * Listeners are attached from a ref callback rather than an effect so they are
 * bound the moment the node mounts, whatever order React runs sibling effects
 * in (the sheet mounts its content lazily, so a mount-only effect raced it).
 * The wheel listener must be non-passive in order to preventDefault.
 */
export function useHorizontalScroll<T extends HTMLElement>(): {
	ref: (node: T | null) => void
	onPointerDown: (event: React.PointerEvent<T>) => void
} {
	const nodeRef = useRef<T | null>(null)
	const cleanupRef = useRef<(() => void) | null>(null)
	// Drag bookkeeping lives in a ref: moving the pointer must not re-render.
	const drag = useRef({ active: false, startX: 0, startScroll: 0, moved: false })

	const ref = useCallback((node: T | null) => {
		cleanupRef.current?.()
		cleanupRef.current = null
		nodeRef.current = node
		if (!node) return

		const onWheel = (event: WheelEvent) => {
			// Only take over when the strip actually overflows, so a vertical
			// page scroll keeps working when the chips already fit.
			if (node.scrollWidth <= node.clientWidth) return
			// Respect horizontal wheel/trackpad gestures and let the page handle
			// zoom (ctrl) and pinch, which also arrive as wheel events.
			if (event.ctrlKey || Math.abs(event.deltaX) > Math.abs(event.deltaY)) return
			event.preventDefault()
			node.scrollLeft += event.deltaY
		}

		const onPointerMove = (event: PointerEvent) => {
			const state = drag.current
			if (!state.active) return
			const delta = event.clientX - state.startX
			// Treat a few pixels as a click, not a drag, so chips stay tappable.
			if (Math.abs(delta) > 4) state.moved = true
			node.scrollLeft = state.startScroll - delta
		}

		const onPointerUp = () => {
			if (!drag.current.active) return
			const wasDrag = drag.current.moved
			drag.current.active = false
			// A completed drag must not also fire the chip's click handler.
			if (wasDrag) {
				const swallow = (clickEvent: MouseEvent) => {
					clickEvent.preventDefault()
					clickEvent.stopPropagation()
				}
				node.addEventListener("click", swallow, { capture: true, once: true })
				// If no click follows, drop the one-shot guard on the next task.
				setTimeout(() => node.removeEventListener("click", swallow, { capture: true }), 0)
			}
		}

		node.addEventListener("wheel", onWheel, { passive: false })
		window.addEventListener("pointermove", onPointerMove)
		window.addEventListener("pointerup", onPointerUp)
		window.addEventListener("pointercancel", onPointerUp)

		cleanupRef.current = () => {
			node.removeEventListener("wheel", onWheel)
			window.removeEventListener("pointermove", onPointerMove)
			window.removeEventListener("pointerup", onPointerUp)
			window.removeEventListener("pointercancel", onPointerUp)
		}
	}, [])

	// Release listeners if the strip unmounts without React calling the ref again.
	useEffect(() => () => cleanupRef.current?.(), [])

	const onPointerDown = useCallback((event: React.PointerEvent<T>) => {
		// Left button / touch only; ignore right and middle clicks.
		if (event.button !== 0) return
		const node = nodeRef.current
		if (!node || node.scrollWidth <= node.clientWidth) return
		drag.current = { active: true, startX: event.clientX, startScroll: node.scrollLeft, moved: false }
	}, [])

	return { ref, onPointerDown }
}
