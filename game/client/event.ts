import { customAlphabet } from 'nanoid';

function uniqueId() {
  return customAlphabet('1234567890abcdef', 21);
}

export async function netEventController<TResponse>(event: string, ...args: any[]): Promise<TResponse> {
  return new Promise((resolve) => {
    const eventId = uniqueId();
    const listenName = `${event}:${eventId}`;

    emitNet(event, listenName, ...args);

    const eventListener = (data: TResponse) => {
      removeEventListener(listenName, eventListener);
      resolve(data);
    };

    onNet(listenName, eventListener);
  });
}