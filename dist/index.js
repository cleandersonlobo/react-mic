'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var React = require('react');
var React__default = _interopDefault(React);
var propTypes = require('prop-types');

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

var MediaStreamRecorder_1 = createCommonjsModule(function (module) {
// Last time updated: 2016-07-03 8:51:35 AM UTC

// links:
// Open-Sourced: https://github.com/streamproc/MediaStreamRecorder
// https://cdn.WebRTC-Experiment.com/MediaStreamRecorder.js
// https://www.WebRTC-Experiment.com/MediaStreamRecorder.js
// npm install msr

//------------------------------------

// Browsers Support::
// Chrome (all versions) [ audio/video separately ]
// Firefox ( >= 29 ) [ audio/video in single webm/mp4 container or only audio in ogg ]
// Opera (all versions) [ same as chrome ]
// Android (Chrome) [ only video ]
// Android (Opera) [ only video ]
// Android (Firefox) [ only video ]
// Microsoft Edge (Only Audio & Gif)

//------------------------------------
// Muaz Khan     - www.MuazKhan.com
// MIT License   - www.WebRTC-Experiment.com/licence
//------------------------------------

// ______________________
// MediaStreamRecorder.js

function MediaStreamRecorder(mediaStream) {
    if (!mediaStream) {
        throw 'MediaStream is mandatory.';
    }

    // void start(optional long timeSlice)
    // timestamp to fire "ondataavailable"
    this.start = function(timeSlice) {
        var Recorder;

        if (typeof MediaRecorder !== 'undefined') {
            Recorder = MediaRecorderWrapper;
        } else if (IsChrome || IsOpera || IsEdge) {
            if (this.mimeType.indexOf('video') !== -1) {
                Recorder = WhammyRecorder;
            } else if (this.mimeType.indexOf('audio') !== -1) {
                Recorder = StereoAudioRecorder;
            }
        }

        // video recorder (in GIF format)
        if (this.mimeType === 'image/gif') {
            Recorder = GifRecorder;
        }

        // audio/wav is supported only via StereoAudioRecorder
        // audio/pcm (int16) is supported only via StereoAudioRecorder
        if (this.mimeType === 'audio/wav' || this.mimeType === 'audio/pcm') {
            Recorder = StereoAudioRecorder;
        }

        // allows forcing StereoAudioRecorder.js on Edge/Firefox
        if (this.recorderType) {
            Recorder = this.recorderType;
        }

        mediaRecorder = new Recorder(mediaStream);
        mediaRecorder.blobs = [];

        var self = this;
        mediaRecorder.ondataavailable = function(data) {
            mediaRecorder.blobs.push(data);
            self.ondataavailable(data);
        };
        mediaRecorder.onstop = this.onstop;
        mediaRecorder.onStartedDrawingNonBlankFrames = this.onStartedDrawingNonBlankFrames;

        // Merge all data-types except "function"
        mediaRecorder = mergeProps(mediaRecorder, this);

        mediaRecorder.start(timeSlice);
    };

    this.onStartedDrawingNonBlankFrames = function() {};
    this.clearOldRecordedFrames = function() {
        if (!mediaRecorder) {
            return;
        }

        mediaRecorder.clearOldRecordedFrames();
    };

    this.stop = function() {
        if (mediaRecorder) {
            mediaRecorder.stop();
        }
    };

    this.ondataavailable = function(blob) {
        console.log('ondataavailable..', blob);
    };

    this.onstop = function(error) {
        console.warn('stopped..', error);
    };

    this.save = function(file, fileName) {
        if (!file) {
            if (!mediaRecorder) {
                return;
            }

            ConcatenateBlobs(mediaRecorder.blobs, mediaRecorder.blobs[0].type, function(concatenatedBlob) {
                invokeSaveAsDialog(concatenatedBlob);
            });
            return;
        }
        invokeSaveAsDialog(file, fileName);
    };

    this.pause = function() {
        if (!mediaRecorder) {
            return;
        }
        mediaRecorder.pause();
        console.log('Paused recording.', this.mimeType || mediaRecorder.mimeType);
    };

    this.resume = function() {
        if (!mediaRecorder) {
            return;
        }
        mediaRecorder.resume();
        console.log('Resumed recording.', this.mimeType || mediaRecorder.mimeType);
    };

    // StereoAudioRecorder || WhammyRecorder || MediaRecorderWrapper || GifRecorder
    this.recorderType = null;

    // video/webm or audio/webm or audio/ogg or audio/wav
    this.mimeType = 'video/webm';

    // logs are enabled by default
    this.disableLogs = false;

    // Reference to "MediaRecorder.js"
    var mediaRecorder;
}

// ______________________
// MultiStreamRecorder.js

function MultiStreamRecorder(mediaStream) {
    if (!mediaStream) {
        throw 'MediaStream is mandatory.';
    }

    var self = this;
    var isMediaRecorder = isMediaRecorderCompatible();

    this.stream = mediaStream;

    // void start(optional long timeSlice)
    // timestamp to fire "ondataavailable"
    this.start = function(timeSlice) {
        audioRecorder = new MediaStreamRecorder(mediaStream);
        videoRecorder = new MediaStreamRecorder(mediaStream);

        audioRecorder.mimeType = 'audio/ogg';
        videoRecorder.mimeType = 'video/webm';

        for (var prop in this) {
            if (typeof this[prop] !== 'function') {
                audioRecorder[prop] = videoRecorder[prop] = this[prop];
            }
        }

        audioRecorder.ondataavailable = function(blob) {
            if (!audioVideoBlobs[recordingInterval]) {
                audioVideoBlobs[recordingInterval] = {};
            }

            audioVideoBlobs[recordingInterval].audio = blob;

            if (audioVideoBlobs[recordingInterval].video && !audioVideoBlobs[recordingInterval].onDataAvailableEventFired) {
                audioVideoBlobs[recordingInterval].onDataAvailableEventFired = true;
                fireOnDataAvailableEvent(audioVideoBlobs[recordingInterval]);
            }
        };

        videoRecorder.ondataavailable = function(blob) {
            if (isMediaRecorder) {
                return self.ondataavailable({
                    video: blob,
                    audio: blob
                });
            }

            if (!audioVideoBlobs[recordingInterval]) {
                audioVideoBlobs[recordingInterval] = {};
            }

            audioVideoBlobs[recordingInterval].video = blob;

            if (audioVideoBlobs[recordingInterval].audio && !audioVideoBlobs[recordingInterval].onDataAvailableEventFired) {
                audioVideoBlobs[recordingInterval].onDataAvailableEventFired = true;
                fireOnDataAvailableEvent(audioVideoBlobs[recordingInterval]);
            }
        };

        function fireOnDataAvailableEvent(blobs) {
            recordingInterval++;
            self.ondataavailable(blobs);
        }

        videoRecorder.onstop = audioRecorder.onstop = function(error) {
            self.onstop(error);
        };

        if (!isMediaRecorder) {
            // to make sure both audio/video are synced.
            videoRecorder.onStartedDrawingNonBlankFrames = function() {
                videoRecorder.clearOldRecordedFrames();
                audioRecorder.start(timeSlice);
            };
            videoRecorder.start(timeSlice);
        } else {
            videoRecorder.start(timeSlice);
        }
    };

    this.stop = function() {
        if (audioRecorder) {
            audioRecorder.stop();
        }
        if (videoRecorder) {
            videoRecorder.stop();
        }
    };

    this.ondataavailable = function(blob) {
        console.log('ondataavailable..', blob);
    };

    this.onstop = function(error) {
        console.warn('stopped..', error);
    };

    this.pause = function() {
        if (audioRecorder) {
            audioRecorder.pause();
        }
        if (videoRecorder) {
            videoRecorder.pause();
        }
    };

    this.resume = function() {
        if (audioRecorder) {
            audioRecorder.resume();
        }
        if (videoRecorder) {
            videoRecorder.resume();
        }
    };

    var audioRecorder;
    var videoRecorder;

    var audioVideoBlobs = {};
    var recordingInterval = 0;
}

if (typeof MediaStreamRecorder !== 'undefined') {
    MediaStreamRecorder.MultiStreamRecorder = MultiStreamRecorder;
}

// _____________________________
// Cross-Browser-Declarations.js

var browserFakeUserAgent = 'Fake/5.0 (FakeOS) AppleWebKit/123 (KHTML, like Gecko) Fake/12.3.4567.89 Fake/123.45';

(function(that) {
    if (typeof window !== 'undefined') {
        return;
    }

    if (typeof window === 'undefined' && typeof commonjsGlobal !== 'undefined') {
        commonjsGlobal.navigator = {
            userAgent: browserFakeUserAgent,
            getUserMedia: function() {}
        };

        /*global window:true */
        that.window = commonjsGlobal;
    }

    if (typeof document === 'undefined') {
        /*global document:true */
        that.document = {};

        document.createElement = document.captureStream = document.mozCaptureStream = function() {
            return {};
        };
    }

    if (typeof location === 'undefined') {
        /*global location:true */
        that.location = {
            protocol: 'file:',
            href: '',
            hash: ''
        };
    }

    if (typeof screen === 'undefined') {
        /*global screen:true */
        that.screen = {
            width: 0,
            height: 0
        };
    }
})(typeof commonjsGlobal !== 'undefined' ? commonjsGlobal : window);

// WebAudio API representer
var AudioContext = window.AudioContext;

if (typeof AudioContext === 'undefined') {
    if (typeof webkitAudioContext !== 'undefined') {
        /*global AudioContext:true */
        AudioContext = webkitAudioContext;
    }

    if (typeof mozAudioContext !== 'undefined') {
        /*global AudioContext:true */
        AudioContext = mozAudioContext;
    }
}

if (typeof window === 'undefined') {
    /*jshint -W020 */
    window = {};
}

// WebAudio API representer
var AudioContext = window.AudioContext;

if (typeof AudioContext === 'undefined') {
    if (typeof webkitAudioContext !== 'undefined') {
        /*global AudioContext:true */
        AudioContext = webkitAudioContext;
    }

    if (typeof mozAudioContext !== 'undefined') {
        /*global AudioContext:true */
        AudioContext = mozAudioContext;
    }
}

/*jshint -W079 */
var URL = window.URL;

if (typeof URL === 'undefined' && typeof webkitURL !== 'undefined') {
    /*global URL:true */
    URL = webkitURL;
}

if (typeof navigator !== 'undefined') {
    if (typeof navigator.webkitGetUserMedia !== 'undefined') {
        navigator.getUserMedia = navigator.webkitGetUserMedia;
    }

    if (typeof navigator.mozGetUserMedia !== 'undefined') {
        navigator.getUserMedia = navigator.mozGetUserMedia;
    }
} else {
    navigator = {
        getUserMedia: function() {},
        userAgent: browserFakeUserAgent
    };
}

var IsEdge = navigator.userAgent.indexOf('Edge') !== -1 && (!!navigator.msSaveBlob || !!navigator.msSaveOrOpenBlob);

var IsOpera = false;
if (typeof opera !== 'undefined' && navigator.userAgent && navigator.userAgent.indexOf('OPR/') !== -1) {
    IsOpera = true;
}
var IsChrome = !IsEdge && !IsEdge && !!navigator.webkitGetUserMedia;

var MediaStream = window.MediaStream;

if (typeof MediaStream === 'undefined' && typeof webkitMediaStream !== 'undefined') {
    MediaStream = webkitMediaStream;
}

/*global MediaStream:true */
if (typeof MediaStream !== 'undefined') {
    if (!('getVideoTracks' in MediaStream.prototype)) {
        MediaStream.prototype.getVideoTracks = function() {
            if (!this.getTracks) {
                return [];
            }

            var tracks = [];
            this.getTracks.forEach(function(track) {
                if (track.kind.toString().indexOf('video') !== -1) {
                    tracks.push(track);
                }
            });
            return tracks;
        };

        MediaStream.prototype.getAudioTracks = function() {
            if (!this.getTracks) {
                return [];
            }

            var tracks = [];
            this.getTracks.forEach(function(track) {
                if (track.kind.toString().indexOf('audio') !== -1) {
                    tracks.push(track);
                }
            });
            return tracks;
        };
    }

    if (!('stop' in MediaStream.prototype)) {
        MediaStream.prototype.stop = function() {
            this.getAudioTracks().forEach(function(track) {
                if (!!track.stop) {
                    track.stop();
                }
            });

            this.getVideoTracks().forEach(function(track) {
                if (!!track.stop) {
                    track.stop();
                }
            });
        };
    }
}

if (typeof location !== 'undefined') {
    if (location.href.indexOf('file:') === 0) {
        console.error('Please load this HTML file on HTTP or HTTPS.');
    }
}

// Merge all other data-types except "function"

function mergeProps(mergein, mergeto) {
    for (var t in mergeto) {
        if (typeof mergeto[t] !== 'function') {
            mergein[t] = mergeto[t];
        }
    }
    return mergein;
}

/**
 * @param {Blob} file - File or Blob object. This parameter is required.
 * @param {string} fileName - Optional file name e.g. "Recorded-Video.webm"
 * @example
 * invokeSaveAsDialog(blob or file, [optional] fileName);
 * @see {@link https://github.com/muaz-khan/RecordRTC|RecordRTC Source Code}
 */
function invokeSaveAsDialog(file, fileName) {
    if (!file) {
        throw 'Blob object is required.';
    }

    if (!file.type) {
        try {
            file.type = 'video/webm';
        } catch (e) {}
    }

    var fileExtension = (file.type || 'video/webm').split('/')[1];

    if (fileName && fileName.indexOf('.') !== -1) {
        var splitted = fileName.split('.');
        fileName = splitted[0];
        fileExtension = splitted[1];
    }

    var fileFullName = (fileName || (Math.round(Math.random() * 9999999999) + 888888888)) + '.' + fileExtension;

    if (typeof navigator.msSaveOrOpenBlob !== 'undefined') {
        return navigator.msSaveOrOpenBlob(file, fileFullName);
    } else if (typeof navigator.msSaveBlob !== 'undefined') {
        return navigator.msSaveBlob(file, fileFullName);
    }

    var hyperlink = document.createElement('a');
    hyperlink.href = URL.createObjectURL(file);
    hyperlink.target = '_blank';
    hyperlink.download = fileFullName;

    if (!!navigator.mozGetUserMedia) {
        hyperlink.onclick = function() {
            (document.body || document.documentElement).removeChild(hyperlink);
        };
        (document.body || document.documentElement).appendChild(hyperlink);
    }

    var evt = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true
    });

    hyperlink.dispatchEvent(evt);

    if (!navigator.mozGetUserMedia) {
        URL.revokeObjectURL(hyperlink.href);
    }
}

function bytesToSize(bytes) {
    var k = 1000;
    var sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0) {
        return '0 Bytes';
    }
    var i = parseInt(Math.floor(Math.log(bytes) / Math.log(k)), 10);
    return (bytes / Math.pow(k, i)).toPrecision(3) + ' ' + sizes[i];
}

// ______________ (used to handle stuff like http://goo.gl/xmE5eg) issue #129
// ObjectStore.js
var ObjectStore = {
    AudioContext: AudioContext
};

function isMediaRecorderCompatible() {
    var isOpera = !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
    var isChrome = !!window.chrome && !isOpera;
    var isFirefox = typeof window.InstallTrigger !== 'undefined';

    if (isFirefox) {
        return true;
    }

    if (!isChrome) {
        return false;
    }

    var nVer = navigator.appVersion;
    var nAgt = navigator.userAgent;
    var fullVersion = '' + parseFloat(navigator.appVersion);
    var majorVersion = parseInt(navigator.appVersion, 10);
    var verOffset, ix;

    if (isChrome) {
        verOffset = nAgt.indexOf('Chrome');
        fullVersion = nAgt.substring(verOffset + 7);
    }

    // trim the fullVersion string at semicolon/space if present
    if ((ix = fullVersion.indexOf(';')) !== -1) {
        fullVersion = fullVersion.substring(0, ix);
    }

    if ((ix = fullVersion.indexOf(' ')) !== -1) {
        fullVersion = fullVersion.substring(0, ix);
    }

    majorVersion = parseInt('' + fullVersion, 10);

    if (isNaN(majorVersion)) {
        fullVersion = '' + parseFloat(navigator.appVersion);
        majorVersion = parseInt(navigator.appVersion, 10);
    }

    return majorVersion >= 49;
}

// ______________ (used to handle stuff like http://goo.gl/xmE5eg) issue #129
// ObjectStore.js
var ObjectStore = {
    AudioContext: window.AudioContext || window.webkitAudioContext
};

// ==================
// MediaRecorder.js

/**
 * Implementation of https://dvcs.w3.org/hg/dap/raw-file/default/media-stream-capture/MediaRecorder.html
 * The MediaRecorder accepts a mediaStream as input source passed from UA. When recorder starts,
 * a MediaEncoder will be created and accept the mediaStream as input source.
 * Encoder will get the raw data by track data changes, encode it by selected MIME Type, then store the encoded in EncodedBufferCache object.
 * The encoded data will be extracted on every timeslice passed from Start function call or by RequestData function.
 * Thread model:
 * When the recorder starts, it creates a "Media Encoder" thread to read data from MediaEncoder object and store buffer in EncodedBufferCache object.
 * Also extract the encoded data and create blobs on every timeslice passed from start function or RequestData function called by UA.
 */

