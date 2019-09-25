import {calculateMFCC, MFCCConfig} from './calculateMFCC';

window.onload = function() {
  const input = document.createElement("input");
  input.type = "file";
  input.onchange = handleFile;
  document.body.appendChild(input);
}


const sampleRate = 8000;

function handleFile(e:any) {
  if(!e.target)
    throw 1;
  let file = e.target.files[0];
  console.log("File:", file);
  if(file) {
    let reader = new FileReader();
    reader.onload = data => {
      let arrbuff = reader.result;
      const audioctx = new OfflineAudioContext(1, 1, sampleRate);
      if(arrbuff instanceof ArrayBuffer)
        audioctx.decodeAudioData(arrbuff, (audio:AudioBuffer) => {
          handleAudio(audio);
        })
    }
    reader.readAsArrayBuffer(file);
  }
}

const controlVersion = [-10.9531314 ,  -0.08254892,  -0.61411686,   2.73524852,
  3.05144807,   5.28675469,   1.46473103,   1.36508555,
  4.5818183 ,   4.68330949,  -0.41958311,   2.24747888,
 -1.51294501]

function handleAudio(audio:AudioBuffer) {
  let mfccStream = calculateMFCC(audio, {samplerate: audio.sampleRate});
  console.log(mfccStream);

  mfccStream.once('data', chunk => {
    let coeffs = chunk.coeffsByChannel[0]
    console.log("new script:", coeffs)
    console.log("old script:", controlVersion)
  });
}