export type DataType = 'base64' | 'blob';

export interface UploadData {
  callback: CallbackFn;
  isRemote: boolean;
  remoteConfig: CaptureOptions | null;
  dataType: DataType;
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
  encoding?: string;
}

export type CallbackFn = (data: unknown) => void;

export interface CallbackData {
  imageData: string | Buffer<ArrayBuffer>;
  dataType: string;
}

export interface RequestBody {
  imageData: string;
  dataType: DataType;
}
