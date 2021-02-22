<img align="right" alt="traffic" src="https://pv-badge.herokuapp.com/total.svg?repo_id=olavoparno-react-use-downloader"/>

# react-use-downloader

> Creates a download handler function with its progress information and cancel ability.

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

| Plain                           |
| ------------------------------- |
| ![Example](./assets/readme.gif) |
| [Preview!](https://codesandbox.io/s/react-use-downloader-0zzoq) |

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
  const {
    size,
    elapsed,
    percentage,
    download,
    cancel,
    error,
    isInProgress
  } = useDownload();

  const fileUrl = "https://olavoparno.github.io/saywololo/sounds/Wololo1.wav";

  return (
    <div className="App">
      {isInProgress ? (
        <p>Download is in progress</p>
      ) : (
        <p>Download is stopped</p>
      )}
      <button onClick={() => download(fileUrl, "file")}>
        Click to download file
      </button>
      <span> </span>
      <button onClick={() => cancel()}>Cancel</button>
      <p>
        Download size {size} bytes and {percentage}%
      </p>
      <LinearProgress variant="determinate" value={percentage} />
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

  1. size (size in bytes)
  2. elapsed (in seconds)
  3. percentage (a percentage string)
  4. download (a download function handler)
    - arguments, both as string: {downloadUrl, filename}
  5. cancel (a cancel function)
  6. error (an error object from the fetch request)
  7. isInProgress (a boolean status wether it is downloading or not)

```jsx
const {
    size,
    elapsed,
    percentage,
    download,
    cancel,
    error,
    isInProgress
  } = useDownload();
```

---

## License

react-use-downloader is [MIT licensed](./LICENSE).

---

This hook is created using [create-react-hook](https://github.com/hermanya/create-react-hook).
