import { shuffle } from './utils.js';

// boardCards хранит карточки с ключами "x,y" (система координат: (0,0) — центр, положительное y – вверх)

export const gameState = {
	boardCards: {}, // Карты на столе (ключ: "x,y")
	deck: [], // Оставшиеся карты колоды
	playerHand: [], // Карты игрока
	currentTurnPlacements: [], // Координаты карт, сыгранных в текущем ходе
	turnOrientation: null, // Направление линии: "horizontal" или "vertical"
	undoStack: [], // Добавлено для отмены последнего размещения карточки
};

// Генерация колоды (64 карты)
export function generateDeck() {
	const numbers = [1, 2, 3, 4];
	const shapes = ['●', '■', '▲', '✚'];
	const colors = ['yellow', 'red', 'blue', 'green'];
	const cards = [];
	for (let number of numbers) {
		for (let shape of shapes) {
			for (let color of colors) {
				cards.push({ number, shape, color });
			}
		}
	}
	return cards;
}

// Функция проверки линии: для каждого признака – все одинаковы или все различны
export function checkLine(cards) {
	if (cards.length < 2) return true;
	const attributes = ['color', 'shape', 'number'];
	for (let attr of attributes) {
		const values = cards.map((card) => card[attr]);
		const allSame = values.every((v) => v === values[0]);
		const allDifferent = new Set(values).size === values.length;
		if (!allSame && !allDifferent) return false;
	}
	return true;
}

export function getVerticalChain(x, startingY) {
	let maxY = startingY;
	while (gameState.boardCards[`${x},${maxY + 1}`]) {
		maxY++;
	}
	let minY = startingY;
	while (gameState.boardCards[`${x},${minY - 1}`]) {
		minY--;
	}
	return { minY, maxY };
}

export function getHorizontalChain(y, startingX) {
	let maxX = startingX;
	while (gameState.boardCards[`${maxX + 1},${y}`]) {
		maxX++;
	}
	let minX = startingX;
	while (gameState.boardCards[`${minX - 1},${y}`]) {
		minX--;
	}
	return { minX, maxX };
}

export function isPermanentlyInvalid(pos) {
	// Если в ячейке уже есть карточка, здесь не вызываем (предполагаем, что pos пустая)
	const directions = [
		{ dx: -1, dy: 0 },
		{ dx: 1, dy: 0 },
		{ dx: 0, dy: 1 },
		{ dx: 0, dy: -1 },
	];
	let horizontalNeighbor = false;
	let verticalNeighbor = false;
	directions.forEach((dir) => {
		if (gameState.boardCards[`${pos.x + dir.dx},${pos.y + dir.dy}`]) {
			if (dir.dx !== 0) horizontalNeighbor = true;
			if (dir.dy !== 0) verticalNeighbor = true;
		}
	});
	return horizontalNeighbor && verticalNeighbor;
}

export function isCellPermanentlyInvalid(pos) {
	// Для pos проверяем непрерывную цепочку по горизонтали и вертикали
	const chainVert = getVerticalChain(pos.x, pos.y);
	const chainHoriz = getHorizontalChain(pos.y, pos.x);

	// Если по вертикали непрерывная цепочка имеет 4 или более карточек...
	const verticalValid = chainVert.maxY - chainVert.minY + 1 >= 4;
	const horizontalValid = chainHoriz.maxX - chainHoriz.minX + 1 >= 4;
	return verticalValid && horizontalValid;
}

