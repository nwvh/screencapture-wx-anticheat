import { router } from './server';
import { CallbackFn, CaptureOptions, DataType } from './types';

// upload the file from the server and return the raw response
global.exports(
  'remoteUpload',
  (source: number, url: string, options: CaptureOptions, callback: CallbackFn, dataType: DataType = 'base64') => {
    const token = router.addUpload({
      callback: callback,
      isRemote: true,
      remoteConfig: options,
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
    const token = router.addUpload({
      callback,
      isRemote: false,
      remoteConfig: null,
      dataType,
    });
    emitNet('screencapture:captureScreen', source, token, options, dataType);
  },
);