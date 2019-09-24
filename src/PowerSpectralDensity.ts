import { Transform, TransformCallback } from "stream";
import { SpectralBuffer } from "ts-dsp/src/SpectralBuffer";

const sq = (x:number) => x*x;

declare interface PSDChunk {
  channelData: number[][];
  sampleRate: number;
  numberOfChannels: number;
  time: number;
}

class PowerSpectralDensity extends Transform {
  constructor() {
    super({objectMode:true});
  }

  _transform(
    spectrum:SpectralBuffer, 
    encoding:string, 
    callback:TransformCallback
  ) {
    const psd = [];
    const scale = 1 / (spectrum.frameSize);// * spectrum.sampleRate);
    //                                   ^??

    // For each channel
    for(let c=0; c<spectrum.numberOfChannels; ++c) {
      // For each bin
      const data = spectrum.getChannelData(c);
      const channelPsd:number[] = [];
      psd[c] = channelPsd;
      for(let bin=0, i=0; i<data.length; ++bin, i+=2)
        channelPsd[bin] = (sq(data[i]) + sq(data[i+1])) * scale;
    }

    callback(null, {
      channelData: psd,
      sampleRate: spectrum.sampleRate,
      numberOfChannels: spectrum.numberOfChannels,
      time: spectrum.time,
    })
  }
}

export {PowerSpectralDensity, PSDChunk}