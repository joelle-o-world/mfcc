import {calculateMFCC, MFCCConfig} from './calculateMFCC';

window.onload = function() {
  const input = document.createElement("input");
  input.type = "file";
  input.onchange = handleFile;
  document.body.appendChild(input);
}

const audioctx = new AudioContext;

function handleFile(e:any) {
  if(!e.target)
    throw 1;
  let file = e.target.files[0];
  console.log("File:", file);
  if(file) {
    let reader = new FileReader();
    reader.onload = data => {
      let arrbuff = reader.result;
      if(arrbuff instanceof ArrayBuffer)
        audioctx.decodeAudioData(arrbuff, (audio:AudioBuffer) => {
          handleAudio(audio);
        })
    }
    reader.readAsArrayBuffer(file);

  }
}

function handleAudio(audio:AudioBuffer) {
  let mfccStream = calculateMFCC(audio);
  console.log(mfccStream);

  mfccStream.on('data', console.log);
}