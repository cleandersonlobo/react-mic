/* eslint-disable class-methods-use-this */
import MediaStreamRecorder from 'msr';
import AudioContext from './AudioContext';

let analyser;
let audioCtx;
let mediaRecorder;
let chunks = [];
let startTime;
let stream;
let mediaOptions;
let blobObject;
let onStartCallback;
let onStopCallback;
let onSaveCallback;
let onDataCallback;

const constraints = { audio: true }; // constraints - only audio needed

navigator.getUserMedia =
  navigator.getUserMedia ||
  navigator.webkitGetUserMedia ||
  navigator.mozGetUserMedia ||
  navigator.msGetUserMedia;

export class MicrophoneRecorder {
  constructor(onStart, onStop, onSave, onData, options) {
    onStartCallback = onStart;
    onStopCallback = onStop;
    onSaveCallback = onSave;
    onDataCallback = onData;
    mediaOptions = options;
  }

  startRecording = () => {
    startTime = Date.now();

    if (mediaRecorder) {
      if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
      }

      if (mediaRecorder && mediaRecorder.state === 'paused') {
        mediaRecorder.resume();
        return;
      }

      if (audioCtx && mediaRecorder && mediaRecorder.state === 'inactive') {
        mediaRecorder.start(10);
        const source = audioCtx.createMediaStreamSource(stream);
        source.connect(analyser);
        if (onStartCallback) {
          onStartCallback();
        }
      }
    } else if (navigator.mediaDevices) {
      console.log('getUserMedia supported.');
      navigator.mediaDevices
        .getUserMedia(constraints)
        .then(str => {
          stream = str;

          mediaRecorder = new MediaStreamRecorder(str);
          mediaRecorder.mimeType = 'audio/wav';
          if (onStartCallback) {
            onStartCallback();
          }

          // mediaRecorder.onstop = ;
          mediaRecorder.onstop = this.onStop;

          mediaRecorder.ondataavailable = blob => {
            if (onDataCallback) {
              onDataCallback();
            }
            if (blob) {
              chunks.push(blob);
              if (onDataCallback) {
                onDataCallback(blob);
              }
            }
          };
          audioCtx = AudioContext.getAudioContext();
          audioCtx.resume().then(() => {
            analyser = AudioContext.getAnalyser();
            mediaRecorder.start(10);
            const sourceNode = audioCtx.createMediaStreamSource(stream);
            sourceNode.connect(analyser);
          });
        })
        .catch(error => console.log(JSON.stringify(error, 2, null)));
    } else {
      alert('Your browser does not support audio recording');
    }
  };

  stopRecording() {
    if (mediaRecorder && mediaRecorder.state !== 'inactive') {
      mediaRecorder.stop();
      stream.getAudioTracks().forEach(track => {
        track.stop();
      });
      mediaRecorder = null;
      AudioContext.resetAnalyser();
    }
  }

  onStop() {
    const blob = new Blob(chunks, { type: 'audio/wav' });
    chunks = [];

    blobObject = {
      blob,
      startTime,
      stopTime: Date.now(),
      options: mediaOptions,
      blobURL: window.URL.createObjectURL(blob),
    };
    if (onStopCallback) {
      onStopCallback(blobObject);
    }
    if (onSaveCallback) {
      onSaveCallback(blobObject);
    }
  }
}
