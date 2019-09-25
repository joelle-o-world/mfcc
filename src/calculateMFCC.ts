import {Hopper} from "./Hopper";
import {Windower} from "./Windower";
import {FastFourierTransform} from "./FastFourierTransform";
import { PowerSpectralDensity } from "./PowerSpectralDensity";
import { MelFilterBank, MFCC } from "./Mel";

declare interface MFCCConfig {
  /** Spacing of analysis frames (in samples). */
  hopSize?: number;
  /** Size of analysis frames (in samples). */
  windowSize?: number;
  /** Kind of window to use. */
  windowKind?: "hamming";

  sampleRate?: number;

  lowFrequency?: number; // Hz
  highFrequency?: number; // Hz
  /** How many mel filters should be used? */
  bankCount?: number;
}

function calculateMFCC(
  audio:AudioBuffer,
  params: MFCCConfig = {},
) {
  // Destructure parameters,
  const {
    windowSize = 2048,
    hopSize = 441,
    windowKind = "hamming",
    sampleRate = 44100,
    lowFrequency = 300,
    highFrequency = 8000,
    bankCount = 26,

  } = params;

  console.log("Hop Size:", hopSize)

  // Set up FFT pipeline.
  const hopper = new Hopper(windowSize, hopSize);
  const windower = new Windower(windowSize, windowKind);
  const fft = new FastFourierTransform(windowSize);
  hopper.pipe(windower).pipe(fft);

  // Feed audio to the hopper.
  hopper.end(audio);

  const psd = new PowerSpectralDensity;
  const filterBank = new MelFilterBank(
    bankCount, 
    lowFrequency, 
    highFrequency, 
    windowSize, 
    sampleRate,
  );
  const mfcc = new MFCC;

  fft.pipe(psd).pipe(filterBank).pipe(mfcc);

  return mfcc
}

export {calculateMFCC, MFCCConfig};