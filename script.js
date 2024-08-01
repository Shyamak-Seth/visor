const video = document.getElementById('webcam');
const liveView = document.getElementById('liveView');
const demosSection = document.getElementById('demos');
const enableWebcamButton = document.getElementById('webcamButton');
var loadedOrNot = false;

function getUserMediaSupported() {
    return !!(navigator.mediaDevices &&
      navigator.mediaDevices.getUserMedia);
}
if (getUserMediaSupported()) {
} else {
    console.warn('getUserMedia() is not supported by your browser');
}

function enableCam(event) {
    if (!model) {
        return;
    }

    const constraints = {
        video: {
            facingMode: {
                ideal: 'environment'
            }
        }
    };

    navigator.mediaDevices.getUserMedia(constraints).then(function(stream) {
        video.srcObject = stream;
        video.addEventListener('loadeddata', predictWebcam);
    });
}

var model = undefined;

cocoSsd.load().then(function (loadedModel) {
  model = loadedModel;
  demosSection.classList.remove('invisible');
  document.getElementsByClassName('clickme')[0].style.color = '#eee'
  document.getElementsByClassName('clickme')[0].style.opacity = '1'
  loadedOrNot = true
});

var children = [];

function predictWebcam() {
  model.detect(video).then(function (predictions) {
    for (let i = 0; i < children.length; i++) {
      document.getElementById('liveView2').removeChild(children[i]);
    }
    children.splice(0);
    for (let n = 0; n < predictions.length; n++) {
      if (predictions[n].score > 0.66) {
        const p = document.createElement('p');
        p.innerText = predictions[n].class  + ' - with ' 
            + Math.round(parseFloat(predictions[n].score) * 100) 
            + '% confidence.';
        p.style = 'margin-left: ' + predictions[n].bbox[0] + 'px; margin-top: '
            + ((predictions[n].bbox[1] - 10) - document.getElementById('webcam').getBoundingClientRect().height) + 'px; width: ' 
            + (predictions[n].bbox[2] - 10) + 'px; position: absolute;';

        const highlighter = document.createElement('div');
        highlighter.setAttribute('class', 'highlighter');
        highlighter.style = 'margin-left: ' + predictions[n].bbox[0] + 'px; margin-top: '
            + (predictions[n].bbox[1] - document.getElementById('webcam').getBoundingClientRect().height) + 'px; width: ' 
            + predictions[n].bbox[2] + 'px; height: '
            + predictions[n].bbox[3] + 'px;';

        document.getElementById('liveView2').appendChild(highlighter);
        document.getElementById('liveView2').appendChild(p);
        children.push(highlighter);
        children.push(p);
      }
    }
    window.requestAnimationFrame(predictWebcam);
  });
}

async function getPredictWebcam() {
    const myarr = []
    const predictions = await model.detect(video)
    for (let n = 0; n < predictions.length; n++) {
        if (predictions[n].score > 0.66) {
            myarr.push(predictions[n].class)
        }
    }
    console.log('predict kr bsdk')
    return myarr
}

window.onload = () => {
    var SpeechRecognition = SpeechRecognition || webkitSpeechRecognition;
    var recognition = new SpeechRecognition();

    recognition.onstart = () => {
        console.log('Listening...')
    }

    recognition.onresult = async (e) => {
        var transcript = e.results[0][0].transcript.toUpperCase()
        console.log(transcript)
            console.log('sahi baat hai')
                const theirCommand = transcript
                if (theirCommand.includes('WHAT DO I SEE')) {
                    var myResponse = 'There are '
                    const allObjects = await getPredictWebcam()
                    const finalArray = []
                    const allTempObjects = []
                    for (let i = 0; i < allObjects.length; i++) {
                        if (!allTempObjects.includes(allObjects[i])) {
                            finalArray.push({
                                name: allObjects[i],
                                quantity: 1
                            })
                            allTempObjects.push(allObjects[i])
                        } else {
                            for (let j = 0; j < finalArray.length; j++) {
                                if (finalArray[j].name == allObjects[i]) {
                                    finalArray[j].quantity += 1
                                }
                            }
                        }
                    }
                    console.log('all objects')
                    console.log(allObjects)
                    console.log('all temp objects')
                    console.log(allTempObjects)
                    console.log('final array')
                    console.log(finalArray)
                    for (let k = 0; k < finalArray.length; k++) {
                        myResponse += `${finalArray[k].quantity} ${finalArray[k].name + 's'}, `
                    }
                    myResponse += 'in front of you.'
                    const utterance = new SpeechSynthesisUtterance(myResponse);
                    const voices = speechSynthesis.getVoices();
                    utterance.voice = voices[0];
                    speechSynthesis.speak(utterance);
                }
    }

    recognition.onspeechend = () => {
        console.log('speech ended.')
        recognition.stop()
    }

    recognition.onerror = (e) => {
        console.log(e.error)
    }
    liveView.addEventListener('click', (ev) => {
        if (!loadedOrNot) return
        enableCam(ev)
        recognition.start()
    });
}