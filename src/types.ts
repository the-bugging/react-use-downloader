import { SetStateAction } from "react";

export type TError = {
  errorMessage: string;
} | null

export interface IUseDownloader {
  elapsed: number;
  percentage: number;
  size: number;
  download: (downloadUrl: string, filename: string) => Promise<void | null>;
  cancel: () => void;
  error: TError;
  isInProgress: boolean;
}

export interface IResolverProps {
  setSize: (value: SetStateAction<number>) => void;
  setControllerCallback: (controller: ReadableStreamController<Uint8Array>) => void
  setPercentageCallback: ({ loaded, total }: { loaded: number; total: number; }) => void;
  setErrorCallback: (err: Error) => void;
}