function MediaRecorderWrapper(mediaStream) {
    var self = this;

    /**
     * This method records MediaStream.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.record();
     */
    this.start = function(timeSlice, __disableLogs) {
        if (!self.mimeType) {
            self.mimeType = 'video/webm';
        }

        if (self.mimeType.indexOf('audio') !== -1) {
            if (mediaStream.getVideoTracks().length && mediaStream.getAudioTracks().length) {
                var stream;
                if (!!navigator.mozGetUserMedia) {
                    stream = new MediaStream();
                    stream.addTrack(mediaStream.getAudioTracks()[0]);
                } else {
                    // webkitMediaStream
                    stream = new MediaStream(mediaStream.getAudioTracks());
                }
                mediaStream = stream;
            }
        }

        if (self.mimeType.indexOf('audio') !== -1) {
            self.mimeType = IsChrome ? 'audio/webm' : 'audio/ogg';
        }

        self.dontFireOnDataAvailableEvent = false;

        var recorderHints = {
            mimeType: self.mimeType
        };

        if (!self.disableLogs && !__disableLogs) {
            console.log('Passing following params over MediaRecorder API.', recorderHints);
        }

        if (mediaRecorder) {
            // mandatory to make sure Firefox doesn't fails to record streams 3-4 times without reloading the page.
            mediaRecorder = null;
        }

        if (IsChrome && !isMediaRecorderCompatible()) {
            // to support video-only recording on stable
            recorderHints = 'video/vp8';
        }

        // http://dxr.mozilla.org/mozilla-central/source/content/media/MediaRecorder.cpp
        // https://wiki.mozilla.org/Gecko:MediaRecorder
        // https://dvcs.w3.org/hg/dap/raw-file/default/media-stream-capture/MediaRecorder.html

        // starting a recording session; which will initiate "Reading Thread"
        // "Reading Thread" are used to prevent main-thread blocking scenarios
        try {
            mediaRecorder = new MediaRecorder(mediaStream, recorderHints);
        } catch (e) {
            // if someone passed NON_supported mimeType
            // or if Firefox on Android
            mediaRecorder = new MediaRecorder(mediaStream);
        }

        if ('canRecordMimeType' in mediaRecorder && mediaRecorder.canRecordMimeType(self.mimeType) === false) {
            if (!self.disableLogs) {
                console.warn('MediaRecorder API seems unable to record mimeType:', self.mimeType);
            }
        }

        // i.e. stop recording when <video> is paused by the user; and auto restart recording 
        // when video is resumed. E.g. yourStream.getVideoTracks()[0].muted = true; // it will auto-stop recording.
        mediaRecorder.ignoreMutedMedia = self.ignoreMutedMedia || false;

        var firedOnDataAvailableOnce = false;

        // Dispatching OnDataAvailable Handler
        mediaRecorder.ondataavailable = function(e) {
            if (self.dontFireOnDataAvailableEvent) {
                return;
            }

            // how to fix FF-corrupt-webm issues?
            // should we leave this?          e.data.size < 26800
            if (!e.data || !e.data.size || e.data.size < 26800 || firedOnDataAvailableOnce) {
                return;
            }

            firedOnDataAvailableOnce = true;

            var blob = self.getNativeBlob ? e.data : new Blob([e.data], {
                type: self.mimeType || 'video/webm'
            });

            self.ondataavailable(blob);

            self.dontFireOnDataAvailableEvent = true;

            if (!!mediaRecorder) {
                mediaRecorder.stop();
                mediaRecorder = null;
            }

            // record next interval
            self.start(timeSlice, '__disableLogs');
        };

        mediaRecorder.onerror = function(error) {
            if (!self.disableLogs) {
                if (error.name === 'InvalidState') {
                    console.error('The MediaRecorder is not in a state in which the proposed operation is allowed to be executed.');
                } else if (error.name === 'OutOfMemory') {
                    console.error('The UA has exhaused the available memory. User agents SHOULD provide as much additional information as possible in the message attribute.');
                } else if (error.name === 'IllegalStreamModification') {
                    console.error('A modification to the stream has occurred that makes it impossible to continue recording. An example would be the addition of a Track while recording is occurring. User agents SHOULD provide as much additional information as possible in the message attribute.');
                } else if (error.name === 'OtherRecordingError') {
                    console.error('Used for an fatal error other than those listed above. User agents SHOULD provide as much additional information as possible in the message attribute.');
                } else if (error.name === 'GenericError') {
                    console.error('The UA cannot provide the codec or recording option that has been requested.', error);
                } else {
                    console.error('MediaRecorder Error', error);
                }
            }

            // When the stream is "ended" set recording to 'inactive' 
            // and stop gathering data. Callers should not rely on 
            // exactness of the timeSlice value, especially 
            // if the timeSlice value is small. Callers should 
            // consider timeSlice as a minimum value

            if (!!mediaRecorder && mediaRecorder.state !== 'inactive' && mediaRecorder.state !== 'stopped') {
                mediaRecorder.stop();
            }
        };

        // void start(optional long mTimeSlice)
        // The interval of passing encoded data from EncodedBufferCache to onDataAvailable
        // handler. "mTimeSlice < 0" means Session object does not push encoded data to
        // onDataAvailable, instead, it passive wait the client side pull encoded data
        // by calling requestData API.
        try {
            mediaRecorder.start(3.6e+6);
        } catch (e) {
            mediaRecorder = null;
        }

        setTimeout(function() {
            if (!mediaRecorder) {
                return;
            }

            if (mediaRecorder.state === 'recording') {
                // "stop" method auto invokes "requestData"!
                mediaRecorder.requestData();
                // mediaRecorder.stop();
            }
        }, timeSlice);

        // Start recording. If timeSlice has been provided, mediaRecorder will
        // raise a dataavailable event containing the Blob of collected data on every timeSlice milliseconds.
        // If timeSlice isn't provided, UA should call the RequestData to obtain the Blob data, also set the mTimeSlice to zero.
    };

    /**
     * This method stops recording MediaStream.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.stop(function(blob) {
     *     video.src = URL.createObjectURL(blob);
     * });
     */
    this.stop = function(callback) {
        if (!mediaRecorder) {
            return;
        }

        // mediaRecorder.state === 'recording' means that media recorder is associated with "session"
        // mediaRecorder.state === 'stopped' means that media recorder is detached from the "session" ... in this case; "session" will also be deleted.

        if (mediaRecorder.state === 'recording') {
            // "stop" method auto invokes "requestData"!
            mediaRecorder.requestData();

            setTimeout(function() {
                self.dontFireOnDataAvailableEvent = true;
                if (!!mediaRecorder && mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
                mediaRecorder = null;
            }, 2000);
        }
    };

    /**
     * This method pauses the recording process.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.pause();
     */
    this.pause = function() {
        if (!mediaRecorder) {
            return;
        }

        if (mediaRecorder.state === 'recording') {
            mediaRecorder.pause();
        }
    };

    /**
     * The recorded blobs are passed over this event.
     * @event
     * @memberof MediaStreamRecorder
     * @example
     * recorder.ondataavailable = function(data) {};
     */
    this.ondataavailable = function(blob) {
        console.log('recorded-blob', blob);
    };

    /**
     * This method resumes the recording process.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.resume();
     */
    this.resume = function() {
        if (this.dontFireOnDataAvailableEvent) {
            this.dontFireOnDataAvailableEvent = false;

            var disableLogs = self.disableLogs;
            self.disableLogs = true;
            this.record();
            self.disableLogs = disableLogs;
            return;
        }

        if (!mediaRecorder) {
            return;
        }

        if (mediaRecorder.state === 'paused') {
            mediaRecorder.resume();
        }
    };

    /**
     * This method resets currently recorded data.
     * @method
     * @memberof MediaStreamRecorder
     * @example
     * recorder.clearRecordedData();
     */
    this.clearRecordedData = function() {
        if (!mediaRecorder) {
            return;
        }

        this.pause();

        this.dontFireOnDataAvailableEvent = true;
        this.stop();
    };

    // Reference to "MediaRecorder" object
    var mediaRecorder;

    function isMediaStreamActive() {
        if ('active' in mediaStream) {
            if (!mediaStream.active) {
                return false;
            }
        } else if ('ended' in mediaStream) { // old hack
            if (mediaStream.ended) {
                return false;
            }
        }
        return true;
    }

    // this method checks if media stream is stopped
    // or any track is ended.
    (function looper() {
        if (!mediaRecorder) {
            return;
        }

        if (isMediaStreamActive() === false) {
            self.stop();
            return;
        }

        setTimeout(looper, 1000); // check every second
    })();
}

if (typeof MediaStreamRecorder !== 'undefined') {
    MediaStreamRecorder.MediaRecorderWrapper = MediaRecorderWrapper;
}

// ======================
// StereoAudioRecorder.js

function StereoAudioRecorder(mediaStream) {
    // void start(optional long timeSlice)
    // timestamp to fire "ondataavailable"
    this.start = function(timeSlice) {
        timeSlice = timeSlice || 1000;

        mediaRecorder = new StereoAudioRecorderHelper(mediaStream, this);

        mediaRecorder.record();

        timeout = setInterval(function() {
            mediaRecorder.requestData();
        }, timeSlice);
    };

    this.stop = function() {
        if (mediaRecorder) {
            mediaRecorder.stop();
            clearTimeout(timeout);
        }
    };

    this.pause = function() {
        if (!mediaRecorder) {
            return;
        }

        mediaRecorder.pause();
    };

    this.resume = function() {
        if (!mediaRecorder) {
            return;
        }

        mediaRecorder.resume();
    };

    this.ondataavailable = function() {};

    // Reference to "StereoAudioRecorder" object
    var mediaRecorder;
    var timeout;
}

if (typeof MediaStreamRecorder !== 'undefined') {
    MediaStreamRecorder.StereoAudioRecorder = StereoAudioRecorder;
}

// ============================
// StereoAudioRecorderHelper.js

// source code from: http://typedarray.org/wp-content/projects/WebAudioRecorder/script.js

function StereoAudioRecorderHelper(mediaStream, root) {

    // variables    
    var deviceSampleRate = 44100; // range: 22050 to 96000

    if (!ObjectStore.AudioContextConstructor) {
        ObjectStore.AudioContextConstructor = new ObjectStore.AudioContext();
    }

    // check device sample rate
    deviceSampleRate = ObjectStore.AudioContextConstructor.sampleRate;

    var leftchannel = [];
    var rightchannel = [];
    var scriptprocessornode;
    var recording = false;
    var recordingLength = 0;
    var volume;
    var audioInput;
    var sampleRate = root.sampleRate || deviceSampleRate;

    var mimeType = root.mimeType || 'audio/wav';
    var isPCM = mimeType.indexOf('audio/pcm') > -1;

    var context;

    var numChannels = root.audioChannels || 2;

    this.record = function() {
        recording = true;
        // reset the buffers for the new recording
        leftchannel.length = rightchannel.length = 0;
        recordingLength = 0;
    };

    this.requestData = function() {
        if (isPaused) {
            return;
        }

        if (recording) {
            root.ondataavailable(false);
            return;
        }

        if (recordingLength === 0) {
            requestDataInvoked = false;
            return;
        }

        requestDataInvoked = true;
        // clone stuff
        var internalLeftChannel = leftchannel.slice(0);
        var internalRightChannel = rightchannel.slice(0);
        var internalRecordingLength = recordingLength;

        // reset the buffers for the new recording
        leftchannel.length = rightchannel.length = [];
        recordingLength = 0;
        requestDataInvoked = false;

        // we flat the left and right channels down
        var leftBuffer = mergeBuffers(internalLeftChannel, internalRecordingLength);

        var interleaved = leftBuffer;

        // we interleave both channels together
        if (numChannels === 2) {
            var rightBuffer = mergeBuffers(internalRightChannel, internalRecordingLength); // bug fixed via #70,#71
            interleaved = interleave(leftBuffer, rightBuffer);
        }

        if (isPCM) {
            // our final binary blob
            var blob = new Blob([convertoFloat32ToInt16(interleaved)], {
                type: 'audio/pcm'
            });

            console.debug('audio recorded blob size:', bytesToSize(blob.size));
            root.ondataavailable(blob);
            return;
        }

        // we create our wav file
        var buffer = new ArrayBuffer(44 + interleaved.length * 2);
        var view = new DataView(buffer);

        // RIFF chunk descriptor
        writeUTFBytes(view, 0, 'RIFF');

        // -8 (via #97)
        view.setUint32(4, 44 + interleaved.length * 2 - 8, true);

        writeUTFBytes(view, 8, 'WAVE');
        // FMT sub-chunk
        writeUTFBytes(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true);
        // stereo (2 channels)
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * 2, true); // numChannels * 2 (via #71)
        view.setUint16(32, numChannels * 2, true);
        view.setUint16(34, 16, true);
        // data sub-chunk
        writeUTFBytes(view, 36, 'data');
        view.setUint32(40, interleaved.length * 2, true);

        // write the PCM samples
        var lng = interleaved.length;
        var index = 44;
        var volume = 1;
        for (var i = 0; i < lng; i++) {
            view.setInt16(index, interleaved[i] * (0x7FFF * volume), true);
            index += 2;
        }

        // our final binary blob
        var blob = new Blob([view], {
            type: 'audio/wav'
        });

        console.debug('audio recorded blob size:', bytesToSize(blob.size));

        root.ondataavailable(blob);
        root.onstop();
        audioInput.disconnect();
    };

    this.stop = function() {
        // we stop recording
        recording = false;
        this.requestData();
    };

    function interleave(leftChannel, rightChannel) {
        var length = leftChannel.length + rightChannel.length;
        var result = new Float32Array(length);

        var inputIndex = 0;

        for (var index = 0; index < length;) {
            result[index++] = leftChannel[inputIndex];
            result[index++] = rightChannel[inputIndex];
            inputIndex++;
        }
        return result;
    }

    function mergeBuffers(channelBuffer, recordingLength) {
        var result = new Float32Array(recordingLength);
        var offset = 0;
        var lng = channelBuffer.length;
        for (var i = 0; i < lng; i++) {
            var buffer = channelBuffer[i];
            result.set(buffer, offset);
            offset += buffer.length;
        }
        return result;
    }

    function writeUTFBytes(view, offset, string) {
        var lng = string.length;
        for (var i = 0; i < lng; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    function convertoFloat32ToInt16(buffer) {
        var l = buffer.length;
        var buf = new Int16Array(l);

        while (l--) {
            buf[l] = buffer[l] * 0xFFFF; //convert to 16 bit
        }
        return buf.buffer
    }

    // creates the audio context
    var context = ObjectStore.AudioContextConstructor;

    // creates a gain node
    ObjectStore.VolumeGainNode = context.createGain();

    var volume = ObjectStore.VolumeGainNode;

    // creates an audio node from the microphone incoming stream
    ObjectStore.AudioInput = context.createMediaStreamSource(mediaStream);

    // creates an audio node from the microphone incoming stream
    var audioInput = ObjectStore.AudioInput;

    // connect the stream to the gain node
    audioInput.connect(volume);

    /* From the spec: This value controls how frequently the audioprocess event is
    dispatched and how many sample-frames need to be processed each call.
    Lower values for buffer size will result in a lower (better) latency.
    Higher values will be necessary to avoid audio breakup and glitches 
    Legal values are 256, 512, 1024, 2048, 4096, 8192, and 16384.*/
    var bufferSize = root.bufferSize || 2048;
    if (root.bufferSize === 0) {
        bufferSize = 0;
    }

    if (context.createJavaScriptNode) {
        scriptprocessornode = context.createJavaScriptNode(bufferSize, numChannels, numChannels);
    } else if (context.createScriptProcessor) {
        scriptprocessornode = context.createScriptProcessor(bufferSize, numChannels, numChannels);
    } else {
        throw 'WebAudio API has no support on this browser.';
    }

    bufferSize = scriptprocessornode.bufferSize;

    console.debug('using audio buffer-size:', bufferSize);

    var requestDataInvoked = false;

    // sometimes "scriptprocessornode" disconnects from he destination-node
    // and there is no exception thrown in this case.
    // and obviously no further "ondataavailable" events will be emitted.
    // below global-scope variable is added to debug such unexpected but "rare" cases.
    window.scriptprocessornode = scriptprocessornode;

    if (numChannels === 1) {
        console.debug('All right-channels are skipped.');
    }

    var isPaused = false;

    this.pause = function() {
        isPaused = true;
    };

    this.resume = function() {
        isPaused = false;
    };

    // http://webaudio.github.io/web-audio-api/#the-scriptprocessornode-interface
    scriptprocessornode.onaudioprocess = function(e) {
        if (!recording || requestDataInvoked || isPaused) {
            return;
        }

        var left = e.inputBuffer.getChannelData(0);
        leftchannel.push(new Float32Array(left));

        if (numChannels === 2) {
            var right = e.inputBuffer.getChannelData(1);
            rightchannel.push(new Float32Array(right));
        }
        recordingLength += bufferSize;
    };

    volume.connect(scriptprocessornode);
    scriptprocessornode.connect(context.destination);
}

if (typeof MediaStreamRecorder !== 'undefined') {
    MediaStreamRecorder.StereoAudioRecorderHelper = StereoAudioRecorderHelper;
}

// ===================
// WhammyRecorder.js

function WhammyRecorder(mediaStream) {
    // void start(optional long timeSlice)
    // timestamp to fire "ondataavailable"
    this.start = function(timeSlice) {
        timeSlice = timeSlice || 1000;

        mediaRecorder = new WhammyRecorderHelper(mediaStream, this);

        for (var prop in this) {
            if (typeof this[prop] !== 'function') {
                mediaRecorder[prop] = this[prop];
            }
        }

        mediaRecorder.record();

        timeout = setInterval(function() {
            mediaRecorder.requestData();
        }, timeSlice);
    };

    this.stop = function() {
        if (mediaRecorder) {
            mediaRecorder.stop();
            clearTimeout(timeout);
        }
    };

    this.clearOldRecordedFrames = function() {
        if (mediaRecorder) {
            mediaRecorder.clearOldRecordedFrames();
        }
    };

    this.pause = function() {
        if (!mediaRecorder) {
            return;
        }

        mediaRecorder.pause();
    };

    this.resume = function() {
        if (!mediaRecorder) {
            return;
        }

        mediaRecorder.resume();
    };

    this.ondataavailable = function() {};

    // Reference to "WhammyRecorder" object
    var mediaRecorder;
    var timeout;
}

if (typeof MediaStreamRecorder !== 'undefined') {
    MediaStreamRecorder.WhammyRecorder = WhammyRecorder;
}

// ==========================
// WhammyRecorderHelper.js

function WhammyRecorderHelper(mediaStream, root) {
    this.record = function(timeSlice) {
        if (!this.width) {
            this.width = 320;
        }
        if (!this.height) {
            this.height = 240;
        }

        if (this.video && this.video instanceof HTMLVideoElement) {
            if (!this.width) {
                this.width = video.videoWidth || video.clientWidth || 320;
            }
            if (!this.height) {
                this.height = video.videoHeight || video.clientHeight || 240;
            }
        }

        if (!this.video) {
            this.video = {
                width: this.width,
                height: this.height
            };
        }

        if (!this.canvas || !this.canvas.width || !this.canvas.height) {
            this.canvas = {
                width: this.width,
                height: this.height
            };
        }

        canvas.width = this.canvas.width;
        canvas.height = this.canvas.height;

        // setting defaults
        if (this.video && this.video instanceof HTMLVideoElement) {
            this.isHTMLObject = true;
            video = this.video.cloneNode();
        } else {
            video = document.createElement('video');
            video.src = URL.createObjectURL(mediaStream);

            video.width = this.video.width;
            video.height = this.video.height;
        }

        video.muted = true;
        video.play();

        lastTime = new Date().getTime();
        whammy = new Whammy.Video(root.speed, root.quality);

        console.log('canvas resolutions', canvas.width, '*', canvas.height);
        console.log('video width/height', video.width || canvas.width, '*', video.height || canvas.height);

        drawFrames();
    };

    this.clearOldRecordedFrames = function() {
        whammy.frames = [];
    };

    var requestDataInvoked = false;
    this.requestData = function() {
        if (isPaused) {
            return;
        }

        if (!whammy.frames.length) {
            requestDataInvoked = false;
            return;
        }

        requestDataInvoked = true;
        // clone stuff
        var internalFrames = whammy.frames.slice(0);

        // reset the frames for the new recording

        whammy.frames = dropBlackFrames(internalFrames, -1);

        whammy.compile(function(whammyBlob) {
            root.ondataavailable(whammyBlob);
            console.debug('video recorded blob size:', bytesToSize(whammyBlob.size));
        });

        whammy.frames = [];

        requestDataInvoked = false;
    };

    var isOnStartedDrawingNonBlankFramesInvoked = false;

    function drawFrames() {
        if (isPaused) {
            lastTime = new Date().getTime();
            setTimeout(drawFrames, 500);
            return;
        }

        if (isStopDrawing) {
            return;
        }

        if (requestDataInvoked) {
            return setTimeout(drawFrames, 100);
        }

        var duration = new Date().getTime() - lastTime;
        if (!duration) {
            return drawFrames();
        }

        // via webrtc-experiment#206, by Jack i.e. @Seymourr
        lastTime = new Date().getTime();

        if (!self.isHTMLObject && video.paused) {
            video.play(); // Android
        }

        context.drawImage(video, 0, 0, canvas.width, canvas.height);

        if (!isStopDrawing) {
            whammy.frames.push({
                duration: duration,
                image: canvas.toDataURL('image/webp')
            });
        }

        if (!isOnStartedDrawingNonBlankFramesInvoked && !isBlankFrame(whammy.frames[whammy.frames.length - 1])) {
            isOnStartedDrawingNonBlankFramesInvoked = true;
            root.onStartedDrawingNonBlankFrames();
        }

        setTimeout(drawFrames, 10);
    }

    var isStopDrawing = false;

    this.stop = function() {
        isStopDrawing = true;
        this.requestData();
    };

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');

    var video;
    var lastTime;
    var whammy;

    var self = this;

    function isBlankFrame(frame, _pixTolerance, _frameTolerance) {
        var localCanvas = document.createElement('canvas');
        localCanvas.width = canvas.width;
        localCanvas.height = canvas.height;
        var context2d = localCanvas.getContext('2d');

        var sampleColor = {
            r: 0,
            g: 0,
            b: 0
        };
        var maxColorDifference = Math.sqrt(
            Math.pow(255, 2) +
            Math.pow(255, 2) +
            Math.pow(255, 2)
        );
        var pixTolerance = _pixTolerance && _pixTolerance >= 0 && _pixTolerance <= 1 ? _pixTolerance : 0;
        var frameTolerance = _frameTolerance && _frameTolerance >= 0 && _frameTolerance <= 1 ? _frameTolerance : 0;

        var matchPixCount, endPixCheck, maxPixCount;

        var image = new Image();
        image.src = frame.image;
        context2d.drawImage(image, 0, 0, canvas.width, canvas.height);
        var imageData = context2d.getImageData(0, 0, canvas.width, canvas.height);
        matchPixCount = 0;
        endPixCheck = imageData.data.length;
        maxPixCount = imageData.data.length / 4;

        for (var pix = 0; pix < endPixCheck; pix += 4) {
            var currentColor = {
                r: imageData.data[pix],
                g: imageData.data[pix + 1],
                b: imageData.data[pix + 2]
            };
            var colorDifference = Math.sqrt(
                Math.pow(currentColor.r - sampleColor.r, 2) +
                Math.pow(currentColor.g - sampleColor.g, 2) +
                Math.pow(currentColor.b - sampleColor.b, 2)
            );
            // difference in color it is difference in color vectors (r1,g1,b1) <=> (r2,g2,b2)
            if (colorDifference <= maxColorDifference * pixTolerance) {
                matchPixCount++;
            }
        }

        if (maxPixCount - matchPixCount <= maxPixCount * frameTolerance) {
            return false;
        } else {
            return true;
        }
    }

    function dropBlackFrames(_frames, _framesToCheck, _pixTolerance, _frameTolerance) {
        var localCanvas = document.createElement('canvas');
        localCanvas.width = canvas.width;
        localCanvas.height = canvas.height;
        var context2d = localCanvas.getContext('2d');
        var resultFrames = [];

        var checkUntilNotBlack = _framesToCheck === -1;
        var endCheckFrame = (_framesToCheck && _framesToCheck > 0 && _framesToCheck <= _frames.length) ?
            _framesToCheck : _frames.length;
        var sampleColor = {
            r: 0,
            g: 0,
            b: 0
        };
        var maxColorDifference = Math.sqrt(
            Math.pow(255, 2) +
            Math.pow(255, 2) +
            Math.pow(255, 2)
        );
        var pixTolerance = _pixTolerance && _pixTolerance >= 0 && _pixTolerance <= 1 ? _pixTolerance : 0;
        var frameTolerance = _frameTolerance && _frameTolerance >= 0 && _frameTolerance <= 1 ? _frameTolerance : 0;
        var doNotCheckNext = false;

        for (var f = 0; f < endCheckFrame; f++) {
            var matchPixCount, endPixCheck, maxPixCount;

            if (!doNotCheckNext) {
                var image = new Image();
                image.src = _frames[f].image;
                context2d.drawImage(image, 0, 0, canvas.width, canvas.height);
                var imageData = context2d.getImageData(0, 0, canvas.width, canvas.height);
                matchPixCount = 0;
                endPixCheck = imageData.data.length;
                maxPixCount = imageData.data.length / 4;

                for (var pix = 0; pix < endPixCheck; pix += 4) {
                    var currentColor = {
                        r: imageData.data[pix],
                        g: imageData.data[pix + 1],
                        b: imageData.data[pix + 2]
                    };
                    var colorDifference = Math.sqrt(
                        Math.pow(currentColor.r - sampleColor.r, 2) +
                        Math.pow(currentColor.g - sampleColor.g, 2) +
                        Math.pow(currentColor.b - sampleColor.b, 2)
                    );
                    // difference in color it is difference in color vectors (r1,g1,b1) <=> (r2,g2,b2)
                    if (colorDifference <= maxColorDifference * pixTolerance) {
                        matchPixCount++;
                    }
                }
            }

            if (!doNotCheckNext && maxPixCount - matchPixCount <= maxPixCount * frameTolerance) ; else {
                // console.log('frame is passed : ' + f);
                if (checkUntilNotBlack) {
                    doNotCheckNext = true;
                }
                resultFrames.push(_frames[f]);
            }
        }

        resultFrames = resultFrames.concat(_frames.slice(endCheckFrame));

        if (resultFrames.length <= 0) {
            // at least one last frame should be available for next manipulation
            // if total duration of all frames will be < 1000 than ffmpeg doesn't work well...
            resultFrames.push(_frames[_frames.length - 1]);
        }

        return resultFrames;
    }

    var isPaused = false;

    this.pause = function() {
        isPaused = true;
    };

    this.resume = function() {
        isPaused = false;
    };
}

if (typeof MediaStreamRecorder !== 'undefined') {
    MediaStreamRecorder.WhammyRecorderHelper = WhammyRecorderHelper;
}

// --------------
// GifRecorder.js

function GifRecorder(mediaStream) {
    if (typeof GIFEncoder === 'undefined') {
        throw 'Please link: https://cdn.webrtc-experiment.com/gif-recorder.js';
    }

    // void start(optional long timeSlice)
    // timestamp to fire "ondataavailable"
    this.start = function(timeSlice) {
        timeSlice = timeSlice || 1000;

        var imageWidth = this.videoWidth || 320;
        var imageHeight = this.videoHeight || 240;

        canvas.width = video.width = imageWidth;
        canvas.height = video.height = imageHeight;

        // external library to record as GIF images
        gifEncoder = new GIFEncoder();

        // void setRepeat(int iter)
        // Sets the number of times the set of GIF frames should be played.
        // Default is 1; 0 means play indefinitely.
        gifEncoder.setRepeat(0);

        // void setFrameRate(Number fps)
        // Sets frame rate in frames per second.
        // Equivalent to setDelay(1000/fps).
        // Using "setDelay" instead of "setFrameRate"
        gifEncoder.setDelay(this.frameRate || this.speed || 200);

        // void setQuality(int quality)
        // Sets quality of color quantization (conversion of images to the
        // maximum 256 colors allowed by the GIF specification).
        // Lower values (minimum = 1) produce better colors,
        // but slow processing significantly. 10 is the default,
        // and produces good color mapping at reasonable speeds.
        // Values greater than 20 do not yield significant improvements in speed.
        gifEncoder.setQuality(this.quality || 1);

        // Boolean start()
        // This writes the GIF Header and returns false if it fails.
        gifEncoder.start();

        function drawVideoFrame(time) {
            if (isPaused) {
                setTimeout(drawVideoFrame, 500, time);
                return;
            }

            lastAnimationFrame = requestAnimationFrame(drawVideoFrame);

            if (typeof lastFrameTime === undefined) {
                lastFrameTime = time;
            }

            // ~10 fps
            if (time - lastFrameTime < 90) {
                return;
            }

            if (video.paused) {
                video.play(); // Android
            }

            context.drawImage(video, 0, 0, imageWidth, imageHeight);

            gifEncoder.addFrame(context);

            // console.log('Recording...' + Math.round((Date.now() - startTime) / 1000) + 's');
            // console.log("fps: ", 1000 / (time - lastFrameTime));

            lastFrameTime = time;
        }

        lastAnimationFrame = requestAnimationFrame(drawVideoFrame);

        timeout = setTimeout(doneRecording, timeSlice);
    };

    function doneRecording() {

        var gifBlob = new Blob([new Uint8Array(gifEncoder.stream().bin)], {
            type: 'image/gif'
        });
        self.ondataavailable(gifBlob);

        // todo: find a way to clear old recorded blobs
        gifEncoder.stream().bin = [];
    }

    this.stop = function() {
        if (lastAnimationFrame) {
            cancelAnimationFrame(lastAnimationFrame);
            clearTimeout(timeout);
            doneRecording();
        }
    };

    var isPaused = false;

    this.pause = function() {
        isPaused = true;
    };

    this.resume = function() {
        isPaused = false;
    };

    this.ondataavailable = function() {};
    this.onstop = function() {};

    // Reference to itself
    var self = this;

    var canvas = document.createElement('canvas');
    var context = canvas.getContext('2d');

    var video = document.createElement('video');
    video.muted = true;
    video.autoplay = true;
    video.src = URL.createObjectURL(mediaStream);
    video.play();

    var lastAnimationFrame = null;
    var lastFrameTime;

    var gifEncoder;
    var timeout;
}

if (typeof MediaStreamRecorder !== 'undefined') {
    MediaStreamRecorder.GifRecorder = GifRecorder;
}

// https://github.com/antimatter15/whammy/blob/master/LICENSE
// _________
// Whammy.js

// todo: Firefox now supports webp for webm containers!
// their MediaRecorder implementation works well!
// should we provide an option to record via Whammy.js or MediaRecorder API is a better solution?

/**
 * Whammy is a standalone class used by {@link RecordRTC} to bring video recording in Chrome. It is written by {@link https://github.com/antimatter15|antimatter15}
 * @summary A real time javascript webm encoder based on a canvas hack.
 * @typedef Whammy
 * @class
 * @example
 * var recorder = new Whammy().Video(15);
 * recorder.add(context || canvas || dataURL);
 * var output = recorder.compile();
 */

var Whammy = (function() {
    // a more abstract-ish API

    function WhammyVideo(duration, quality) {
        this.frames = [];
        if (!duration) {
            duration = 1;
        }
        this.duration = 1000 / duration;
        this.quality = quality || 0.8;
    }

    /**
     * Pass Canvas or Context or image/webp(string) to {@link Whammy} encoder.
     * @method
     * @memberof Whammy
     * @example
     * recorder = new Whammy().Video(0.8, 100);
     * recorder.add(canvas || context || 'image/webp');
     * @param {string} frame - Canvas || Context || image/webp
     * @param {number} duration - Stick a duration (in milliseconds)
     */
    WhammyVideo.prototype.add = function(frame, duration) {
        if ('canvas' in frame) { //CanvasRenderingContext2D
            frame = frame.canvas;
        }

        if ('toDataURL' in frame) {
            frame = frame.toDataURL('image/webp', this.quality);
        }

        if (!(/^data:image\/webp;base64,/ig).test(frame)) {
            throw 'Input must be formatted properly as a base64 encoded DataURI of type image/webp';
        }
        this.frames.push({
            image: frame,
            duration: duration || this.duration
        });
    };

    function processInWebWorker(_function) {
        var blob = URL.createObjectURL(new Blob([_function.toString(),
            'this.onmessage =  function (e) {' + _function.name + '(e.data);}'
        ], {
            type: 'application/javascript'
        }));

        var worker = new Worker(blob);
        URL.revokeObjectURL(blob);
        return worker;
    }

    function whammyInWebWorker(frames) {
        function ArrayToWebM(frames) {
            var info = checkFrames(frames);
            if (!info) {
                return [];
            }

            var clusterMaxDuration = 30000;

            var EBML = [{
                'id': 0x1a45dfa3, // EBML
                'data': [{
                    'data': 1,
                    'id': 0x4286 // EBMLVersion
                }, {
                    'data': 1,
                    'id': 0x42f7 // EBMLReadVersion
                }, {
                    'data': 4,
                    'id': 0x42f2 // EBMLMaxIDLength
                }, {
                    'data': 8,
                    'id': 0x42f3 // EBMLMaxSizeLength
                }, {
                    'data': 'webm',
                    'id': 0x4282 // DocType
                }, {
                    'data': 2,
                    'id': 0x4287 // DocTypeVersion
                }, {
                    'data': 2,
                    'id': 0x4285 // DocTypeReadVersion
                }]
            }, {
                'id': 0x18538067, // Segment
                'data': [{
                    'id': 0x1549a966, // Info
                    'data': [{
                        'data': 1e6, //do things in millisecs (num of nanosecs for duration scale)
                        'id': 0x2ad7b1 // TimecodeScale
                    }, {
                        'data': 'whammy',
                        'id': 0x4d80 // MuxingApp
                    }, {
                        'data': 'whammy',
                        'id': 0x5741 // WritingApp
                    }, {
                        'data': doubleToString(info.duration),
                        'id': 0x4489 // Duration
                    }]
                }, {
                    'id': 0x1654ae6b, // Tracks
                    'data': [{
                        'id': 0xae, // TrackEntry
                        'data': [{
                            'data': 1,
                            'id': 0xd7 // TrackNumber
                        }, {
                            'data': 1,
                            'id': 0x73c5 // TrackUID
                        }, {
                            'data': 0,
                            'id': 0x9c // FlagLacing
                        }, {
                            'data': 'und',
                            'id': 0x22b59c // Language
                        }, {
                            'data': 'V_VP8',
                            'id': 0x86 // CodecID
                        }, {
                            'data': 'VP8',
                            'id': 0x258688 // CodecName
                        }, {
                            'data': 1,
                            'id': 0x83 // TrackType
                        }, {
                            'id': 0xe0, // Video
                            'data': [{
                                'data': info.width,
                                'id': 0xb0 // PixelWidth
                            }, {
                                'data': info.height,
                                'id': 0xba // PixelHeight
                            }]
                        }]
                    }]
                }]
            }];

            //Generate clusters (max duration)
            var frameNumber = 0;
            var clusterTimecode = 0;
            while (frameNumber < frames.length) {

                var clusterFrames = [];
                var clusterDuration = 0;
                do {
                    clusterFrames.push(frames[frameNumber]);
                    clusterDuration += frames[frameNumber].duration;
                    frameNumber++;
                } while (frameNumber < frames.length && clusterDuration < clusterMaxDuration);

                var clusterCounter = 0;
                var cluster = {
                    'id': 0x1f43b675, // Cluster
                    'data': getClusterData(clusterTimecode, clusterCounter, clusterFrames)
                }; //Add cluster to segment
                EBML[1].data.push(cluster);
                clusterTimecode += clusterDuration;
            }

            return generateEBML(EBML);
        }

        function getClusterData(clusterTimecode, clusterCounter, clusterFrames) {
            return [{
                'data': clusterTimecode,
                'id': 0xe7 // Timecode
            }].concat(clusterFrames.map(function(webp) {
                var block = makeSimpleBlock({
                    discardable: 0,
                    frame: webp.data.slice(4),
                    invisible: 0,
                    keyframe: 1,
                    lacing: 0,
                    trackNum: 1,
                    timecode: Math.round(clusterCounter)
                });
                clusterCounter += webp.duration;
                return {
                    data: block,
                    id: 0xa3
                };
            }));
        }

        // sums the lengths of all the frames and gets the duration

        function checkFrames(frames) {
            if (!frames[0]) {
                postMessage({
                    error: 'Something went wrong. Maybe WebP format is not supported in the current browser.'
                });
                return;
            }

            var width = frames[0].width,
                height = frames[0].height,
                duration = frames[0].duration;

            for (var i = 1; i < frames.length; i++) {
                duration += frames[i].duration;
            }
            return {
                duration: duration,
                width: width,
                height: height
            };
        }

        function numToBuffer(num) {
            var parts = [];
            while (num > 0) {
                parts.push(num & 0xff);
                num = num >> 8;
            }
            return new Uint8Array(parts.reverse());
        }

        function strToBuffer(str) {
            return new Uint8Array(str.split('').map(function(e) {
                return e.charCodeAt(0);
            }));
        }

        function bitsToBuffer(bits) {
            var data = [];
            var pad = (bits.length % 8) ? (new Array(1 + 8 - (bits.length % 8))).join('0') : '';
            bits = pad + bits;
            for (var i = 0; i < bits.length; i += 8) {
                data.push(parseInt(bits.substr(i, 8), 2));
            }
            return new Uint8Array(data);
        }

        function generateEBML(json) {
            var ebml = [];
            for (var i = 0; i < json.length; i++) {
                var data = json[i].data;

                if (typeof data === 'object') {
                    data = generateEBML(data);
                }

                if (typeof data === 'number') {
                    data = bitsToBuffer(data.toString(2));
                }

                if (typeof data === 'string') {
                    data = strToBuffer(data);
                }

                var len = data.size || data.byteLength || data.length;
                var zeroes = Math.ceil(Math.ceil(Math.log(len) / Math.log(2)) / 8);
                var sizeToString = len.toString(2);
                var padded = (new Array((zeroes * 7 + 7 + 1) - sizeToString.length)).join('0') + sizeToString;
                var size = (new Array(zeroes)).join('0') + '1' + padded;

                ebml.push(numToBuffer(json[i].id));
                ebml.push(bitsToBuffer(size));
                ebml.push(data);
            }

            return new Blob(ebml, {
                type: 'video/webm'
            });
        }

        function makeSimpleBlock(data) {
            var flags = 0;

            if (data.keyframe) {
                flags |= 128;
            }

            if (data.invisible) {
                flags |= 8;
            }

            if (data.lacing) {
                flags |= (data.lacing << 1);
            }

            if (data.discardable) {
                flags |= 1;
            }

            if (data.trackNum > 127) {
                throw 'TrackNumber > 127 not supported';
            }

            var out = [data.trackNum | 0x80, data.timecode >> 8, data.timecode & 0xff, flags].map(function(e) {
                return String.fromCharCode(e);
            }).join('') + data.frame;

            return out;
        }

        function parseWebP(riff) {
            var VP8 = riff.RIFF[0].WEBP[0];

            var frameStart = VP8.indexOf('\x9d\x01\x2a'); // A VP8 keyframe starts with the 0x9d012a header
            for (var i = 0, c = []; i < 4; i++) {
                c[i] = VP8.charCodeAt(frameStart + 3 + i);
            }

            var width, height, tmp;

            //the code below is literally copied verbatim from the bitstream spec
            tmp = (c[1] << 8) | c[0];
            width = tmp & 0x3FFF;
            tmp = (c[3] << 8) | c[2];
            height = tmp & 0x3FFF;
            return {
                width: width,
                height: height,
                data: VP8,
                riff: riff
            };
        }

        function getStrLength(string, offset) {
            return parseInt(string.substr(offset + 4, 4).split('').map(function(i) {
                var unpadded = i.charCodeAt(0).toString(2);
                return (new Array(8 - unpadded.length + 1)).join('0') + unpadded;
            }).join(''), 2);
        }

        function parseRIFF(string) {
            var offset = 0;
            var chunks = {};

            while (offset < string.length) {
                var id = string.substr(offset, 4);
                var len = getStrLength(string, offset);
                var data = string.substr(offset + 4 + 4, len);
                offset += 4 + 4 + len;
                chunks[id] = chunks[id] || [];

                if (id === 'RIFF' || id === 'LIST') {
                    chunks[id].push(parseRIFF(data));
                } else {
                    chunks[id].push(data);
                }
            }
            return chunks;
        }

        function doubleToString(num) {
            return [].slice.call(
                new Uint8Array((new Float64Array([num])).buffer), 0).map(function(e) {
                return String.fromCharCode(e);
            }).reverse().join('');
        }

        var webm = new ArrayToWebM(frames.map(function(frame) {
            var webp = parseWebP(parseRIFF(atob(frame.image.slice(23))));
            webp.duration = frame.duration;
            return webp;
        }));

        postMessage(webm);
    }

    /**
     * Encodes frames in WebM container. It uses WebWorkinvoke to invoke 'ArrayToWebM' method.
     * @param {function} callback - Callback function, that is used to pass recorded blob back to the callee.
     * @method
     * @memberof Whammy
     * @example
     * recorder = new Whammy().Video(0.8, 100);
     * recorder.compile(function(blob) {
     *    // blob.size - blob.type
     * });
     */
    WhammyVideo.prototype.compile = function(callback) {
        var webWorker = processInWebWorker(whammyInWebWorker);

        webWorker.onmessage = function(event) {
            if (event.data.error) {
                console.error(event.data.error);
                return;
            }
            callback(event.data);
        };

        webWorker.postMessage(this.frames);
    };

    return {
        /**
         * A more abstract-ish API.
         * @method
         * @memberof Whammy
         * @example
         * recorder = new Whammy().Video(0.8, 100);
         * @param {?number} speed - 0.8
         * @param {?number} quality - 100
         */
        Video: WhammyVideo
    };
})();

if (typeof MediaStreamRecorder !== 'undefined') {
    MediaStreamRecorder.Whammy = Whammy;
}

// Last time updated at Nov 18, 2014, 08:32:23

// Latest file can be found here: https://cdn.webrtc-experiment.com/ConcatenateBlobs.js

// Muaz Khan    - www.MuazKhan.com
// MIT License  - www.WebRTC-Experiment.com/licence
// Source Code  - https://github.com/muaz-khan/ConcatenateBlobs
// Demo         - https://www.WebRTC-Experiment.com/ConcatenateBlobs/

// ___________________
// ConcatenateBlobs.js

// Simply pass array of blobs.
// This javascript library will concatenate all blobs in single "Blob" object.

(function() {
    window.ConcatenateBlobs = function(blobs, type, callback) {
        var buffers = [];

        var index = 0;

        function readAsArrayBuffer() {
            if (!blobs[index]) {
                return concatenateBuffers();
            }
            var reader = new FileReader();
            reader.onload = function(event) {
                buffers.push(event.target.result);
                index++;
                readAsArrayBuffer();
            };
            reader.readAsArrayBuffer(blobs[index]);
        }

        readAsArrayBuffer();

        function concatenateBuffers() {
            var byteLength = 0;
            buffers.forEach(function(buffer) {
                byteLength += buffer.byteLength;
            });

            var tmp = new Uint16Array(byteLength);
            var lastOffset = 0;
            buffers.forEach(function(buffer) {
                // BYTES_PER_ELEMENT == 2 for Uint16Array
                var reusableByteLength = buffer.byteLength;
                if (reusableByteLength % 2 != 0) {
                    buffer = buffer.slice(0, reusableByteLength - 1);
                }
                tmp.set(new Uint16Array(buffer), lastOffset);
                lastOffset += reusableByteLength;
            });

            var blob = new Blob([tmp.buffer], {
                type: type
            });

            callback(blob);
        }
    };
})();

// https://github.com/streamproc/MediaStreamRecorder/issues/42
{
    module.exports = MediaStreamRecorder;
}
});

