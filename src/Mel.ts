import { Transform, TransformCallback } from "stream";
import { PSDChunk } from "./PowerSpectralDensity";
import dct from 'dct';

// Special number types to keep track of units
type Mel = number;
type Hz = number;
type Bin = number;

/** Popular formula to convert Hz into Mels */
function hzToMels(f: Hz):Mel {
  return 1125 * Math.log(1 + f/700);
}

/** Inverse function of `hzToMels(f)` */
function melsToHz(m: Mel):Hz {
  return 700 * (Math.exp(m/1125) - 1)
}

/** Output chunk for MelFilterBand chunk transform stream. */
interface MelFilterBankChunk {
  channelData: number[][];
  sampleRate: Hz;
  time: number;
  numberOfChannels: number;
}

declare type SpectralFilter = {
  [key: number]: number;
}

/** Filter PowerSpectralDensity chunks to make Mel-band energies.  */
class MelFilterBank extends Transform {
  filters: SpectralFilter[];

  constructor(
    numberOfFilters:number = 26,
    lowFrequency:Hz = 300, // Hz 
    highFrequency:Hz = 8000, // Hz
    windowSize: number = 256,
    sampleRate: Hz = 44100,
  ) {
    super({objectMode:true});
    
    const highMel:Mel = hzToMels(highFrequency);
    const lowMel:Mel = hzToMels(lowFrequency);
    const step:Mel = (highMel - lowMel) / numberOfFilters

    const points:Bin[] = [];
    for(let i=0; i<numberOfFilters; i++)
      points[i] = Math.round(
        melsToHz(lowMel + step * i) * (windowSize/2) / sampleRate
      );

    // Create filters
    this.filters = []
    for(let i=0; i+2<points.length; i++) {
      let filter:SpectralFilter = {};
      let a = points[i], b = points[i+1], c = points[i+2];
      for(let bin=a+1; bin<b; ++bin)
        filter[bin] = (bin - a)/(b-a);
      filter[b] = 1;
      for(let bin=b+1; bin<c; ++bin)
        filter[bin] = (c - bin) / (c - b);

      this.filters[i] = filter;
    }
  }

  _transform(
    psd:PSDChunk, 
    encoding:string, 
    callback:TransformCallback
  ) {
    const channelData = []
    for(let c=0; c<psd.numberOfChannels; ++c) {
      const data = psd.channelData[c];
      const melBandPowers = this.filters.map(filter => {
        let sum = 0;
        for(let i in filter)
          sum += filter[i] * data[i];
        return sum;
      });
      channelData.push(melBandPowers);
    }

    callback(null, {
      channelData,
      sampleRate: psd.sampleRate,
      time: psd.time,
      numberOfChannels: psd.numberOfChannels,
    })
  }
}

/** Output chunk format for MFCC transform stream. */
declare interface MFCCChunk {
  /** Cepstral coefficients for each audio channel. */
  coffsByChannel: number[][];
  /** Time (in samples) of the analysis window. */
  time: number;
}

/** Transform MelFilterBank data into Mel Frequency Cepstral Coefficients. */
class MFCC extends Transform {
  constructor() {
    super({objectMode:true});
  }

  _transform(
    chunk:MelFilterBankChunk, encoding:string, callback:TransformCallback
  ) {
    const coeffsByChannel = [];
    for(let c=0; c<chunk.numberOfChannels; ++c) {
      const logMelPowers = chunk.channelData[c].map(Math.log);
      coeffsByChannel[c] = dct(logMelPowers);
    }

    callback(null, {
      coeffsByChannel: coeffsByChannel,
      time: chunk.time,
    })
  }
}

export {
  hzToMels,
  MelFilterBank,
  MFCC,
  MFCCChunk,
};