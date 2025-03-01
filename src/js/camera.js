import { gameState } from './game.js';
import { dimensions } from './utils.js';
import { renderBoard } from './board.js';

// Параметры камеры (масштаб и смещение)
export let camera = {
	scale: 1,
	translateX: window.innerWidth / 2,
	translateY: window.innerHeight / 2,
};

// Функция для анимации камеры (без изменений)
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

// функция для мгновенной установки параметров камеры (без анимации, если duration=0)
export function setCamera(newScale, newTranslateX, newTranslateY, duration = 0) {
	animateCamera(newScale, newTranslateX, newTranslateY, duration);
}

// функция для мгновенного обновления параметров камеры (без анимации)
export function updateCamera(newScale, newTranslateX, newTranslateY) {
	camera.scale = newScale;
	camera.translateX = newTranslateX;
	camera.translateY = newTranslateY;
	renderBoard();
}

// Изменённая функция автоадаптации: она вычисляет только координаты центра (x,y)
// и оставляет текущий scale без изменений
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

	const centerBBx = (minX + maxX) / 2;
	const centerBBy = (minY + maxY) / 2;

	// Вычисляем новые translateX и translateY, используя текущий camera.scale
	const newTranslateX = dimensions.windowWidth / 2 - centerBBx * camera.scale;
	const newTranslateY = dimensions.windowHeight / 2 - centerBBy * camera.scale;

	// Анимируем только смещение, оставляя scale без изменений
	animateCamera(camera.scale, newTranslateX, newTranslateY);
}
