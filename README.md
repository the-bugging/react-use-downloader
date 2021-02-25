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
import useDownloader from "react-use-downloader";

export default function App() {
  const {
    size,
    elapsed,
    percentage,
    download,
    cancel,
    error,
    isInProgress
  } = useDownloader();

  const fileUrl = "https://olavoparno.github.io/saywololo/sounds/Wololo1.wav";

  return (
    <div className="App">
      <p>Download is in {isInProgress ? 'in progress' : 'stopped'}</p>
      <button onClick={() => download(fileUrl, "filename")}>
        Click to download the file
      </button>
      <button onClick={() => cancel()}>Cancel the download</button>
      <p>
        Download size in bytes {size}
      </p>
      <label for="file">Downloading progress:</label>
      <progress id="file" value={percentage} max="100" />
      <p>Elapsed time in seconds {elapsed}</p>
      {error && <p>possible error {JSON.stringify(error)}</p>}
    </div>
  );
}
```

---

## Documentation

`useDownloader()` returns:

- An object with the following keys:

| key          | description                      | arguments                               |
| ------------ | -------------------------------- | --------------------------------------- |
| size         | size in bytes                    | n/a                                     |
| elapsed      | elapsed time in seconds          | n/a                                     |
| percentage   | percentage in string             | n/a                                     |
| download     | download function handler        | (downloadUrl: string, filename: string) |
| cancel       | cancel function handler          | n/a                                     |
| error        | error object from the request    | n/a                                     |
| isInProgress | boolean denoting download status | n/a                                     |

```jsx
const {
    size,
    elapsed,
    percentage,
    download,
    cancel,
    error,
    isInProgress
  } = useDownloader();
```

---

## License

react-use-downloader is [MIT licensed](./LICENSE).

---

This hook is created using [create-react-hook](https://github.com/hermanya/create-react-hook).
