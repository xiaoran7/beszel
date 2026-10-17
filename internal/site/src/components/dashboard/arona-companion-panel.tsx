import { memo } from "react"

/**
 * KivotosPanoramicBackdrop:
 * Seamless ambient layer with full Light/Dark mode dual-adaptation.
 *
 * - Light Mode: Clean, high-key Aozora daylight panorama with full skyline & Arona companion.
 * - Dark Mode: Seamless night-atmosphere transformation. Smooth multi-axis gradient mask
 *   eliminates all rectangular clipping seams, while fine-tuned dark filters (brightness/contrast/hue)
 *   render Arona as a gentle, quiet nighttime companion under moonlit terminal glow.
 */
export const AronaCompanionPanel = memo(function AronaCompanionPanel() {
	return (
		<div
			className="hidden 2xl:block absolute top-0 right-0 h-[876px] w-[852px] pointer-events-none select-none z-0 overflow-hidden"
			style={{ transform: "translateZ(0)", willChange: "transform" }}
			aria-hidden="true"
		>
			<img
				src="/assets/kivotos_ambient_backdrop.png"
				alt=""
				className="w-full h-full object-cover object-top-right pointer-events-none drop-shadow-xs transition-all duration-300
					dark:opacity-40
					dark:brightness-[0.58]
					dark:contrast-[1.12]
					dark:saturate-[0.88]
					dark:hue-rotate-[-8deg]
					[mask-image:linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.15)_25%,rgba(0,0,0,0.85)_55%,black_80%)]
					dark:[mask-image:linear-gradient(to_right,transparent_0%,rgba(0,0,0,0.05)_45%,rgba(0,0,0,0.6)_70%,black_90%),linear-gradient(to_bottom,black_60%,rgba(0,0,0,0.4)_85%,transparent_100%)]
					dark:[mask-composite:intersect]"
			/>
			{/* Night ambient rim glow */}
			<div className="absolute inset-0 bg-gradient-to-l from-sky-950/20 via-transparent to-transparent hidden dark:block pointer-events-none" />
		</div>
	)
})
