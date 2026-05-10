// Local Voxel Coordinates
pub struct LVec3(pub u8, pub u8, pub u8);

// Global Chunk Coordinates
#[derive(Hash, Eq, PartialEq, Debug)]
pub struct CVec3(pub i32, pub i32, pub i32);
