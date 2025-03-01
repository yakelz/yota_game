import { gameState } from './game.js';
import { dimensions } from './utils.js';
import { renderBoard } from './board.js';

// Параметры камеры (масштаб и смещение)
export let camera = {
	scale: 1,
	translateX: window.innerWidth / 2,
	translateY: window.innerHeight / 2,
};

export function animateCamera(targetScale, targetTranslateX, targetTranslateY, duration = 500) {
	const startTime = performance.now();
	const startScale = camera.scale;
	const startTranslateX = camera.translateX;
	const startTranslateY = camera.translateY;

	function easeOutCubic(t) {
		return 1 - Math.pow(1 - t, 3);
	}

	function step(timestamp) {
		const elapsed = timestamp - startTime;
		const progress = Math.min(elapsed / duration, 1);
		const eased = easeOutCubic(progress);

		camera.scale = startScale + (targetScale - startScale) * eased;
		camera.translateX = startTranslateX + (targetTranslateX - startTranslateX) * eased;
		camera.translateY = startTranslateY + (targetTranslateY - startTranslateY) * eased;

		renderBoard();
		if (progress < 1) {
			requestAnimationFrame(step);
		}
	}
	requestAnimationFrame(step);
}

export function autoFitCamera() {
	const keys = Object.keys(gameState.boardCards);
	if (keys.length === 0) return;

	let minX = Infinity,
		maxX = -Infinity,
		minY = Infinity,
		maxY = -Infinity;
	keys.forEach((key) => {
		const [x, y] = key.split(',').map(Number);
		const left = dimensions.windowWidth / 2 + x * dimensions.cellSize - dimensions.cardSize / 2;
		const top = dimensions.windowHeight / 2 - y * dimensions.cellSize - dimensions.cardSize / 2;
		const right = left + dimensions.cardSize;
		const bottom = top + dimensions.cardSize;
		if (left < minX) minX = left;
		if (right > maxX) maxX = right;
		if (top < minY) minY = top;
		if (bottom > maxY) maxY = bottom;
	});

	const boundingWidth = maxX - minX;
	const boundingHeight = maxY - minY;
	const margin = 0.2;
	const desiredWidth = boundingWidth * (1 + margin);
	const desiredHeight = boundingHeight * (1 + margin);

	let newScale = Math.min(
		dimensions.windowWidth / desiredWidth,
		dimensions.windowHeight / desiredHeight
	);
	newScale = Math.min(Math.max(newScale, 0.5), 2);

	const centerBBx = (minX + maxX) / 2;
	const centerBBy = (minY + maxY) / 2;

	const newTranslateX = dimensions.windowWidth / 2 - centerBBx * newScale;
	const newTranslateY = dimensions.windowHeight / 2 - centerBBy * newScale;

	animateCamera(newScale, newTranslateX, newTranslateY);
}