var audioCtx = new (window.AudioContext || window.webkitAudioContext)();
var analyser = audioCtx.createAnalyser();

var AudioContext = {
  getAudioContext: function getAudioContext() {
    return audioCtx;
  },
  getAnalyser: function getAnalyser() {
    return analyser;
  },
  resetAnalyser: function resetAnalyser() {
    analyser = audioCtx.createAnalyser();
  },
  decodeAudioData: function decodeAudioData() {
    audioCtx.decodeAudioData(audioData).then(function (decodedData) {
      // use the decoded data here
    });
  }
};

var asyncToGenerator = function (fn) {
  return function () {
    var gen = fn.apply(this, arguments);
    return new Promise(function (resolve, reject) {
      function step(key, arg) {
        try {
          var info = gen[key](arg);
          var value = info.value;
        } catch (error) {
          reject(error);
          return;
        }

        if (info.done) {
          resolve(value);
        } else {
          return Promise.resolve(value).then(function (value) {
            step("next", value);
          }, function (err) {
            step("throw", err);
          });
        }
      }

      return step("next");
    });
  };
};

var classCallCheck = function (instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError("Cannot call a class as a function");
  }
};

var createClass = function () {
  function defineProperties(target, props) {
    for (var i = 0; i < props.length; i++) {
      var descriptor = props[i];
      descriptor.enumerable = descriptor.enumerable || false;
      descriptor.configurable = true;
      if ("value" in descriptor) descriptor.writable = true;
      Object.defineProperty(target, descriptor.key, descriptor);
    }
  }

  return function (Constructor, protoProps, staticProps) {
    if (protoProps) defineProperties(Constructor.prototype, protoProps);
    if (staticProps) defineProperties(Constructor, staticProps);
    return Constructor;
  };
}();

