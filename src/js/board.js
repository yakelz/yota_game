import { gameState, isCellPermanentlyInvalid, getCandidateCells } from './game.js';
import { dimensions } from './utils.js';
import { camera } from './camera.js';

// Функция создания элемента карточки
export function createCardElement(card) {
	const el = document.createElement('div');
	el.classList.add('card');
	el.style.backgroundColor = card.color;
	el.innerHTML = `${card.shape}<br>${card.number}`;
	return el;
}

export function renderGrid() {
	const board = document.getElementById('game-board');
	let keys = Object.keys(gameState.boardCards);
	let minX, maxX, minY, maxY;
	if (keys.length > 0) {
		const xs = keys.map((k) => Number(k.split(',')[0]));
		const ys = keys.map((k) => Number(k.split(',')[1]));
		minX = Math.min(...xs);
		maxX = Math.max(...xs);
		minY = Math.min(...ys);
		maxY = Math.max(...ys);
	} else {
		minX = maxX = 0;
		minY = maxY = 0;
	}
	// Расширяем границы на 1 клетку с каждой стороны
	minX -= 1;
	maxX += 1;
	minY -= 1;
	maxY += 1;

	for (let x = minX; x <= maxX; x++) {
		for (let y = minY; y <= maxY; y++) {
			const cellDiv = document.createElement('div');
			cellDiv.classList.add('grid-cell');
			// Задаем точные размеры ячейки равные размеру карточки
			cellDiv.style.width = dimensions.cardSize + 'px';
			cellDiv.style.height = dimensions.cardSize + 'px';
			// Вычисляем позицию ячейки так, чтобы она совпадала с позицией карточек
			const left = dimensions.windowWidth / 2 + x * dimensions.cellSize - dimensions.cardSize / 2;
			const top = dimensions.windowHeight / 2 - y * dimensions.cellSize - dimensions.cardSize / 2;
			cellDiv.style.left = left + 'px';
			cellDiv.style.top = top + 'px';
			// Если в этой клетке по правилу нельзя ставить карточку, закрашиваем в серый
			if (isCellPermanentlyInvalid({ x, y })) {
				cellDiv.style.backgroundColor = 'rgba(128,128,128,0.3)';
			}
			board.appendChild(cellDiv);
		}
	}
}

// Отрисовка игрового поля: подсветка кандидатов и карточек на столе
export function renderBoard(selectedCard = null) {
	const board = document.getElementById('game-board');
	board.innerHTML = '';

	// Отрисовываем сетку
	renderGrid();

	// Если выбрана карточка – подсвечиваем кандидатов для хода
	if (selectedCard) {
		const candidates = getCandidateCells(selectedCard);
		candidates.forEach((cell) => {
			const highlight = document.createElement('div');
			highlight.classList.add('highlight');
			highlight.style.width = dimensions.cardSize + 'px';
			highlight.style.height = dimensions.cardSize + 'px';
			const posX =
				dimensions.windowWidth / 2 + cell.x * dimensions.cellSize - dimensions.cardSize / 2;
			const posY =
				dimensions.windowHeight / 2 - cell.y * dimensions.cellSize - dimensions.cardSize / 2;
			highlight.style.left = posX + 'px';
			highlight.style.top = posY + 'px';
			board.appendChild(highlight);
		});
	}

	// Отрисовываем карты, выложенные на столе
	for (let key in gameState.boardCards) {
		const [x, y] = key.split(',').map(Number);
		const card = gameState.boardCards[key];
		const cardEl = createCardElement(card);
		const posX = dimensions.windowWidth / 2 + x * dimensions.cellSize - dimensions.cardSize / 2;
		const posY = dimensions.windowHeight / 2 - y * dimensions.cellSize - dimensions.cardSize / 2;
		cardEl.style.left = posX + 'px';
		cardEl.style.top = posY + 'px';
		board.appendChild(cardEl);
	}

	board.style.transform = `translate(${camera.translateX}px, ${camera.translateY}px) scale(${camera.scale})`;
}

// Отрисовка руки игрока: теперь рендерим прямо в #player-hand
export function renderPlayerHand() {
	const handDiv = document.getElementById('player-hand');
	handDiv.innerHTML = '';
	gameState.playerHand.forEach((card, index) => {
		const cardEl = createCardElement(card);
		cardEl.dataset.index = index;
		handDiv.appendChild(cardEl);
	});
}
