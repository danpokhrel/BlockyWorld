use crate::{types::*, world_generator::generate_chunk};
use wasm_bindgen::prelude::*;
use web_sys::js_sys;

pub const CHUNK_LENGTH: usize = 32;
pub const HEIGHT_LIMIT: i32 = CHUNK_LENGTH as i32 * 5;
// Padded on all sides
pub const SIZE: usize = CHUNK_LENGTH + 2;
pub const SIZE8: u8 = SIZE as u8;
pub const VOX_COUNT: usize = SIZE * SIZE * SIZE;
const VERT_BUFFER_RESERVE_SIZE: usize = 100_000;

#[wasm_bindgen]
pub struct VoxelChunk {
    arr: Option<Box<[u8; VOX_COUNT]>>,
    origin: CVec3,
    verts: Vec<u32>,
}

#[wasm_bindgen]
impl VoxelChunk {
    #[wasm_bindgen(constructor)]
    pub fn new(x: i32, y: i32, z: i32) -> Self {
        Self {
            arr: None,
            origin: CVec3(x, y, z),
            verts: vec![],
        }
    }

    #[wasm_bindgen]
    pub fn init(&mut self) {
        self.arr = Some(Box::new([0; VOX_COUNT]));
        self.verts.reserve(VERT_BUFFER_RESERVE_SIZE);
    }

    #[wasm_bindgen]
    pub fn free(&mut self) {
        self.arr = None;
        self.verts = vec![];
    }

    #[wasm_bindgen]
    pub fn generate(&mut self) {
        if let Some(arr) = self.arr.as_mut() {
            generate_chunk(arr, self.origin);
        }
    }

    #[wasm_bindgen]
    pub unsafe fn get_buffer(&self) -> js_sys::Uint32Array {
        js_sys::Uint32Array::view(&self.verts)
    }

    #[wasm_bindgen]
    pub fn is_empty(&self) -> bool {
        self.verts.is_empty()
    }

    pub fn get_vert_len(&self) -> usize {
        self.verts.len()
    }

