import { TILESIZE } from "@/utils/tileset";

export const EXPORT_SCALES = [1, 0.5, 0.25, 0.125];
export const MAX_IMAGE_PIXELS = 16777216;
export const MAX_IMAGE_SIDE = 8192;

export function imageSize(width, height, scale) {
  return {
    width: Math.ceil(width * TILESIZE * scale),
    height: Math.ceil(height * TILESIZE * scale),
  };
}

export function canExport(width, height, scale) {
  const size = imageSize(width, height, scale);
  return (
    EXPORT_SCALES.includes(scale) &&
    size.width <= MAX_IMAGE_SIDE &&
    size.height <= MAX_IMAGE_SIDE &&
    size.width * size.height <= MAX_IMAGE_PIXELS
  );
}
