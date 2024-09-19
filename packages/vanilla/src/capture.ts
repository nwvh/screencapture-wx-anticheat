import { createGameView } from "./gameview";

type CaptureRequest = {
  action: "capture";
  url: string;
  encoding: "jpg" | "png" | "webp";
  headers: Headers;
};

export class Capture {
  #gameView: any;
  #canvas: HTMLCanvasElement | null = null;

  start() {
    window.addEventListener("message", async (event) => {
      const data = event.data as CaptureRequest;

      if (data.action === "capture") {
        await this.captureScreen(data);
      }
    });

    window.addEventListener("resize", () => {
      if (this.#gameView) {
        this.#gameView.resize(window.innerWidth, window.innerHeight);
      }
    });
  }

  async captureScreen(request: CaptureRequest) {
    this.#canvas = document.createElement("canvas");
    this.#canvas.width = window.innerWidth;
    this.#canvas.height = window.innerHeight;

    this.#gameView = createGameView(this.#canvas);

    const image = await this.createBlob(this.#canvas);
    console.log("Image", image);

    if (!image) return console.error("No image available");
    await this.httpUploadImage(request, image);

    this.#canvas.remove();
  }

  async httpUploadImage(request: CaptureRequest, blob: Blob) {
    const enc = request.encoding ?? "webp";
    console.log("Uploading image to server");
    console.log(request.url, enc);
    console.log(blob);
  }

  createBlob(canvas: HTMLCanvasElement): Promise<Blob> {
    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject("No blob available");
          }
        },
        "image/webp",
        0.5
      );
    });
  }
}
