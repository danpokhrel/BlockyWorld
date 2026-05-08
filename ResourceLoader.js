// ---------- WASM ---------- //
import init, { get_buffer, perf_test } from "./Scene/voxel_engine/pkg/voxel_engine.js";
await init();
window.WASM = { get_buffer, perf_test };

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

let start = performance.now();
for (let i = 0; i < 100; i++)
    perf_test(i);
let end = performance.now();
console.log(end - start);

start = performance.now();
for (let i = 0; i < 100; i++)
    jsPerfTest();
end = performance.now();
console.log(end - start);

main();

function jsPerfTest(i) {
    const SIZE = 100;
    let arr = new Uint32Array(SIZE * SIZE * SIZE);

    for (let x = 0; x < SIZE; x++) {
        for (let y = 0; y < SIZE; y++) {
            for (let z = 0; z < SIZE; z++) {
                arr[x * y * z] += i;
            }
        }
    }


    let result = [];
    for (let x = 0; x < SIZE; x++) {
        for (let y = 0; y < SIZE; y++) {
            for (let z = 0; z < SIZE; z++) {
                result.push(arr[x * y * z]);
            }
        }
    }

    return (result);
}