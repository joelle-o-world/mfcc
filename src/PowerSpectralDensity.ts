import { Transform, TransformCallback } from "stream";
import { SpectralBuffer } from "./SpectralBuffer";

const sq = (x:number) => x*x;

declare interface PSDChunk {
  channelData: number[][];
  energyByChannel: number[];
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
    const energyByChannel:number[] = [];

    // For each channel
    for(let c=0; c<spectrum.numberOfChannels; ++c) {
      // For each bin
      const data = spectrum.getChannelData(c);
      const channelPsd:number[] = [];
      psd[c] = channelPsd;
      let energy = 0;
      for(let bin=0, i=0; i<data.length; ++bin, i+=2) {
        channelPsd[bin] = (sq(data[i]) + sq(data[i+1])) * scale;
        energy += channelPsd[bin];
      }
      energyByChannel[c] = energy;
    }

    callback(null, {
      channelData: psd,
      energyByChannel,
      sampleRate: spectrum.sampleRate,
      numberOfChannels: spectrum.numberOfChannels,
      time: spectrum.time,
    })
  }
}

export {PowerSpectralDensity, PSDChunk}