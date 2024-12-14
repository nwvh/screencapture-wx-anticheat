# ScreenCapture (WIP)

ScreenCapture is a being built as a replacement for screenshot-basic in FiveM.

## Why build something new?

I'll explain this later, but breifly - Screenshot-Basic is no longer maintained, has it's issues. It's a nightmare for almost everyone to get up and running for some reason (blame FXServer yarn) and it's not up-to-date with anything.

## How to use

ScreenCapture is still WIP, but you are able to the minimum if you're using Node.js.

This is a server export only.
```ts
exp.screencapture.serverCapture(args[0], (data: string | number[]>) => {
        data = Buffer.from(data) // if you're using 'buffer' instead of 'base64'

        fs.writeFileSync('./buffer_image.png', data);
        console.log(`File saved`);
    },
    {
        encoding: 'webp',
        // other options like headers, formField, filename
    },
    'base64', // or 'buffer'
);
```


## What will this include?
1. Server exports both for getting image data and uploading images/videos from the server
2. Client exports
3. Upload images or videos from NUI, just more secure.
4. React, Svelt and Vue packages + publishing all internal packages like @screencapture/gameview (SoonTM)
