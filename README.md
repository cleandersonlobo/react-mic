# @cleanderson/react-mic

### Wrapper component for [react-mic](https://github.com/hackingbeauty/react-mic)


## What's new - @cleandersonlobo/react-mic

The Component audio format is supported in Safari browsers (including Safari on iOS). 

The Package has been updated to use the [MediaStreamRecorder](https://github.com/cleandersonlobo/MediaStreamRecorder) to record WAV audio.

The Package has been updated to use the [wasm-optimized](https://hackernoon.com/creating-webassembly-powered-library-for-modern-web-846da334f8fc) [vmsg](https://github.com/Kagami/vmsg) to record MP3 audio.


- Supports WAV audio recording
- Supports MP3 audio recording

## Problem to be solved.

- Audio recorded in **WAV** by safari presents noises;


## Demos [react-mic](https://github.com/hackingbeauty/react-mic)


Check out the [demo](https://www.voicerecordpro.com/#/record).

**NOTE**: The above demo does not use this package

## Installation

`npm install --save @cleandersonlobo/react-mic`

## Features

- Record audio from microphone
- Display sound wave as voice is being recorded
- Save audio as BLOB

## Usage

```js

<ReactMic
  record={boolean}         // defaults -> false.  Set to true to begin recording
  pause={boolean}          // defaults -> false.  Available in React-Mic-Plus upgrade only
  className={string}       // provide css class name
  onStop={function}        // callback to execute when audio stops recording
  onData={function}        // callback to execute when chunk of audio data is available
  strokeColor={string}     // sound wave color
  backgroundColor={string} // background color
  mimeType={string}        // defaults -> audio/wav. Set audio/mp3 to switch to MP3
  bufferSize={number}      // defaults -> 2048. You can set following bufferSize values: 0, 256, 512, 1024, 2048, 4096, 8192, and 16384. 
  sampleRate={number}      // defaults -> 44100. It accepts values only in range: 22050 to 96000 
/>

```

## Example 

# AUDIO/WAV

```js
import { ReactMic } from 'react-mic';

export class Example extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      record: false
    }

  }

  startRecording = () => {
    this.setState({
      record: true
    });
  }

  stopRecording = () => {
    this.setState({
      record: false
    });
  }

  onData(recordedBlob) {
    console.log('chunk of real-time data is: ', recordedBlob);
  }

  onStop(recordedBlob) {
    console.log('recordedBlob is: ', recordedBlob);
  }

  render() {
    return (
      <div>
        <ReactMic
          record={this.state.record}
          className="sound-wave"
          onStop={this.onStop}
          onData={this.onData}
          strokeColor="#000000"
          backgroundColor="#FF4081" />
        <button onTouchTap={this.startRecording} type="button">Start</button>
        <button onTouchTap={this.stopRecording} type="button">Stop</button>
      </div>
    );
  }
}
```

# AUDIO/MP3

```js
import { ReactMic } from 'react-mic';

export class Example extends React.Component {
  ...

  onData() {
    console.log('This function does not return an object, but is called at a time interval of 10ms');
  }

  onStop(recordedBlob) {
    console.log('recordedBlob is: ', recordedBlob);
  }

  render() {
    return (
      <div>
        <ReactMic
          record={this.state.record}
          className="sound-wave"
          onStop={this.onStop}
          onData={this.onData}
          strokeColor="#000000"
          backgroundColor="#FF4081" 
          mimeType="audio/mp3" />
        <button onTouchTap={this.startRecording} type="button">Start</button>
        <button onTouchTap={this.stopRecording} type="button">Stop</button>
      </div>
    );
  }
}
```
# Having issues with the lambda function?
Try installing babel-preset-stage-1

Include stage-1 in your webpack.config under presets.

e.g.

```js
module.exports = {
    entry: "./scripts/Main.js",
    output: {
        path: __dirname,
        filename: "./static/script.js"
    },
    module: {
        loaders: [{
            test: /\.css$/,
            loader: "style!css"
        }, {
            test: /\.js$/,
            // exclude: /(node_modules)/,
            loader: 'babel-loader',
            query: {
                presets: ['es2015', 'react', 'stage-1']
            }
        }]

    }
};
```

## License

MIT
