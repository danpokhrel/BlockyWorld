use crate::types::*;

pub const HEIGHT_LIMIT_C: i32 = 5;
pub const HEIGHT_LIMIT: i32 = 32 * HEIGHT_LIMIT_C;
// Padded on all sides
pub const SIZE: usize = 32 + 2;
pub const SIZE8: u8 = SIZE as u8;
pub const VOX_COUNT: usize = SIZE * SIZE * SIZE;
const VERT_BUFFER_RESERVE_SIZE: usize = 100_000;

pub struct VoxelChunk {
    pub arr: Box<[u8; VOX_COUNT]>,
    pub verts: Vec<u32>,
    pub has_mesh: bool,
}

impl VoxelChunk {
    pub fn new() -> Self {
        Self {
            arr: Box::new([0; VOX_COUNT]),
            verts: Vec::with_capacity(VERT_BUFFER_RESERVE_SIZE),
            has_mesh: false,
        }
    }

    pub fn generate_mesh(&mut self) {
        let mut neighbors: [[[bool; 3]; 3]; 3] = [[[false; 3]; 3]; 3];
        let (mut ao0, mut ao1, mut ao2, mut ao3): (u8, u8, u8, u8);

        for x in 1..SIZE8 - 1 {
            for y in 1..SIZE8 - 1 {
                for z in 1..SIZE8 - 1 {
                    // Coordinates and indicies
                    let idx = xyz_idx(x, y, z);
                    let i = self.arr[idx];
                    if i == 0 {
                        continue;
                    }
                    let i = i - 1;

                    // Neighbors
                    for dx in 0..3u8 {
                        for dy in 0..3u8 {
                            for dz in 0..3u8 {
                                neighbors[dx as usize][dy as usize][dz as usize] = self.arr
                                    [xyz_idx(x + (dx - 1), y + (dy - 1), z + (dz - 1))]
                                    == 0;
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

        self.has_mesh = true;
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
