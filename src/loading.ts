import { Text, Container, Application } from "pixi.js";

export function createLoadingScreen(app: Application) {
  const container = new Container();
  const text = new Text("Loading...", { fill: "0xffffff", fontSize: 32 });
  text.anchor.set(0.5);
  text.x = app.screen.width / 2;
  text.y = app.screen.height / 2;

  container.addChild(text);
  return container;
}
