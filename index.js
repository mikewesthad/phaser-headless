const installJsDom = require("jsdom-global");

const uninstallJsDom = installJsDom("", {
  pretendToBeVisual: true,
  // Required for Phaser's TextureManager to boot (because it loads two base64 images):
  resources: "usable",
});
// Globals that are missing from jsdom-global:
global.performance = global.window.performance;
global.window.focus = () => {};

function shutdown() {
  global.window.close();
  uninstallJsDom();
}

const Phaser = require("phaser");

class MainScene extends Phaser.Scene {
  constructor() {
    super();
    this.frameNum = 0;
  }

  create() {
    console.log("MainScene Created!");
  }

  update() {
    console.log(`MainScene Update #${this.frameNum}!`);

    this.frameNum += 1;
    if (this.frameNum > 5) {
      this.game.destroy();

      // There is some issue with shutting down Phaser's RAF. Calling destroy schedules destruction
      // for the next step, so this waits for that, then schedules an async shutdown that will clear
      // all RAF timers. Clearing them without the async shutdown won't catch the latest RAF
      // scheduled.
      this.game.events.on("destroy", () => {
        setTimeout(shutdown, 0);
      });
    }
  }
}

const game = new Phaser.Game({
  type: Phaser.HEADLESS,
  customEnvironment: true,
  scene: [MainScene],
  width: 800,
  height: 600,
});
