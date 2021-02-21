import { useCallback, useMemo, useState } from 'react';
import { resolver } from './fetch-progress';
import jsDownload from './js-download';

function useDownload() {
  const [elapsedTime, setElapsedTime] = useState(0);
  const [totalPct, setTotalPct] = useState(0);
  const [blobSize, setBlobSize] = useState(0);
  const [error, setError] = useState(null);
  const debugMode = process.env.REACT_APP_DEBUG_MODE;

  const handleDownload = useCallback(
    (downloadUrl, filename) => {
      setElapsedTime(() => 0);

      function progress({ loaded, total }) {
        const pct = `${Math.round((loaded / total) * 100)}%`;

        setTotalPct(() => pct);
      }

      function startDownload() {
        const interval = setInterval(
          () => setElapsedTime((prevValue) => prevValue + 1),
          debugMode ? 1 : 1000
        );
        const resolverWithProgress = resolver(progress);
        return fetch(downloadUrl, {
          method: 'GET',
        })
          .then(resolverWithProgress)
          .then((data) => data.blob())
          .then((response) => {
            setBlobSize(() => response.size);
            return jsDownload(response, filename);
          })
          .finally(() => {
            return clearInterval(interval);
          })
          .catch(setError);
      }

      startDownload();
    },
    [debugMode]
  );

  return useMemo(
    () => ({
      elapsed: elapsedTime,
      percentage: totalPct,
      size: blobSize,
      download: handleDownload,
      error,
    }),
    [elapsedTime, totalPct, blobSize, handleDownload, error]
  );
}

export default useDownload;
