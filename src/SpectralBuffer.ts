/* Borrowed from ts-dsp (https://github.com/joelyjoel/ts-dsp) */


/** Stores a single frame of multichannel FFT data. */
class SpectralBuffer {
  private _data:number[][];
  public sampleRate: number;
  time?: number;

  constructor() {
    this.sampleRate = 44100
    this._data = []
  }

  get numberOfChannels() {
    return this._data.length
  }

  get frameSize() {
    return this._data[0].length
  }

  get windowSize() {
    return this.frameSize/2
  }

  getChannelData(c:number) {
    if(this._data[c])
      return this._data[c].slice()
    else
      throw "Channel doesn't exist"
  }

  binFrequency(bin:number) {
    return bin * this.sampleRate/this.frameSize
  }

  binOfFrequency(f:number) {
    return f * this.frameSize / this.sampleRate
  }

  static fromArray(channelData:number[][], sampleRate:number) {
    if(!sampleRate)
      throw 'SpectralBuffer.fromArray expects sample rate'

    let buffer = new SpectralBuffer

    buffer.sampleRate = sampleRate
    buffer._data = channelData

    return buffer
  }
}
export {SpectralBuffer}
