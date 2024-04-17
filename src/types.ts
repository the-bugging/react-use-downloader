import { SetStateAction } from 'react';

export type ErrorMessage = {
  errorMessage: string;
} | null;

/** useDownloader options for fetch call
 * See fetch RequestInit for more details
 */
export type UseDownloaderOptions = RequestInit;

/**
 * Initiate the download of the specified asset from the specified url. Optionally supply timeout and overrideOptions.
 * @example await download('https://example.com/file.zip', 'file.zip')
 * @example await download('https://example.com/file.zip', 'file.zip', 500) timeouts after 500ms
 * @example await download('https://example.com/file.zip', 'file.zip', undefined, { method: 'GET' }) skips optional timeout but supplies overrideOptions
 */
export type DownloadFunction = (
  /** Download url
   * @example https://upload.wikimedia.org/wikipedia/commons/4/4d/%D0%93%D0%BE%D0%B2%D0%B5%D1%80%D0%BB%D0%B0_%D1%96_%D0%9F%D0%B5%D1%82%D1%80%D0%BE%D1%81_%D0%B2_%D0%BF%D1%80%D0%BE%D0%BC%D1%96%D0%BD%D1%8F%D1%85_%D0%B2%D1%80%D0%B0%D0%BD%D1%96%D1%88%D0%BD%D1%8C%D0%BE%D0%B3%D0%BE_%D1%81%D0%BE%D0%BD%D1%86%D1%8F.jpg
   */
  downloadUrl: string,
  /** File name
   * @example carpathia.jpeg
   */
  filename: string,
  /** Optional timeout to download items */
  timeout?: number,
  /** Optional options to supplement and/or override UseDownloader options  */
  overrideOptions?: UseDownloaderOptions
) => Promise<void | null>;

/**
 * Provides access to Downloader functionality and settings.
 *
 * @interface EditDialogField
 * @field {number} size in bytes.
 * @field {number} elapsed time in seconds.
 * @field {number} percentage in string
 * @field {DownloadFunction} download function handler
 * @field {void} cancel function handler
 * @field {ErrorMessage} error object from the request
 * @field {boolean} isInProgress boolean flag denoting download status
 */
export interface UseDownloader {
  /** Size in bytes */
  size: number;
  /**	Elapsed time in seconds */
  elapsed: number;
  /** Percentage in string */
  percentage: number;
  /**
   * Download function handler
   * @example await download('https://example.com/file.zip', 'file.zip')
   * @example await download('https://example.com/file.zip', 'file.zip', 500) timeouts after 500ms
   * */
  download: DownloadFunction;
  /** Cancel function handler */
  cancel: () => void;
  /** Error object from the request */
  error: ErrorMessage;
  /** Boolean denoting download status */
  isInProgress: boolean;
}

export interface ResolverProps {
  setSize: (value: SetStateAction<number>) => void;
  setControllerCallback: (
    controller: ReadableStreamController<Uint8Array>
  ) => void;
  setPercentageCallback: ({
    loaded,
    total,
  }: {
    loaded: number;
    total: number;
  }) => void;
  setErrorCallback: (err: Error) => void;
}

interface CustomNavigator extends Navigator {
  msSaveBlob: (blob?: Blob, filename?: string) => boolean | NodeJS.Timeout;
}

export interface WindowDownloaderEmbedded extends Window {
  navigator: CustomNavigator;
}
