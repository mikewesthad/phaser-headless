const installJsDom = require("jsdom-global");

// Phaser depends on globals being present, jsdom-global patches most of those in.
const uninstallJsDom = installJsDom("", {
  // Add RAF functionality:
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

// Make sure to import Phaser after setting up globals, since Phaser includes its own polyfills.
const Phaser = require("phaser");

class MainScene extends Phaser.Scene {
  constructor() {
    super();
    this.frameNum = 0;
    this.isGameOver = false;
  }

  create() {
    console.log("MainScene Created!");

    // Create a world with a falling sprite and a static floor below it.
    this.movingSprite = this.matter.add.sprite(0, 0, "").setRectangle(20, 5);
    this.floorSprite = this.matter.add
      .sprite(0, 50, "")
      .setRectangle(200, 5)
      .setStatic(true);

    this.matter.world.once("collisionstart", this.onCollision, this);
  }

  onCollision(event, bodyA, bodyB) {
    console.log("Sprite hit the floor!");
    console.log("Shutting down the game...");
    this.game.destroy();
    this.isGameOver = true;

    // There is some issue with shutting down Phaser's RAF. Calling destroy schedules destruction
    // for the next step, so this waits for that, then schedules an async shutdown that will clear
    // all RAF timers. Clearing them without the async shutdown won't catch the latest RAF
    // scheduled.
    this.game.events.on("destroy", () => {
      setTimeout(shutdown, 0);
    });
  }

  update() {
    // It is possible for one more update after destroying from collisionstart, so avoid that with a
    // conditional check:
    if (this.isGameOver) {
      return;
    }

    this.frameNum += 1;
    const floorDist = this.floorSprite.y - this.movingSprite.y;
    console.log(`MainScene Update #${this.frameNum}!`);
    console.log(
      `\tThe sprite is falling, current y: ${this.movingSprite.y.toFixed(1)}.`
    );
    console.log(
      `\tThe sprite is ${floorDist.toFixed(1)} units away from the floor.`
    );
  }
}

const game = new Phaser.Game({
  type: Phaser.HEADLESS,
  customEnvironment: true,
  scene: [MainScene],
  width: 800,
  height: 600,
  physics: {
    default: "matter",
  },
});
