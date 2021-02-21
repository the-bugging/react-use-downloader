<img align="right" alt="traffic" src="https://pv-badge.herokuapp.com/total.svg?repo_id=olavoparno-react-use-presentation"/>

# react-use-presentation

> Create pure HTML (React enriched if you will) presentations with a provided array of components and their time durations. The library will do the rest triggering a re-render per array item.

[![NPM](https://img.shields.io/npm/v/react-use-presentation.svg)](https://www.npmjs.com/package/react-use-presentation)

---

## Table of Contents

- [Running example](#running-example)
- [Install](#install)
- [Usage](#usage)
- [Documentation](#documentation)
- [License](#license)

---

## Running example

| Plain                           | Video BG                           |
| ------------------------------- | ---------------------------------- |
| ![Example](./assets/readme.gif) | ![Example](./assets/readme-bg.gif) |
| [Preview!](https://codesandbox.io/s/react-use-presentation-1c2du) | [Preview with BG video!](https://codesandbox.io/s/react-use-presentation-with-bg-d7f7j) | 

---

## Install

```bash
npm install --save react-use-presentation
```

---

## Usage

- Set up your presentation array with each object acting as a movie frame. See the example and contract below:

```tsx
export const myFramesArray = [
  {
    component: <div>First Frame with 1 second duration</div>,
    time: 1000
  },
  {
    component: <div>Second Frame with 2 second duration</div>,
    time: 2000
  },
  {
    component: <div>Last Frame without duration</div>,
  },
  ...
]
```

- To initialize a Presentation component:

```tsx
import * as react from 'react';
import usePresentation from 'react-use-presentation';
import { myFramesArray1 } from './myFramesArray'

export default function App() {
  const [Presentation] = usePresentation({ framesOptions: myFramesArray1 });

  return (
    <Presentation />
  )
}
```

- To initialize a __delayed__ (in milliseconds) Presentation component:

```tsx
import * as react from 'react';
import usePresentation from 'react-use-presentation';
import { myFramesArray2 } from './myFramesArray'

export default function App() {
  const [DelayedPresentation] = usePresentation({
    framesOptions: myFramesArray2,
    startDelay: 1000
  });

  return (
    <DelayedPresentation />
  )
}
```

- To initialize a __delayed__ (in milliseconds) and also in __loop__ Presentation component:

```tsx
import * as react from 'react';
import usePresentation from 'react-use-presentation';
import { myFramesArray3 } from './myFramesArray'

export default function App() {
  const [DelayedAndLoopedPresentation] = usePresentation({
    framesOptions: myFramesArray3,
    startDelay: 1000,
    isLoop: true
  });

  return (
    <DelayedAndLoopedPresentation />
  )
}
```

- To initialize multiple separated presentations and with its current frame and length:

```tsx
import * as react from 'react';
import usePresentation from 'react-use-presentation';
import { myFramesArray1, myFramesArray2, myFramesArray3 } from './myFramesArray';

export default function App() {
  const [Presentation] = usePresentation({ framesOptions: myFramesArray1 });
  const [DelayedPresentation] = usePresentation({
    framesOptions: myFramesArray2,
    startDelay: 1000
  });
  const [DelayedAndLoopedPresentation, currentLoopFrame, loopFramesLength] = usePresentation({
    framesOptions: myFramesArray3,
    startDelay: 1000,
    isLoop: true
  });

  return (
    <>
      <Presentation />
      <DelayedPresentation />
      <div>
        <p>Current frame: {currentLoopFrame}/{loopFramesLength}</p>
        <DelayedAndLoopedPresentation />
      </div>
    </>
  )
}
```

- You can also render elements as children:

```tsx
import * as react from 'react';
import usePresentation from 'react-use-presentation';
import { myFramesArray1 } from './myFramesArray';

export default function App() {
  const [PresentationWithChildren, currentFrame, framesLength] = usePresentation({
    framesOptions: myFramesArray1
  });

  return (
    <PresentationWithChildren>
      <p>Current frame: {currentFrame}/{framesLength}</p>
    </PresentationWithChildren>
  )
}
```

---

## Documentation

`usePresentation()` constructor:

```tsx
type TFrameOptions = {
  component: Component | null,
  time?: number
}

type TUsePresentation = {
  framesOptions: Array<TFrameOptions>,
  startDelay?: number,
  isLoop?: boolean
}

usePresentation(TUsePresentation);
```

`usePresentation()` returns:

- An array with 3 positions, described below:

  1. The very animation component;
  2. The current position of the frame (1 based);
  3. The total quantity of frames;

> As the return is an array you may name each array position in an arbitrary way, e.g.:

```tsx
const [MyLittleComponent, currentFrameLittle, totalLengthLittle] = usePresentation();
```

---

## License

react-use-presentation is [MIT licensed](./LICENSE).

---

This hook is created using [create-react-hook](https://github.com/hermanya/create-react-hook).
