/* tslint:disable */
/* eslint-disable */

export class VoxelChunk {
    free(): void;
    [Symbol.dispose](): void;
    free(): void;
    generate(): void;
    generate_mesh(): void;
    get_buffer(): Uint32Array;
    get_vert_len(): number;
    init(): void;
    is_empty(): boolean;
    constructor(x: number, y: number, z: number);
    ray_cast(mode: number, ox: number, oy: number, oz: number, dx: number, dy: number, dz: number): Int32Array;
}

export type InitInput = RequestInfo | URL | Response | BufferSource | WebAssembly.Module;

export interface InitOutput {
    readonly memory: WebAssembly.Memory;
    readonly __wbg_voxelchunk_free: (a: number, b: number) => void;
    readonly voxelchunk_free: (a: number) => void;
    readonly voxelchunk_generate: (a: number) => void;
    readonly voxelchunk_generate_mesh: (a: number) => void;
    readonly voxelchunk_get_buffer: (a: number) => any;
    readonly voxelchunk_get_vert_len: (a: number) => number;
    readonly voxelchunk_init: (a: number) => void;
    readonly voxelchunk_is_empty: (a: number) => number;
    readonly voxelchunk_new: (a: number, b: number, c: number) => number;
    readonly voxelchunk_ray_cast: (a: number, b: number, c: number, d: number, e: number, f: number, g: number, h: number) => [number, number];
    readonly __wbindgen_externrefs: WebAssembly.Table;
    readonly __wbindgen_free: (a: number, b: number, c: number) => void;
    readonly __wbindgen_start: () => void;
}

export type SyncInitInput = BufferSource | WebAssembly.Module;

/**
 * Instantiates the given `module`, which can either be bytes or
 * a precompiled `WebAssembly.Module`.
 *
 * @param {{ module: SyncInitInput }} module - Passing `SyncInitInput` directly is deprecated.
 *
 * @returns {InitOutput}
 */
export function initSync(module: { module: SyncInitInput } | SyncInitInput): InitOutput;

/**
 * If `module_or_path` is {RequestInfo} or {URL}, makes a request and
 * for everything else, calls `WebAssembly.instantiate` directly.
 *
 * @param {{ module_or_path: InitInput | Promise<InitInput> }} module_or_path - Passing `InitInput` directly is deprecated.
 *
 * @returns {Promise<InitOutput>}
 */
export default function __wbg_init (module_or_path?: { module_or_path: InitInput | Promise<InitInput> } | InitInput | Promise<InitInput>): Promise<InitOutput>;
