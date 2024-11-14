import { createGameView } from '@screencapture/gameview';

type Encoding = "webp" | "jpg" | "png"

type CaptureRequest = {
  action: 'capture';
  url: string;
  encoding: Encoding
  quality: number;
  headers: Headers;
  serverEndpoint: string;
  formField: string;
};

export class Capture {
  #gameView: any;
  #canvas: HTMLCanvasElement | null = null;

  start() {
    window.addEventListener('message', async (event) => {
      const data = event.data as CaptureRequest;

      if (data.action === 'capture') {
        console.log('data', data);
        await this.captureScreen(data);
      }
    });

    window.addEventListener('resize', () => {
      if (this.#gameView) {
        this.#gameView.resize(window.innerWidth, window.innerHeight);
      }
    });
  }

  async captureScreen(request: CaptureRequest) {
    this.#canvas = document.createElement('canvas');
    this.#canvas.width = window.innerWidth;
    this.#canvas.height = window.innerHeight;

    this.#gameView = createGameView(this.#canvas);

    let imageData: string | Blob;
    if (request.serverEndpoint || !request.formField) {
      imageData = await this.createDataURL(this.#canvas);
    } else {
      const enc = request.encoding ?? "webp"
      const qlty = request.quality ?? 0.7
      imageData = await this.createBlob(this.#canvas, enc, qlty);
    }

    if (!imageData) return console.error('No image available');

    await this.httpUploadImage(request, imageData);
    this.#canvas.remove();
  }

  async httpUploadImage(request: CaptureRequest, imageData: string | Blob) {
    const reqBody = this.createRequestBody(request, imageData)

    if (request.serverEndpoint) {
      try {
        await fetch(request.serverEndpoint, {
          method: 'POST',
          mode: 'cors',
          body: reqBody,
        });
      } catch (err) {
        console.error(err);
      }
    }
  }

  createRequestBody(request: CaptureRequest, imageData: string | Blob): BodyInit {
    if (imageData instanceof Blob) {
      const formData = new FormData();
      formData.append(request.formField, imageData);
      return formData;
    }
    
    return JSON.stringify({ data: imageData });
  }
  

  createDataURL(canvas: HTMLCanvasElement): Promise<string> {
    return new Promise((resolve, reject) => {
      const url = canvas.toDataURL('image/webp', 0.7);
      if (!url) {
        reject('No data URL available');
      }

      resolve(url);
    });
  }

  createBlob(canvas: HTMLCanvasElement, enc: Encoding, quality = 0.7): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject('No blob available');
          }
        },
        `image/${enc}`,
        quality,
      );
    });
  }
}
