extern crate wasm_bindgen;
extern crate web_sys;
use self::web_sys::*;
use crate::{types::CVec3, voxel_chunk::*, world_generator::*};
use std::collections::HashMap;
use wasm_bindgen::prelude::*;
use web_sys::WebGl2RenderingContext as GL;

// Uniform Buffer Object Binding Point
const UBO_POINT: u32 = 1;

#[wasm_bindgen]
pub struct VoxelEngine {
    gl: WebGl2RenderingContext,
    program: WebGlProgram,
    chunks: HashMap<
        CVec3,
        (
            VoxelChunk,
            Option<WebGlVertexArrayObject>,
            Option<WebGlBuffer>,
        ),
    >,
}

#[wasm_bindgen]
impl VoxelEngine {
    #[wasm_bindgen(constructor)]
    pub fn new(gl: WebGl2RenderingContext, program: WebGlProgram) -> Self {
        Self {
            gl,
            program,
            chunks: HashMap::new(),
        }
    }

    #[wasm_bindgen]
    pub fn init(&mut self) -> Vec<i32> {
        let mut test = 0;
        let mut test2 = 0;
        let mut failed = 0;
        // create chunk objects
        for x in -30..31 {
            for y in 0..HEIGHT_LIMIT_C {
                for z in -30..31 {
                    self.chunks.insert(
                        CVec3(x * 32, y * 32, z * 32),
                        (VoxelChunk::new(), None, None),
                    );
                }
            }
        }

        for (pos, (chunk, vao, ubo)) in self.chunks.iter_mut() {
            let (x, y, z) = (pos.0, pos.1, pos.2);

            chunk.init();
            generate_chunk(chunk.arr.as_mut().unwrap(), CVec3(x, y, z));

            chunk.generate_mesh();

            if chunk.verts.is_empty() {
                test += 1;
                chunk.free();
                continue;
            }
            test2 += 1;

            // create objects
            *vao = self.gl.create_vertex_array();
            *ubo = self.gl.create_buffer();
            if (vao.is_none() || ubo.is_none()) {
                failed += 1;
                continue;
            }
            let ubo = ubo.as_ref();

            self.gl.bind_buffer(GL::UNIFORM_BUFFER, ubo);
            let ubo_index = self.gl.get_uniform_block_index(&self.program, "Chunk");
            let ubo_size = self
                .gl
                .get_active_uniform_block_parameter(
                    &self.program,
                    ubo_index,
                    GL::UNIFORM_BLOCK_DATA_SIZE,
                )
                .unwrap()
                .as_f64()
                .unwrap() as i32;
            self.gl
                .buffer_data_with_i32(GL::UNIFORM_BUFFER, ubo_size, GL::STATIC_DRAW);

            self.gl
                .uniform_block_binding(&self.program, ubo_index, UBO_POINT);
            self.gl.bind_buffer_base(GL::UNIFORM_BUFFER, UBO_POINT, ubo);

            let (x, y, z) = (x as f32, y as f32, z as f32);
            let mat: [f32; 16] = [
                1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, 0.0, 0.0, 0.0, 1.0, 0.0, x, y, z, 1.0,
            ];
            self.gl.bind_buffer(GL::UNIFORM_BUFFER, ubo);
            unsafe {
                let view = js_sys::Float32Array::view(&mat);
                self.gl.buffer_sub_data_with_i32_and_array_buffer_view(
                    GL::UNIFORM_BUFFER,
                    0,
                    &view,
                );
            }
        }

        vec![test, test2, failed]
    }

    #[wasm_bindgen]
    pub fn upload_chunks(&mut self) {
        for (chunk, vao, ubo) in self.chunks.values_mut() {
            self.gl.use_program(Some(&self.program));
            self.gl.bind_vertex_array(vao.as_ref());
            let buffer = self.gl.create_buffer().unwrap();
            self.gl.bind_buffer(GL::ARRAY_BUFFER, Some(&buffer));

            let array = unsafe { js_sys::Uint32Array::view(&chunk.verts) };
            self.gl
                .buffer_data_with_array_buffer_view(GL::ARRAY_BUFFER, &array, GL::STATIC_DRAW);

            let loc = self.gl.get_attrib_location(&self.program, "voxelData") as u32;
            self.gl.enable_vertex_attrib_array(loc);
            self.gl
                .vertex_attrib_i_pointer_with_i32(loc, 1, GL::UNSIGNED_INT, 0, 0);

            chunk.ready = true;
        }
    }

    #[wasm_bindgen]
    pub fn draw_chunks(&self, mode: u32) {
        self.gl.use_program(Some(&self.program));
        for (chunk, vao, ubo) in self.chunks.values() {
            if chunk.verts.is_empty() {
                continue;
            }
            // bind uniform buffer object
            self.gl
                .bind_buffer_base(GL::UNIFORM_BUFFER, UBO_POINT, ubo.as_ref());
            // bind vertex array object
            self.gl.bind_vertex_array(vao.as_ref());
            // draw
            self.gl.draw_arrays(mode, 0, chunk.verts.len() as i32);
        }
    }
}
