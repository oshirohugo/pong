import './style.css';
import MenuKeysListener from './menu-keys-listener';
import Client from './client';
import { SERVER_HOST } from './game-params';
import Game from './game';

const multiplayerOption = document.getElementById('multiplayer');
const singlePlayerOption = document.getElementById('single-player');
const menu = document.getElementById('menu');
const container = document.getElementById('container');
const connectingText = document.getElementById('connecting-text');

const menuKeysListener = new MenuKeysListener({
  onDown: () => {
    if (multiplayerOption?.classList.contains('selected-item')) {
      multiplayerOption.classList.remove('selected-item');
      singlePlayerOption?.classList.add('selected-item');
    } else if (singlePlayerOption?.classList.contains('selected-item')) {
      singlePlayerOption.classList.remove('selected-item');
      multiplayerOption?.classList.add('selected-item');
    }
  },
  onUp: () => {
    if (multiplayerOption?.classList.contains('selected-item')) {
      multiplayerOption.classList.remove('selected-item');
      singlePlayerOption?.classList.add('selected-item');
    } else if (singlePlayerOption?.classList.contains('selected-item')) {
      singlePlayerOption.classList.remove('selected-item');
      multiplayerOption?.classList.add('selected-item');
    }
  },
  onEnter: () => {
    if (multiplayerOption?.classList.contains('selected-item')) {
      if (menu) {
        menu.style.display = 'none';

        if (connectingText) {
          connectingText.style.display = 'block';
        }

        const game = new Game();

        const client = new Client(SERVER_HOST, {
          onStart: game.onStart.bind(game),
          onGameUpdate: game.onGameUpdate.bind(game),
          onConnect: () => {
            if (connectingText) {
              connectingText.style.display = 'none';
            }
            if (container) {
              container.style.display = 'block';
            }
            game.setOnInput(client.sendState.bind(client));
            game.run();
            menuKeysListener.stopListen();
          },
        });
      }
    }
  },
});

menuKeysListener.listen();
