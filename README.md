# mini-metro-map-maker

## Use the tool here

**https://conradlempert.github.io/mini-metro-map-maker/**

## General info

<img width="500" alt="2343771903_preview_Bildschirmfoto 2020-12-31 um 19 00 34" src="https://github.com/user-attachments/assets/2060409d-02ce-4082-aeb8-3e262ccb9da1" /><img width="300" alt="2343771903_preview_Bildschirmfoto 2020-12-31 um 19 01 44" src="https://github.com/user-attachments/assets/92b25913-343d-418d-94e0-6e1f5023838e" />

This is a tool for drawing shapes on a map and to copy/paste their coordinates, so as to use them for custom Mini Metro (Steam game) maps.

Steam workshop: https://steamcommunity.com/sharedfiles/filedetails/?id=2343771903

It is written in TypeScript with HTML5 Canvas functionality and Vite.

## Reviews on Steam

* **haneul**: It is the best tool to create a mini metro map.👍
* ⁧**さびアカデミー**: Awesome!

## Development

To start the development server, run this in the root folder of the repo:

```
npm install
npm run dev
```

Then go to http://localhost:5173.

## How to use

First, create a picture that you want to use as a background while drawing shapes. This could be a Google Maps image or a metro map.

<img width="322" alt="2343771903_preview_st petersburg" src="https://github.com/user-attachments/assets/f11ec71d-e5bb-4d10-a5ea-0d499f60e89d" />

Next, open this image in the tool and adjust the settings. 5000x5000 was recommended by the official guide. You can desaturate the image so you can see your shapes better.

<img width="542" alt="2343771903_preview_Bildschirmfoto 2020-12-31 um 18 59 51" src="https://github.com/user-attachments/assets/c8994542-1ba8-457e-9e5d-a3f90f894b34" />

Now, you can draw points or polygons. When you do this, their coordinates get automatically copied into the clipboard. Points are exported like [x,y] and polygons are exported like [[x1, y1], [x2, y2], [x3, y3], ...]. This format can be directly used in the city.json.

<img width="500" alt="2343771903_preview_Bildschirmfoto 2020-12-31 um 19 00 34" src="https://github.com/user-attachments/assets/2060409d-02ce-4082-aeb8-3e262ccb9da1" />

Here is further explanation of the tool:

<img width="501" alt="2343771903_preview_Bildschirmfoto 2020-12-31 um 19 11 41" src="https://github.com/user-attachments/assets/42175900-f2ef-45cb-aa77-761c960c6159" />

This is what the final result looks like:

<img width="564" alt="2343771903_preview_Bildschirmfoto 2020-12-31 um 19 01 44" src="https://github.com/user-attachments/assets/92b25913-343d-418d-94e0-6e1f5023838e" />

Please note that the upload/download functionality is only for shapes from this tool. This is not directly compatible with the .json files in a mod folder. You have to copy/paste the coordinates.
