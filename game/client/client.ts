import { netEventController } from './event';
import { CaptureRequest, RequestScreenshotUploadCB } from './types';

const clientCaptureMap = new Map<string, RequestScreenshotUploadCB>();

onNet('screencapture:captureScreen', (token: string, options: object, dataType: string) => {
  SendNUIMessage({
    ...options,
    uploadToken: token,
    dataType,
    action: 'capture',
    serverEndpoint: `http://${GetCurrentServerEndpoint()}/${GetCurrentResourceName()}/image`,
  });
});

global.exports(
  'requestScreenshotUpload',
  async (
    url: string,
    formField: string,
    optionsOrCB: CaptureRequest | RequestScreenshotUploadCB,
    callback: RequestScreenshotUploadCB,
  ) => {
    // forgive me
    const isOptions = typeof optionsOrCB === 'object' && optionsOrCB !== null;
    const realOptions = isOptions
      ? (optionsOrCB as CaptureRequest)
      : ({ headers: {}, encoding: 'webp' } as CaptureRequest);
    const realCallback = isOptions
      ? (callback as RequestScreenshotUploadCB)
      : (optionsOrCB as RequestScreenshotUploadCB);

    const token = await netEventController('screencapture:INTERNAL_requestUploadToken', url);

    createImageCaptureMessage({
      ...realOptions,
      formField,
      url,
      uploadToken: token,
      dataType: 'blob',
    });
  },
);

function createImageCaptureMessage(options: CaptureRequest) {
  return {
    ...options,
    action: 'capture',
    serverEndpoint: `http://${GetCurrentServerEndpoint()}/${GetCurrentResourceName()}/image`,
  };
}

/* onNet("screencapture:captureStream", (token: string, options: object) => {
  SendNUIMessage({
    ...options,
    uploadToken: token,
    action: 'capture-stream-start',
    serverEndpoint: `http://${GetCurrentServerEndpoint()}/${GetCurrentResourceName()}/stream`,
  });
}) */

/* onNet("screencapture:INTERNAL:stopCaptureStream", () => {
  SendNUIMessage({
    action: 'capture-stream-stop',
  })
}) */
