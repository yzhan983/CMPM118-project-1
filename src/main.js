// src/main.js
import Phaser from 'phaser';
import Generator from './scenes/Generator.js';

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'phaser‑game',
  width: 20*16,        // 20×15 tiles, each 16 px
  height: 15*16,
  pixelArt: true,
  scene: [Generator],
});
