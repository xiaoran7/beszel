import { memo } from "react"

/**
 * KivotosPanoramicBackdrop:
 * Complete, seamless ambient layer from Reference Image 1.
 * Integrates:
 * 1. Japanese Slogan («いつも、どこでも。みんなの「あたりまえ」を支える。»)
 * 2. Kivotos City Skyline & Clock Tower
 * 3. Glass Window Mullion with «Small Servers, Big Tomorrows.»
 * 4. Arona Companion
 * 
 * Positioned fixed/absolute touching the topbar and right screen edge,
 * perfectly mirroring the reference artwork without any seams or sticker effects.
 */
export const AronaCompanionPanel = memo(function AronaCompanionPanel() {
	return (
		<div
			className="hidden 2xl:block absolute top-0 right-0 h-[876px] w-[852px] pointer-events-none select-none z-0 overflow-hidden"
			aria-hidden="true"
		>
			<img
				src="/assets/kivotos_ambient_backdrop.png"
				alt=""
				className="w-full h-full object-cover object-top-right pointer-events-none drop-shadow-xs"
			/>
		</div>
	)
})

