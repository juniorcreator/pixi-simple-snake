import { Application, Graphics, Text, Container } from "pixi.js";
import { sound } from "@pixi/sound";
import { Coordinate, Direction, Snake } from "./types.ts";
import { randomCords } from "./utils.ts";
import { CONFIG } from "./config.ts";
import { preloadGameAssets } from "./assets.ts";

(async () => {
  const gridCellSize = CONFIG.gridCellSize;

  let currentSpeed = CONFIG.INITIAL_SPEED;
  let isPaused = false;
  let isGameOver = false;
  let score = 0;

  const snake: Snake = {
    head: randomCords(gridCellSize, CONFIG.screenWidth, CONFIG.screenHeight),
    body: [],
    direction: Direction.Default,
  };

  let nextDirection = snake.direction;
  let food: Coordinate = randomCords(gridCellSize, CONFIG.screenWidth, CONFIG.screenHeight);

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

  // assets
  await preloadGameAssets();

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
    x: 10,
    y: 10,
    alpha: 0.7,
    text: `Score ${score}`,
    style: { fill: "0xffffff", fontSize: 18, fontWeight: "bold" },
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
  textGameOver.on("click", () => {
    console.log("textGameOver clicked");
    isGameOver = false;
    textGameOver.visible = isGameOver;
  });

  const bodyContainer = new Container();
  const bodyGraphics: Graphics[] = [];

  app.stage.addChild(foodGraphic);
  app.stage.addChild(snakeHeadGraphic);
  app.stage.addChild(bodyContainer);
  app.stage.addChild(textPlayPauseGraphic, textScore, textGameOver);

  app.ticker.maxFPS = currentSpeed;
  //
  sound.stop("bg-music");
  sound.play("bg-music", { volume: 0.1, loop: true });
  //////////////// ticker
  app.ticker.add(() => {
    if (isPaused) return;

    snake.direction = nextDirection;

    // if eat food
    if (snake.head.x === food.x && snake.head.y === food.y) {
      sound.stop("snake-eat");
      sound.play("snake-eat", { start: 0.1, volume: 0.5 });
      snake.body.push({ x: snake.head.x, y: snake.head.y });
      food = randomCords(gridCellSize, CONFIG.screenWidth, CONFIG.screenHeight);
      score += 1;
      textScore.text = `Score ${score}`;

      if (currentSpeed < CONFIG.MAX_SPEED) {
        currentSpeed += CONFIG.SPEED_STEP;
        app.ticker.maxFPS = currentSpeed;
        console.log("Current speed: ", currentSpeed);
      }
    }

    snake.body.unshift({ x: snake.head.x, y: snake.head.y });
    snake.body.pop();

    // snake direction move
    if (snake.direction === Direction.Up) snake.head.y -= gridCellSize;
    if (snake.direction === Direction.Left) snake.head.x -= gridCellSize;
    if (snake.direction === Direction.Down) snake.head.y += gridCellSize;
    if (snake.direction === Direction.Right) snake.head.x += gridCellSize;

    //pass walls
    if (snake.head.x < 0) snake.head.x = CONFIG.screenWidth - gridCellSize;
    else if (snake.head.x >= CONFIG.screenWidth) snake.head.x = 0;

    if (snake.head.y < 0) snake.head.y = CONFIG.screenHeight - gridCellSize;
    else if (snake.head.y >= CONFIG.screenHeight) snake.head.y = 0;

    // hit its own body
    if (snake.body.some((body) => body.x === snake.head.x && body.y === snake.head.y)) {
      snake.body = [];
      snake.head = randomCords(gridCellSize, CONFIG.screenWidth, CONFIG.screenHeight);
      nextDirection = Direction.Default;
      snake.direction = Direction.Default;
      isGameOver = true;
      textGameOver.visible = isGameOver;
      score = 0;
      textScore.text = `Score ${score}`;

      //reset speed if loose
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

    //update every tail part position
    for (let i = 0; i < snake.body.length; i++) {
      bodyGraphics[i].position.set(snake.body[i].x, snake.body[i].y);
    }
  });
})();