var _extends = Object.assign || function (target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i];

    for (var key in source) {
      if (Object.prototype.hasOwnProperty.call(source, key)) {
        target[key] = source[key];
      }
    }
  }

  return target;
};

var inherits = function (subClass, superClass) {
  if (typeof superClass !== "function" && superClass !== null) {
    throw new TypeError("Super expression must either be null or a function, not " + typeof superClass);
  }

  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: {
      value: subClass,
      enumerable: false,
      writable: true,
      configurable: true
    }
  });
  if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass;
};

var possibleConstructorReturn = function (self, call) {
  if (!self) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }

  return call && (typeof call === "object" || typeof call === "function") ? call : self;
};

/* eslint-disable */

function pad2(n) {
  n |= 0;
  return n < 10 ? "0" + n : "" + Math.min(n, 99);
}

function inlineWorker() {
  // TODO(Kagami): Cache compiled module in IndexedDB? It works in FF
  // and Edge, see: https://github.com/mdn/webassembly-examples/issues/4
  // Though gzipped WASM module currently weights ~70kb so it should be
  // perfectly cached by the browser itself.
  function fetchAndInstantiate(url, imports) {
    if (!WebAssembly.instantiateStreaming) return fetchAndInstantiateFallback(url, imports);
    var req = fetch(url, { credentials: "same-origin" });
    return WebAssembly.instantiateStreaming(req, imports).catch(function (err) {
      // https://github.com/Kagami/vmsg/issues/11
      if (err.message && err.message.indexOf("Argument 0 must be provided and must be a Response") > 0) {
        return fetchAndInstantiateFallback(url, imports);
      } else {
        throw err;
      }
    });
  }

  function fetchAndInstantiateFallback(url, imports) {
    return new Promise(function (resolve, reject) {
      var req = new XMLHttpRequest();
      req.open("GET", url);
      req.responseType = "arraybuffer";
      req.onload = function () {
        resolve(WebAssembly.instantiate(req.response, imports));
      };
      req.onerror = reject;
      req.send();
    });
  }

  // Must be in sync with emcc settings!
  var TOTAL_STACK = 5 * 1024 * 1024;
  var TOTAL_MEMORY = 16 * 1024 * 1024;
  var WASM_PAGE_SIZE = 64 * 1024;
  var memory = null;
  var dynamicTop = TOTAL_STACK;
  // TODO(Kagami): Grow memory?
  function sbrk(increment) {
    var oldDynamicTop = dynamicTop;
    dynamicTop += increment;
    return oldDynamicTop;
  }
  // TODO(Kagami): LAME calls exit(-1) on internal error. Would be nice
  // to provide custom DEBUGF/ERRORF for easier debugging. Currenty
  // those functions do nothing.
  function exit(status) {
    postMessage({ type: "internal-error", data: status });
  }

  var FFI = null;
  var ref = null;
  var pcm_l = null;
  function vmsg_init(rate) {
    ref = FFI.vmsg_init(rate);
    if (!ref) return false;
    var pcm_l_ref = new Uint32Array(memory.buffer, ref, 1)[0];
    pcm_l = new Float32Array(memory.buffer, pcm_l_ref);
    return true;
  }
  function vmsg_encode(data) {
    pcm_l.set(data);
    return FFI.vmsg_encode(ref, data.length) >= 0;
  }
  function vmsg_flush() {
    if (FFI.vmsg_flush(ref) < 0) return null;
    var mp3_ref = new Uint32Array(memory.buffer, ref + 4, 1)[0];
    var size = new Uint32Array(memory.buffer, ref + 8, 1)[0];
    var mp3 = new Uint8Array(memory.buffer, mp3_ref, size);
    var blob = new Blob([mp3], { type: "audio/mpeg" });
    FFI.vmsg_free(ref);
    ref = null;
    pcm_l = null;
    return blob;
  }

  // https://github.com/brion/min-wasm-fail
  function testSafariWebAssemblyBug() {
    var bin = new Uint8Array([0, 97, 115, 109, 1, 0, 0, 0, 1, 6, 1, 96, 1, 127, 1, 127, 3, 2, 1, 0, 5, 3, 1, 0, 1, 7, 8, 1, 4, 116, 101, 115, 116, 0, 0, 10, 16, 1, 14, 0, 32, 0, 65, 1, 54, 2, 0, 32, 0, 40, 2, 0, 11]);
    var mod = new WebAssembly.Module(bin);
    var inst = new WebAssembly.Instance(mod, {});
    // test storing to and loading from a non-zero location via a parameter.
    // Safari on iOS 11.2.5 returns 0 unexpectedly at non-zero locations
    return inst.exports.test(4) !== 0;
  }

  onmessage = function onmessage(e) {
    var msg = e.data;
    switch (msg.type) {
      case "init":
        var _msg$data = msg.data,
            wasmURL = _msg$data.wasmURL,
            shimURL = _msg$data.shimURL;

        Promise.resolve().then(function () {
          if (self.WebAssembly && !testSafariWebAssemblyBug()) {
            delete self.WebAssembly;
          }
          if (!self.WebAssembly) {
            importScripts(shimURL);
          }
          memory = new WebAssembly.Memory({
            initial: TOTAL_MEMORY / WASM_PAGE_SIZE,
            maximum: TOTAL_MEMORY / WASM_PAGE_SIZE
          });
          return {
            memory: memory,
            pow: Math.pow,
            exit: exit,
            powf: Math.pow,
            exp: Math.exp,
            sqrtf: Math.sqrt,
            cos: Math.cos,
            log: Math.log,
            sin: Math.sin,
            sbrk: sbrk
          };
        }).then(function (Runtime) {
          return fetchAndInstantiate(wasmURL, { env: Runtime });
        }).then(function (wasm) {
          FFI = wasm.instance.exports;
          postMessage({ type: "init", data: null });
        }).catch(function (err) {
          postMessage({ type: "init-error", data: err.toString() });
        });
        break;
      case "start":
        if (!vmsg_init(msg.data)) return postMessage({ type: "error", data: "vmsg_init" });
        break;
      case "data":
        if (!vmsg_encode(msg.data)) return postMessage({ type: "error", data: "vmsg_encode" });
        break;
      case "stop":
        var blob = vmsg_flush();
        if (!blob) return postMessage({ type: "error", data: "vmsg_flush" });
        postMessage({ type: "stop", data: blob });
        break;
    }
  };
}

var Recorder = function () {
  function Recorder() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
    var onStop = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : null;

    var _this = this;

    var draftAudioBuffer = arguments[2];
    var isPaused = arguments[3];
    classCallCheck(this, Recorder);

    this.togglePause = function () {
      _this.isPaused = !_this.isPaused;
    };

    this.setPause = function (value) {
      _this.isPaused = value;
    };

    // Can't use relative URL in blob worker, see:
    // https://stackoverflow.com/a/22582695
    this.wasmURL = new URL(opts.wasmURL || "/static/js/vmsg.wasm", location).href;
    this.shimURL = new URL(opts.shimURL || "/static/js/wasm-polyfill.js", location).href;
    this.onStop = onStop;
    this.pitch = opts.pitch || 0;
    this.stream = null;
    this.audioCtx = null;
    this.gainNode = null;
    this.pitchFX = null;
    this.encNode = null;
    this.worker = null;
    this.workerURL = null;
    this.blob = null;
    this.blobURL = null;
    this.resolve = null;
    this.reject = null;
    this.isPaused = isPaused;
    this.draftAudioBuffer = draftAudioBuffer;
    Object.seal(this);
  }

  createClass(Recorder, [{
    key: "close",
    value: function close() {
      if (this.encNode) this.encNode.disconnect();
      if (this.encNode) this.encNode.onaudioprocess = null;
      if (this.stream) this.stopTracks();
      if (this.audioCtx) this.audioCtx.close();
      if (this.worker) this.worker.terminate();
      if (this.workerURL) URL.revokeObjectURL(this.workerURL);
      if (this.blobURL) URL.revokeObjectURL(this.blobURL);
    }

    // Without pitch shift:
    //   [sourceNode] -> [gainNode] -> [encNode] -> [audioCtx.destination]
    //                                     |
    //                                     -> [worker]
    // With pitch shift:
    //   [sourceNode] -> [gainNode] -> [pitchFX] -> [encNode] -> [audioCtx.destination]
    //                                                  |
    //                                                  -> [worker]

  }, {
    key: "initAudio",
    value: function initAudio() {
      var _this2 = this;

      var getUserMedia = navigator.mediaDevices && navigator.mediaDevices.getUserMedia ? function (constraints) {
        return navigator.mediaDevices.getUserMedia(constraints);
      } : function (constraints) {
        var oldGetUserMedia = navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
        if (!oldGetUserMedia) {
          return Promise.reject(new Error("getUserMedia is not implemented in this browser"));
        }
        return new Promise(function (resolve, reject) {
          oldGetUserMedia.call(navigator, constraints, resolve, reject);
        });
      };

      return getUserMedia({ audio: true }).then(function (stream) {
        _this2.stream = stream;
        var audioCtx = _this2.audioCtx = new (window.AudioContext || window.webkitAudioContext)();

        var sourceNode = audioCtx.createMediaStreamSource(stream);
        var gainNode = _this2.gainNode = (audioCtx.createGain || audioCtx.createGainNode).call(audioCtx);
        gainNode.gain.value = 1;
        sourceNode.connect(gainNode);

        var pitchFX = _this2.pitchFX = new Jungle(audioCtx);
        pitchFX.setPitchOffset(_this2.pitch);

        var encNode = _this2.encNode = (audioCtx.createScriptProcessor || audioCtx.createJavaScriptNode).call(audioCtx, 0, 1, 1);
        pitchFX.output.connect(encNode);

        gainNode.connect(_this2.pitch === 0 ? encNode : pitchFX.input);
      });
    }
  }, {
    key: "initWorker",
    value: function initWorker() {
      var _this3 = this;

      if (!this.stream) throw new Error("missing audio initialization");
      // https://stackoverflow.com/a/19201292
      var blob = new Blob(["(", inlineWorker.toString(), ")()"], {
        type: "application/javascript"
      });
      var workerURL = this.workerURL = URL.createObjectURL(blob);
      var worker = this.worker = new Worker(workerURL);
      var wasmURL = this.wasmURL,
          shimURL = this.shimURL;

      worker.postMessage({ type: "init", data: { wasmURL: wasmURL, shimURL: shimURL } });
      return new Promise(function (resolve, reject) {
        worker.onmessage = function (e) {
          var msg = e.data;
          switch (msg.type) {
            case "init":
              resolve();
              break;
            case "init-error":
              reject(new Error(msg.data));
              break;
            // TODO(Kagami): Error handling.
            case "error":
            case "internal-error":
              console.error("Worker error:", msg.data);
              if (_this3.reject) _this3.reject(msg.data);
              break;
            case "stop":
              _this3.blob = msg.data;
              _this3.blobURL = URL.createObjectURL(msg.data);
              if (_this3.onStop) _this3.onStop();
              if (_this3.resolve) _this3.resolve(_this3.blob);
              break;
          }
        };
      });
    }
  }, {
    key: "init",
    value: function init() {
      return this.initAudio().then(this.initWorker.bind(this));
    }
  }, {
    key: "startRecording",
    value: function startRecording() {
      var _this4 = this;

      if (!this.stream) throw new Error("missing audio initialization");
      if (!this.worker) throw new Error("missing worker initialization");
      this.blob = null;
      if (this.blobURL) URL.revokeObjectURL(this.blobURL);
      this.blobURL = null;
      this.resolve = null;
      this.reject = null;
      this.worker.postMessage({ type: "start", data: this.audioCtx.sampleRate });
      if (this.draftAudioBuffer) {
        var samples = this.draftAudioBuffer.getChannelData(0);
        var chunkSize = 256;
        for (var i = 0; i < samples.length; i += chunkSize) {
          var subSample = samples.slice(i, i + chunkSize);
          this.worker.postMessage({ type: "data", data: subSample });
        }
        this.draftAudioBuffer = null;
      }
      this.encNode.onaudioprocess = function (e) {
        if (_this4.isPaused) {
          return false;
        }
        var samples = e.inputBuffer.getChannelData(0);
        _this4.worker.postMessage({ type: "data", data: samples });
      };
      this.encNode.connect(this.audioCtx.destination);
    }
  }, {
    key: "stopRecording",
    value: function stopRecording() {
      var _this5 = this;

      if (!this.stream) throw new Error("missing audio initialization");
      if (!this.worker) throw new Error("missing worker initialization");
      this.encNode.disconnect();
      this.encNode.onaudioprocess = null;
      this.isPaused = false;
      this.stopTracks();
      this.worker.postMessage({ type: "stop", data: null });
      return new Promise(function (resolve, reject) {
        _this5.resolve = resolve;
        _this5.reject = reject;
      });
    }
  }, {
    key: "stopTracks",
    value: function stopTracks() {
      // Might be missed in Safari and old FF/Chrome per MDN.
      if (this.stream && this.stream.getTracks) {
        // Hide browser's recording indicator.
        this.stream.getTracks().forEach(function (track) {
          return track.stop();
        });
      }
    }
  }]);
  return Recorder;
}();

