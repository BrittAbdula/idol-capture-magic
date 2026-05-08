import { mkdir, readFile, unlink, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";

export interface StoredObject {
  key: string;
  absolutePath: string | null;
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

export function createR2StorageService(options: {
  bucket: R2Bucket;
  publicBasePath?: string;
}): StorageService {
  const publicBasePath = options.publicBasePath ?? "/storage";

  return {
    async putBuffer(buffer, { extension, contentType }) {
      const normalizedExtension = extension.replace(/^\./, "");
      const key = `${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${normalizedExtension}`;
      await options.bucket.put(key, buffer, {
        httpMetadata: {
          contentType
        }
      });
      return {
        key,
        absolutePath: null,
        publicUrl: `${publicBasePath}/${key}`
      };
    },
    async readBuffer(key) {
      const object = await options.bucket.get(key);
      if (!object) {
        throw new Error("object_not_found");
      }
      return Buffer.from(await object.arrayBuffer());
    },
    async deleteObject(key) {
      await options.bucket.delete(key);
    },
    publicUrlFor(key) {
      return `${publicBasePath}/${key}`;
    }
  };
}