    #[wasm_bindgen]
    pub fn generate_mesh(&mut self) {
        let mut neighbors: [[[bool; 3]; 3]; 3] = [[[false; 3]; 3]; 3];
        let (mut ao0, mut ao1, mut ao2, mut ao3): (u8, u8, u8, u8);

        if self.arr.is_none() {
            self.init();
        }
        let arr = self.arr.as_mut().unwrap();

        for x in 1..SIZE8 - 1 {
            for y in 1..SIZE8 - 1 {
                for z in 1..SIZE8 - 1 {
                    // Coordinates and indicies
                    let idx = xyz_idx(x, y, z);
                    let i = arr[idx];
                    if i == 0 {
                        continue;
                    }
                    let i = i - 1;

                    // Neighbors
                    for dx in 0..3u8 {
                        for dy in 0..3u8 {
                            for dz in 0..3u8 {
                                neighbors[dx as usize][dy as usize][dz as usize] =
                                    arr[xyz_idx(x + (dx - 1), y + (dy - 1), z + (dz - 1))] == 0;
                            }
                        }
                    }

                    // Push Faces
                    if neighbors[2][1][1] {
                        ao0 = ao(neighbors[2][0][1], neighbors[2][1][0], neighbors[2][0][0]);
                        ao1 = ao(neighbors[2][2][1], neighbors[2][1][0], neighbors[2][2][0]);
                        ao2 = ao(neighbors[2][1][2], neighbors[2][0][1], neighbors[2][0][2]);
                        ao3 = ao(neighbors[2][1][2], neighbors[2][2][1], neighbors[2][2][2]);
                        push_face(&mut self.verts, LVec3(x, y, z), 0, i, ao0, ao1, ao2, ao3);
                    };
                    if neighbors[0][1][1] {
                        let ao0 = ao(neighbors[0][0][1], neighbors[0][1][2], neighbors[0][0][2]);
                        let ao1 = ao(neighbors[0][2][1], neighbors[0][1][2], neighbors[0][2][2]);
                        let ao2 = ao(neighbors[0][1][0], neighbors[0][0][1], neighbors[0][0][0]);
                        let ao3 = ao(neighbors[0][1][0], neighbors[0][2][1], neighbors[0][2][0]);
                        push_face(&mut self.verts, LVec3(x, y, z), 1, i, ao0, ao1, ao2, ao3);
                    };
                    if neighbors[1][2][1] {
                        let ao0 = ao(neighbors[1][2][0], neighbors[0][2][1], neighbors[0][2][0]);
                        let ao1 = ao(neighbors[1][2][2], neighbors[0][2][1], neighbors[0][2][2]);
                        let ao2 = ao(neighbors[2][2][1], neighbors[1][2][0], neighbors[2][2][0]);
                        let ao3 = ao(neighbors[1][2][2], neighbors[2][2][1], neighbors[2][2][2]);
                        push_face(&mut self.verts, LVec3(x, y, z), 2, i, ao0, ao1, ao2, ao3);
                    };
                    if neighbors[1][0][1] {
                        let ao0 = ao(neighbors[2][0][1], neighbors[1][0][0], neighbors[2][0][0]);
                        let ao1 = ao(neighbors[1][0][2], neighbors[2][0][1], neighbors[2][0][2]);
                        let ao2 = ao(neighbors[1][0][0], neighbors[0][0][1], neighbors[0][0][0]);
                        let ao3 = ao(neighbors[1][0][2], neighbors[0][0][1], neighbors[0][0][2]);
                        push_face(&mut self.verts, LVec3(x, y, z), 3, i, ao0, ao1, ao2, ao3);
                    };
                    if neighbors[1][1][2] {
                        let ao0 = ao(neighbors[2][1][2], neighbors[1][0][2], neighbors[2][0][2]);
                        let ao1 = ao(neighbors[1][2][2], neighbors[2][1][2], neighbors[2][2][2]);
                        let ao2 = ao(neighbors[1][0][2], neighbors[0][1][2], neighbors[0][0][2]);
                        let ao3 = ao(neighbors[1][2][2], neighbors[0][1][2], neighbors[0][2][2]);
                        push_face(&mut self.verts, LVec3(x, y, z), 4, i, ao0, ao1, ao2, ao3);
                    };
                    if neighbors[1][1][0] {
                        let ao0 = ao(neighbors[1][0][0], neighbors[0][1][0], neighbors[0][0][0]);
                        let ao1 = ao(neighbors[1][2][0], neighbors[0][1][0], neighbors[0][2][0]);
                        let ao2 = ao(neighbors[2][1][0], neighbors[1][0][0], neighbors[2][0][0]);
                        let ao3 = ao(neighbors[1][2][0], neighbors[2][1][0], neighbors[2][2][0]);
                        push_face(&mut self.verts, LVec3(x, y, z), 5, i, ao0, ao1, ao2, ao3);
                    };
                }
            }
        }
    }

