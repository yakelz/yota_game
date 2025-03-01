// src/events.js
import { gameState, isValidMove, isValidTurnPlacement } from './game.js';
import { renderBoard, renderPlayerHand } from './board.js';
import { autoFitCamera } from './camera.js';
import { recalcDimensions, dimensions } from './utils.js';
import { camera } from './camera.js';

let selectedCardIndex = null;

// Вычисление координат ячейки по клику (с учетом инвертированной оси Y)
export function getGridPosition(clientX, clientY) {
	const boardX = (clientX - camera.translateX) / camera.scale;
	const boardY = (clientY - camera.translateY) / camera.scale;
	const gridX = Math.round((boardX - dimensions.windowWidth / 2) / dimensions.cellSize);
	const gridY = Math.round((dimensions.windowHeight / 2 - boardY) / dimensions.cellSize);
	return { x: gridX, y: gridY };
}

// Обновление тестовой карты – читаем значения из селектов и обновляем элемент #test-card
export function updateTestCard() {
	const color = document.getElementById('test-color').value;
	const shape = document.getElementById('test-shape').value;
	const number = parseInt(document.getElementById('test-number').value);
	gameState.testCard.color = color;
	gameState.testCard.shape = shape;
	gameState.testCard.number = number;

	const testCardEl = document.getElementById('test-card');
	testCardEl.style.backgroundColor = color;
	testCardEl.innerHTML = `${shape}<br>${number}`;
	renderPlayerHand();
	renderBoard(selectedCardIndex !== null ? gameState.playerHand[selectedCardIndex] : null);
}

