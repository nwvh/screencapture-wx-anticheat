export type RequestScreenshotUploadCB = (response: object) => void;

type Encoding = 'webp' | 'jpg' | 'png';

export type CaptureRequest = {
    action: 'capture';
    url: string;
    encoding: Encoding;
    quality: number;
    headers: Headers;
    uploadToken: string;
    serverEndpoint: string;
    formField: string;
    dataType: 'blob' | 'base64';
  };