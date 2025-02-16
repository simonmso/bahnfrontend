*Note: This site is no longer online or maintained*
# bahnzeit.site's frontend

*Visit [bahnBackend](https://github.com/simonmso/bahnbackend) for information about the backend.*

<img src="https://github.com/simonmso/bahnfrontend/blob/main/preview.png?raw=true" width="800" />

## What is it
This site finds a random train in Germany and follows it along its journey. Connected dots mark minutes the train will be at a station (updated in real time). It is intended to serve as a gentle escape from the toils of everyday life; one is encouraged to picture oneself on the train, swaying gently as the scenery glides by. It can also be used to tell the time.

## How the clock works
The clock is one SVG element, created by `./js/src/dom/`. Each part of the clock - the hands, the minute dots, the train, etc. - is contained in a seperate group `<g></g>`, so that not everything has to be updated/recreated with each clock tick. The conic gradient that fades the minute dots out is faked by individually setting the color of each dot (I tried all sorts of other CSS and SVG solutions; this was simplest).

## Installing
First fork this repository, then

```bash
cd js
npm install
npm run build
```

To serve this with using the same backend I use, follow the steps in [bahnBackend](https://github.com/simonmso/bahnbackend), then copy the contents of `./dist/` into the backend as instructed.
