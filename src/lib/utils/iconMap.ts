/**
 * Maps emoji area icons (from Supabase) to Google Material Symbols icon names.
 * Used to replace informal emoji rendering with professional icon font.
 */
const EMOJI_TO_MATERIAL: Record<string, string> = {
	'🏗️': 'construction',
	'🏗': 'construction',
	'🏥': 'local_hospital',
	'🍱': 'restaurant',
	'📚': 'school',
	'🐾': 'pets',
	'🏠': 'night_shelter',
	'🛖': 'night_shelter',
	'💊': 'medication',
	'🩺': 'medical_services',
	'👶': 'child_care',
	'💧': 'water_drop',
	'⚡': 'bolt',
	'🌐': 'language',
	'🎯': 'target',
	'🏕️': 'night_shelter',
	'🏕': 'night_shelter',
	'🤝': 'handshake',
};

/**
 * Returns the Material Symbols icon name for a given emoji.
 * Falls back to 'volunteer_activism' if no mapping exists.
 */
export function getAreaIconName(emoji: string | undefined | null): string {
	if (!emoji) return 'volunteer_activism';
	return EMOJI_TO_MATERIAL[emoji] ?? 'volunteer_activism';
}
