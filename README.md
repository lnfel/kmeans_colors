<p align="center">
    <a href="https://lnfel.github.io/lamy-debugbar/" target="_blank">
        <img src="https://raw.githubusercontent.com/lnfel/kmeans_colors/main/static/favicon.png" height="150">
    </a>
    <h1 align="center">Aerial</h1>
</p>

## About

Aerial is an sveltekit application that extracts dominant colors from images and documents (mainly docx and pdf format) and displays the summary on the client. The core functionality relies heavily on [kmeans_colors](https://github.com/okaneco/kmeans-colors), a k-means clustering library written in Rust.

## How Aerial works
The sole purpose of Aerial is to extract colors from valid file targets and ephemerally store those data after some time (like a week or so). There are [API](#api) endpoints that are exposed that can be used to send file data or to retrieve information on extracted data. Upon receiving valid file target, aerial hands it off to [Quirrel](https://quirrel.dev/) (a redis based queue process) before doing extraction. Once color data is extracted, the data will be available on API endpoint using their assigned unique ID.

## Supported files

Aerial can extract colors in most image formats:
- [x] JPEG
- [x] PNG
- [x] GIF
- [x] SVG (only when no embedded fonts)
- [x] TIFF (rendering is experimental but colors can be extracted)
- [x] WebP

It can process the following document formats:
- [x] DOCX
- [x] PDF

## Pre-requisites

The following applications must be installed in order for Aerial to run without issues:

- [Node.js](https://nodejs.org/en/download) version 18+ (Aerial's core functionality requires it to run sveltekit with a backend server)
- [Libreoffice](https://www.libreoffice.org/download/download-libreoffice/) tested using version 7.3.7.2 30(Build:2) with [ubuntu](https://wiki.ubuntu.com/LibreOffice) (required for processing docx files)

> Note: Aerial uses kmeans_colors compiled rust binary so we don't need to install the Rust compiler, Aerial should work on development or production server without rust installed. Proven to work on a fresh installation of windows os without rust on a computers.
> Source: [/r/rust Reddit thread](https://www.reddit.com/r/rust/comments/wjubpl/comment/ijjz2hv/?utm_source=share&utm_medium=web2x&context=3)

## Getting Started

## API

## Database
The command samples uses npx command but we can also use pnpm equivalent which is pnpx.

We are using [Prisma](https://www.prisma.io/) as database ORM. To see prisma cli commands run:
```sh
npx prisma
```

To generate artifacts the first time or update Prisma Client run:
```sh
npx prisma generate
```

To run migrations from your Prisma schema and apply them to the database do:
```sh
npx prisma migrate dev --name init
# Do not forget to generate prisma client afterwards
npx prisma generate
```

Reset prisma migration, useful for when changing schema and re-running seeders:
```sh
npx prisma migrate reset
npx prisma migrate dev --name init
```

Prisma has their own database viewer called prisma studio that runs on the browser:
```sh
npx prisma studio
```
