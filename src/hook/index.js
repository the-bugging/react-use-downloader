import { useCallback, useMemo, useState } from 'react';
import jsDownload from './js-download';
import ProgressReportFetcher from './fetch-progress';

function updateDownloadProgress({ loaded, total }) {
  if (!started) {
    loader.classList.add('loading');
    started = true;
  }

  // handle divide-by-zero edge case when Content-Length=0
  pct = total ? loaded / total : 1;

  progress.style.transform = `scaleX(${pct})`;
  // console.log('downloaded', Math.round(pct*100)+'%')
  if (loaded === total) {
    console.log('download complete');
  }
}

function useDownload(): readonly [
  number,
  number,
  (downloadUrl: string, filename: string) => void,
  null
] {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [blobSize, setBlobSize] = useState(0);
  const [error, setError] = useState(null);
  const debugMode = process.env.REACT_APP_DEBUG_MODE;

  const fetcher = new ProgressReportFetcher(updateDownloadProgress);

  const handleDownload = useCallback(
    (downloadUrl, filename) => {
      setElapsedTime(() => 0);

      function startDownload() {
        const interval = setInterval(
          () => setElapsedTime((prevValue) => prevValue + 1),
          debugMode ? 1 : 1000
        );
        return fetch(downloadUrl, {
          method: 'GET',
        })
          .then((data) => data.blob())
          .then((response) => {
            setBlobSize(() => response.size);
            return jsDownload(response, filename);
          })
          .finally(() => {
            return clearInterval(interval);
          })
          .catch((err) => setError(err));
      }

      startDownload();
    },
    [debugMode]
  );

  return useMemo(
    () => [elapsedTime, blobSize, handleDownload, error] as const,
    [elapsedTime, blobSize, handleDownload, error]
  );
}

export default useDownload;
