import { Application, Graphics, Text, Container } from "pixi.js";
import { sound } from "@pixi/sound";
import { Coordinate, Direction, Snake } from "./types.ts";
import { randomCords } from "./utils.ts";
import { CONFIG } from "./config.ts";
import { preloadGameAssets } from "./assets.ts";
import { createLoadingScreen } from "./loading.ts";

(async () => {
  const gridCellSize = CONFIG.gridCellSize;

  let currentSpeed = CONFIG.INITIAL_SPEED;
  let isPaused = false;
  let isGameOver = false;
  let isPlaying = false;
  let score = 0;

  const snake: Snake = {
    head: randomCords(gridCellSize, CONFIG.screenWidth, CONFIG.screenHeight - CONFIG.hederHeight),
    body: [],
    direction: Direction.Default,
  };

  let nextDirection = snake.direction;
  let food: Coordinate = randomCords(
    gridCellSize,
    CONFIG.screenWidth,
    CONFIG.screenHeight - CONFIG.hederHeight,
  );

  // keyboard snake moves
  window.addEventListener("keydown", (keypress) => {
    if (keypress.key === "ArrowLeft" && snake.direction !== Direction.Right) {
      nextDirection = Direction.Left;
    } else if (keypress.key === "ArrowDown" && snake.direction !== Direction.Up) {
      nextDirection = Direction.Down;
    } else if (keypress.key === "ArrowRight" && snake.direction !== Direction.Left) {
      nextDirection = Direction.Right;
    } else if (keypress.key === "ArrowUp" && snake.direction !== Direction.Down) {
      nextDirection = Direction.Up;
    } else if (keypress.key === " " || keypress.key === "Spacebar") {
      if (!isGameOver) {
        isPaused = !isPaused;
        textPlayPauseGraphic.visible = isPaused;

        if (isPlaying) {
          if (isPaused) bgMusic.pause();
          else bgMusic.resume();
        }
      }
    }
  });

  const app = new Application();
  // @ts-ignore
  globalThis.__PIXI_APP__ = app;
  await app.init({
    background: CONFIG.backgroundColor,
    width: CONFIG.screenWidth,
    height: CONFIG.screenHeight,
  });
  document.getElementById("pixi-container")!.appendChild(app.canvas);

  // loading game...
  const loadingScreen = createLoadingScreen(app);
  app.stage.addChild(loadingScreen);

  // assets
  await preloadGameAssets();

  // remove load container
  app.stage.removeChild(loadingScreen);
  loadingScreen.destroy();

  // find sounds
  const bgMusic = sound.find("bg-music");
  const eatSong = sound.find("snake-eat");

  const uiContainer = new Container();
  const gameContainer = new Container({ y: CONFIG.hederHeight, x: 0 });

  app.stage.addChild(uiContainer);
  app.stage.addChild(gameContainer);

  const headerGraphic = new Graphics().rect(0, 0, CONFIG.screenWidth, CONFIG.hederHeight).fill(0x333333);
  const snakeHeadGraphic = new Graphics().rect(0, 0, gridCellSize, gridCellSize).fill("orange");
  const foodGraphic = new Graphics().rect(0, 0, gridCellSize, gridCellSize).fill("red");

  const textPlayPauseGraphic = new Text({
    x: app.screen.width / 2,
    y: app.screen.height / 2,
    anchor: 0.5,
    text: "Paused",
    style: { fill: "0xffffff", fontSize: 50, fontWeight: "bold" },
    visible: false,
  });

  const textScore = new Text({
    x: 50,
    y: CONFIG.hederHeight / 2,
    anchor: 0.5,
    alpha: 0.8,
    text: `Score ${score}`,
    style: { fill: "0xffffff", fontSize: 18, fontWeight: "bold" },
    visible: true,
  });

  const textInfo = new Text({
    x: app.screen.width / 2,
    y: CONFIG.hederHeight / 2,
    anchor: 0.5,
    alpha: 0.9,
    text: `Play - Pause = "Space Btn"`,
    style: { fill: "0xffffff", fontSize: 17, fontWeight: "bold" },
    visible: true,
  });

  const textGameOver = new Text({
    x: app.screen.width / 2,
    y: app.screen.height / 2,
    anchor: 0.5,
    text: "Game Over, Restart? ▶️",
    style: { fill: "0xffffff", fontSize: 50, fontWeight: "bold" },
    eventMode: "static",
    cursor: "pointer",
    visible: isGameOver,
  });

  textGameOver.on("pointerdown", () => {
    console.log("textGameOver clicked");
    isGameOver = false;
    textGameOver.visible = isGameOver;

    if (isPlaying) {
      bgMusic.resume();
    }
  });

  const musicBtn = new Text({
    style: { fontSize: 30 },
    x: app.screen.width - 50,
    anchor: 0.5,
    y: CONFIG.hederHeight / 2,
    eventMode: "static",
    cursor: "pointer",
    text: "🔇",
  });

  // on of bg music
  musicBtn.on("pointerdown", () => {
    isPlaying = !isPlaying;
    if (isPlaying) {
      bgMusic.resume();
      musicBtn.text = "🎵";
    } else {
      bgMusic.pause();
      musicBtn.text = "🔇";
    }
  });

  const bodyContainer = new Container();
  const bodyGraphics: Graphics[] = [];

  gameContainer.addChild(foodGraphic);
  gameContainer.addChild(snakeHeadGraphic);
  gameContainer.addChild(bodyContainer);
  gameContainer.addChild(textPlayPauseGraphic, textGameOver);
  uiContainer.addChild(headerGraphic);
  uiContainer.addChild(textScore, musicBtn, textInfo);

  app.ticker.maxFPS = currentSpeed;

  // load bg music
  bgMusic.play({ loop: true, volume: 0.1 });
  bgMusic.pause();

  //////////////// TICKER LOOP
  app.ticker.add(() => {
    if (isPaused || isGameOver) return;

    snake.direction = nextDirection;

    // if eat food
    if (snake.head.x === food.x && snake.head.y === food.y) {
      eatSong.stop();
      eatSong.play({ volume: 0.4, start: 0.1 });

      snake.body.push({ x: snake.head.x, y: snake.head.y });
      food = randomCords(gridCellSize, CONFIG.screenWidth, CONFIG.screenHeight - CONFIG.hederHeight);
      score += 1;
      textScore.text = `Score ${score}`;

      if (currentSpeed < CONFIG.MAX_SPEED) {
        currentSpeed += CONFIG.SPEED_STEP;
        app.ticker.maxFPS = currentSpeed;
      }
    }

    snake.body.unshift({ x: snake.head.x, y: snake.head.y });
    snake.body.pop();

    // snake direction move
    if (snake.direction === Direction.Up) snake.head.y -= gridCellSize;
    if (snake.direction === Direction.Left) snake.head.x -= gridCellSize;
    if (snake.direction === Direction.Down) snake.head.y += gridCellSize;
    if (snake.direction === Direction.Right) snake.head.x += gridCellSize;

    // pass walls
    if (snake.head.x < 0) snake.head.x = CONFIG.screenWidth - gridCellSize;
    else if (snake.head.x >= CONFIG.screenWidth) snake.head.x = 0;

    if (snake.head.y < 0) snake.head.y = CONFIG.screenHeight - gridCellSize - CONFIG.hederHeight;
    else if (snake.head.y >= CONFIG.screenHeight - CONFIG.hederHeight) snake.head.y = 0;

    // if snake hits its tail game over
    if (snake.body.some((body) => body.x === snake.head.x && body.y === snake.head.y)) {
      snake.body = [];
      snake.head = randomCords(gridCellSize, CONFIG.screenWidth, CONFIG.screenHeight - CONFIG.hederHeight);
      nextDirection = Direction.Default;
      snake.direction = Direction.Default;
      isGameOver = true;
      textGameOver.visible = isGameOver;
      score = 0;
      textScore.text = `Score ${score}`;
      bgMusic.pause();

      currentSpeed = CONFIG.INITIAL_SPEED;
      app.ticker.maxFPS = currentSpeed;
    }

    // draw movement
    snakeHeadGraphic.position.set(snake.head.x, snake.head.y);
    foodGraphic.position.set(food.x, food.y);

    // update when new tail part
    while (bodyGraphics.length < snake.body.length) {
      const part = new Graphics().rect(0, 0, gridCellSize, gridCellSize).fill("green");
      bodyContainer.addChild(part);
      bodyGraphics.push(part);
    }
    // update when game over and empty tail
    while (bodyGraphics.length > snake.body.length) {
      const part = bodyGraphics.pop();
      if (part) {
        bodyContainer.removeChild(part);
        part.destroy();
      }
    }

    // update every tail part position
    for (let i = 0; i < snake.body.length; i++) {
      bodyGraphics[i].position.set(snake.body[i].x, snake.body[i].y);
    }
  });
})();