var Form = function () {
  function Form() {
    var opts = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};

    var _this6 = this;

    var resolve = arguments[1];
    var reject = arguments[2];
    classCallCheck(this, Form);

    this.recorder = new Recorder(opts, this.onStop.bind(this));
    this.resolve = resolve;
    this.reject = reject;
    this.backdrop = null;
    this.popup = null;
    this.recordBtn = null;
    this.stopBtn = null;
    this.timer = null;
    this.audio = null;
    this.saveBtn = null;
    this.tid = 0;
    this.start = 0;
    Object.seal(this);

    this.recorder.initAudio().then(function () {
      return _this6.drawInit();
    }).then(function () {
      return _this6.recorder.initWorker();
    }).then(function () {
      return _this6.drawAll();
    }).catch(function (err) {
      return _this6.drawError(err);
    });
  }

  createClass(Form, [{
    key: "drawInit",
    value: function drawInit() {
      var _this7 = this;

      if (this.backdrop) return;
      var backdrop = this.backdrop = document.createElement("div");
      backdrop.className = "vmsg-backdrop";
      backdrop.addEventListener("click", function () {
        return _this7.close(null);
      });

      var popup = this.popup = document.createElement("div");
      popup.className = "vmsg-popup";
      popup.addEventListener("click", function (e) {
        return e.stopPropagation();
      });

      var progress = document.createElement("div");
      progress.className = "vmsg-progress";
      for (var i = 0; i < 3; i++) {
        var progressDot = document.createElement("div");
        progressDot.className = "vmsg-progress-dot";
        progress.appendChild(progressDot);
      }
      popup.appendChild(progress);

      backdrop.appendChild(popup);
      document.body.appendChild(backdrop);
    }
  }, {
    key: "drawTime",
    value: function drawTime(msecs) {
      var secs = Math.round(msecs / 1000);
      this.timer.textContent = pad2(secs / 60) + ":" + pad2(secs % 60);
    }
  }, {
    key: "drawAll",
    value: function drawAll() {
      var _this8 = this;

      this.drawInit();
      this.clearAll();

      var recordRow = document.createElement("div");
      recordRow.className = "vmsg-record-row";
      this.popup.appendChild(recordRow);

      var recordBtn = this.recordBtn = document.createElement("button");
      recordBtn.className = "vmsg-button vmsg-record-button";
      recordBtn.textContent = "●";
      recordBtn.addEventListener("click", function () {
        return _this8.startRecording();
      });
      recordRow.appendChild(recordBtn);

      var stopBtn = this.stopBtn = document.createElement("button");
      stopBtn.className = "vmsg-button vmsg-stop-button";
      stopBtn.style.display = "none";
      stopBtn.textContent = "■";
      stopBtn.addEventListener("click", function () {
        return _this8.stopRecording();
      });
      recordRow.appendChild(stopBtn);

      var audio = this.audio = new Audio();
      audio.autoplay = true;

      var timer = this.timer = document.createElement("span");
      timer.className = "vmsg-timer";
      timer.addEventListener("click", function () {
        if (audio.paused) {
          if (_this8.recorder.blobURL) {
            audio.src = _this8.recorder.blobURL;
          }
        } else {
          audio.pause();
        }
      });
      this.drawTime(0);
      recordRow.appendChild(timer);

      var saveBtn = this.saveBtn = document.createElement("button");
      saveBtn.className = "vmsg-button vmsg-save-button";
      saveBtn.textContent = "✓";
      saveBtn.disabled = true;
      saveBtn.addEventListener("click", function () {
        return _this8.close(_this8.recorder.blob);
      });
      recordRow.appendChild(saveBtn);

      var gainWrapper = document.createElement("div");
      gainWrapper.className = "vmsg-slider-wrapper vmsg-gain-slider-wrapper";
      var gainSlider = document.createElement("input");
      gainSlider.className = "vmsg-slider vmsg-gain-slider";
      gainSlider.setAttribute("type", "range");
      gainSlider.min = 0;
      gainSlider.max = 2;
      gainSlider.step = 0.2;
      gainSlider.value = 1;
      gainSlider.onchange = function () {
        var gain = +gainSlider.value;
        _this8.recorder.gainNode.gain.value = gain;
      };
      gainWrapper.appendChild(gainSlider);
      this.popup.appendChild(gainWrapper);

      var pitchWrapper = document.createElement("div");
      pitchWrapper.className = "vmsg-slider-wrapper vmsg-pitch-slider-wrapper";
      var pitchSlider = document.createElement("input");
      pitchSlider.className = "vmsg-slider vmsg-pitch-slider";
      pitchSlider.setAttribute("type", "range");
      pitchSlider.min = -1;
      pitchSlider.max = 1;
      pitchSlider.step = 0.2;
      pitchSlider.value = this.recorder.pitch;
      pitchSlider.onchange = function () {
        var pitch = +pitchSlider.value;
        _this8.recorder.pitchFX.setPitchOffset(pitch);
        _this8.recorder.gainNode.disconnect();
        _this8.recorder.gainNode.connect(pitch === 0 ? _this8.recorder.encNode : _this8.recorder.pitchFX.input);
      };
      pitchWrapper.appendChild(pitchSlider);
      this.popup.appendChild(pitchWrapper);
    }
  }, {
    key: "drawError",
    value: function drawError(err) {
      console.error(err);
      this.drawInit();
      this.clearAll();
      var error = document.createElement("div");
      error.className = "vmsg-error";
      error.textContent = err.toString();
      this.popup.appendChild(error);
    }
  }, {
    key: "clearAll",
    value: function clearAll() {
      if (!this.popup) return;
      this.popup.innerHTML = "";
    }
  }, {
    key: "close",
    value: function close(blob) {
      if (this.audio) this.audio.pause();
      if (this.tid) clearTimeout(this.tid);
      this.recorder.close();
      this.backdrop.remove();
      if (blob) {
        this.resolve(blob);
      } else {
        this.reject(new Error("No record made"));
      }
    }
  }, {
    key: "onStop",
    value: function onStop() {
      this.recordBtn.style.display = "";
      this.stopBtn.style.display = "none";
      this.stopBtn.disabled = false;
      this.saveBtn.disabled = false;
    }
  }, {
    key: "startRecording",
    value: function startRecording() {
      this.audio.pause();
      this.start = Date.now();
      this.updateTime();
      this.recordBtn.style.display = "none";
      this.stopBtn.style.display = "";
      this.saveBtn.disabled = true;
      this.recorder.startRecording();
    }
  }, {
    key: "stopRecording",
    value: function stopRecording() {
      clearTimeout(this.tid);
      this.tid = 0;
      this.stopBtn.disabled = true;
      this.recorder.stopRecording();
    }
  }, {
    key: "updateTime",
    value: function updateTime() {
      var _this9 = this;

      // NOTE(Kagami): We can do this in `onaudioprocess` but that would
      // run too often and create unnecessary DOM updates.
      this.drawTime(Date.now() - this.start);
      this.tid = setTimeout(function () {
        return _this9.updateTime();
      }, 300);
    }
  }]);
  return Form;
}();

// Borrowed from and slightly modified:
// https://github.com/cwilso/Audio-Input-Effects/blob/master/js/jungle.js

// Copyright 2012, Google Inc.
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are
// met:
//
//     * Redistributions of source code must retain the above copyright
// notice, this list of conditions and the following disclaimer.
//     * Redistributions in binary form must reproduce the above
// copyright notice, this list of conditions and the following disclaimer
// in the documentation and/or other materials provided with the
// distribution.
//     * Neither the name of Google Inc. nor the names of its
// contributors may be used to endorse or promote products derived from
// this software without specific prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
// "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
// LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
// A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
// OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
// LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
// DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
// THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
// (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
// OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

var delayTime = 0.1;
var fadeTime = 0.05;
var bufferTime = 0.1;

function createFadeBuffer(context, activeTime, fadeTime) {
  var length1 = activeTime * context.sampleRate;
  var length2 = (activeTime - 2 * fadeTime) * context.sampleRate;
  var length = length1 + length2;
  var buffer = context.createBuffer(1, length, context.sampleRate);
  var p = buffer.getChannelData(0);

  var fadeLength = fadeTime * context.sampleRate;

  var fadeIndex1 = fadeLength;
  var fadeIndex2 = length1 - fadeLength;

  // 1st part of cycle
  for (var i = 0; i < length1; ++i) {
    var value;

    if (i < fadeIndex1) {
      value = Math.sqrt(i / fadeLength);
    } else if (i >= fadeIndex2) {
      value = Math.sqrt(1 - (i - fadeIndex2) / fadeLength);
    } else {
      value = 1;
    }

    p[i] = value;
  }

  // 2nd part
  for (var i = length1; i < length; ++i) {
    p[i] = 0;
  }

  return buffer;
}

function createDelayTimeBuffer(context, activeTime, fadeTime, shiftUp) {
  var length1 = activeTime * context.sampleRate;
  var length2 = (activeTime - 2 * fadeTime) * context.sampleRate;
  var length = length1 + length2;
  var buffer = context.createBuffer(1, length, context.sampleRate);
  var p = buffer.getChannelData(0);

  // 1st part of cycle
  for (var i = 0; i < length1; ++i) {
    if (shiftUp)
      // This line does shift-up transpose
      p[i] = (length1 - i) / length;
      // This line does shift-down transpose
    else p[i] = i / length1;
  }

  // 2nd part
  for (var i = length1; i < length; ++i) {
    p[i] = 0;
  }

  return buffer;
}

function Jungle(context) {
  this.context = context;
  // Create nodes for the input and output of this "module".
  var input = (context.createGain || context.createGainNode).call(context);
  var output = (context.createGain || context.createGainNode).call(context);
  this.input = input;
  this.output = output;

  // Delay modulation.
  var mod1 = context.createBufferSource();
  var mod2 = context.createBufferSource();
  var mod3 = context.createBufferSource();
  var mod4 = context.createBufferSource();
  this.shiftDownBuffer = createDelayTimeBuffer(context, bufferTime, fadeTime, false);
  this.shiftUpBuffer = createDelayTimeBuffer(context, bufferTime, fadeTime, true);
  mod1.buffer = this.shiftDownBuffer;
  mod2.buffer = this.shiftDownBuffer;
  mod3.buffer = this.shiftUpBuffer;
  mod4.buffer = this.shiftUpBuffer;
  mod1.loop = true;
  mod2.loop = true;
  mod3.loop = true;
  mod4.loop = true;

  // for switching between oct-up and oct-down
  var mod1Gain = (context.createGain || context.createGainNode).call(context);
  var mod2Gain = (context.createGain || context.createGainNode).call(context);
  var mod3Gain = (context.createGain || context.createGainNode).call(context);
  mod3Gain.gain.value = 0;
  var mod4Gain = (context.createGain || context.createGainNode).call(context);
  mod4Gain.gain.value = 0;

  mod1.connect(mod1Gain);
  mod2.connect(mod2Gain);
  mod3.connect(mod3Gain);
  mod4.connect(mod4Gain);

  // Delay amount for changing pitch.
  var modGain1 = (context.createGain || context.createGainNode).call(context);
  var modGain2 = (context.createGain || context.createGainNode).call(context);

  var delay1 = (context.createDelay || context.createDelayNode).call(context);
  var delay2 = (context.createDelay || context.createDelayNode).call(context);
  mod1Gain.connect(modGain1);
  mod2Gain.connect(modGain2);
  mod3Gain.connect(modGain1);
  mod4Gain.connect(modGain2);
  modGain1.connect(delay1.delayTime);
  modGain2.connect(delay2.delayTime);

  // Crossfading.
  var fade1 = context.createBufferSource();
  var fade2 = context.createBufferSource();
  var fadeBuffer = createFadeBuffer(context, bufferTime, fadeTime);
  fade1.buffer = fadeBuffer;
  fade2.buffer = fadeBuffer;
  fade1.loop = true;
  fade2.loop = true;

  var mix1 = (context.createGain || context.createGainNode).call(context);
  var mix2 = (context.createGain || context.createGainNode).call(context);
  mix1.gain.value = 0;
  mix2.gain.value = 0;

  fade1.connect(mix1.gain);
  fade2.connect(mix2.gain);

  // Connect processing graph.
  input.connect(delay1);
  input.connect(delay2);
  delay1.connect(mix1);
  delay2.connect(mix2);
  mix1.connect(output);
  mix2.connect(output);

  // Start
  var t = context.currentTime + 0.05;
  var t2 = t + bufferTime - fadeTime;
  mod1.start(t);
  mod2.start(t2);
  mod3.start(t);
  mod4.start(t2);
  fade1.start(t);
  fade2.start(t2);

  this.mod1 = mod1;
  this.mod2 = mod2;
  this.mod1Gain = mod1Gain;
  this.mod2Gain = mod2Gain;
  this.mod3Gain = mod3Gain;
  this.mod4Gain = mod4Gain;
  this.modGain1 = modGain1;
  this.modGain2 = modGain2;
  this.fade1 = fade1;
  this.fade2 = fade2;
  this.mix1 = mix1;
  this.mix2 = mix2;
  this.delay1 = delay1;
  this.delay2 = delay2;

  this.setDelay(delayTime);
}

Jungle.prototype.setDelay = function (delayTime) {
  this.modGain1.gain.setTargetAtTime(0.5 * delayTime, 0, 0.01);
  this.modGain2.gain.setTargetAtTime(0.5 * delayTime, 0, 0.01);
};

Jungle.prototype.setPitchOffset = function (mult) {
  if (mult > 0) {
    // pitch up
    this.mod1Gain.gain.value = 0;
    this.mod2Gain.gain.value = 0;
    this.mod3Gain.gain.value = 1;
    this.mod4Gain.gain.value = 1;
  } else {
    // pitch down
    this.mod1Gain.gain.value = 1;
    this.mod2Gain.gain.value = 1;
    this.mod3Gain.gain.value = 0;
    this.mod4Gain.gain.value = 0;
  }
  this.setDelay(delayTime * Math.abs(mult));
};

