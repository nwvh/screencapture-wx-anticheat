onNet('screencapture:captureScreen', (token: string, options: Object, dataType: string) => {
  SendNUIMessage({
    uploadToken: token,
    ...options,
    dataType,
    action: 'capture',
    serverEndpoint: `http://${GetCurrentServerEndpoint()}/${GetCurrentResourceName()}/upload`,
  });
});
