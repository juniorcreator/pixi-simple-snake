import { Coordinate } from "./types";

export function randomCords(grid: number, maxWidth: number, maxHeight: number): Coordinate {
  const cols = Math.floor(maxWidth / grid);
  const rows = Math.floor(maxHeight / grid);
  return { x: Math.floor(Math.random() * cols) * grid, y: Math.floor(Math.random() * rows) * grid };
}
