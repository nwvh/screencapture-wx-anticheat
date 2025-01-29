export type RequestScreenshotUploadCB = (response: unknown) => void;

type Encoding = 'webp' | 'jpg' | 'png';

export type CaptureRequest = {
  action: 'capture';
  url: string;
  encoding: Encoding;
  quality: number;
  headers: Headers;
  uploadToken: string;
  serverEndpoint: string;
  filename: string;
  formField: string;
  dataType: 'blob' | 'base64';
};

export type RequestUploadToken = {
  url: string;
  encoding: Encoding;
  quality: number;
  headers: Headers;
  correlationId: string;
};
