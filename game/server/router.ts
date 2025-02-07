import { nanoid } from 'nanoid';
import { CaptureOptions, DataType, RequestBody, StreamUploadData, UploadData } from './types';
import FormData from 'form-data';
import fetch from 'node-fetch';
import { parseFormData } from './form-data';
import { Blob } from 'node:buffer';

type CfxRequest = {
  address: string;
  headers: Record<string, string>;
  method: string;
  path: string;
  setDataHandler(handler: (data: string) => void): void;
  setDataHandler(handler: (data: ArrayBuffer) => void, binary: 'binary'): void;
};

type CfxResponse = {
  writeHead(code: number, headers?: Record<string, string | string[]>): void;
  write(data: string): void;
  send(data?: string): void;
};

export class Router {
  #uploadMap: Map<string, UploadData>;
  #streamUploadMap: Map<string, StreamUploadData>;

  constructor() {
    this.#uploadMap = new Map<string, UploadData>();
    this.#streamUploadMap = new Map<string, StreamUploadData>();

    global.SetHttpHandler((req: CfxRequest, res: CfxResponse) => {
      req.setDataHandler(async (data) => {
        const token = req.headers['X-ScreenCapture-Token'] as string;
        if (!token) {
          res.writeHead(403);
          res.write(JSON.stringify({ status: 'error', message: 'No token provided' }));
          return res.send();
        }

        if (req.path === '/image' && req.method === 'POST') {
          try {
            const { callback, dataType, isRemote, remoteConfig, url, playerSource, correlationId } =
              this.getUpload(token);

            const contentType = req.headers['Content-Type'];
            const rawForm = await this.rawFormData(contentType, data as unknown as ArrayBuffer);
            const uint8Array = new Uint8Array(rawForm.file.content);
            const bufData = Buffer.from(uint8Array);

            const buf = await this.buffer(dataType, bufData);

            if (isRemote) {
              const response = await this.uploadFile(url, remoteConfig, buf, dataType);

              // this is only when we return data back to the client
              if (playerSource && correlationId) {
                callback(response, playerSource, correlationId);
              } else {
                callback(response);
              }
            } else {
              callback(buf);
            }
          } catch (err) {
            if (err instanceof Error) {
              console.error(err.message);
              res.writeHead(500);
              res.write(JSON.stringify({ status: 'error', message: err.message }));
              return res.send();
            }
          }

          res.writeHead(200);
          res.write(JSON.stringify({ status: 'ok' }));
          return res.send();
        }

        res.writeHead(404);
        return res.send();
      }, 'binary');
    });
  }

  addUpload(params: UploadData): string {
    const uploadToken = nanoid(24);

    this.#uploadMap.set(uploadToken, params);

    return uploadToken;
  }

  addStream(params: StreamUploadData): string {
    const uploadToken = nanoid(24);
    const { callback, isRemote, remoteConfig, url } = params;

    this.#streamUploadMap.set(uploadToken, {
      callback,
      isRemote,
      remoteConfig,
      url,
    });

    return uploadToken;
  }

  getUpload(uploadToken: string): UploadData {
    const exists = this.#uploadMap.has(uploadToken);
    if (!exists) {
      throw new Error('Upload data does not exist. Cancelling screen capture.');
    }

    const data = this.#uploadMap.get(uploadToken);
    if (!data) throw new Error('Could not find upload data');

    return data;
  }

  getStreamUpload(uploadToken: string): StreamUploadData {
    const exists = this.#streamUploadMap.has(uploadToken);
    if (!exists) {
      throw new Error('Upload data does not exist. Cancelling screen capture.');
    }

    const data = this.#streamUploadMap.get(uploadToken);
    if (!data) throw new Error('Could not find upload data');

    return data;
  }

  async buffer(dataType: DataType, imageData: Buffer): Promise<string | Buffer> {
    return new Promise(async (resolve, reject) => {
      if (dataType === 'base64') {
        const blob = new Blob([imageData]);
        const dateURL = await this.blobToBase64(blob);
        resolve(dateURL);
      } else {
        resolve(imageData);
      }
    });
  }

  async uploadFile(url: string | undefined, config: CaptureOptions | null, buf: string | Buffer, dataType: DataType) {
    if (!url) throw new Error('No remote URL provided');
    if (!config) throw new Error('No remote config provided');

    try {
      const body = await this.createRequestBody(buf, dataType, config);

      let response;
      if (body instanceof FormData) {
        response = await fetch(url, {
          method: 'POST',
          headers: {
            ...body.getHeaders(),
            ...config.headers,
          },
          body: body.getBuffer(),
        });
      } else {
        response = await fetch(url, {
          method: 'POST',
          headers: config.headers || {},
          // as soon as we get a node upgrade, we'll use Node's http module
          // we might be able to do it now, but if so I'll test that later
          body: body as any,
        });
      }

      if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to upload file to ${url}. Status: ${response.status}. Response: ${text}`);
      }

      const res = await response.json();
      return res;
    } catch (err) {
      if (err instanceof Error) {
        throw new Error(err.message);
      }
    }
  }

  createRequestBody(buf: string | Buffer, dataType: DataType, config: CaptureOptions): Promise<BodyInit | FormData> {
    return new Promise((resolve, reject) => {
      const { formField, filename } = config;

      const filenameExt = filename ? `${filename}.${config.encoding}` : `screenshot.${config.encoding}`;

      if (dataType === 'blob') {
        const formData = new FormData();
        formData.append(formField || 'file', buf, filenameExt);
        if (filename) {
          formData.append('filename', filename);
        }

        return resolve(formData);
      }

      if (typeof buf === 'string' && dataType === 'base64') {
        return resolve(buf);
      }

      return reject('Invalid body data');
    });
  }

  // todo: fix this return type
  rawFormData(contentType: string | undefined, data: ArrayBuffer): Promise<any> {
    return new Promise((res, rej) => {
      if (contentType && contentType.startsWith('multipart/form-data')) {
        const boundaryMatch = contentType.match(/boundary=([^\s]+)/);
        if (!boundaryMatch) {
          return rej('Invalid boundary in multipart/form-data');
        }

        const boundary = `--${boundaryMatch[1]}`;
        const body = Buffer.from(data);
        ``;

        const rawFormData = parseFormData(body, boundary);
        return res(rawFormData);
      }
    });
  }

  async blobToBase64(blob: Blob): Promise<string> {
    return new Promise(async (resolve, reject) => {
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');
        resolve(base64);
      } catch (err) {
        reject(err);
      }
    });
  }
}
