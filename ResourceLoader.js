// ---------- WASM ---------- //
import init, { VoxelEngine } from "./Scene/voxel_engine/pkg/voxel_engine.js";
await init();
window.WASM = { VoxelEngine };

// ---------- Textures ---------- // 
const dir = "./Assets/Blocks/";
const urls = ["grass.png", "cactus.png"];
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