var wasmURL = "data:application/wasm;base64,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AFMNAUF/IQQgACACVCABIANTIAEgA1EbDQIgACAChSABIAOFhEIAUg8LQQAPC0F/IQQgACACViABIANVIAEgA1EbDQAgACAChSABIAOFhEIAUiEECyAECykAIABBGHQgAEEIdEGAgPwHcXIgAEEIdkGA/gNxIABBGHZyciAAIAEbC08AIABDAAAAAJe7RPyp8dJNYlA/orYiALtEUrgehetR6D+iEJEBRAAAAAAAACpAoiAAIACUu0QAAAAAACBMQKMQkQFEAAAAAAAADECioLYLEQAgABAMBEAgACABNgKcAQsLIAECfUEBQX9BACAAKgIAIgIgASoCACIDXRsgAiADXhsLXQEBfgJAAn4gA0HAAHFFBEAgA0UNAiACQcAAIANrrYYgASADrSIEiIQhASACIASIIQJCAAwBCyACIANBQGqtiCEBQgAhAkIACyABhCEBCyAAIAE3AwAgACACNwMIC+IDAQZ/AkAgACABRg0AAkACQAJAAkACQAJAAkACQAJAIAEgAmogAE0NACAAIAJqIgMgAU0NACABIABzQQNxIQQgACABTw0BIARFDQIgACEEIAJFDQkMCAsgACABIAIQCg8LIARFDQEMBAsgAEEDcUUNASAAIQMDQCACRQ0HIAMgAS0AADoAACABQQFqIQEgAkF/aiECIANBAWoiA0EDcQ0ADAMLAAsgA0EDcQRAIAJBf2ohAgNAIAJBf0YNByAAIAJqIgQgASACai0AADoAACACQX9qIQIgBEEDcQ0ACyACQQFqIQILIAJBBEkNAiACQXxqIQQDQCAAIARqIAEgBGooAgA2AgAgBEEDSyEDIARBfGohBCADDQALIAJBA3EiAg0DDAULIAAhAwsgAkEETwRAIAMgAkF8aiIGQXxxIgdBBGoiCGohBCABIQUDQCADIAUoAgA2AgAgBUEEaiEFIANBBGohAyACQXxqIgJBA0sNAAsgASAIaiEBIAYgB2siAg0DDAQLIAMhBCACDQIMAwsgAkUNAgsDQCAAIAJqQX9qIAEgAmpBf2otAAA6AAAgAkF/aiICDQAMAgsACwNAIAQgAS0AADoAACAEQQFqIQQgAUEBaiEBIAJBf2oiAg0ACwsgAAuEAQIDfwF+AkAgAEKAgICAEFoEQANAIAFBf2oiASAAQgqAIgVCdn4gAHynQTByOgAAIABC/////58BViED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IARqIAQ2AgACfwJAAn8CQCAEQf8BTQRAIARBA3YiAkEDdEHU7AVqIQBBrOwFKAIAIgRBASACdCICcUUNASAAQQhqIQQgACgCCAwCCyAEQQh2IgJFDQJBHyAEQf///wdLDQMaIARBDiACIAJBgP4/akEQdkEIcSIAdCICQYDgH2pBEHZBBHEiBSAAciACIAV0IgBBgIAPakEQdkECcSICcmsgACACdEEPdmoiAEEHanZBAXEgAEEBdHIMAwtBrOwFIAQgAnI2AgAgAEEIaiEEIAALIQIgBCAHNgIAIAIgBzYCDCAHIAA2AgwgByACNgIIDAILQQALIQAgByAANgIcIAdCADcCECAAQQJ0QdzuBWohAgJAAkBBASAAdCIFIApxBEAgBEEAQRkgAEEBdmsgAEEfRht0IQAgAigCACEFA0AgBSICKAIEQXhxIARGDQMgAEEddiEFIABBAXQhACACIAVBBHFqQRBqIgEoAgAiBQ0ACyABIAc2AgAMAQtBsOwFIAUgCnI2AgAgAiAHNgIACyAHIAI2AhggByAHNgIMIAcgBzYCCAwBCyACKAIIIgAgBzYCDCACIAc2AgggByACNgIMIAcgADYCCCAHQQA2AhgLIANBCGohAEEHCyEIA0ACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkACQAJAAkAC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F15BAXMNACADQQhqIBcgFiAXkyAQKAIAKgLgVpSSOAIACyADQQxqIQMgB0EDaiEHIApBAWohCgwACwALIAwL+wIBCn8gAQRAIAFBBHQiB0Hw8AVqKAIAIQYgBCACQQJ0aiEEIAdB+PAFaiENIAdB/PAFaiEOIAFBEEkhDAJAA0AgAiADTg0BIARBhBJqKAIAIQhBACEFAkACQAJAAn8CQAJAIARBgBJqKAIAIgkEQCAEKgIAQwAAAABdIQdB//8DIQEMAQtBACEBQQAhBwsgDA0AIAlBD08EQCAHIAlBAXRB4v8HakH+/wdxciEHQQ8hCSAGIQULQRAgCEEPSQ0BGiAHIAZ0IAhB8f8DakH//wNxciEHIAUgBmohBUEQIQtBDyEIDAILIAYLIQsgCEUNAQsgB0EBdCAEQQRqKgIAQwAAAABdciEHIAFBf2ohAQwBC0EAIQgLIAAgDSgCACALIAlsIAhqIghBAXRqLwEAIAEgDigCACAIai0AAGpBEHRBEHUiCBARIAAgByAFIAFrQf//A3EiARARIAogAWogCGohCiAEQQhqIQQgAkECaiECDAALAAsgCg8LQQALigsCBX8PfiMAQeAAayIFJAAgA0IRiCAEQi+GhCEPIAFCIIggAkIghoQhCyADQjGIIARC////////P4MiDEIPhoQhESAEIAKFQoCAgICAgICAgH+DIQogDEIRiCESIAJC////////P4MiDUIgiCETIARCMIinQf//AXEhBgJAAkACQCACQjCIp0H//wFxIghBf2pB/f8BTQRAIAZBf2pB/v8BSQ0BCyABUCACQv///////////wCDIhBCgICAgICAwP//AFQgEEKAgICAgIDA//8AURtFBEAgAkKAgICAgIAghCEKDAMLIANQIARC////////////AIMiDkKAgICAgIDA//8AVCAOQoCAgICAgMD//wBRG0UEQCAEQoCAgICAgCCEIQogAyEBDAMLAkACQCABIBBCgICAgICAwP//AIWEQgBRBEAgAyAOhFANASAEQoCAgICAgICAgH+DIAKFIQoMBQsgAyAOQoCAgICAgMD//wCFhEIAUg0BIAEgEIRQDQAgAkKAgICAgICAgIB/gyAEhSEKIAMhAQwEC0KAgICAgIDg//8AIQoMAgsgASAQhEIAUSADIA6EQgBRcg0BIBBC////////P1gEQCAFQdAAaiABIA0gASANIA1QIgcbeSAHQQZ0rXynIgdBcWoQE0EQIAdrIQcgBSkDUCIBQiCIIAVB2ABqKQMAIg1CIIaEIQsgDUIgiCETCyAOQv///////z9WDQAgBUHAAGogAyAMIAMgDCAMUCIJG3kgCUEGdK18pyIJQXFqEBNBECAJayAHaiEHIAUpA0AiA0IxiCAFQcgAaikDACICQg+GhCERIANCEYggAkIvhoQhDyACQhGIIRILIA9C/////w+DIgIgAUL/////D4MiBH4iDiADQg+GQoCA/v8PgyIBIAtC/////w+DIgN+fCIPQiCGIgwgASAEfnwiCyAMVK0gAiADfiIVIAEgDUL/////D4MiDH58IhAgEUL/////D4MiDSAEfnwiESAPQiCIIA8gDlStQiCGhHwiDiACIAx+IhYgASATQoCABIQiD358IhMgDSADfnwiFCASQv////8Hg0KAgICACIQiASAEfnwiEkIghnwiF3whBCAIIAZqIAdqQYGAf2ohBgJAIA0gDH4iGCACIA9+fCICIBhUrSACIAEgA358IgMgAlStfCADIBAgFVStIBEgEFStfHwiAiADVK18IAEgD358IAEgDH4iAyANIA9+fCIBIANUrUIghiABQiCIhHwgAiABQiCGfCIBIAJUrXwgASASQiCIIBMgFlStIBQgE1StfCASIBRUrXxCIIaEfCIDIAFUrXwgAyAOIBFUrSAXIA5UrXx8IgIgA1StfCIBQoCAgICAgMAAg1AEQCALQj+IIQMgAUIBhiACQj+IhCEBIARCP4ggAkIBhoQhAiALQgGGIQsgAyAEQgGGhCEEDAELIAZBAWohBgsgBkH//wFOBEAgCkKAgICAgIDA//8AhCEKDAELAn4gBq1CMIYgAUL///////8/g4QgBkEASg0AGkEBIAZrIgZB/wBLDQEgBUEgaiALIAQgBhAfIAVBEGogAiABQYABIAZrIggQEyAFQTBqIAsgBCAIEBMgBSACIAEgBhAfIAUpAxAgBSkDIIQgBSkDMCAFQThqKQMAhEIAUq2EIQsgBUEYaikDACAFQShqKQMAhCEEIAUpAwAhAiAFQQhqKQMACyAKhCEKIAtQIARCf1UgBEKAgICAgICAgIB/URtFBEAgCiACQgF8IgEgAlStfCEKDAILIAsgBEKAgICAgICAgIB/hYRCAFEEQCAKIAIgAkIBg3wiASACVK18IQoMAgsgAiEBDAELQgAhAQsgACABNwMAIAAgCjcDCCAFQeAAaiQAC+QJAgR/BH4jAEHwAGsiByQAIARC////////////AIMhCgJAAkAgAUJ/fCIJQn9RIAJC////////////AIMiCyAJIAFUrXxCf3wiCUL///////+///8AViAJQv///////7///wBRG0UEQCADQn98IglCf1IgCiAJIANUrXxCf3wiCUL///////+///8AVCAJQv///////7///wBRGw0BCyABUCALQoCAgICAgMD//wBUIAtCgICAgICAwP//AFEbRQRAIAJCgICAgICAIIQhBCABIQMMAgsgA1AgCkKAgICAgIDA//8AVCAKQoCAgICAgMD//wBRG0UEQCAEQoCAgICAgCCEIQQMAgsgASALQoCAgICAgMD//wCFhEIAUQRAQoCAgICAgOD//wAgAiADIAGFIAQgAoVCgICAgICAgICAf4WEUCIFGyEEQgAgASAFGyEDDAILIAMgCkKAgICAgIDA//8AhYRQDQEgASALhEIAUgRAIAMgCoRQRQ0BIAEhAyACIQQMAgsgAyAKhEIAUg0BIAMgAYMhAyAEIAKDIQQMAQsgAyABIAMgAVYgCiALViAKIAtRGyIGGyEKIAQgAiAGGyILQv///////z+DIQkgAiAEIAYbIgJCMIinQf//AXEhCCALQjCIp0H//wFxIgVFBEAgB0HgAGogCiAJIAogCSAJUCIFG3kgBUEGdK18pyIFQXFqEBNBECAFayEFIAdB6ABqKQMAIQkgBykDYCEKCyABIAMgBhshAyACQv///////z+DIQEgCEUEQCAHQdAAaiADIAEgAyABIAFQIgYbeSAGQQZ0rXynIgZBcWoQE0EQIAZrIQggB0HYAGopAwAhASAHKQNQIQMLIAFCA4YgA0I9iIRCgICAgICAgASEIQQgCUIDhiAKQj2IhCEBIAsgAoUhCQJ+IANCA4YiAyAFIAhrIgZFDQAaIAZB/wBNBEAgB0HAAGogAyAEQYABIAZrEBMgB0EwaiADIAQgBhAfIAdBOGopAwAhBCAHKQMwIAcpA0AgB0HIAGopAwCEQgBSrYQMAQtCACEEQgELIQMgAUKAgICAgICABIQhDCAKQgOGIQICQAJAIAlCf1UEQCAEIAx8IAMgAnwiASADVK18IgNCgICAgICAgAiDUA0BIAFCAYggA0I/hoQgAUIBg4QhASAFQQFqIQUgA0IBiCEDDAELIAIgA30iASAMIAR9IAIgA1StfSIDhFANASADQv////////8DVg0AIAdBIGogASADIAEgAyADUCIGG3kgBkEGdK18p0F0aiIGEBMgBSAGayEFIAdBKGopAwAhAyAHKQMgIQELIAtCgICAgICAgICAf4MhBCAFQf//AU4EQCAEQoCAgICAgMD//wCEIQRCACEDDAILQQAhBgJAIAVBAEoEQCAFIQYMAQsgB0EQaiABIANBgAFBASAFayIFaxATIAcgASADIAUQHyAHKQMAIAcpAxAgB0EYaikDAIRCAFKthCEBIAdBCGopAwAhAwsgA0IDiEL///////8/gyAEhCAGrUIwhoQgAUIDiCADQj2GhCIEIAGnQQdxIgVBBEutfCIDIARUrXwgA0IBg0IAIAVBBEYbIgEgA3wiAyABVK18IQQMAQtCACEDQgAhBAsgACADNwMAIAAgBDcDCCAHQfAAaiQACzQAQwAAIEEgACoCtAEgACABED0gACoC0AEiAYxDAADIwiABQwAAAABeG5KSQ83MzD2UEAILWwECfwJ/IABBiJYFaigCACIBBEAgAEEUaigCACICQQZ0IAFBAnRqQYDGAGoMAQsgACgCFCECIABB/ABqCyEBIAIgAEHEAGooAgAgASgCACAAQZCWBWooAgAQXAtaAQN/IAIhBCAAIQUCQANAIARFDQEgBEF/aiEEIAUCfyABBEAgAUEBaiABIAEtAAAiBhshASAGIAMgBhsMAQtBACEBIAMLOgAAIAVBAWohBQwACwALIAAgAmoLZQEEfyACBEAgAS8BACEFIAIhBCAAIQMCQANAIARFDQEgAyAFIAEvAQAQnwEiBjoAACADQQFqIAZBCHY6AAAgA0ECaiEDIAFBAmohASAEQX9qIQQMAAsACyAAIAJBAXRqIQALIAALEwAgACABOgABIAAgAUEIdjoAAAuGAQEBfUMepr1CIAMgA0MAAIA/XRshBCABEBm7RH5YxyQYFQhAorYgApMhAUMAAAAAIQMgACAAlCIAQwjlPB5eQQFzRQRAIAAQGbtEpuQ9ZhQRoT+iRAAAAAAAAPA/oLYhAwtDAAAgQSACQxKetEKSIASTIAEgA0MAAAAA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QYxuaioCAEMAAAAAXUEBcw0AIAJBAXIhAgsgACACIAcoAgAgA0EBdGovAQBqIAYoAgAgA2oiAi0AABARIAFBEGohASAEQX9qIQQgBSACLQAAaiEFDAALAAsgBQuIAQEEfyAAQfSmAWoiAiABKALYJSIFIAEoAtwlakECdGpBCGooAgAhAyAAIAEoArwlQQAgASgCpCUiBCACIAVBAnRqQQRqKAIAIgIgAiAEShsiAiABECggACABQcAlaigCACACIAQgAyADIARKGyIDIAEQKGogACABQcQlaigCACADIAQgARAoaguLAwMDfwF+AnwjAEEQayICJAACfAJAAkAgAL0iBEIgiKdB/////wdxIgFBgOC/hARPBEAgBEIAUyABQYCAwIQESXINASAARAAAAAAAAOB/ogwDCyABQf//v+QDSw0BIABEAAAAAAAA8D+gDAILRAAAAAAAAPC/IACjIAFBgIDA/wdPDQEaIARCf1UNACAARAAAAAAAzJDAZUUEQCAARAAAAAAAADDDoEQAAAAAAAAwQ6AgAGENASACRAAAAAAAAKC2IACjtjgCDAwBCyACRAAAAAAAAKC2IACjtjgCDEQAAAAAAAAAAAwBCyAARAAAAAAAALhCoCIFvadBgAFqIgFBBHRB8B9xIgNBkKcBaisDACIGIAYgACAFRAAAAAAAALjCoKEgA0EIckGQpwFqKwMAoSIAoiAAIAAgACAARHRchwOA2FU/okQABPeIq7KDP6CiRKagBNcIa6w/oKJEdcWC/72/zj+gokTvOfr+Qi7mP6CioCABQYB+cUGAAm0Q3wELIQAgAkEQaiQAIAALNAECfyAABEAgAEEBcUUEQANAIAFBAWohASAAQQJxIQIgAEEBdiEAIAJFDQALCyABDwtBIAt/AQN/IwBBgAJrIgMkAAJAIAFBAkgNACAAIAFBAnRqIAM2AgAgAyAAKAIAIgQoAAA2AgAgAUF/aiEBA0AgBCAAQQRqIgIoAgAoAAA2AAAgACAAKAIAQQRqNgIAIAFFDQEgAUF/aiEBIAIoAgAhBCACIQAMAAsACyADQYACaiQACycBAX8gACgCAEF/ahByIgEEQCABDwsgACgCBBByIgBBIGpBACAAGwtJAQJ/IAAgASgCvCVBACABKAKkJSICIABB3KcBaigCAEEDbCIDIAMgAkobIgIgARAoIAAg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DQELIAMgABClAgwBCyACEKABBEAgAyAAEKQCDAELIAMgABCjAgshAyAAKAIAIQAMAAsACyAGBEAgAyAGIAVB4J0FaigCACAFQeSdBWooAgAQogIhAwsgA0EAIAQgAWogA2sQCxogBA8LQQAPCyAECyIBAX8gAEH+/wNGBEAgASICQRh0IAJBCHRyQRB2IQELIAELCAAgABCoAkULcwEDfyAABEAgACgCABANIABBADYCAAJAIAFFDQADQCABIAJqIQMgAkEBaiIEIQIgAy0AAA0AC0EAIQIgBEEBRg0AIAAgBEEBEA8iAzYCACADRQ0AIAMgASAEQX9qIgIQCiAEakF/akEAOgAACyACDwtBAAt2AQF/AkAgAUUNACABLQAARQ0AAkADQCACQQNPDQEgAS0AAEUNASAAIAJqIAEgAmotAAA6AAAgAkEBaiECDAALAAsCQANAIAJBAksNASAAIAJqQSA6AAAgAkEBaiECDAALAAsPCyAAQecAOgACIABB5dwBOwAAC48BAQN/IABBeGohACABQXhqIQEgA0EQaiEFIANBDGohBgJAA0AgAkUNASABQQhqIAAqAgAgAyoCAJQgAEEEaiIEKgIAIANBCGoqAgCUkiAAQQhqKgIAIAUqAgCUkiABKgIAIANBBGoqAgCUIAFBBGoiASoCACAGKgIAlJKTOAIAIAJBf2ohAiAEIQAMAAsACwvYAwELfyABQVhqIQEgAEFYaiEAIANBwABqIQUgA0E8aiEGIANBOGohByADQTRqIQggA0EwaiEJIANBLGohCiADQcgAaiELIANBxABqIQwgA0HQAGohDSADQcwAaiEOAkADQCACRQ0BIAFBKGogACoCACADKgIAlCAAQQRqIgQqAgAgA0EEaioCAJSSIABBCGoqAgAgA0EIaioCAJSSIABBDGoqAgAgA0EMaioCAJSSIABBEGoqAgAgA0EQaioCAJQgAEEUaioCACADQRRqKgIAlJIgAEEYaioCACADQRhqKgIAlJIgAEEcaioCACADQRxqKgIAlJKSIABBIGoqAgAgA0EgaioCAJQgAEEkaioCACADQSRqKgIAlJKSIABBKGoqAgAgA0EoaioCAJSSIAEqAgAgCioCAJQgAUEEaiIAKgIAIAkqAgCUkiABQQhqKgIAIAgqAgCUIAFBDGoqAgAgByoCAJSSkiABQRBq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IAVBCGohBSAIQQRqIQgMAAsACyAHQYDkAGohByAJQYDkAGohCSANQYDkAGohDSAKQQFqIQoMAAsACyAAQayXBWpBgICA/AM2AgAgACAWEM0BCyAAQYyWBWoiCCAIKAIAQQFqNgIAIAAQzAEgDEGwH2okACAVC0QAIABBoLcCakEANgIAIABBoJcDakIANwMAIABBgIAJQQEQDzYCoAIgAEGsAmpC/////w83AgAgAEGkAmpCgIAJNwIAC0UBAn8CQCAAQawCaigCACIEQQBIDQBBfyEDIAQgAk4NACABIAAoAqACIARBAWoiAxAKGiAAQawCakL/////DzcCAAsgAwsDAAELbAIBfwJ+IwBBEGsiAiQAAn4gAQRAIAIgAa1CAEHRAEEAIAFnIgFraxATIAIpAwAhAyACQQhqKQMAQoCAgICAgMAAhUGegAEgAWutQjCGfAwBC0IACyEEIAAgAzcDACAAIAQ3AwggAkEQaiQAC4cBAgJ/An4jAEEQayIDJAACfiABBEAgAyABIAFBH3UiAmogAnMiAq1CAEHRAEEAIAJnIgJraxATIAMpAwAhBCADQQhqKQMAQoCAgICAgMAAhUGegAEgAmutQjCGfCABQYCAgIB4ca1CIIaEDAELQgALIQUgACAENwMAIAAgBTcDCCADQRBqJAALbQEDfyMAQRBrIgIkAAJAIAFCAFMNACABQjCIp0H//wFxIgRB//8ASQ0AQX8hAyAEQYGAf2pBH0sNACACIAAgAUL///////8/g0KAgICAgIDAAIRB74ABIARrEB8gAigCACEDCyACQRBqJAAgAwuMAQEDfyMAQRBrIgMkAAJ/QQAgAUIwiKdB//8BcSIEQf//AEkNABogAUI+iKdBf3NBAnFBf2ohAkH/////B0GAgICAeCACQQFGGyAEQYGAf2pBIE8NABogAyAAIAFC////////P4NCgICAgICAwACEQe+AASAEaxAfIAIgAygCAGwLIQIgA0EQaiQAIAILjAICAn8EfiMAQRBrIgIkACABvSIFQoCAgICAgICAgH+DIQcCfiAFQv///////////wCDIgRCgICAgICAgHh8Qv/////////v/wBYBEAgBEI8hiEGIARCBIhCgICAgICAgIA8fAwBCyAEQoCAgICAgID4/wBaBEAgBUI8hiEGIAVCBIhCgICAgICAwP//AIQMAQsCfwJAIARQRQRAIARCgICAgBBaDQEgBadnQSBqDAILQgAMAgsgBEIgiKdnCyEDIAIgBEIAIANBMWoQEyACKQMAIQYgAkEIaikDAEKAgICAgIDAAIVBjPgAIANrrUIwhoQLIQQgACAGNwMAIAAgBCAHhDcDCCACQRBqJAALYwAgAEIAUiABQv///////////wCDIgFCgICAgICAwP//AFYgAUKAgICAgIDA//8AURsgAkIAUiADQv///////////wCDIgFCgICAgICAwP//AFYgAUKAgICAgIDA//8AURtyC7ABAAJAAkACQCABQYAITgRAIABEAAAAAAAA4H+iIQAgAUH/D0gNASABQYJwaiIBQf8HIAFB/wdIGyEBIABEAAAAAAAA4H+iIQAMAwsgAUGBeEoNAiAARAAAAAAAABAAoiEAIAFBg3BKDQEgAUH8D2oiAUGCeCABQYJ4ShshASAARAAAAAAAABAAoiEADAILIAFBgXhqIQEMAQsgAUH+B2ohAQsgACABQf8Haq1CNIa/oguzAgIBfwN9AkACQAJ/IAC8IgFBgICABEkgAUF/THJFBEAgAUH////7B00EQEMAAAAAIQBBgX8gAUGAgID8A0cNAhoLIAAPCyABQf////8HcUUNASABQX9MDQIgAEMAAABMlLwhAUHofgsgAUGN9qsCaiIBQRd2arIiBEOAIJo+lCABQf///wNxQfOJ1PkDar5DAACAv5IiACAAIABDAAAAP5SUIgKTvEGAYHG+IgNDAGDePpQgACADkyACkyAAIABDAAAAQJKVIgAgAiAAIACUIgAgACAAlCIAQ+7pkT6UQ6qqKj+SlCAAIABDJp54PpRDE87MPpKUkpKUkiIAQwBg3j6UIARD2ydUNZQgACADkkPZ6gS4lJKSkpIPC0MAAIC/IAAgAJSVDwsgACAAk0MAAAAAlQszAQF/IAAoAhQiAyABIAIgACgCECADayIDIAMgAksbIgMQChogACAAKAIUIANqNgIUIAILWgEBfyAAIAAtAEoiAUF/aiABcjoASiAAKAIAIgFBCHFFBEAgAEIANwIEIAAgACgCLCIBNgIcIAAgATYCFCAAIAEgACgCMGo2AhBBAA8LIAAgAUEgcjYCAEF/C0QCAX8BfiABQv///////z+DIQMCfyABQjCIp0H//wFxIgJB//8BRwRA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oAJqJAALiQEBAn8jAEGAAWsiAyQAIANB4PUFQfwAEAoiAyAANgIUIAMgADYCLCADQX4gAGsiBEH/////ByAEQf////8HSRsiBDYCMCADIAAgBGoiADYCECADIAA2AhwgAyABIAIQ6gEgBARAIANBFGooAgAiACAAIANBEGooAgBGa0EAOgAACyADQYABaiQAC9MGARN/AkAgACgCFEEBRgRAIABBtCZqIQMgAEHMAGohDQNAIApBAkYNAkEAIQ4gAyEBAkADQCAOIA0oAgBODQEgACAKQYjSAGxqIA5BhClsaiIGQbgoaiELIAZB5CdqKAIAQQJ0IgRBoMgAaigCACEJIARB4McAaigCACEHQQAhBSABIQJBACEEAkADQCAEIAsoAgBODQEgAigCACIIQX9HBEAgACAIIAcQESAFIAdqIQULIAJBBGohAiAEQQFqIQQMAAsACyAGQbAoaiEHAkADQCAEIAcoAgBODQEgAigCACIIQX9HBEAgACAIIAkQESAFIAlqIQULIAJBBGohAiAEQQFqIQQMAAsACyAGQbQCaiEEIAUgDGoCfyAGQegnaigCAEECRgRAIAAgBBB1DAELIAAgBBBwC2ogACAEEG9qIQwgAUGEKWohASAOQQFqIQ4MAAsACyADQYjSAGohAyAKQQFqIQoMAAsACyAAQcwAaiETIABBtCZqIg4hEQNAIA8gEygCAE4NASAAIA9BhClsaiINQfgqaiEDIA1BtAJqIRICfyANQegnaigCAEECRgRAQQAhAUEAIQRBACEKAkADQCABQQRGDQEgDSABQQJ0IgJqQfwqaigCACIFQQNsIQYgECAKQQxsaiEIIAMoAgAgAmooAgBBA20hC0EAIQICQANAIAIgC04NASAAIA4gCGoiCSgCACIHQQAgB0EAShsgBRARIAAgCUEEaigCACIHQQAgB0EAShsgBRARIAAgCUEIaigCACIJQQAgCUEAShsgBRARIAhBDGohCCACQQFqIQIgBCAGaiEEDAALAAsgCiACaiEKIAFBAWohAQwACwALIAAgEhB1DAELQQAhC0EAIQRBACEGAkADQCALQQRGDQEgDSALQQJ0IgJqQfwqaigCACEIIBEgBkECdGohBSADKAIAIAJqKAIAIQdBACECAkADQCACIAdODQEgACAFKAIAIglBACAJQQBKGyAIEBEgBUEE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BQtBBiECDAQLQQUhAgwDC0EEIQIMAgtBAyECDAELQQIhAgsgACACNgKArwIgACABQRNqQRRtNgLorgIgAEGIrwJqQQBBgPcCEAsaIABB/K4CakEANgIAIABB9K4CakIANwIAIABCADcC7K4CQQEhAgsgAgt1AQF/IAAgARCyAkEBRgRAIAAgAEHclwFqNgKEmAEgACAAQShqNgJQIAAgAEH8AGo2AoBMIAAgAEGwmAFqNgK04wEgACAAQazMAGo2ArCXASAAIABB4OMBajYC5K4CIABBiKYFakEAQYD3AhALGkEBIQILIAILsgcCHX8RfSABQQF0IRkgACABQQN0aiEYQYDvACETQQQhAgNAIAJBAnQiCiACQQF0IgRqIRUgBCACQQxsIgVqIRQgBCACQQN0IgZqIRYgAkEEdCEBIAJBAXUhGiAAIQIDQCACIAZqIgMgAioCACIfIAIgCmoiByoCACIgkiIjIAMqAgAiISACIAVqIgMqAgAiIpIiJJM4AgAgAiAjICSSOAIAIAMgHyAgkyIfICEgIpMiIJM4AgAgByAfICCSOAIAIAIgFGoiAyoCACEfIAIgFmoiByACIARqIggqAgAiICACIBVqIgkqAgAiI5IiISAHKgIAu0TNO39mnqD2P6K2IiKTOAIAIAggISAikjgCACADICAgI5MiICAfu0TNO39mnqD2P6K2Ih+TOAIAIAkgICAfkjgCACACIAFqIgIgGEkNAAtBBCELIApBBGohDCABQXxqIQ0gCkF8aiEOIAVBBGohDyAGQQRyIRAgBkF8aiERIAVBfGohEiATKgIEIR8gEyoCACEgQQEhFwJAA0AgFyAaTg0BICAgHyAfkiIhlCEjQwAAgD8gHyAhlJMhISAMIQIgDyEDIBAhByALIQggESEJIA0hBCASIQUgDiEGA0AgACAGaiIVKgIAISIgACAHaiIUIAAgCGoiFioCACIkICEgACACaiIbKgIAIiWUICMgACAJaiIcKgIAIiaUkiIqkiInICAgFCoCACIrICEgACADaiIUKgIAIiiUICMgACAEaiIdKgIAIimUkiIskiItlCAfIAAgBWoiHioCACIuICMgKJQgISAplJMiKJMiKZSSIi+TOAIAIBYgJyAvkjgCACAdICIgIyAllCAhICaUkyIlkyImIB8gLZQgICAplJMiJ5M4AgAgHCAm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CAkJCgoKCwsMDAwNDQYHBwgJCQoKCgsLDAwNDQ0HCAgJCQoKCwsLDAwMDQ0NCAgJCQoKCwsLCwwMDA0NDQkJCQoKCgsLCwsMDA0NDQ4KCQoKCgsLCwsMDAwNDQ4OCgoKCwsLCwwMDAwMDQ0NDgoKCgsLCwsMDAwMDQ0ODg4KCgsLCwsMDAwNDQ0NDg4OCwsLCwwMDAwMDQ0NDQ4PDgsLCwsMDAwMDQ0NDQ4ODg8MDAsMDAwNDQ0NDQ0ODg8PDAwMDAwNDQ0NDg4ODg4PDw0NDQ0NDQ0NDg4ODg8PDg8NDQ0NDQ0NDg4ODg4PDw8PAQAFAA4ALABKAD8AbgBdAKwAlQCKAPIA4QDDAHgBEQADAAQADAAUACMAPgA1AC8AUwBLAEQAdwDJAGsAzwAJAA8ADQAXACYAQwA6AGcAWgChAEgAfwB1AG4A0QDOABAALQAVACcARQBAAHIAYwBXAJ4AjAD8ANQAxwCDAW0BGgBLACQARABBAHMAZQCzAKQAmwAIAfYA4gCLAX4BagEJAEIAHgA7ADgAZgC5AK0ACQGOAP0A6ACQAYQBegG9ARAAbwA2ADQAZAC4ALIAoACFAAEB9ADkANkAgQFuAcsCCgBiADAAWwBYAKUAnQCUAAUB+ACXAY0BdAF8AXkDdAMIAFUAVABRAJ8AnACPAAQB+QCrAZEBiAF/AdcCyQLEAgcAmgBMAEkAjQCDAAAB9QCqAZYBigGAAd8CZwHGAmABCwCLAIEAQwB9APcA6QDlANsAiQHnAuEC0AJ1A3IDtwEEAPMAeAB2AHMA4wDfAIwB6gLmAuAC0QLIAsIC3wC0AQYAygDgAN4A2gDYAIUBggF9AWwBeAO7AcMCuAG1AcAGBADrAtMA0gDQAHIBewHeAtMCygLHBnMDbQNsA4MNYQMCAHkBcQFmALsA1gLSAmYBxwLFAmIDxgZnA4INZgOyAQAADAAKAAcACwAKABEACwAJAA0ADAAKAAcABQADAAEAAwABBQcJCgoLCwwMDA0NDQ4KBAYICQoLCwsMDAwNDg0OCgcICQoLCwwMDQwNDQ0ODgsJCQoLCwwMDA0NDg4ODw8MCgoLCwwMDQ0NDg4ODw8PCwoKCwsMDQ0ODQ4ODw8PEAwLCwsMDQ0NDQ4ODg4PDxAMCwsMDA0NDQ4ODw8PDxERDAsMDA0NDQ4ODw8PDxAQEAwMDAwNDQ4ODw8PDxAPEA8NDA0MDQ4ODg4PEBAQEREQDA0NDQ0ODg8QEBAQEBAPEA0NDg4ODg8PDw8REBAQEBINDw4ODg8PEBAQEhERERMRDQ4PDQ4QEA8QEBESERMREA0KCgoLCwwMDA0NDQ0NDQ0KDwANAC4AUACSAAYB+ACyAaoBnQKNAokCbQIFAggEWAAOAAwAFQAmAEcAggB6ANgA0QDGAEcBWQE/ASkBFwEqAC8AFgApAEoARACAAHgA3QDPAMIAtgBUATsBJwEdAhIAUQAnAEsARgCGAH0AdADcAMwAvgCyAEUBNwElAQ8BEACTAEgARQCHAH8AdgBwANIAyAC8AGABQwEyAR0BHAIOAAcBQgCBAH4AdwByANYAygDAALQAVQE9AS0BGQEGAQwA+QB7AHkAdQBxANcAzgDDALkAWwFKATQBIwEQAQgCCgCzAXMAbwBtANMAywDEALsAYQFMATkBKgEbARMCfQERAKsB1ADQAM0AyQDBALoAsQCpAEABLwEeAQwBAgJ5ARAATwHHAMUAvwC9ALUArgBNAUEBMQEhARMBCQJ7AXMBCwCcArgAtwCzAK8AWAFLAToBMAEiARUBEgJ/AXUBbgEKAIwCWgGrAKgApAA+ATUBKwEfARQBBwEBAncBcAFqAQYAiAJCATwBOAEzAS4BJAEcAQ0BBQEAAngBcgFsAWcBBABsAiwBKAEmASABGgERAQoBAwJ8AXYBcQFtAWkBZQECAAkEGAEWARIBCwEIAQMBfgF6AXQBbwFrAWgBZgFkAQAAKwAUABMAEQAPAA0ACwAJAAcABgAEAAcABQADAAEAAwAEBQcICQoKCwsMDAwMDA0KBQYHCAkKCgsLCwwMDAwMCgcHCAkJCgoLCwsLDAwMDQkICAkJCgoKCwsLCwwMDAwJCQkJCgoKCgsLCwwMDAwNCQoJCgoKCgsLCwsMDAwMDAkKCgoKCgsLCwsMDAwMDA0JCwoKCgsLCwsMDAwMDA0NCgsLCwsLCwsLCwwMDAwNDQoLCwsLCwsLDAwMDAwNDQ0KDAsLCwsMDAwMDAwNDQ0NCgwMCwsLDAwMDAwMDQ0NDQoMDAwMDAwMDAwMDQ0NDQ0KDAwMDAwMDAwNDQ0NDQ0NCg0MDAwMDAwNDQ0NDQ0NDQoJCQkJCQkJCQkJCQoKCgoGAQAKAAgAFAAMABQAEAAgAA4ADAAYAAAAHAAQABgAEAAPABwAGgAwABYAKAAkAEAADgAYABQAIAAMABAACAAAAAQAAQAFAAUABwAHAAgACQAJAAoACgAKAAoACwALAAsACwAMAAwADAAMAAwADAANAAwADQAMAA0ADQAOAAoACgAFAAQABgAGAAcACAAIAAkACQAKAAoACwAKAAsACwALAAsADAALAAwADAAMAAwADQAMAA4ADAANAAwADgAKAAoABwAHAAcACAAIAAkACQAKAAkACwAKAAsACgAMAAsADAALAA0ACwAMAAsADQAMAA0ADAANAAwADgANAA4ACQALAAgACQAIAAkACQAKAAkACwAKAAsACgAMAAoADAALAAwACwANAAsADQALAA4ADAAOAAwADgAMAA8ADAAPAAkADAAJAAoACQAKAAkACwAKAAsACgAMAAoADAAKAA0ACwANAAsADQALAA4ADAAOAAwADgAMAA8ADAAPAA0ADwAJAAsACgAKAAkACgAKAAsACgALAAoADAAKAA0ACwANAAsADgALAA0ACwAOAAwADgAMAA8ADAAPAAwADwAMABAACQAMAAoACwAKAAsACgALAAoADAAKAA0ACwANAAsADQALAA0ACwAOAAwADgAMAA4ADAAOAAwADwAMAA8ADQAQAAkADAALAAsACgALAAoADAAKAAwACwANAAsADQALAA0ACwAOAAwADgAMAA8ADAAPAAwADwAMAA8ADQARAA0AEQAKAAwACwALAAsADAALAAwACwANAAsADQALAA0ACwAOAAsADgALAA8ADAAPAAwADwAMAA8ADAAQAA0AEAANABAACgAMAAsADAALAAwACwAMAAsADQALAA0ACwAOAAsADgAMAA8ADAAPAAwADwAMAA8ADAAQAA0ADwANABAADQAPAAoADQAMAAwACwANAAsADAALAA0ACwAOAAwADgAMAA4ADAAOAAwADwAMABAADAAQAA0AEAANABEADQARAA0AEAAKAAwADAANAAwADQALAA0ACwANAAsADgAMAA4ADAAPAAwAEAAMABAADAAQAAwAEAANABAADQAQAA0ADwANABAACgANAAwADQAMAA4ADAAOAAwADgAMAA4ADAAPAAwADwAMAA8ADAAPAAwAEQANABAADQAQAA0AEAANABAADQASAAoADQAMAA8ADAAOAAwADgAMAA4ADAAPAAwADwAMABAADAAQAA0AEAANABIADQARAA0AEQANABEADQATAA0AEQAKAA0ADQAOAAwADwAMAA0ADAAOAAwAEAAMABAADAAPAA0AEAANABAADQARAA0AEgANABEADQATAA0AEQANABAACgANAAkACgAJAAoACQAKAAkACwAJAAsACQAMAAkADAAJAAwACQANAAkADQAJAA0ACgANAAoADQAKAA0ACgANAAYACgACAAEAAwAEAAcABwAEAAQABAAFAAcABwAGAAYABwAHAAgACABBwMUAC5ECAwABAAQABAAGAAcACAAIAAQABAAEAAUABgAIAAcACQAFAAcABgAIAAcACQAIAAoABwAIAAcACAAIAAkACQAKAAAAAAAIAAAAEAAAABgAAAAgAAAAKAAAADAAAAA4AAAAQAAAAFAAAABgAAAAcAAAAIAAAACQAAAAoAAAAP////8AAAAAIAAAACgAAAAwAAAAOAAAAEAAAABQAAAAYAAAAHAAAACAAAAAoAAAAMAAAADgAAAAAAEAAEABAAD/////AAAAAAgAAAAQAAAAGAAAACAAAAAoAAAAMAAAADgAAABAAAAA/////////////////////////////////////wAAAAAGAAAACwAAABAAAAAVAEHwxwALlwEDAAAAAQAAAAEAAAABAAAAAgAAAAIAAAACAAAAAwAAAAMAAAADAAAABAAAAAQAAAAAAAAAAQAAAAIAAAADAAAAAAAAAAEAAAACAAAAAwAAAAEAAAACAAAAAwAAAAEAAAACAAAAAwAAAAIAAAADAAAARXJyb3I6IGNhbid0IGFsbG9jYXRlIFZickZyYW1lcyBidWZmZXIKAEGUyQALwQ7BwAAAgcEAAEABAAABwwAAwAMAAIACAABBwgAAAcYAAMAGAACABwAAQccAAAAFAADBxQAAgcQAAEAEAAABzAAAwAwAAIANAABBzQAAAA8AAMHPAACBzgAAQA4AAAAKAADBygAAgcsAAEALAAAByQAAwAkAAIAIAABByAAAAdgAAMAYAACAGQAAQdkAAAAbAADB2wAAgdoAAEAaAAAAHgAAwd4AAIHfAABAHwAAAd0AAMAdAACAHAAAQdwAAAAUAADB1AAAgdUAAEAVAAAB1wAAwBcAAIAWAABB1gAAAdIAAMASAACAEwAAQdMAAAARAADB0QAAgdAAAEAQAAAB8AAA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cgBObyBzdWNoIGRldmljZSBvciBhZGRyZXNzAEJsb2NrIGRldmljZSByZXF1aXJlZABObyBzdWNoIGRldmljZQBOb3QgYSBkaXJlY3RvcnkASXMgYSBkaXJlY3RvcnkAVGV4dCBmaWxlIGJ1c3kARXhlYyBmb3JtYXQgZXJyb3IASW52YWxpZCBhcmd1bWVudABBcmd1bWVudCBsaXN0IHRvbyBsb25nAFN5bWJvbGljIGxpbmsgbG9vcABGaWxlbmFtZSB0b28gbG9uZwBUb28gbWFueSBvcGVuIGZpbGVzIGluIHN5c3RlbQBObyBmaWxlIGRlc2NyaXB0b3JzIGF2YWlsYWJsZQBCYWQgZmlsZSBkZXNjcmlwdG9yAE5vIGNoaWxkIHByb2Nlc3MAQmFkIGFkZHJlc3MARmlsZSB0b28gbGFyZ2UAVG9vIG1hbnkgbGlua3MATm8gbG9ja3MgYXZhaWxhYmxlAFJlc291cmNlIGRlYWRsb2NrIHdvdWxkIG9jY3VyAFN0YXRlIG5vdCByZWNvdmVyYWJsZQBQcmV2aW91cyBvd25lciBkaWVkAE9wZXJhdGlvbiBjYW5jZWxlZABGdW5jdGlvbiBub3QgaW1wbGVtZW50ZWQATm8gbWVzc2FnZSBvZiBkZXNpcmVkIHR5cGUASWRlbnRpZmllciByZW1vdmVkAERldmljZSBub3QgYSBzdHJlYW0ATm8gZGF0YSBhdmFpbGFibGUARGV2aWNlIHRpbWVvdXQAT3V0IG9mIHN0cmVhbXMgcmVzb3VyY2VzAExpbmsgaGFzIGJlZW4gc2V2ZXJlZABQcm90b2NvbCBlcnJvcgBCYWQgbWVzc2FnZQBGaWxlIGRlc2NyaXB0b3IgaW4gYmFkIHN0YXRlAE5vdCBhIHNvY2tldABEZXN0aW5hdGlvbiBhZGRyZXNzIHJlcXVpcmVkAE1lc3NhZ2UgdG9vIGxhcmdlAFByb3RvY29sIHdyb25nIHR5cGUgZm9yIHNvY2tldABQcm90b2NvbCBub3QgYXZhaWxhYmxlAFByb3RvY29sIG5vdCBzdXBwb3J0ZWQAU29ja2V0IHR5cGUgbm90IHN1cHBvcnRlZABOb3Qgc3VwcG9ydGVkAFByb3RvY29sIGZhbWlseSBub3Qgc3VwcG9ydGVkAEFkZHJlc3MgZmFt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";