export function setupEventListeners(autoFitCallback) {
	const boardElement = document.getElementById('game-board');
	const handDiv = document.getElementById('player-hand');

	// Выбор карточки из руки (при клике по элементу карточки)
	handDiv.addEventListener('click', function (e) {
		if (e.target.classList.contains('card')) {
			// Если карточка уже выбрана – снимаем выделение и опускаем её (с плавной анимацией)
			if (e.target.classList.contains('selected')) {
				e.target.classList.remove('selected');
				selectedCardIndex = null;
				renderBoard(null);
			} else {
				handDiv.querySelectorAll('.card').forEach((el) => el.classList.remove('selected'));
				e.target.classList.add('selected');
				selectedCardIndex = parseInt(e.target.dataset.index);
				renderBoard(gameState.playerHand[selectedCardIndex]);
			}
		}
	});

	// Размещение карточки на игровом поле
	boardElement.addEventListener('click', function (e) {
		if (selectedCardIndex === null) return;
		const pos = getGridPosition(e.clientX, e.clientY);
		if (!isValidTurnPlacement(pos)) {
			alert('Карты в одном ходе должны быть выложены в одну линию!');
			return;
		}
		if (!isValidMove(gameState.playerHand[selectedCardIndex], pos)) return;

		if (gameState.currentTurnPlacements.length === 0) {
			gameState.currentTurnPlacements.push(pos);
		} else if (gameState.currentTurnPlacements.length === 1) {
			const first = gameState.currentTurnPlacements[0];
			if (pos.x === first.x) {
				gameState.turnOrientation = 'vertical';
			} else if (pos.y === first.y) {
				gameState.turnOrientation = 'horizontal';
			}
			gameState.currentTurnPlacements.push(pos);
		} else {
			gameState.currentTurnPlacements.push(pos);
		}

		// Размещаем карточку (копия, чтобы не изменять исходный объект)
		const placedCard = { ...gameState.playerHand[selectedCardIndex] };
		gameState.boardCards[`${pos.x},${pos.y}`] = placedCard;

		// Сохраняем данные для возможности отмены размещения
		gameState.undoStack.push({
			card: placedCard,
			pos: pos,
			removedIndex: selectedCardIndex,
			isTestCard: selectedCardIndex === gameState.playerHand.length - 1,
		});

		// boardCards[pos.x + ',' + pos.y] = playerHand[selectedCardIndex];
		// console.log(`Координаты карточки: x = ${pos.x}, y = ${pos.y}`);
		// playerHand.splice(selectedCardIndex, 1);

		// Если сыграна тестовая карта – возвращаем её в руку
		const isTestCard = selectedCardIndex === gameState.playerHand.length - 1;
		gameState.playerHand.splice(selectedCardIndex, 1);
		if (isTestCard) {
			gameState.playerHand.push(gameState.testCard);
		}

		selectedCardIndex = null;
		renderPlayerHand();
		autoFitCallback();
		renderBoard();
	});

	// Обработка кнопки "Завершить ход"
	document.getElementById('endTurnButton').addEventListener('click', function () {
		gameState.currentTurnPlacements = [];
		gameState.turnOrientation = null;
		// Раздаем новые 4 карты (оставшиеся карты из руки отбрасываются)
		gameState.playerHand = gameState.deck.splice(0, 4);
		gameState.playerHand.push(gameState.testCard);
		selectedCardIndex = null;
		renderPlayerHand();
	});

	document.getElementById('undoButton').addEventListener('click', function () {
		if (gameState.undoStack.length > 0) {
			const lastMove = gameState.undoStack.pop();
			// Убираем карточку с игрового поля
			delete gameState.boardCards[`${lastMove.pos.x},${lastMove.pos.y}`];
			// Возвращаем карточку в руку (в начало массива)
			gameState.playerHand.unshift(lastMove.card);

			// Сбрасываем текущие размещения (на случай, если они остались)
			gameState.currentTurnPlacements = [];
			// Автоматически выбираем возвращенную карточку для дальнейшего хода
			selectedCardIndex = 0;
			// Перерисовываем руку и игровое поле с выделением восстановленной карточки,
			// чтобы getCandidateCells() вызывался и подсвечивал возможные позиции

			renderBoard();
			renderPlayerHand();
		} else {
			alert('Нет действий для отмены.');
		}
	});

	// Кнопка обновления тестовой карты
	document.getElementById('updateTestCard').addEventListener('click', updateTestCard);

	// Панорамирование мышью
	let isPanning = false;
	let startPan = { x: 0, y: 0 };

	boardElement.addEventListener('mousedown', function (e) {
		isPanning = true;
		startPan = { x: e.clientX - camera.translateX, y: e.clientY - camera.translateY };
		boardElement.style.cursor = 'grabbing';
	});

	document.addEventListener('mousemove', function (e) {
		if (!isPanning) return;
		camera.translateX = e.clientX - startPan.x;
		camera.translateY = e.clientY - startPan.y;
		renderBoard(selectedCardIndex !== null ? gameState.playerHand[selectedCardIndex] : null);
	});

	document.addEventListener('mouseup', function () {
		isPanning = false;
		boardElement.style.cursor = 'default';
	});

	// Сенсорные события (панорамирование и зум)
	let touchMode = null;
	let initialPinchDistance = 0;
	let initialScaleForPinch = camera.scale;
	let startPinchTranslate = { x: 0, y: 0 };
	let pinchMidpoint = { x: 0, y: 0 };

	boardElement.addEventListener('touchstart', function (e) {
		if (e.touches.length === 1) {
			touchMode = 'pan';
			startPan = {
				x: e.touches[0].clientX - camera.translateX,
				y: e.touches[0].clientY - camera.translateY,
			};
		} else if (e.touches.length === 2) {
			touchMode = 'pinch';
			initialPinchDistance = Math.hypot(
				e.touches[0].clientX - e.touches[1].clientX,
				e.touches[0].clientY - e.touches[1].clientY
			);
			initialScaleForPinch = camera.scale;
			startPinchTranslate = { x: camera.translateX, y: camera.translateY };
			pinchMidpoint = {
				x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
				y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
			};
		}
	});

	boardElement.addEventListener(
		'touchmove',
		function (e) {
			e.preventDefault();
			if (touchMode === 'pan' && e.touches.length === 1) {
				camera.translateX = e.touches[0].clientX - startPan.x;
				camera.translateY = e.touches[0].clientY - startPan.y;
				renderBoard(selectedCardIndex !== null ? gameState.playerHand[selectedCardIndex] : null);
			} else if (touchMode === 'pinch' && e.touches.length === 2) {
				let currentDistance = Math.hypot(
					e.touches[0].clientX - e.touches[1].clientX,
					e.touches[0].clientY - e.touches[1].clientY
				);
				let newScale = initialScaleForPinch * (currentDistance / initialPinchDistance);
				newScale = Math.min(Math.max(newScale, 0.5), 2);
				camera.translateX =
					pinchMidpoint.x -
					(newScale / initialScaleForPinch) * (pinchMidpoint.x - startPinchTranslate.x);
				camera.translateY =
					pinchMidpoint.y -
					(newScale / initialScaleForPinch) * (pinchMidpoint.y - startPinchTranslate.y);
				camera.scale = newScale;
				renderBoard(selectedCardIndex !== null ? gameState.playerHand[selectedCardIndex] : null);
			}
		},
		{ passive: false }
	);

	boardElement.addEventListener('touchend', function (e) {
		if (e.touches.length === 0) {
			touchMode = null;
		}
	});

	// Зум колесиком мыши
	boardElement.addEventListener('wheel', function (e) {
		e.preventDefault();
		const oldScale = camera.scale;
		const delta = e.deltaY > 0 ? -0.1 : 0.1;
		camera.scale = Math.min(Math.max(camera.scale + delta, 0.5), 2);
		const mouseX = e.clientX;
		const mouseY = e.clientY;
		camera.translateX = mouseX - (mouseX - camera.translateX) * (camera.scale / oldScale);
		camera.translateY = mouseY - (mouseY - camera.translateY) * (camera.scale / oldScale);
		renderBoard(selectedCardIndex !== null ? gameState.playerHand[selectedCardIndex] : null);
	});

	// Обработка изменения размеров окна
	window.addEventListener('resize', function () {
		const oldWidth = dimensions.windowWidth;
		const oldHeight = dimensions.windowHeight;
		recalcDimensions();
		camera.translateX += (dimensions.windowWidth - oldWidth) / 2;
		camera.translateY += (dimensions.windowHeight - oldHeight) / 2;
		autoFitCallback();
		renderBoard(selectedCardIndex !== null ? gameState.playerHand[selectedCardIndex] : null);
		renderPlayerHand();
	});
}
