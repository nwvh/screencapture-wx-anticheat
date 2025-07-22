import { createGameView } from '@screencapture/gameview';

type Encoding = 'webp' | 'jpg' | 'png';

type CaptureRequest = {
  action: 'capture';
  url: string;
  encoding: Encoding;
  quality: number;
  headers: Headers;
  uploadToken: string;
  serverEndpoint: string;
  formField: string;
  dataType: 'blob' | 'base64';
  maxWidth?: number;
  maxHeight?: number;
};

export class Capture {
  #gameView: any;
  #canvas: HTMLCanvasElement | null = null;

  private readonly MAX_WIDTH = 1920;
  private readonly MAX_HEIGHT = 1080;

  start() {
    window.addEventListener('message', async (event) => {
      const data = event.data as CaptureRequest;

      if (data.action === 'capture') {
        await this.captureScreen(data);
      }
    });

    window.addEventListener('resize', () => {
      if (this.#gameView) {
        this.#gameView.resize(window.innerWidth, window.innerHeight);
      }
    });
  }

  // fuck me
  // i guess this is the downside of using webgl??
  private calculateDimensions(request: CaptureRequest): { width: number; height: number } {
    const originalWidth = window.innerWidth;
    const originalHeight = window.innerHeight;

    const maxWidth = request.maxWidth || this.MAX_WIDTH;
    const maxHeight = request.maxHeight || this.MAX_HEIGHT;

    if (originalWidth <= maxWidth && originalHeight <= maxHeight) {
      return { width: originalWidth, height: originalHeight };
    }

    const scaleX = maxWidth / originalWidth;
    const scaleY = maxHeight / originalHeight;
    const scale = Math.min(scaleX, scaleY);

    return {
      width: Math.floor(originalWidth * scale),
      height: Math.floor(originalHeight * scale)
    };
  }

  async captureScreen(request: CaptureRequest) {
    this.#canvas = document.createElement('canvas');

    const { width, height } = this.calculateDimensions(request);
    this.#canvas.width = width;
    this.#canvas.height = height;

    console.log(`Capturing at ${width}x${height} (original: ${window.innerWidth}x${window.innerHeight})`);

    this.#gameView = createGameView(this.#canvas);


    this.#gameView.resize(width, height);

    const enc = request.encoding ?? 'png';
    let imageData: string | Blob;
    if (request.serverEndpoint || !request.formField) {
      // make sure we don't care about serverEndpoint, only the dataType
      imageData = await this.createBlob(this.#canvas, enc, request.quality);
    } else {
      imageData = await this.createBlob(this.#canvas, enc, request.quality);
    }

    if (!imageData) return console.error('No image available');

    await this.httpUploadImage(request, imageData);
    this.#canvas.remove();
  }

  async httpUploadImage(request: CaptureRequest, imageData: string | Blob) {
    const reqBody = this.createRequestBody(request, imageData);

    if (request.serverEndpoint) {
      try {
        await fetch(request.serverEndpoint, {
          method: 'POST',
          mode: 'cors',
          headers: {
            'X-ScreenCapture-Token': request.uploadToken,
          },
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
      formData.append(request.formField ?? 'file', imageData);

      return formData;
    }

    // dataType is just here in order to know what to do with the data when we get it back
    return JSON.stringify({ imageData: imageData, dataType: request.dataType });
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

  createBlob(canvas: HTMLCanvasElement, enc: Encoding, requestQuality?: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      // Calculate adaptive quality based on canvas size
      const pixelCount = canvas.width * canvas.height;
      let quality = 0.7; // default

      if (requestQuality) {
        quality = requestQuality;
      } else {
        // wtf am I doing
        if (pixelCount > 2073600) { //1920x1080
          quality = 0.5;
        } else if (pixelCount > 1440000) { //1200x1200
          quality = 0.6;
        }
      }


      console.log(`Using quality ${quality} for ${canvas.width}x${canvas.height} (${pixelCount} pixels)`);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            console.log(`Generated blob: ${(blob.size / 1024 / 1024).toFixed(2)}MB`);
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
