export type DataType = 'base64' | 'blob';

type Encoding = 'webp' | 'jpg' | 'png';

export interface UploadData {
  callback: CallbackFn | ScreenshotBasicCallbackFn;
  isRemote: boolean;
  remoteConfig: CaptureOptions | null;
  dataType: DataType;
  url?: string;
  playerSource?: number;
  correlationId?: string;
  screenshotBasicCompatibility?: boolean;
}

export function createScreenshotBasicUploadData(params: Omit<UploadData, 'callback' | 'screenshotBasicCompatibility'> & { callback: ScreenshotBasicCallbackFn }): UploadData {
  return {
    ...params,
    callback: params.callback,
    screenshotBasicCompatibility: true,
  };
}

export function createRegularUploadData(params: Omit<UploadData, 'callback' | 'screenshotBasicCompatibility'> & { callback: CallbackFn }): UploadData {
  return {
    ...params,
    callback: params.callback,
    screenshotBasicCompatibility: false,
  };
}

export interface StreamUploadData {
  callback: CallbackFn | null
  isRemote: boolean;
  remoteConfig: CaptureOptions | null;
  url?: string;
}

export interface RemoteConfig {
  url: string;
  headers?: HeadersInit;
  formField?: string;
  filename?: string;
  encoding?: string;
}

export interface CaptureOptions {
  headers?: HeadersInit;
  formField?: string;
  filename?: string;
  // fuck me, but needed for screenshot-basic stuffies -- delete later :)
  fileName?: string;
  encoding?: string;
  maxWidth?: number;
  maxHeight?: number;
}

export type CallbackFn = (data: unknown, _playerSource?: number, correlationId?: string) => void;
export type ScreenshotBasicCallbackFn = (err: string | boolean, data: string) => void;

export interface CallbackData { 
  imageData: string | Buffer<ArrayBuffer>;
  dataType: string;
}

export interface RequestBody {
  imageData: string;
  dataType: DataType;
}

export type RequestUploadToken = {
  url: string;
  encoding: Encoding;
  quality: number;
  headers: Headers;
  correlationId: string;
  filename: string;
};
