// ---------- WASM ---------- //
import init, { VoxelChunk } from "./Scene/voxel_engine/pkg/voxel_engine.js";
await init();
window.WASM = { VoxelChunk };

// ---------- Textures ---------- // 
const dir = "./Assets/Blocks/";
const urls = ["dirt.png", "grass.png", "stone.png", "stone_grass.png", "water.png"];
window.blockTextures = [];
for (let url of urls) {
    const img = new Image();
    img.src = dir.concat(url);
    await img.decode();
    window.blockTextures.push(img);
    window.bTexWidth = img.width;
    window.bTexHeight = img.height;
}

main();