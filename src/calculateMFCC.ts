import { Readable } from "stream";
import {Windower, Hopper, FFT} from "ts-dsp";
import { PowerSpectralDensity } from "./PowerSpectralDensity";

declare interface MFCCConfig {
  /** Spacing of analysis frames (in samples). */
  hopSize: number;
  /** Size of analysis frames (in samples). */
  windowSize: number;
  /** Kind of window to use. */
  windowKind: "hamming";
}

function calculateMFCC(
  audio:AudioBuffer,
  params: MFCCConfig,
) {
  // Destructure parameters,
  const {
    windowSize = 2056,
    hopSize = 441,
    windowKind = "hamming",
  } = params;

  // Set up FFT pipeline.
  const hopper = new Hopper(windowSize, hopSize);
  const windower = new Windower(windowSize, windowKind);
  const fft = new FFT(windowSize);
  hopper.pipe(windower).pipe(fft);

  // Feed audio to the hopper.
  hopper.end(audio);

  const psd = new PowerSpectralDensity;
  fft.pipe(psd);
}

export {calculateMFCC};