    #[wasm_bindgen]
    pub fn ray_cast(
        &mut self,
        mode: i32,
        ox: f32,
        oy: f32,
        oz: f32,
        dx: f32,
        dy: f32,
        dz: f32,
    ) -> Vec<i32> {
        if self.arr.is_none() {
            return vec![0, i32::MAX, i32::MAX, i32::MAX];
        }
        let arr = self.arr.as_mut().unwrap();

        // Transform to local coordinates
        let mut local_ox = ox - self.origin.0 as f32;
        let mut local_oy = oy - self.origin.1 as f32;
        let mut local_oz = oz - self.origin.2 as f32;

        // Compute entry point into the chunk bounding box
        let mut t_min = 0.0f32;
        let mut t_max = f32::INFINITY;

        // For x
        if dx != 0.0 {
            let t1 = (0.0 - local_ox) / dx;
            let t2 = (SIZE as f32 - local_ox) / dx;
            let t_min_x = t1.min(t2);
            let t_max_x = t1.max(t2);
            t_min = t_min.max(t_min_x);
            t_max = t_max.min(t_max_x);
        } else if local_ox < 0.0 || local_ox >= SIZE as f32 {
            return vec![0, i32::MAX, i32::MAX, i32::MAX];
        }

        // For y
        if dy != 0.0 {
            let t1 = (0.0 - local_oy) / dy;
            let t2 = (SIZE as f32 - local_oy) / dy;
            let t_min_y = t1.min(t2);
            let t_max_y = t1.max(t2);
            t_min = t_min.max(t_min_y);
            t_max = t_max.min(t_max_y);
        } else if local_oy < 0.0 || local_oy >= SIZE as f32 {
            return vec![0, i32::MAX, i32::MAX, i32::MAX];
        }

        // For z
        if dz != 0.0 {
            let t1 = (0.0 - local_oz) / dz;
            let t2 = (SIZE as f32 - local_oz) / dz;
            let t_min_z = t1.min(t2);
            let t_max_z = t1.max(t2);
            t_min = t_min.max(t_min_z);
            t_max = t_max.min(t_max_z);
        } else if local_oz < 0.0 || local_oz >= SIZE as f32 {
            return vec![0, i32::MAX, i32::MAX, i32::MAX];
        }

        if t_min > t_max {
            return vec![0, i32::MAX, i32::MAX, i32::MAX];
        }

        // Move to entry point
        local_ox += dx * t_min;
        local_oy += dy * t_min;
        local_oz += dz * t_min;

        // Current voxel
        let mut x = local_ox.floor() as i32;
        let mut y = local_oy.floor() as i32;
        let mut z = local_oz.floor() as i32;

        // Step directions
        let step_x = if dx > 0.0 {
            1
        } else if dx < 0.0 {
            -1
        } else {
            0
        };
        let step_y = if dy > 0.0 {
            1
        } else if dy < 0.0 {
            -1
        } else {
            0
        };
        let step_z = if dz > 0.0 {
            1
        } else if dz < 0.0 {
            -1
        } else {
            0
        };

        // tMax calculations
        let mut t_max_x = if step_x > 0 {
            ((x as f32) + 1.0 - local_ox) / dx
        } else if step_x < 0 {
            ((x as f32) - local_ox) / dx
        } else {
            f32::INFINITY
        };
        let mut t_max_y = if step_y > 0 {
            ((y as f32) + 1.0 - local_oy) / dy
        } else if step_y < 0 {
            ((y as f32) - local_oy) / dy
        } else {
            f32::INFINITY
        };
        let mut t_max_z = if step_z > 0 {
            ((z as f32) + 1.0 - local_oz) / dz
        } else if step_z < 0 {
            ((z as f32) - local_oz) / dz
        } else {
            f32::INFINITY
        };

        // tDelta
        let t_delta_x = if step_x != 0 {
            step_x as f32 / dx
        } else {
            f32::INFINITY
        };
        let t_delta_y = if step_y != 0 {
            step_y as f32 / dy
        } else {
            f32::INFINITY
        };
        let t_delta_z = if step_z != 0 {
            step_z as f32 / dz
        } else {
            f32::INFINITY
        };

        // Traverse
        for _ in 0..(SIZE * 3) {
            if x >= 0 && x < SIZE as i32 && y >= 0 && y < SIZE as i32 && z >= 0 && z < SIZE as i32 {
                let idx = xyz_idx(x as u8, y as u8, z as u8);
                let voxel_id = arr[idx];
                if voxel_id != 0 {
                    if mode == 0 {
                        arr[idx] = 0;
                    } else if mode > 0 {
                        let target_x = x + step_x;
                        let target_y = y + step_y;
                        let target_z = z + step_z;
                        if target_x >= 0
                            && target_x < SIZE as i32
                            && target_y >= 0
                            && target_y < SIZE as i32
                            && target_z >= 0
                            && target_z < SIZE as i32
                        {
                            let target_idx =
                                xyz_idx(target_x as u8, target_y as u8, target_z as u8);
                            arr[target_idx] = mode as u8;
                        }
                    }

                    return vec![voxel_id as i32, x, y, z];
                }
            } else {
                return vec![0, i32::MAX, i32::MAX, i32::MAX];
            }

            if t_max_x < t_max_y && t_max_x < t_max_z {
                x += step_x;
                t_max_x += t_delta_x;
            } else if t_max_y < t_max_z {
                y += step_y;
                t_max_y += t_delta_y;
            } else {
                z += step_z;
                t_max_z += t_delta_z;
            }
        }

        vec![0, i32::MAX, i32::MAX, i32::MAX]
    }
}

