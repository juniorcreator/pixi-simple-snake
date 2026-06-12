import { Coordinate } from "./types";

export function randomCords(grid: number, maxWidth: number, maxHeight: number): Coordinate {
  return {
    x: Math.floor(Math.random() * (maxWidth / grid)) * grid,
    y: Math.floor(Math.random() * (maxHeight / grid)) * grid,
  };
}
