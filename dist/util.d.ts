/// <reference types="node" />
import { SpawnOptions } from 'child_process';
/**
 * Count all occurrences of a indexOf
 * @param buffer
 * @param searchItem
 * @returns
 */
export declare const indexOfAll: (buffer: Buffer, searchItem: Buffer) => number;
export declare const spawnPromise: (command: string, args?: string[] | undefined, options?: SpawnOptions | undefined) => Promise<Buffer>;
