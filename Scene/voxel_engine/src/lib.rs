extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn perf_test(i: u32) -> Vec<u32> {
    const SIZE: usize = 100;
    let mut arr = Box::new([0u32; SIZE * SIZE * SIZE]);

    for x in 0..SIZE {
        for y in 0..SIZE {
            for z in 0..SIZE {
                arr[x * y * z] += i;
            }
        }
    }

    let mut result: Vec<u32> = Vec::new();
    for x in 0..SIZE {
        for y in 0..SIZE {
            for z in 0..SIZE {
                result.push(arr[x * y * z]);
            }
        }
    }

    result
}

#[wasm_bindgen]
pub fn get_buffer() -> Vec<u32> {
    let mut bytes: Vec<u32> = Vec::new();

    let i: u32 = 1;
    const SIZE: u32 = 32;

    for vx in 0..SIZE {
        for vy in 0..SIZE {
            for vz in 0..SIZE {
                bytes.push(pack_voxel(vx + 1, vy + 0, vz + 0, 0, i, 0));
                bytes.push(pack_voxel(vx + 1, vy + 1, vz + 0, 0, i, 2));
                bytes.push(pack_voxel(vx + 1, vy + 0, vz + 1, 0, i, 0));
                bytes.push(pack_voxel(vx + 1, vy + 0, vz + 1, 0, i, 0));
                bytes.push(pack_voxel(vx + 1, vy + 1, vz + 0, 0, i, 2));
                bytes.push(pack_voxel(vx + 1, vy + 1, vz + 1, 0, i, 3));

                bytes.push(pack_voxel(vx + 0, vy + 0, vz + 1, 1, i, 0));
                bytes.push(pack_voxel(vx + 0, vy + 1, vz + 1, 1, i, 1));
                bytes.push(pack_voxel(vx + 0, vy + 0, vz + 0, 1, i, 0));
                bytes.push(pack_voxel(vx + 0, vy + 0, vz + 0, 1, i, 0));
                bytes.push(pack_voxel(vx + 0, vy + 1, vz + 1, 1, i, 1));
                bytes.push(pack_voxel(vx + 0, vy + 1, vz + 0, 1, i, 0));

                bytes.push(pack_voxel(vx + 0, vy + 1, vz + 0, 2, i, 0));
                bytes.push(pack_voxel(vx + 0, vy + 1, vz + 1, 2, i, 1));
                bytes.push(pack_voxel(vx + 1, vy + 1, vz + 0, 2, i, 2));
                bytes.push(pack_voxel(vx + 1, vy + 1, vz + 0, 2, i, 2));
                bytes.push(pack_voxel(vx + 0, vy + 1, vz + 1, 2, i, 1));
                bytes.push(pack_voxel(vx + 1, vy + 1, vz + 1, 2, i, 3));

                bytes.push(pack_voxel(vx + 1, vy + 0, vz + 0, 3, i, 0));
                bytes.push(pack_voxel(vx + 1, vy + 0, vz + 1, 3, i, 0));
                bytes.push(pack_voxel(vx + 0, vy + 0, vz + 0, 3, i, 0));
                bytes.push(pack_voxel(vx + 0, vy + 0, vz + 0, 3, i, 0));
                bytes.push(pack_voxel(vx + 1, vy + 0, vz + 1, 3, i, 0));
                bytes.push(pack_voxel(vx + 0, vy + 0, vz + 1, 3, i, 0));

                bytes.push(pack_voxel(vx + 1, vy + 0, vz + 1, 4, i, 0));
                bytes.push(pack_voxel(vx + 1, vy + 1, vz + 1, 4, i, 3));
                bytes.push(pack_voxel(vx + 0, vy + 0, vz + 1, 4, i, 0));
                bytes.push(pack_voxel(vx + 0, vy + 0, vz + 1, 4, i, 0));
                bytes.push(pack_voxel(vx + 1, vy + 1, vz + 1, 4, i, 3));
                bytes.push(pack_voxel(vx + 0, vy + 1, vz + 1, 4, i, 1));

                bytes.push(pack_voxel(vx + 0, vy + 0, vz + 0, 5, i, 0));
                bytes.push(pack_voxel(vx + 0, vy + 1, vz + 0, 5, i, 0));
                bytes.push(pack_voxel(vx + 1, vy + 0, vz + 0, 5, i, 0));
                bytes.push(pack_voxel(vx + 1, vy + 0, vz + 0, 5, i, 0));
                bytes.push(pack_voxel(vx + 0, vy + 1, vz + 0, 5, i, 0));
                bytes.push(pack_voxel(vx + 1, vy + 1, vz + 0, 5, i, 2));
            }
        }
    }

    bytes
}

fn pack_voxel(x: u32, y: u32, z: u32, face: u32, tex: u32, ao: u32) -> u32 {
    (x & 63)
        | ((y & 63) << 6)
        | ((z & 63) << 12)
        | ((face & 7) << 18)
        | ((tex & 31) << 21)
        | ((ao & 3) << 26)
}