pub fn xyz_idx(x: u8, y: u8, z: u8) -> usize {
    x as usize + (SIZE) * (y as usize + (SIZE) * z as usize)
}

pub fn idx_xyz(idx: usize) -> (u8, u8, u8) {
    let z = idx / (SIZE * SIZE);
    let rem = idx % (SIZE * SIZE);

    let y = rem / SIZE;
    let x = rem % SIZE;

    (x as u8, y as u8, z as u8)
}

fn pack_voxel(xyz: LVec3, face: u8, tex: u8, ao: u8) -> u32 {
    let (x, y, z) = (xyz.0 as u32, xyz.1 as u32, xyz.2 as u32);
    let (face, tex, ao) = (face as u32, tex as u32, ao as u32);

    (x & 63)
        | ((y & 63) << 6)
        | ((z & 63) << 12)
        | ((face & 7) << 18)
        | ((tex & 31) << 21)
        | ((ao & 3) << 26)
}

fn push_face(verts: &mut Vec<u32>, xyz: LVec3, f: u8, i: u8, ao0: u8, ao1: u8, ao2: u8, ao3: u8) {
    let (x, y, z) = (xyz.0, xyz.1, xyz.2);
    let fi = f as usize;
    verts.push(pack_voxel(
        LVec3(
            x + FACES[fi][0][0],
            y + FACES[fi][0][1],
            z + FACES[fi][0][2],
        ),
        f,
        i,
        ao0,
    ));
    verts.push(pack_voxel(
        LVec3(
            x + FACES[fi][1][0],
            y + FACES[fi][1][1],
            z + FACES[fi][1][2],
        ),
        f,
        i,
        ao1,
    ));
    verts.push(pack_voxel(
        LVec3(
            x + FACES[fi][2][0],
            y + FACES[fi][2][1],
            z + FACES[fi][2][2],
        ),
        f,
        i,
        ao2,
    ));
    verts.push(pack_voxel(
        LVec3(
            x + FACES[fi][2][0],
            y + FACES[fi][2][1],
            z + FACES[fi][2][2],
        ),
        f,
        i,
        ao2,
    ));
    verts.push(pack_voxel(
        LVec3(
            x + FACES[fi][1][0],
            y + FACES[fi][1][1],
            z + FACES[fi][1][2],
        ),
        f,
        i,
        ao1,
    ));
    verts.push(pack_voxel(
        LVec3(
            x + FACES[fi][3][0],
            y + FACES[fi][3][1],
            z + FACES[fi][3][2],
        ),
        f,
        i,
        ao3,
    ));
}

const FACES: [[[u8; 3]; 4]; 6] = [
    [
        // +X (Left)
        [1, 0, 0],
        [1, 1, 0],
        [1, 0, 1],
        [1, 1, 1],
    ],
    [
        // -X (Right)
        [0, 0, 1],
        [0, 1, 1],
        [0, 0, 0],
        [0, 1, 0],
    ],
    [
        // +Y (Top)
        [0, 1, 0],
        [0, 1, 1],
        [1, 1, 0],
        [1, 1, 1],
    ],
    [
        // -Y (Bottom)
        [1, 0, 0],
        [1, 0, 1],
        [0, 0, 0],
        [0, 0, 1],
    ],
    [
        // +Z (Front)
        [1, 0, 1],
        [1, 1, 1],
        [0, 0, 1],
        [0, 1, 1],
    ],
    [
        // -Z (Back)
        [0, 0, 0],
        [0, 1, 0],
        [1, 0, 0],
        [1, 1, 0],
    ],
];

fn ao(side1: bool, side2: bool, corner: bool) -> u8 {
    if (!side1) && (!side2) {
        3
    } else {
        (!side1) as u8 + (!side2) as u8 + (!corner) as u8
    }
}
