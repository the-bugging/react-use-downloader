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

function App(): JSX.Element {
  const classes = useStyles();
  const [progressSmall, smallSize, handleDownloadSmall] = useDownload();
  const [progressBig, bigSize, handleDownloadBig, error] = useDownload();

  const smallFileUrl = '/api/backend?size=small';
  const largeFileUrl = '/api/backend?size=big';

  return (
    <>
      <CssBaseline />
      <Container className={classes.main} maxWidth="md">
        <button
          type="button"
          onClick={() => handleDownloadSmall(smallFileUrl, 'small file')}
        >
          Click to download small 50kb size file
        </button>
        <p>
          Progress Small {progressSmall} of size {smallSize}
        </p>
        <br />
        <br />
        <button
          type="button"
          onClick={() => handleDownloadBig(largeFileUrl, 'large file')}
        >
          Click to download large size file
        </button>
        <p>
          Progress BIG {progressBig} of size {bigSize}
        </p>
        {error && <p>Something went wrong {JSON.stringify(error)}</p>}
      </Container>
    </>
  );
}

export default App;
