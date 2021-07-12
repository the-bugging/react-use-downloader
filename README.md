<img align="right" alt="traffic" src="https://pv-badge.herokuapp.com/total.svg?repo_id=olavoparno-react-use-downloader"/>

# react-use-downloader

> Creates a download handler function with its progress information and cancel ability.

[![NPM](https://img.shields.io/npm/v/react-use-downloader.svg)](https://www.npmjs.com/package/react-use-downloader)

---

| Statements                                                            | Branches                                                            | Functions                                                            | Lines                                                            |
| --------------------------------------------------------------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------- |
| ![Statements](https://img.shields.io/badge/statements-88.12%25-yellow.svg) | ![Branches](https://img.shields.io/badge/branches-71.88%25-red.svg) | ![Functions](https://img.shields.io/badge/functions-81.25%25-yellow.svg) | ![Lines](https://img.shields.io/badge/lines-87.91%25-yellow.svg) |

## Table of Contents

- [Running example](#running-example)
- [Install](#install)
- [Usage](#usage)
- [Documentation](#documentation)
- [License](#license)

---

## Running example

| Plain                                                           |
| --------------------------------------------------------------- |
| ![Example](./assets/readme.gif)                                 |
| [Preview!](https://codesandbox.io/s/react-use-downloader-0zzoq) |

> You may find another [example](./example) in this project which are served at [Github Pages](https://olavoparno.github.io/react-use-downloader).

---

## Install

```bash
npm install --save react-use-downloader
```

---

## Usage

```jsx
import React from 'react';
import useDownloader from 'react-use-downloader';

export default function App() {
  const {
    size,
    elapsed,
    percentage,
    download,
    cancel,
    error,
    isInProgress,
  } = useDownloader();

  const fileUrl =
    'https://upload.wikimedia.org/wikipedia/commons/4/4d/%D0%93%D0%BE%D0%B2%D0%B5%D1%80%D0%BB%D0%B0_%D1%96_%D0%9F%D0%B5%D1%82%D1%80%D0%BE%D1%81_%D0%B2_%D0%BF%D1%80%D0%BE%D0%BC%D1%96%D0%BD%D1%8F%D1%85_%D0%B2%D1%80%D0%B0%D0%BD%D1%96%D1%88%D0%BD%D1%8C%D0%BE%D0%B3%D0%BE_%D1%81%D0%BE%D0%BD%D1%86%D1%8F.jpg';
  const filename = 'beautiful-carpathia.jpg';

  return (
    <div className="App">
      <p>Download is in {isInProgress ? 'in progress' : 'stopped'}</p>
      <button onClick={() => download(fileUrl, filename)}>
        Click to download the file
      </button>
      <button onClick={() => cancel()}>Cancel the download</button>
      <p>Download size in bytes {size}</p>
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
  isInProgress,
} = useDownloader();
```

---

## License

react-use-downloader is [MIT licensed](./LICENSE).

---

This hook is created using [create-react-hook](https://github.com/hermanya/create-react-hook).
