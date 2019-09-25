import { Transform, TransformCallback } from "stream";
import * as AudioBuffer from 'audiobuffer';


class Preemphasis extends Transform {

  /** Feedback points (by channel) */
  feedback: number[];
  /** Coefficient of preemphasis filter. (Zero = no filter) */
  coeff: number;

  constructor(coeff=0.95) {
    super({objectMode:true});
    this.feedback = [];
    this.coeff = coeff
  }

  _transform(chunk:AudioBuffer, enc:string, callback:TransformCallback) {
    const coeff = this.coeff
    const channelData = []
    for(let c=0; c<chunk.numberOfChannels; ++c) {
      const data = chunk.getChannelData(c);

      const out = new Float32Array(chunk.length);
      channelData.push(out)

      let prev = this.feedback[c] || 0;
      for(let i=0; i<data.length; ++i) {
        out[i] = data[i] - coeff * prev;
        prev = data[i];
      }
      this.feedback[c] =  prev;
    }

    callback(null, AudioBuffer.fromArray(channelData, chunk.sampleRate))
  }
}

export {Preemphasis}