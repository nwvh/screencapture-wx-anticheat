import { uploadStore } from './bootstrap';
import { CallbackFn, CaptureOptions, DataType } from './types';

/* global.exports("serverCaptureStream", (source: number) => {
  const token = router.addStream({
    callback: null,
    isRemote: false,
    remoteConfig: null,
  })

  emitNet("screencapture:captureStream", source, token, {})
})

// DO NOT USE
global.exports("INTERNAL_stopServerCaptureStream", (source: number) => {
  emitNet("screencapture:INTERNAL:stopCaptureStream", source)
}) */

// upload the file from the server and return the raw response
global.exports(
  'remoteUpload',
  (source: number, url: string, options: CaptureOptions, callback: CallbackFn, dataType: DataType = 'base64') => {
    if (!source) return console.error('source is required for serverCapture');

    const token = uploadStore.addUpload({
      callback: callback,
      isRemote: true,
      remoteConfig: {
        ...options,
        encoding: options.encoding ?? 'webp',
      },
      url,
      dataType,
    });

    emitNet('screencapture:captureScreen', source, token, options, dataType);
  },
);

// dataType here doesn't matter for NUI, its just for the server to know how to handle the data
// when calling this export, the client will always send it back as base64
global.exports(
  'serverCapture',
  (source: number, options: CaptureOptions, callback: CallbackFn, dataType: DataType = 'base64') => {
    if (!source) return console.error('source is required for serverCapture');

    const token = uploadStore.addUpload({
      callback,
      isRemote: false,
      remoteConfig: null,
      dataType,
    });

    const opts = {
      ...options,
      encoding: options.encoding ?? 'webp',
    };

    emitNet('screencapture:captureScreen', source, token, opts, dataType);
  },
);
