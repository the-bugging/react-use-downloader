<img align="right" alt="traffic" src="https://pv-badge.herokuapp.com/total.svg?repo_id=olavoparno-react-use-downloader"/>

# react-use-downloader

> Creates a download handler function and gives progress information.

[![NPM](https://img.shields.io/npm/v/react-use-downloader.svg)](https://www.npmjs.com/package/react-use-downloader)

---

## Table of Contents

- [Running example](#running-example)
- [Install](#install)
- [Usage](#usage)
- [Documentation](#documentation)
- [License](#license)

---

## Running example

TODO

---

## Install

```bash
npm install --save react-use-downloader
```

---

## Usage

```jsx
import React from "react";
import useDownload from "react-use-downloader";

export default function App() {
  const { size, elapsed, percentage, download, error } = useDownload();

  const fileUrl = "https://olavoparno.github.io/saywololo/sounds/Wololo1.wav";

  return (
    <div className="App">
      <button onClick={() => download(fileUrl, "wololo")}>
        Click to download file
      </button>
      <p>
        Download size {size} bytes and {percentage}
      </p>
      <p>Elapsed time {elapsed}s</p>
      {error && <p>possible error {JSON.stringify(error)}</p>}
    </div>
  );
}
```

---

## Documentation

`useDownload()` returns:

- An object with the following keys:

  1. elapsed (in seconds)
  2. percentage (a percentage string)
  3. size (size in bytes)
  4. download (a download function handler)
    - arguments, both as string: {downloadUrl, filename}
  5. error (an error object from the fetch request)

```jsx
const { size, elapsed, percentage, download, error } = useDownload();
```

---

## License

react-use-downloader is [MIT licensed](./LICENSE).

---

This hook is created using [create-react-hook](https://github.com/hermanya/create-react-hook).
