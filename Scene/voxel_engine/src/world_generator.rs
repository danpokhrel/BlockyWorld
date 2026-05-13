extern crate noiselib;

use self::noiselib::uniform::UniformRandomGen;
use crate::{types::CVec3, voxel_chunk::*};

pub fn generate_chunk(arr: &mut Box<[u8; VOX_COUNT]>, origin: CVec3) {
    let mut rng: UniformRandomGen = UniformRandomGen::new(0);
    let mut heightmap = [[0i32; SIZE]; SIZE];
    let mut heightmap2 = [[0i32; SIZE]; SIZE];

    for x in 0..SIZE {
        for z in 0..SIZE {
            let (wx, wz) = (x as i32 + origin.0 - 1, z as i32 + origin.2 - 1);

            heightmap[x][z] = terrain_height(&mut rng, wx, wz) - 10;
            heightmap2[x][z] = terrain_height(&mut rng, wx * 5 + 100, wz * 5 + 100) + 30;
        }
    }

    for idx in 0..VOX_COUNT {
        let (x, y, z) = idx_xyz(idx);
        let height = heightmap[x as usize][z as usize];
        let h2 = heightmap2[x as usize][z as usize];

        let (_x, y, _z) = (
            x as i32 + origin.0 - 1,
            y as i32 + origin.1 - 1,
            z as i32 + origin.2 - 1,
        );

        if y < 30 {
            arr[idx] = 5;
            continue;
        }

        if y >= HEIGHT_LIMIT || y >= height || y == 0 {
            continue; // blocks already initilized to air
        }

        if y >= h2 {
            arr[idx] = 3;
        } else if y == height - 1 {
            arr[idx] = 2;
        } else {
            arr[idx] = 1;
        }
    }
}

fn terrain_height(rng: &mut UniformRandomGen, x: i32, z: i32) -> i32 {
    let x = x + 220;
    let z = z + 377;

    let mut height = 0.0;
    let mut amplitude = 1.0;
    let mut frequency = 1.0;
    let mut max_value = 0.0;
    let num_octaves = 4;

    for _ in 0..num_octaves {
        let nx = (x as f32) * frequency * 0.003;
        let nz = (z as f32) * frequency * 0.003;

        height += noiselib::simplex::simplex_noise_2d(rng, nx, nz, 0) * amplitude;
        max_value += amplitude;

        amplitude *= 0.3;
        frequency *= 3.0;
    }

    let normalized = (height / max_value + 1.0) * 0.5;
    //let dist = ((x * x + z * z) as f32).sqrt();

    ((normalized * 150.0) + 1.0) as i32
}
