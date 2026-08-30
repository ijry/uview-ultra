const MID_BUTTON_SIZE = 64

export function clampMidButtonBorderClipHeight(value) {
	const height = Number(value)
	if (!Number.isFinite(height)) return 0
	return Math.min(Math.max(height, 0), MID_BUTTON_SIZE)
}

export function calculateMidButtonBorderClipHeight(contentTopOrOptions, circleTop, borderTopOffset = 0) {
	let contentTopValue = contentTopOrOptions
	let circleTopValue = circleTop
	let borderTopOffsetValue = borderTopOffset
	if (contentTopOrOptions && typeof contentTopOrOptions === 'object') {
		contentTopValue = contentTopOrOptions.contentTop
		circleTopValue = contentTopOrOptions.circleTop
		borderTopOffsetValue = contentTopOrOptions.borderTopOffset ?? 0
	}
	const targetTop = Number(contentTopValue)
	const currentTop = Number(circleTopValue)
	const borderOffset = Number(borderTopOffsetValue)
	if (![targetTop, currentTop, borderOffset].every(Number.isFinite)) return 0
	return clampMidButtonBorderClipHeight(targetTop + borderOffset - currentTop)
}