// Проверка общих правил размещения карточки на столе
// silent=true не выводит alert
export function isValidMove(newCard, pos, silent = false) {
	const key = `${pos.x},${pos.y}`;
	if (gameState.boardCards[key]) {
		if (!silent) alert('Эта позиция уже занята!');
		return false;
	}
	// Карточка должна касаться хотя бы одной карты на столе
	const directions = [
		{ dx: -1, dy: 0 },
		{ dx: 1, dy: 0 },
		{ dx: 0, dy: 1 },
		{ dx: 0, dy: -1 },
	];
	const adjacentExists = directions.some(
		(dir) => gameState.boardCards[`${pos.x + dir.dx},${pos.y + dir.dy}`]
	);
	if (!adjacentExists) {
		if (!silent) alert('Карточка должна касаться хотя бы одной карты на столе!');
		return false;
	}

	// Проверка горизонтальной линии
	let horizontalLine = [];
	let xLeft = pos.x - 1;
	while (gameState.boardCards[`${xLeft},${pos.y}`]) {
		horizontalLine.unshift(gameState.boardCards[`${xLeft},${pos.y}`]);
		xLeft--;
	}
	horizontalLine.push(newCard);
	let xRight = pos.x + 1;
	while (gameState.boardCards[`${xRight},${pos.y}`]) {
		horizontalLine.push(gameState.boardCards[`${xRight},${pos.y}`]);
		xRight++;
	}
	if (horizontalLine.length > 1 && !checkLine(horizontalLine)) {
		if (!silent) alert('Нарушены правила линии по горизонтали!');
		return false;
	}

	// Проверка вертикальной линии
	let verticalLine = [];
	let yUp = pos.y + 1;
	while (gameState.boardCards[`${pos.x},${yUp}`]) {
		verticalLine.unshift(gameState.boardCards[`${pos.x},${yUp}`]);
		yUp++;
	}
	verticalLine.push(newCard);
	let yDown = pos.y - 1;
	while (gameState.boardCards[`${pos.x},${yDown}`]) {
		verticalLine.push(gameState.boardCards[`${pos.x},${yDown}`]);
		yDown--;
	}
	if (verticalLine.length > 1 && !checkLine(verticalLine)) {
		if (!silent) alert('Нарушены правила линии по вертикали!');
		return false;
	}

	return true;
}

// Проверка, что в текущем ходе все карточки выложены в одну линию
export function isValidTurnPlacement(pos) {
	if (gameState.currentTurnPlacements.length === 0) return true;
	const first = gameState.currentTurnPlacements[0];

	// Если направление еще не выбрано, разрешаем только соседние ячейки (не через ячейку!)
	if (!gameState.turnOrientation) {
		return (
			(pos.x === first.x && (pos.y === first.y + 1 || pos.y === first.y - 1)) ||
			(pos.y === first.y && (pos.x === first.x + 1 || pos.x === first.x - 1))
		);
	}

	// Если направление выбрано вертикальное:
	if (gameState.turnOrientation === 'vertical') {
		if (pos.x !== first.x) return false;
		const chain = getVerticalChain(first.x, first.y);
		// Допустимые ячейки — непосредственно выше верхней карточки цепочки или непосредственно ниже нижней
		return pos.y === chain.maxY + 1 || pos.y === chain.minY - 1;
	}

	// Если направление горизонтальное:
	if (gameState.turnOrientation === 'horizontal') {
		if (pos.y !== first.y) return false;
		const chain = getHorizontalChain(first.y, first.x);
		return pos.x === chain.maxX + 1 || pos.x === chain.minX - 1;
	}
	return true;
}

// Функция возвращает кандидатов для вставки (по общим правилам и правилам хода)
export function getCandidateCells(selectedCard) {
	const candidates = {};
	for (let key in gameState.boardCards) {
		const [x, y] = key.split(',').map(Number);
		const neighbors = [
			{ x: x - 1, y },
			{ x: x + 1, y },
			{ x, y: y + 1 },
			{ x, y: y - 1 },
		];
		neighbors.forEach((cell) => {
			const cellKey = `${cell.x},${cell.y}`;
			if (!gameState.boardCards[cellKey]) {
				candidates[cellKey] = cell;
			}
		});
	}
	let candidateArray = Object.values(candidates);
	if (selectedCard) {
		candidateArray = candidateArray.filter(
			(cell) => isValidMove(selectedCard, cell, true) && isValidTurnPlacement(cell)
		);
	}
	return candidateArray;
}

// Инициализация игры: раздать 4 карты игроку и разместить центральную карточку (0,0)
export function initGame() {
	gameState.deck = shuffle(generateDeck());
	gameState.playerHand = gameState.deck.splice(0, 4);
	// Ставим первую (центральную) карту на стол
	const centerCard = gameState.deck.shift();
	gameState.boardCards['0,0'] = centerCard;
	gameState.currentTurnPlacements = [];
	gameState.turnOrientation = null;
}