/* eslint-disable no-undef */

var analyser$1 = void 0;
var audioCtx$1 = void 0;
var mediaRecorder = void 0;
var chunks = [];
var startTime = void 0;
var stream = void 0;
var mediaOptions = void 0;
var blobObject = void 0;
var onStartCallback = void 0;
var onStopCallback = void 0;
var onSaveCallback = void 0;
var onDataCallback = void 0;
var onUnmountCallback = void 0;
var draftRecordingBlobObject = void 0;
var isPausedBool = void 0;
var timeInterval = void 0;
var shimURL = "https://unpkg.com/wasm-polyfill.js@0.2.0/wasm-polyfill.js";
var constraints = { audio: true }; // constraints - only audio needed

navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

var MicrophoneRecorder = function () {
  function MicrophoneRecorder(onStart, onStop, onSave, onData, options) {
    var _this = this;

    classCallCheck(this, MicrophoneRecorder);

    this.startRecording = function () {
      startTime = Date.now();

      if (mediaRecorder) {
        if (audioCtx$1 && audioCtx$1.state === "suspended") {
          audioCtx$1.resume();
        }

        if (mediaRecorder && mediaRecorder.state === "paused") {
          mediaRecorder.resume();
          return;
        }

        if (audioCtx$1 && mediaRecorder && mediaRecorder.state === "inactive") {
          mediaRecorder.start(10);
          var source = audioCtx$1.createMediaStreamSource(stream);
          source.connect(analyser$1);
          if (onStartCallback) {
            onStartCallback();
          }
        }
      } else if (navigator.mediaDevices) {
        navigator.mediaDevices.getUserMedia(constraints).then(function (str) {
          stream = str;

          mediaRecorder = new MediaStreamRecorder_1(str);
          mediaRecorder.mimeType = mediaOptions.mimeType;
          mediaRecorder.bufferSize = mediaOptions.bufferSize;
          mediaRecorder.sampleRate = mediaOptions.sampleRate;
          if (onStartCallback) {
            onStartCallback();
          }

          // mediaRecorder.onstop = ;
          mediaRecorder.onstop = _this.onStop;

          mediaRecorder.ondataavailable = function (blob) {
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
          audioCtx$1 = AudioContext.getAudioContext();
          audioCtx$1.resume().then(function () {
            analyser$1 = AudioContext.getAnalyser();
            mediaRecorder.start(10);
            var sourceNode = audioCtx$1.createMediaStreamSource(stream);
            sourceNode.connect(analyser$1);
          });
        }).catch(function (error) {
          return console.log(JSON.stringify(error, 2, null));
        });
      } else {
        alert("Your browser does not support audio recording");
      }
    };

    onStartCallback = onStart;
    onStopCallback = onStop;
    onSaveCallback = onSave;
    onDataCallback = onData;
    mediaOptions = options;
  }

  createClass(MicrophoneRecorder, [{
    key: "stopRecording",
    value: function stopRecording() {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        mediaRecorder.stop();
        stream.getAudioTracks().forEach(function (track) {
          track.stop();
        });
        mediaRecorder = null;
        AudioContext.resetAnalyser();
      }
    }
  }, {
    key: "onStop",
    value: function onStop() {
      var blob = new Blob(chunks, { type: mediaOptions.mimeType });
      chunks = [];

      blobObject = {
        blob: blob,
        startTime: startTime,
        stopTime: Date.now(),
        options: mediaOptions,
        blobURL: window.URL.createObjectURL(blob)
      };
      if (onStopCallback) {
        onStopCallback(blobObject);
      }
      if (onSaveCallback) {
        onSaveCallback(blobObject);
      }
    }
  }]);
  return MicrophoneRecorder;
}();

