import { gameState } from './game.js';
import { renderPlayerHand } from './board.js';
import '../styles/testCard.css';

function createTestUI() {
	// Создаем контейнер для тестовой карты
	const container = document.createElement('div');
	container.className = 'test-controls';

	// Предпросмотр тестовой карты
	const testCardPreview = document.createElement('div');
	testCardPreview.id = 'test-card';

	// Селектор цвета
	const colorLabel = document.createElement('label');
	colorLabel.textContent = 'Цвет: ';
	const colorSelect = document.createElement('select');
	colorSelect.id = 'test-color';
	['yellow', 'red', 'blue', 'green'].forEach((color) => {
		const opt = document.createElement('option');
		opt.value = color;
		opt.textContent = color;
		colorSelect.appendChild(opt);
	});
	colorLabel.appendChild(colorSelect);

	// Селектор формы
	const shapeLabel = document.createElement('label');
	shapeLabel.textContent = 'Форма: ';
	const shapeSelect = document.createElement('select');
	shapeSelect.id = 'test-shape';
	['●', '■', '▲', '✚'].forEach((shape) => {
		const opt = document.createElement('option');
		opt.value = shape;
		opt.textContent = shape;
		shapeSelect.appendChild(opt);
	});
	shapeLabel.appendChild(shapeSelect);

	// Селектор номера
	const numberLabel = document.createElement('label');
	numberLabel.textContent = 'Номер: ';
	const numberSelect = document.createElement('select');
	numberSelect.id = 'test-number';
	[1, 2, 3, 4].forEach((num) => {
		const opt = document.createElement('option');
		opt.value = num;
		opt.textContent = num;
		numberSelect.appendChild(opt);
	});
	numberLabel.appendChild(numberSelect);

	// Кнопка обновления тестовой карты
	const updateButton = document.createElement('button');
	updateButton.id = 'updateTestCard';
	updateButton.textContent = 'Обновить тестовую карту';
	updateButton.addEventListener('click', updateTestCard);

	// Собираем UI
	container.appendChild(testCardPreview);
	container.appendChild(colorLabel);
	container.appendChild(shapeLabel);
	container.appendChild(numberLabel);
	container.appendChild(updateButton);

	document.getElementsByClassName('ui')[0].appendChild(container);
	updateTestCardPreview();
}

function updateTestCard() {
	const color = document.getElementById('test-color').value;
	const shape = document.getElementById('test-shape').value;
	const number = parseInt(document.getElementById('test-number').value);

	gameState.testCard.color = color;
	gameState.testCard.shape = shape;
	gameState.testCard.number = number;
	updateTestCardPreview();

	renderPlayerHand();
}

function updateTestCardPreview() {
	console.log(gameState.testCard);
	const testCardEl = document.getElementById('test-card');
	if (testCardEl) {
		testCardEl.style.backgroundColor = gameState.testCard.color;
		testCardEl.innerHTML = `${gameState.testCard.shape}<br>${gameState.testCard.number}`;
	}
}

// Функция для автоматического возврата тестовой карты в руку,
// если она была сыграна (то есть отсутствует в gameState.playerHand)
function ensureTestCardInHand() {
	if (!gameState.playerHand.includes(gameState.testCard)) {
		gameState.playerHand.push(gameState.testCard);
		renderPlayerHand();
	}
}

export function initTestCard() {
	// Инициализируем тестовую карту и добавляем её в gameState
	gameState.testCard = { color: 'yellow', shape: '●', number: 1 };
	gameState.playerHand.push(gameState.testCard);
	// Немедленно создаем UI для тестовой карты при импорте модуля
	createTestUI();
	setInterval(ensureTestCardInHand, 500);
}
