import Phaser from "phaser";
import { WorldScene } from "./scene";
import "./style.css";

new Phaser.Game({
  type: Phaser.AUTO,
  title: "Guerra de Dioses",
  version: "1.0",
  parent: "game",
  backgroundColor: "#9cbac0",
  scale: { mode: Phaser.Scale.RESIZE, width: "100%", height: "100%" },
  render: { antialias: true, roundPixels: false },
  audio: { noAudio: true },
  input: { activePointers: 2, windowEvents: false },
  disableContextMenu: true,
  scene: [WorldScene],
});
