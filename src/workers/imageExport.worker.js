import { renderImage } from "../utils/imageRenderer";

self.onmessage = async ({ data: { job, assets } }) => {
  try {
    const timing = {};
    const blob = await renderImage(
      new OffscreenCanvas(1, 1),
      job,
      assets,
      (progress) => self.postMessage({ progress }),
      undefined,
      timing
    );
    self.postMessage({ blob, timing });
  } catch (error) {
    self.postMessage({ error: error.message });
  } finally {
    assets.tileset.close();
    for (const bitmap of assets.autotileAtlases) bitmap?.close();
  }
};
