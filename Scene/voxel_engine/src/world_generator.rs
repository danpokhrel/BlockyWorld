use crate::{types::CVec3, voxel_chunk::*};

pub fn generate_chunk(arr: &mut Box<[u8; VOX_COUNT]>, origin: CVec3) {
    let s = 3f32;
    for idx in 0..VOX_COUNT {
        let (x, y, z) = idx_xyz(idx);
        let (x, y, z) = (
            x as i32 + origin.0 - 1,
            y as i32 + origin.1 - 1,
            z as i32 + origin.2 - 1,
        );

        if y >= HEIGHT_LIMIT || y < 0 {
            continue; // blocks already initilized to air
        }

        let i = (x as f32 / s).sin() + (y as f32 / s).sin() + (z as f32 / s).sin() + 0.5;
        let i = i.abs().floor() as u8;
        arr[idx] = i;
    }
}
