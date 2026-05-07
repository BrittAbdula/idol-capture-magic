import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export interface StoredObject {
  key: string;
  absolutePath: string;
  publicUrl: string;
}

export interface StorageService {
  putBuffer: (
    buffer: Buffer,
    options: { extension: string; contentType: string }
  ) => Promise<StoredObject>;
  readBuffer: (key: string) => Promise<Buffer>;
  deleteObject: (key: string) => Promise<void>;
  publicUrlFor: (key: string) => string;
}

export function createLocalStorageService(options: {
  rootDir: string;
  publicBasePath?: string;
}): StorageService {
  const publicBasePath = options.publicBasePath ?? "/storage";

  function absolutePathFor(key: string): string {
    return path.join(options.rootDir, key);
  }

  return {
    async putBuffer(buffer, { extension }) {
      const normalizedExtension = extension.replace(/^\./, "");
      const key = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${normalizedExtension}`;
      const absolutePath = absolutePathFor(key);
      await mkdir(path.dirname(absolutePath), { recursive: true });
      await writeFile(absolutePath, buffer);
      return {
        key,
        absolutePath,
        publicUrl: `${publicBasePath}/${key}`
      };
    },
    readBuffer(key) {
      return readFile(absolutePathFor(key));
    },
    deleteObject(key) {
      return unlink(absolutePathFor(key));
    },
    publicUrlFor(key) {
      return `${publicBasePath}/${key}`;
    }
  };
}
