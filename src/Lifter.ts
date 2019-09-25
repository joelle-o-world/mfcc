import { Transform, TransformCallback } from "stream";
import { MFCCChunk } from "./Mel";

class Lifter extends Transform {

  lift: number[];

  constructor(L:number, numcep:number) {
    super({objectMode: true});
    this.lift = [];
    for(let i=0; i<numcep; ++i)
      this.lift[i] = 1 + (L/2) * Math.sin(Math.PI * i / L)
    
  }

  _transform(chunk: MFCCChunk, enc:string, callback:TransformCallback) {
    const liftedCoeffsByChannel = chunk.coeffsByChannel.map(coeffs => {
      return coeffs.map((coeff, i) => coeff * this.lift[i])
    })

    callback(null, {
      coeffsByChannel: liftedCoeffsByChannel,
      time: chunk.time,
    })
  }
}

export {Lifter}