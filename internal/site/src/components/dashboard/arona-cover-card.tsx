import { memo } from "react"

/**
 * AronaCoverCard:
 * Invisible grid anchor for 2xl viewports.
 *
 * Keeps Row 1, Column 4 open so the ambient Kivotos panorama and Arona artwork
 * remain completely clean, pure, and unobstructed (no card borders, text, or overlay pills),
 * while allowing server cards in Row 2 and below to naturally populate Column 4 beneath the artwork.
 *
 * Automatically hidden on `< 2xl` screens (`hidden 2xl:block`) so the 3-column (xl),
 * 2-column (md), and 1-column (mobile) flows adapt smoothly without gaps.
 */
export const AronaCoverCard = memo(function AronaCoverCard() {
	return (
		<div
			className="hidden 2xl:block 2xl:col-start-4 2xl:row-start-1 min-h-[460px] pointer-events-none select-none"
			aria-hidden="true"
		/>
	)
})
