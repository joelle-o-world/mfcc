import {Hopper} from "./Hopper";
import {Windower} from "./Windower";
import {FastFourierTransform} from "./FastFourierTransform";
import { PowerSpectralDensity } from "./PowerSpectralDensity";
import { MelFilterBank, MFCC, MFCCChunk } from "./Mel";
import { Preemphasis } from "./Preemphasis";
import { Lifter } from "./Lifter";
import { Transform, Readable, TransformCallback } from "stream";

declare interface MFCCConfig {
  /** the samplerate of the signal we are working with. */
  samplerate?: number;

  /** the length of the analysis window in seconds. Default is 0.025s (25 milliseconds) */
  winlen?: number;

  /** the step between successive windows in seconds. Default is 0.01s (10 milliseconds) */
  winstep?: number;

  /** the number of cepstrum to return, default 13 */
  numcep?: number;

  /** the number of filters in the filterbank, default 26. */
  nfilt?: number;

  /** the FFT size. Default is 512. */
  //nfft?: number;

  /** lowest band edge of mel filters. In Hz, default is 0. */
  lowfreq?: number;

  /** highest band edge of mel filters. In Hz, default is samplerate/2 */
  highfreq?: number;

  /** apply preemphasis filter with preemph as coefficient. 0 is no filter. Default is 0.97. */
  preemph?: number;

  /** apply a lifter to final cepstral coefficients. 0 is no lifter. Default is 22. */
  ceplifter?: number;

  /** if this is true, the zeroth cepstral coefficient is replaced with the log of the total frame energy. */
  appendEnergy?: boolean;

  /** the analysis window to apply to each frame. By default no window is applied. */
  winfunc?: "hamming"|"none";
}

function calculateMFCC(
  audio:AudioBuffer,
  params: MFCCConfig = {},
) {
  // Destructure parameters,
  const {
    samplerate=16000, 
    winlen=0.025, 
    winstep=0.01, 
    numcep=13, 
    nfilt=26, 
    //nfft=512, 
    lowfreq=0, 
    highfreq=samplerate/2, 
    preemph=0.97, 
    ceplifter=22, 
    appendEnergy=false, 
    winfunc="none"
  } = params;

  /** Window size in samples */
  const windowSize = Math.pow(2, Math.ceil(Math.log2(winlen * samplerate)))
  console.log("## windowSize: ", windowSize)
  /** Hop size in samples */
  const hopSize = winstep * samplerate;

  // Set up FFT pipeline.
  const preemphasis = new Preemphasis(preemph);
  const hopper = new Hopper(windowSize, hopSize);
  const fft = new FastFourierTransform(windowSize);
  if(winfunc != "none")
    preemphasis.pipe(hopper).pipe(new Windower(windowSize, winfunc)).pipe(fft);
  else
    preemphasis.pipe(hopper).pipe(fft);

  // Feed audio to the preemphasis.
  if(audio.sampleRate != samplerate)
    throw "sampling rate of audio buffer does not match `samplerate` parameter."
  preemphasis.end(audio);

  const psd = new PowerSpectralDensity;
  const filterBank = new MelFilterBank({
    numberOfFilters: nfilt, 
    lowFrequency: lowfreq, 
    highFrequency: highfreq, 
    windowSize, 
    sampleRate: samplerate,
  });
  const mfcc = new MFCC({numcep});
  const lifter = new Lifter(ceplifter, numcep)

  fft
    .pipe(psd)
    .pipe(filterBank)
    .pipe(mfcc)
    .pipe(lifter);

  let lastTransform:Readable = lifter;


  // Warning: This step directly edits the output of the Lifter for the sake of simplicity
  if(appendEnergy) {
    lastTransform = lifter.pipe(new Transform({
      objectMode:true,
      transform(chunk:MFCCChunk, enc:string, callback:TransformCallback) {
        for(let c in chunk.coeffsByChannel) 
          chunk.coeffsByChannel[c][0] = chunk.energyByChannel[c];

        callback(null, chunk);
      }
    }))
  }
  
  return lastTransform;
}

export {calculateMFCC, MFCCConfig};