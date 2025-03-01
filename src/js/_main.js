import { initGame } from './game.js';
import { renderBoard, renderPlayerHand } from './board.js';
import { setupEventListeners, updateTestCard } from './events.js';
import { autoFitCamera } from './camera.js';

document.addEventListener('DOMContentLoaded', () => {
	initGame();
	renderPlayerHand();
	autoFitCamera();
	renderBoard();
	updateTestCard();
	setupEventListeners(autoFitCamera);
});
