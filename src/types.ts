import { SetStateAction } from "react";

export type TError = {
  errorMessage: string;
} | null

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
  timeout?: number) => Promise<void | null>;

export interface IUseDownloader {
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
  download: DownloadFunction
  /** Cancel function handler */
  cancel: () => void;
  /** Error object from the request */
  error: TError;
  /** Boolean denoting download status */
  isInProgress: boolean;
}

export interface IResolverProps {
  setSize: (value: SetStateAction<number>) => void;
  setControllerCallback: (controller: ReadableStreamController<Uint8Array>) => void
  setPercentageCallback: ({ loaded, total }: { loaded: number; total: number; }) => void;
  setErrorCallback: (err: Error) => void;
}

interface CustomNavigator extends Navigator {
  msSaveBlob: (blob?: Blob, filename?: string) => boolean | NodeJS.Timeout;
}

export interface IWindowDownloaderEmbedded extends Window {
  navigator: CustomNavigator
}