var MicrophoneRecorderMp3 = function () {
  function MicrophoneRecorderMp3(onStart, onStop, onSave, onData, options, onUnmount, draftRecordingBlob, isPaused) {
    var _this2 = this;

    classCallCheck(this, MicrophoneRecorderMp3);

    this.startRecording = function () {
      startTime = Date.now();

      if (mediaRecorder) {
        if (audioCtx$1 && audioCtx$1.state === "suspended") {
          audioCtx$1.resume();
        }

        if (mediaRecorder && mediaRecorder.state === "paused") {
          mediaRecorder.resume();
          return;
        }

        if (audioCtx$1 && mediaRecorder && mediaRecorder.state === "inactive") {
          mediaRecorder.start(10);
          var source = audioCtx$1.createMediaStreamSource(stream);
          source.connect(analyser$1);
          if (onStartCallback) {
            onStartCallback();
          }
        }
      } else if (navigator.mediaDevices) {
        convertBlobToAudioBuffer(draftRecordingBlobObject).then(function (audioBuffer) {
          navigator.mediaDevices.getUserMedia(constraints).then(function () {
            var _ref = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(str) {
              var _mediaOptions, recorderParams;

              return regeneratorRuntime.wrap(function _callee$(_context) {
                while (1) {
                  switch (_context.prev = _context.next) {
                    case 0:
                      stream = str;
                      _mediaOptions = mediaOptions, recorderParams = _mediaOptions.recorderParams;

                      mediaRecorder = new Recorder(_extends({
                        wasmURL: wasmURL,
                        shimURL: shimURL
                      }, recorderParams), null, audioBuffer, isPausedBool);
                      _context.prev = 3;
                      _context.next = 6;
                      return mediaRecorder.init();

                    case 6:

                      if (onStartCallback) {
                        onStartCallback();
                      }

                      audioCtx$1 = AudioContext.getAudioContext();
                      audioCtx$1.resume().then(function () {
                        analyser$1 = AudioContext.getAnalyser();
                        mediaRecorder.startRecording();
                        if (onDataCallback) {
                          timeInterval = setInterval(onDataCallback, 10);
                        }
                        var sourceNode = audioCtx$1.createMediaStreamSource(stream);
                        sourceNode.connect(analyser$1);
                      });
                      _context.next = 14;
                      break;

                    case 11:
                      _context.prev = 11;
                      _context.t0 = _context["catch"](3);

                      console.log(JSON.stringify(_context.t0, 2, null));

                    case 14:
                    case "end":
                      return _context.stop();
                  }
                }
              }, _callee, _this2, [[3, 11]]);
            }));

            return function (_x) {
              return _ref.apply(this, arguments);
            };
          }()).catch(function (error) {
            return console.log(JSON.stringify(error, 2, null));
          });
        }).catch(function (error) {
          console.log("Error while converting blob to audio buffer::", error);
        });
      } else {
        alert("Your browser does not support audio recording");
      }
    };

    this.togglePause = function () {
      if (mediaRecorder && mediaRecorder.togglePause) {
        mediaRecorder.togglePause();
      }
    };

    this.setPause = function (value) {
      if (mediaRecorder && mediaRecorder.setPause) {
        mediaRecorder.setPause(value);
      }
    };

    onStartCallback = onStart;
    onStopCallback = onStop;
    onSaveCallback = onSave;
    onDataCallback = onData;
    mediaOptions = options;
    onUnmountCallback = onUnmount;
    draftRecordingBlobObject = draftRecordingBlob;
    isPausedBool = isPaused;
  }

  createClass(MicrophoneRecorderMp3, [{
    key: "stopRecording",
    value: function stopRecording(callUnmount) {
      if (mediaRecorder) {
        stream.getAudioTracks().forEach(function (track) {
          track.stop();
        });
        AudioContext.resetAnalyser();
        this.onStop(callUnmount);
      }
    }
  }, {
    key: "onStop",
    value: function () {
      var _ref2 = asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(callUnmount) {
        var blob;
        return regeneratorRuntime.wrap(function _callee2$(_context2) {
          while (1) {
            switch (_context2.prev = _context2.next) {
              case 0:
                _context2.prev = 0;
                _context2.next = 3;
                return mediaRecorder.stopRecording();

              case 3:
                blob = _context2.sent;


                blobObject = {
                  blob: blob,
                  startTime: startTime,
                  stopTime: Date.now(),
                  options: mediaOptions,
                  blobURL: window.URL.createObjectURL(blob)
                };

                mediaRecorder.close();
                mediaRecorder = null;
                clearInterval(timeInterval);

                if (onStopCallback && !callUnmount) {
                  onStopCallback(blobObject);
                }
                if (onSaveCallback) {
                  onSaveCallback(blobObject);
                }

                if (onUnmountCallback && callUnmount) {
                  onUnmountCallback(blobObject);
                }
                _context2.next = 16;
                break;

              case 13:
                _context2.prev = 13;
                _context2.t0 = _context2["catch"](0);

                console.log("onStop", JSON.stringify(_context2.t0, 2, null));

              case 16:
              case "end":
                return _context2.stop();
            }
          }
        }, _callee2, this, [[0, 13]]);
      }));

      function onStop(_x2) {
        return _ref2.apply(this, arguments);
      }

      return onStop;
    }()
  }]);
  return MicrophoneRecorderMp3;
}();

var convertBlobToAudioBuffer = function convertBlobToAudioBuffer(blob) {
  return new Promise(function (resolve, reject) {
    if (!blob) {
      resolve(null);
    }
    var audioContext = new (window.AudioContext || window.webkitAudioContext)();
    var fileReader = new FileReader();
    fileReader.onloadend = function () {
      var arrayBuffer = fileReader.result;
      audioContext.decodeAudioData(arrayBuffer, resolve, reject);
    };
    fileReader.readAsArrayBuffer(blob);
  });
};

var audioSource = void 0;

var AudioPlayer = {
  create: function create(audioElem) {
    var audioCtx = AudioContext.getAudioContext();
    var analyser = AudioContext.getAnalyser();

    if (audioSource === undefined) {
      var source = audioCtx.createMediaElementSource(audioElem);
      source.connect(analyser);
      audioSource = source;
    }

    analyser.connect(audioCtx.destination);
  }
};

var drawVisual = void 0;

var VisualizerComponent = {
  visualizeSineWave: function visualizeSineWave(canvasCtx, canvas, width, height, backgroundColor, strokeColor) {
    var analyser = AudioContext.getAnalyser();

    var running = true;

    var bufferLength = analyser.fftSize;
    var dataArray = new Uint8Array(bufferLength);

    canvasCtx.clearRect(0, 0, width, height);

    function stop() {
      running = false;
    }

    function draw() {
      if (!running) return;
      drawVisual = requestAnimationFrame(draw);

      analyser = AudioContext.getAnalyser();

      analyser.getByteTimeDomainData(dataArray);

      canvasCtx.fillStyle = backgroundColor;
      canvasCtx.fillRect(0, 0, width, height);

      canvasCtx.lineWidth = 2;
      canvasCtx.strokeStyle = strokeColor;

      canvasCtx.beginPath();

      var sliceWidth = width * 1.0 / bufferLength;
      var x = 0;

      for (var i = 0; i < bufferLength; i++) {
        var v = dataArray[i] / 128.0;
        var y = v * height / 2;

        if (i === 0) {
          canvasCtx.moveTo(x, y);
        } else {
          canvasCtx.lineTo(x, y);
        }

        x += sliceWidth;
      }

      canvasCtx.lineTo(canvas.width, canvas.height / 2);
      canvasCtx.stroke();
    }
    draw();
    return stop;
  },
  visualizeFrequencyBars: function visualizeFrequencyBars(canvasCtx, canvas, width, height, backgroundColor, strokeColor) {
    var self = this;
    var running = true;
    var analyser = AudioContext.getAnalyser();
    analyser.fftSize = 256;
    var bufferLength = analyser.frequencyBinCount;
    var dataArray = new Uint8Array(bufferLength);

    canvasCtx.clearRect(0, 0, width, height);

    function stop() {
      running = false;
    }

    function draw() {
      if (!running) return;
      drawVisual = requestAnimationFrame(draw);

      analyser = AudioContext.getAnalyser();
      analyser.getByteFrequencyData(dataArray);

      canvasCtx.fillStyle = backgroundColor;
      canvasCtx.fillRect(0, 0, width, height);

      var barWidth = width / bufferLength * 2.5;
      var barHeight = void 0;
      var x = 0;

      for (var i = 0; i < bufferLength; i++) {
        barHeight = dataArray[i];

        var rgb = self.hexToRgb(strokeColor);

        // canvasCtx.fillStyle = `rgb(${barHeight+100},${rgb.g},${rgb.b})`;
        canvasCtx.fillStyle = strokeColor;
        canvasCtx.fillRect(x, height - barHeight / 2, barWidth, barHeight / 2);

        x += barWidth + 1;
      }
      return stop;
    }
    draw();
    return stop;
  },
  visualizeFrequencyCircles: function visualizeFrequencyCircles(canvasCtx, canvas, width, height, backgroundColor, strokeColor) {
    var running = true;
    var analyser = AudioContext.getAnalyser();
    analyser.fftSize = 32;
    var bufferLength = analyser.frequencyBinCount;

    var dataArray = new Uint8Array(bufferLength);
    canvasCtx.clearRect(0, 0, width, height);

    function stop() {
      running = false;
    }

    function draw() {
      if (!running) return;
      drawVisual = requestAnimationFrame(draw);
      analyser = AudioContext.getAnalyser();
      analyser.getByteFrequencyData(dataArray);
      var reductionAmount = 3;
      var reducedDataArray = new Uint8Array(bufferLength / reductionAmount);

      for (var i = 0; i < bufferLength; i += reductionAmount) {
        var sum = 0;
        for (var j = 0; j < reductionAmount; j++) {
          sum += dataArray[i + j];
        }
        reducedDataArray[i / reductionAmount] = sum / reductionAmount;
      }

      canvasCtx.clearRect(0, 0, width, height);
      canvasCtx.beginPath();
      canvasCtx.arc(width / 2, height / 2, Math.min(height, width) / 2, 0, 2 * Math.PI);
      canvasCtx.fillStyle = backgroundColor;
      canvasCtx.fill();
      var stepSize = Math.min(height, width) / 2.0 / reducedDataArray.length;
      canvasCtx.strokeStyle = strokeColor;

      for (var _i = 0; _i < reducedDataArray.length; _i++) {
        canvasCtx.beginPath();
        var normalized = reducedDataArray[_i] / 128;
        var r = stepSize * _i + stepSize * normalized;
        canvasCtx.arc(width / 2, height / 2, r, 0, 2 * Math.PI);
        canvasCtx.stroke();
      }
    }    draw();
    return stop;
  },
  hexToRgb: function hexToRgb(hex) {
    var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }
};

// cool blog article on how to do this: http://www.smartjava.org/content/exploring-html5-web-audio-visualizing-sound

var ReactMic = function (_Component) {
  inherits(ReactMic, _Component);

  function ReactMic(props) {
    classCallCheck(this, ReactMic);

    var _this = possibleConstructorReturn(this, (ReactMic.__proto__ || Object.getPrototypeOf(ReactMic)).call(this, props));

    _this.componentWillUnmount = function () {
      var record = _this.props.record;
      var microphoneRecorder = _this.state.microphoneRecorder;

      if (record && microphoneRecorder) {
        microphoneRecorder.stopRecording(true);
      }
    };

    _this.componentDidUpdate = function (prevProps, prevState) {
      var _this$props = _this.props,
          isPaused = _this$props.isPaused,
          record = _this$props.record;

      if (prevProps.isPaused !== isPaused) {
        var microphoneRecorder = _this.state.microphoneRecorder;

        if (record && microphoneRecorder) {
          microphoneRecorder.togglePause();
        }
      }
    };

    _this.state = {
      microphoneRecorder: null,
      canvas: null,
      canvasCtx: null
    };
    _this.visualizer = React__default.createRef();
    _this.drawer = null;
    return _this;
  }

  createClass(ReactMic, [{
    key: "componentDidMount",
    value: function componentDidMount() {
      var _this2 = this;

      var _props = this.props,
          onSave = _props.onSave,
          onStop = _props.onStop,
          onStart = _props.onStart,
          onData = _props.onData,
          audioElem = _props.audioElem,
          audioBitsPerSecond = _props.audioBitsPerSecond,
          mimeType = _props.mimeType,
          bufferSize = _props.bufferSize,
          recorderParams = _props.recorderParams,
          sampleRate = _props.sampleRate,
          onUnmount = _props.onUnmount,
          draftRecordingBlob = _props.draftRecordingBlob,
          isPaused = _props.isPaused;

      var canvas = this.visualizer.current;
      var canvasCtx = canvas.getContext("2d");
      var options = {
        audioBitsPerSecond: audioBitsPerSecond,
        mimeType: mimeType,
        bufferSize: bufferSize,
        sampleRate: sampleRate,
        recorderParams: recorderParams
      };
      if (audioElem) {
        AudioPlayer.create(audioElem);
        this.setState({
          canvas: canvas,
          canvasCtx: canvasCtx
        }, function () {
          _this2.visualize();
        });
      } else {
        var Recorder = this.props.mimeType === "audio/mp3" ? MicrophoneRecorderMp3 : MicrophoneRecorder;
        this.setState({
          microphoneRecorder: new Recorder(onStart, onStop, onSave, onData, options, onUnmount, draftRecordingBlob, isPaused),
          canvas: canvas,
          canvasCtx: canvasCtx
        }, function () {
          _this2.visualize();
        });
      }
    }
  }, {
    key: "visualize",
    value: function visualize() {
      var _props2 = this.props,
          backgroundColor = _props2.backgroundColor,
          strokeColor = _props2.strokeColor,
          width = _props2.width,
          height = _props2.height,
          visualSetting = _props2.visualSetting;
      var _state = this.state,
          canvas = _state.canvas,
          canvasCtx = _state.canvasCtx;


      if (visualSetting === "sinewave") {
        this.drawer = VisualizerComponent.visualizeSineWave(canvasCtx, canvas, width, height, backgroundColor, strokeColor);
      } else if (visualSetting === "frequencyBars") {
        this.drawer = VisualizerComponent.visualizeFrequencyBars(canvasCtx, canvas, width, height, backgroundColor, strokeColor);
      } else if (visualSetting === "frequencyCircles") {
        this.drawer = VisualizerComponent.visualizeFrequencyCircles(canvasCtx, canvas, width, height, backgroundColor, strokeColor);
      }
    }
  }, {
    key: "clear",
    value: function clear() {
      var _props3 = this.props,
          width = _props3.width,
          height = _props3.height;
      var canvasCtx = this.state.canvasCtx;

      canvasCtx.clearRect(0, 0, width, height);
    }
  }, {
    key: "render",
    value: function render() {
      var _props4 = this.props,
          record = _props4.record,
          onStop = _props4.onStop,
          width = _props4.width,
          height = _props4.height;
      var _state2 = this.state,
          microphoneRecorder = _state2.microphoneRecorder,
          canvasCtx = _state2.canvasCtx;

      if (record) {
        if (microphoneRecorder) {
          microphoneRecorder.startRecording();
        }
      } else {
        if (microphoneRecorder) {
          microphoneRecorder.stopRecording();
          if (this.drawer) {
            this.drawer();
          }
          this.clear();
        }
      }

      return React__default.createElement("canvas", {
        ref: this.visualizer,
        height: height,
        width: width,
        className: this.props.className
      });
    }
  }]);
  return ReactMic;
}(React.Component);


ReactMic.propTypes = {
  backgroundColor: propTypes.string,
  strokeColor: propTypes.string,
  className: propTypes.string,
  audioBitsPerSecond: propTypes.number,
  mimeType: propTypes.string,
  height: propTypes.number,
  record: propTypes.bool.isRequired,
  onStop: propTypes.func,
  onData: propTypes.func,
  bufferSize: propTypes.oneOf([0, 256, 512, 1024, 2048, 4096, 8192, 16384]),
  sampleRate: propTypes.number,
  recorderParams: propTypes.object,
  isPaused: propTypes.bool
};

ReactMic.defaultProps = {
  backgroundColor: "rgba(255, 255, 255, 0.5)",
  strokeColor: "#000000",
  className: "visualizer",
  audioBitsPerSecond: 128000,
  mimeType: "audio/wav",
  bufferSize: 2048,
  sampleRate: 44100,
  record: false,
  width: 640,
  height: 100,
  visualSetting: "sinewave",
  recorderParams: {},
  isPaused: false
};

exports.ReactMic = ReactMic;
//# sourceMappingURL=index.js.map
