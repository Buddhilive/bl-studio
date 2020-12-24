import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import * as magenta from '@magenta/music/es6';
import { GlobalVariables } from '../shared/global.variables';
@Component({
  selector: 'app-tonebreaker',
  templateUrl: './tonebreaker.component.html',
  styleUrls: ['./tonebreaker.component.scss']
})
export class TonebreakerComponent implements OnInit {

  @ViewChild('toneBreakerAudio', { static: false }) audioElement: ElementRef;

  ddspModel = new magenta.DDSP('https://storage.googleapis.com/magentadata/js/checkpoints/ddsp/tenor_saxophone');
  spiceModels = new magenta.SPICE('https://tfhub.dev/google/tfjs-model/spice/2/default/1');

  AUDIO_ELEMENT: HTMLAudioElement;
  FULL_SONG: any;
  uploadData: string;
  BL_DEFAULT_QPM = 220;
  BL_DEFAULT_STEPS = 4;
  BL_DEFAULT_CHORDS = ['Em', 'C', 'Am', 'G']; //['C', 'G', 'Am', 'F']; ['Dm', 'Bb', 'F', 'C']
  BL_DEFAULT_MELODY = {
    quantizationInfo: { stepsPerQuarter: this.BL_DEFAULT_STEPS },
    notes: [],
    tempos: [{ time: 0, qpm: this.BL_DEFAULT_QPM }],
    totalQuantizedSteps: 1
  };

  BL_PLAYER_PROGRESS = 0;
  BL_PLAYER_DURATION = 0;

  audioCtx = new AudioContext();
  readyStateSPICE = false;
  readyStateDDSP = false;
  transformButtonActive = false;
  controlButtonsActive = false;
  processProgress = false;
  PROGRESS_DATA = '';
  playButtonText = 'play_arrow';

  constructor(
    private globalVar: GlobalVariables
  ) { }

  ngOnInit() {
    this.ddspModel.initialize().then(() => {
      this.readyStateDDSP = true;
    });
    this.spiceModels.initialize().then(() => {
      this.readyStateSPICE = true;
    });

  }

  async transformAudio(event) {
    try {
      this.audioElement.nativeElement.innerHTML = '';
      this.uploadData = await this.globalVar.uploadFile(event) as string;
      /* const sourceElement = document.createElement('source');
      sourceElement.src = this.uploadData;
      this.audioElement.nativeElement.appendChild(sourceElement); */
      this.audioElement.nativeElement.src = this.uploadData;
      this.PROGRESS_DATA = '😊 Uploaded Successfully!';
      /* this.readFileAndProcessAudio(data); */
      if (this.uploadData) {
        this.transformButtonActive = true;
      } else {
        console.log('Oops');
      }
      this.controlButtonsActive = false;
    } catch (errorMsg) {
      alert('No upload file found! \n' + errorMsg);
    }
  }

  async readFileAndProcessAudio() {
    if (this.audioElement.nativeElement.duration <= 15) {
      this.PROGRESS_DATA = '🎵 Tonebreaker in Progress...';
      this.processProgress = true;
      const audioFile = await fetch(this.uploadData);
      const arrayBuffer = await audioFile.arrayBuffer();
      const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
      const audioFeatures = await this.spiceModels.getAudioFeatures(audioBuffer);
      console.log('audio_features', audioFeatures);
      console.log('audio_buffer', audioBuffer, arrayBuffer);
      //this.hzToNotes(audioFeatures);
      this.synthesizeAudio(audioFeatures);
    } else {
      alert('Oops! Duration is greater than 15 seconds! This will crash your browser \nCurrent Duration: ' +
        this.toTime(this.audioElement.nativeElement.duration));
      this.PROGRESS_DATA = '😢 Upload an audio less than 15 seconds duration';
    }
  }

