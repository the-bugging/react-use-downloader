import React from 'react';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  LinearProgress,
  Typography,
  makeStyles,
} from '@material-ui/core';
import useDownloader from 'react-use-downloader';

const useStyles = makeStyles({
  root: {
    maxWidth: 390,
    margin: '4rem auto',
  },
  list: {
    padding: '0 1.5rem',
  },
});

export default function App() {
  const classes = useStyles();
  const { size, elapsed, percentage, download, cancel, error, isInProgress } =
    useDownloader();

  const fileUrl =
    'https://upload.wikimedia.org/wikipedia/commons/4/4d/%D0%93%D0%BE%D0%B2%D0%B5%D1%80%D0%BB%D0%B0_%D1%96_%D0%9F%D0%B5%D1%82%D1%80%D0%BE%D1%81_%D0%B2_%D0%BF%D1%80%D0%BE%D0%BC%D1%96%D0%BD%D1%8F%D1%85_%D0%B2%D1%80%D0%B0%D0%BD%D1%96%D1%88%D0%BD%D1%8C%D0%BE%D0%B3%D0%BE_%D1%81%D0%BE%D0%BD%D1%86%D1%8F.jpg';
  const filename = 'beautiful-carpathia.jpg';

  return (
    <Card className={classes.root} elevation={2}>
      <CardContent>
        <Typography gutterBottom variant="h5" component="h1">
          react-use-downloader
        </Typography>
        <Typography
          variant="body2"
          color="textSecondary"
          component="h2"
          paragraph
        >
          Creates a download handler function and gives progress information
        </Typography>
        <LinearProgress variant="determinate" value={percentage} />
      </CardContent>
      <CardContent>
        <ul className={classes.list}>
          <li>
            <Typography variant="body2" color="textSecondary" component="p">
              size: <b>{size} bytes</b>
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="textSecondary" component="p">
              elapsed: <b>{elapsed}s</b>
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="textSecondary" component="p">
              percentage: <b>{percentage}%</b>
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="textSecondary" component="p">
              error: <b>{JSON.stringify(error)}</b>
            </Typography>
          </li>
          <li>
            <Typography variant="body2" color="textSecondary" component="p">
              isInProgress: <b>{isInProgress.toString()}</b>
            </Typography>
          </li>
        </ul>
      </CardContent>
      <CardActions>
        <Button
          disabled={isInProgress}
          size="small"
          color="primary"
          onClick={() => download(fileUrl, filename)}
        >
          Download file
        </Button>
        <Button
          disabled={!isInProgress}
          size="small"
          color="primary"
          onClick={() => cancel()}
        >
          Cancel the download
        </Button>
      </CardActions>
    </Card>
  );
}
