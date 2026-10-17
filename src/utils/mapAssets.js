import { AUTOTILES, TILESIZE } from "./tileset";

export function releaseAssets(assets) {
  for (const canvas of assets?.autotileAtlases || [])
    if (canvas) canvas.width = canvas.height = 0;
}

export async function loadAssets(map) {
  const load = async (folder, name) => {
    const image = new Image();
    image.src = `/${folder}/${encodeURIComponent(name)}.png`;
    try {
      await image.decode();
    } catch {
      throw new Error(`타일 이미지를 불러올 수 없습니다: ${name}.png`);
    }
    return image;
  };
  const [tileset, autotiles] = await Promise.all([
    load("tilesets", map.tileset),
    Promise.all(
      map.autotiles.map((name) => (name ? load("autotiles", name) : null))
    ),
  ]);
  const autotileAtlases = autotiles.map((image) => {
    if (!image) return null;
    const canvas = document.createElement("canvas");
    canvas.width = TILESIZE * 8;
    canvas.height = TILESIZE * 6;
    const context = canvas.getContext("2d");
    AUTOTILES.flat().forEach((parts, index) =>
      parts.forEach((part, i) => {
        const source = part - 1;
        context.drawImage(
          image,
          (source % 6) * 16,
          Math.floor(source / 6) * 16,
          16,
          16,
          (index % 8) * TILESIZE + (i % 2) * 16,
          Math.floor(index / 8) * TILESIZE + Math.floor(i / 2) * 16,
          16,
          16
        );
      })
    );
    return canvas;
  });
  return { tileset, autotiles, autotileAtlases };
}
