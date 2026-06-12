import { Assets } from "pixi.js";

const soundManifest = [
  { alias: "snake-eat", src: "/audio/eat.mp3" },
  { alias: "bg-music", src: "/audio/bg-music.mp3" },
];

export async function preloadGameAssets() {
  soundManifest.forEach((item) => {
    Assets.add(item);
  });

  const loadedSounds = await Assets.load(soundManifest.map((s) => s.alias));

  console.log("All the assets are loaded", loadedSounds);
}
