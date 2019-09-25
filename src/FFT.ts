/* Borrowed from ts-dsp (https://github.com/joelyjoel/ts-dsp) */

import FFTJS from 'fft.js';
import {Transform, TransformCallback} from 'stream';
import {SpectralBuffer} from './SpectralBuffer';

/**
 *  Transform stream for converting a pre-windowed AudioBuffer object-stream to spectral data.
 *  @returns SpectralBuffer object-stream
 */
class FFT extends Transform {
  windowSize: number;
  frameSize: number;
  fftFunction: any;

  constructor(windowSize=2048) {
    super({objectMode:true})
    this.windowSize = windowSize
    this.frameSize = this.windowSize * 2
    this.fftFunction = new FFTJS(this.windowSize)
    console.log("## FFT constructor success")
  }

  _transform(audio:AudioBuffer, encoding:string, callback:TransformCallback) {

    console.log("## Call to FFT: _transform()")
    if(audio.numberOfChannels != 1)
      throw "FastFourierTransform expects mono input"
    if(audio.length != this.windowSize)
      throw "FastFourierTransform recieved chunk of incorrect size: " + audio.length

    let channelData = []
    for(let c=0; c<audio.numberOfChannels; c++) {
      let signal = audio.getChannelData(c)
      console.log(signal,)
      let bins = new Array(this.frameSize)
      this.fftFunction.realTransform(bins, signal)
      this.fftFunction.completeSpectrum(bins)
      channelData[c] = bins
    }

    let spectrum = SpectralBuffer.fromArray(
      channelData, audio.sampleRate
    )
    // @ts-ignore
    spectrum.time = audio.time
    callback(null, spectrum)
  }
}
export {FFT}
