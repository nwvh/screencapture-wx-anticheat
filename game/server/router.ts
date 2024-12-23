import { nanoid } from 'nanoid';
import { CaptureOptions, DataType, RequestBody, UploadData } from './types';
import FormData from 'form-data';
import fetch from 'node-fetch';

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

  constructor() {
    this.#uploadMap = new Map<string, UploadData>();

    global.SetHttpHandler((req: CfxRequest, res: CfxResponse) => {
      req.setDataHandler(async (data) => {
        const body = JSON.parse(data) as RequestBody;
        const token = req.headers['X-ScreenCapture-Token'] as string;
        if (!token) {
          res.writeHead(403);
          res.write(JSON.stringify({ status: 'error', message: 'No token provided' }));
          return res.send();
        }

        if (req.path === '/upload' && req.method === 'POST') {
          try {
            const { callback, dataType, isRemote, remoteConfig, url } = this.getUpload(token);

            const buf = await this.buffer(dataType, body.imageData);

            if (isRemote) {
              const response = await this.uploadFile(url, remoteConfig, buf, dataType);
              callback(response);
            } else{
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
          res.send();
        }
      });
    });
  }

  addUpload(params: UploadData): string {
    const uploadToken = nanoid(24);
    const { callback, dataType, isRemote, remoteConfig, url } = params;

    this.#uploadMap.set(uploadToken, {
      callback,
      dataType,
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

  async buffer(dataType: DataType, imageData: string): Promise<string | number[]> {
    return new Promise((resolve, reject) => {
      if (dataType === 'blob') {
        const matches = imageData.match(/^data:(.+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
          return reject('Invalid base64 string');
        }

        const base64Data = matches[2];
        if (!base64Data) return reject('Failed to find base64 data');

        const buffer = Buffer.from(base64Data, 'base64');
        const uint8Array = Array.from(buffer);

        resolve(uint8Array);
      } else {
        resolve(imageData);
      }
    });
  }

  async uploadFile(url: string | undefined, config: CaptureOptions | null, buf: string | number[], dataType: DataType) {
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

  createRequestBody(buf: string | number[], dataType: DataType, config: CaptureOptions): Promise<BodyInit | FormData> {
    return new Promise((resolve, reject) => {
      const { formField, filename } = config;

      if (Array.isArray(buf) && dataType === 'blob') {
        const formData = new FormData();
        const bufData = Buffer.from(buf);
        formData.append(formField || 'file', bufData, filename || `screenshot.${config.encoding}`);
        return resolve(formData);
      }

      if (typeof buf === 'string' && dataType === 'base64') {
        return resolve(buf);
      }

      return reject('Invalid body data');
    });
  }
}