  async synthesizeAudio(audioFeatures) {
    const toneTransferredAudioData: Float32Array = await this.ddspModel.synthesize(audioFeatures);
    console.log(toneTransferredAudioData);
    this.FULL_SONG = this.encodeWAV(toneTransferredAudioData, this.audioCtx.sampleRate);
    const audioBlob = new Blob([this.FULL_SONG], { type: 'audio/wav' });
    const audioURL = URL.createObjectURL(audioBlob);
    this.audioElement.nativeElement.innerHTML = '';
    this.AUDIO_ELEMENT = new Audio(audioURL);

    /* const sourceElement = document.createElement('source');
    sourceElement.src = audioURL;
    this.audioElement.nativeElement.appendChild(sourceElement); */
    this.audioElement.nativeElement.src = audioURL;
    console.log(this.AUDIO_ELEMENT, this.audioElement);
    /* this.FULL_SONG = await this.encodeRaw(toneTransferredAudioData); */

    /* this.ddspModel.dispose(); */
    this.controlButtonsActive = true;
    this.processProgress = false;
    this.PROGRESS_DATA = '🎷 Music Generated!';
  }

  /**
   * Encode Array data to RAW file format
   * @param float32Array Float32Array Object
   */
  async encodeRaw(float32Array) {
    const output = new Uint8Array(float32Array.length);

    for (let i = 0; i < float32Array.length; i++) {
      let tmp = Math.max(-1, Math.min(1, float32Array[i]));
      tmp = tmp < 0 ? (tmp * 0x8000) : (tmp * 0x7FFF);
      tmp = tmp / 256;
      output[i] = tmp + 128;
    }

    console.log(output);

    const midiX = new Blob([output], { type: 'application/octet-binary' });
  }


  /**
   * Convert Hz in to MIDI Note
   * @param audioData AudioFeatures from SPICE Model
   */
  hzToNotes(audioData) {
    this.BL_DEFAULT_MELODY.notes = [];
    const freqHz: Array<any> = audioData.f0_hz;
    freqHz.map((frequency, nIndex) => {
      const midiSequence = Math.round(69 + 12 * Math.log2(frequency / 440));
      console.log('Note', midiSequence, nIndex);
      const playedNote = {
        pitch: midiSequence,
        quantizedStartStep: nIndex,
        quantizedEndStep: nIndex + 1
      };
      this.BL_DEFAULT_MELODY.notes.push(playedNote);
    });
  }

  /**
   * Encode output of DDSP Model to WAV format
   * This code is obtained from Google's demo project
   */
  encodeWAV(samples: Float32Array, sampleRate: number) {
    const buffer = new ArrayBuffer(44 + samples.length * 2);
    const view = new DataView(buffer);

    const channels = 1;

    /* RIFF identifier */
    this.writeString(view, 0, 'RIFF');
    /* RIFF chunk length */
    view.setUint32(4, 36 + samples.length * 2, true);
    /* RIFF type */
    this.writeString(view, 8, 'WAVE');
    /* format chunk identifier */
    this.writeString(view, 12, 'fmt ');
    /* format chunk length */
    view.setUint32(16, 16, true);
    /* sample format (raw) */
    view.setUint16(20, 1, true);
    /* channel count */
    view.setUint16(22, channels, true);
    /* sample rate */
    view.setUint32(24, sampleRate, true);
    /* byte rate (sample rate * block align) */
    view.setUint32(28, sampleRate * 4, true);
    /* block align (channel count * bytes per sample) */
    view.setUint16(32, channels * 2, true);
    /* bits per sample */
    view.setUint16(34, 16, true);
    /* data chunk identifier */
    this.writeString(view, 36, 'data');
    /* data chunk length */
    view.setUint32(40, samples.length * 2, true);

    this.floatTo16BitPCM(view, 44, samples);

    return view;
  }

  /**
   * This code is obtained from Google's demo project
   * @param view Dataview object
   * @param offset Array offset
   * @param str String
   */
  writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  /**
   * This code is obtained from Google's demo project
   */
  floatTo16BitPCM(output: DataView, offset: number, input: Float32Array) {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
  }

