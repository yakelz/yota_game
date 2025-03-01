// Адаптивные размеры (в пикселях)
export let dimensions = {
	cardSize: window.innerWidth * 0.08,
	gap: window.innerWidth * 0.08 * 0.1, // gap – 10% от cardSize
	cellSize: window.innerWidth * 0.08 + window.innerWidth * 0.08 * 0.1,
	// Глобальные размеры окна
	windowWidth: window.innerWidth,
	windowHeight: window.innerHeight,
};

export function recalcDimensions() {
	dimensions.cardSize = window.innerWidth * 0.08;
	dimensions.gap = dimensions.cardSize * 0.1;
	dimensions.cellSize = dimensions.cardSize + dimensions.gap;
	dimensions.windowWidth = window.innerWidth;
	dimensions.windowHeight = window.innerHeight;
}

// Перемешивание массива (алгоритм Фишера-Йетса)
export function shuffle(array) {
	for (let i = array.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[array[i], array[j]] = [array[j], array[i]];
	}
	return array;
}
