import { Container, CssBaseline, makeStyles } from '@material-ui/core';
import React from 'react';
import useDownload from './hook';

const useStyles = makeStyles({
  root: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: '100vh',
  },
  main: {
    margin: 'auto',
    padding: '2rem 1rem 0',
  },
});

function App() {
  const classes = useStyles();
  const { elapsed, percentage, size, download, error } = useDownload();
  const {
    elapsed: elapsedBig,
    percentage: percentageBig,
    download: downloadBig,
    size: sizeBig,
    error: errorBig,
  } = useDownload();

  const smallFileUrl = '/api/backend?size=small';
  const largeFileUrl = '/api/backend?size=big';

  return (
    <>
      <CssBaseline />
      <Container className={classes.main} maxWidth="md">
        <button
          type="button"
          onClick={() => download(smallFileUrl, 'small file')}
        >
          Click to download small 50kb size file
        </button>
        <p>
          Progress Small percentage of {percentage} time passed of {elapsed} and
          size of {size}
        </p>
        {error && <p>Something went wrong {JSON.stringify(error)}</p>}
        <br />
        <br />
        <button
          type="button"
          onClick={() => downloadBig(largeFileUrl, 'large file')}
        >
          Click to download large size file
        </button>
        <p>
          Progress Bigh percentage of {percentageBig} time passed of{' '}
          {elapsedBig} and size of {sizeBig}
        </p>
        {errorBig && <p>Something went wrong {JSON.stringify(errorBig)}</p>}
      </Container>
    </>
  );
}

export default App;