  downloadSample() {
    this.globalVar.download(this.FULL_SONG, 'audio/wav', 'tonebreaker');
  }

  playMusic() {
    if (this.audioElement.nativeElement.paused) {
      console.log('paused');
      this.audioElement.nativeElement.play();
      this.playButtonText = 'pause';
    } else {
      console.log('paly');
      this.audioElement.nativeElement.pause();
      this.playButtonText = 'play_arrow';
    }
  }

  showPlayerProgree(progressData: any) {
    /* console.log(progressData); */
    const currentTime = progressData.target.currentTime;
    this.BL_PLAYER_DURATION = progressData.target.duration;
    this.BL_PLAYER_PROGRESS = Math.round((currentTime / this.BL_PLAYER_DURATION) * 100);
    if (this.BL_PLAYER_DURATION) {
      this.PROGRESS_DATA = this.toTime(currentTime) + ' / ' + this.toTime(this.BL_PLAYER_DURATION);
    }
    if (currentTime === this.BL_PLAYER_DURATION && this.BL_PLAYER_PROGRESS === 100) {
      this.playButtonText = 'play_arrow';
    }
  }

  onPlayerSeek() {
    console.log(this.audioElement, this.BL_PLAYER_PROGRESS, (this.BL_PLAYER_PROGRESS / 100) * this.BL_PLAYER_DURATION);
    this.audioElement.nativeElement.currentTime = (this.BL_PLAYER_PROGRESS / 100) * this.BL_PLAYER_DURATION;
  }

  stopPlay() {
    this.audioElement.nativeElement.pause();
    this.audioElement.nativeElement.currentTime = 0;
    this.playButtonText = 'play_arrow';
  }

  toTime(timeStamp) {
    const minuteTime = Math.round(timeStamp / 60);
    const secondsTime = Math.round(timeStamp % 60);
    let finalTime;
    if (secondsTime < 10) {
      finalTime = minuteTime + ':0' + secondsTime;
    } else {
      finalTime = minuteTime + ':' + secondsTime;
    }
    return finalTime;
  }

  async recordAudio() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then((mediaStreamObj) => {
      /* if ('srcObject' in this.audioElement.nativeElement) {
        this.audioElement.nativeElement.srcObject = mediaStreamObj;
        console.log('true', this.audioElement.nativeElement.srcObject);
      } else {
        this.audioElement.nativeElement.src = URL.createObjectURL(mediaStreamObj);
        console.log('else', this.audioElement.nativeElement.src);
      } */

      /* this.audioElement.nativeElement.onloadedmetadata = (ev) => {
        console.log('Audio Loaded!');
      }; */

      const dataArray = [];
      const mediaRecorder = new MediaRecorder(mediaStreamObj);

      mediaRecorder.start();

      mediaRecorder.onstart = (ev) => {
        alert('Only 15 secods will be recorded! Larger files will crash your Browser.');
        this.PROGRESS_DATA = '🎤 Recording...';
        console.log(ev);
      };

      setTimeout(() => {
        mediaRecorder.stop();
        console.log('Stoped');
      }, 15000);

      mediaRecorder.onstop = (ev) => {
        mediaRecorder.stream.getAudioTracks().map(track => track.stop());
        this.PROGRESS_DATA = '📼 Recorded Successfully';
        console.log(ev, mediaRecorder.stream.getAudioTracks());
        const audioData = new Blob(dataArray, { type: 'audio/mp3' });
        this.uploadData = URL.createObjectURL(audioData);
        this.audioElement.nativeElement.src = this.uploadData;
        this.transformButtonActive = true;
        this.controlButtonsActive = true;
      };

      mediaRecorder.ondataavailable = (ev) => {
        console.log(ev);
        dataArray.push(ev.data);
      };
    });
    console.log();
  }

}
