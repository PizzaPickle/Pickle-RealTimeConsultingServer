// eventHandlers.js
import { toggleMic, toggleVideo } from './functions.js';
import { confirmButton, toggleMicButton, toggleVideoButton } from './domElements.js';
import { getUserInfo } from './socketHandlers.js';

// 이벤트 리스너 추가
export function initializeEventListeners() {
    confirmButton.addEventListener('click', getUserInfo);
    toggleMicButton.addEventListener('click', toggleMic);
    toggleVideoButton.addEventListener('click', toggleVideo);
}
