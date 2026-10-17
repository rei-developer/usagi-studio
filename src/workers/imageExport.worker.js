import { renderImage } from "../utils/imageRenderer";

self.onmessage = async ({ data: { job, assets } }) => {
  try {
    const blob = await renderImage(
      new OffscreenCanvas(1, 1),
      job,
      assets,
      (progress) => self.postMessage({ progress })
    );
    self.postMessage({ blob });
  } catch (error) {
    self.postMessage({ error: error.message });
  } finally {
    assets.tileset.close();
    for (const bitmap of assets.autotileAtlases) bitmap?.close();
  }
};
