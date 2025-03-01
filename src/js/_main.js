import { initGame } from './game.js';
import { renderBoard, renderPlayerHand } from './board.js';
import { setupEventListeners } from './events.js';
import { autoFitCamera } from './camera.js';

import { initTestCard } from './testCard.js';

document.addEventListener('DOMContentLoaded', () => {
	initGame();
	initTestCard();
	renderPlayerHand();
	autoFitCamera();
	renderBoard();
	setupEventListeners(autoFitCamera);
});
