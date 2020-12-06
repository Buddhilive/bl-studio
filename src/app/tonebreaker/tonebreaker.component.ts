import { Component, OnInit } from '@angular/core';
import * as magenta from '@magenta/music/es6';
import { PianoRollCanvasVisualizer } from '@magenta/music/es6';
import { GlobalVariables } from '../shared/global.variables';
/* import { DDSP } from '@magenta/music/es6/ddsp/';
import { SPICE } from '@magenta/music/es6/spice'; */

@Component({
  selector: 'app-tonebreaker',
  templateUrl: './tonebreaker.component.html',
  styleUrls: ['./tonebreaker.component.scss']
})
export class TonebreakerComponent implements OnInit {

  modelVAEMusic = new magenta.MusicVAE(this.globalVar.MODEL_VAE_MELODY);
  modelRnn = new magenta.MusicRNN(this.globalVar.MODEL_IMPROV_RNN);
  modelVAEDrum = new magenta.MusicVAE(this.globalVar.MODEL_VAE_DRUMS);
  ddspModel = new magenta.DDSP('https://storage.googleapis.com/magentadata/js/checkpoints/ddsp/tenor_saxophone');
  spiceModels = new magenta.SPICE('https://tfhub.dev/google/tfjs-model/spice/2/default/1');
  midiMe = new magenta.OnsetsAndFrames(this.globalVar.MODEL_MIDIME);
  sampleGenerated: any;
  /* drumSample: any; */
  bassSample: any;
  chordSample: any;
  fullSong: any;
  BL_DEFAULT_QPM = 220;
  BL_DEFAULT_STEPS = 4;
  BL_DEFAULT_BARS = 16;
  BL_DEFAULT_VARIATION = 0.8;
  BL_DEFAULT_CHORDS = ['Em', 'C', 'Am', 'G']; //['C', 'G', 'Am', 'F']; ['Dm', 'Bb', 'F', 'C']
  BL_DEFAULT_MELODY = {
    quantizationInfo: { stepsPerQuarter: this.BL_DEFAULT_STEPS },
    notes: [],
    tempos: [{ time: 0, qpm: this.BL_DEFAULT_QPM }],
    totalQuantizedSteps: 1
  };
  audioPlayer = new magenta.SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus');
  audioCtx = new AudioContext();

  constructor(
    private globalVar: GlobalVariables
  ) { }

  ngOnInit() {
    /* this.modelRnn.initialize().then(() => {
      console.log(this.modelRnn);
    }); */
    /* this.modelVAEDrum.initialize().then(() => {
      console.log('drums loaded');
    }); */
    /* this.modelVAEMusic.initialize().then(() => {
      console.log('drums loaded');
    }); */
    this.ddspModel.initialize().then(() => {
      console.log('Namo Buddhaya!');
    });
    this.spiceModels.initialize().then(() => {
      console.log('Theruwan Saranai');
    });
    /* this.midiMe.initialize().then(() => {
      console.log('Namo Buddhaya!');
    }); */
  }

  async transformAudio(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    let filePath;
    reader.onload = async (e: any) => {
      // The file's text will be printed here
      //console.log(e.target.result);
      filePath = e.target.result;
      this.readFileAndProcessAudio(filePath);
      /* this.fullSong = await this.midiMe.transcribeFromAudioURL(filePath);
      let sampleSeq = this.fullSong;
      if (!magenta.sequences.isQuantizedSequence(this.fullSong)) {
        sampleSeq = magenta.sequences.quantizeNoteSequence(this.fullSong, 1);
      }
      sampleSeq.notes.forEach(n => n.velocity = 100);
      const midiB = magenta.sequenceProtoToMidi(sampleSeq);
      const blob = new Blob([midiB], { type: 'audio/midi' });
      const url = URL.createObjectURL(blob);
      console.log(url);
      const a = document.createElement('a');
      const urlForFile = URL.createObjectURL(blob);
      a.href = urlForFile;
      a.download = 'buddhilive_voicekey' + Date.now() + '.midi';
      a.click();
      console.log(this.fullSong); */
    };
    reader.readAsDataURL(file);
    /* this.readFileAndProcessAudio('assets/v.mp3'); */
  }

  async readFileAndProcessAudio(src: string) {
    const audioFile = await fetch(src);
    const arrayBuffer = await audioFile.arrayBuffer();
    const audioBuffer = await this.audioCtx.decodeAudioData(arrayBuffer);
    const audioFeatures = await this.spiceModels.getAudioFeatures(audioBuffer);
    console.log('audio_features', audioFeatures);
    console.log('audio_buffer', audioBuffer, arrayBuffer);
    //this.hzToNotes(audioFeatures);
    this.synthesizeAudio(audioFeatures);
  }

  async synthesizeAudio(audioFeatures) {
    const toneTransferredAudioData: Float32Array = await this.ddspModel.synthesize(audioFeatures);
    console.log(toneTransferredAudioData);
    const dataview = this.encodeWAV(toneTransferredAudioData, this.audioCtx.sampleRate);
    const blob = new Blob([dataview], { type: 'audio/wav' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const urlForFile = URL.createObjectURL(blob);
    a.href = urlForFile;
    a.download = 'buddhilive_tonebreaker' + Date.now() + '.wav';
    a.click();

    /* this.ddspModel.dispose(); */
  }

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

  writeString(view: DataView, offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  floatTo16BitPCM(
    output: DataView, offset: number, input: Float32Array) {
    for (let i = 0; i < input.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, input[i]));
      output.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
  }


  async generateLead() {
    const xMelody = await this.modelRnn.continueSequence(
      this.BL_DEFAULT_MELODY, this.BL_DEFAULT_STEPS * this.BL_DEFAULT_BARS, this.BL_DEFAULT_VARIATION, this.BL_DEFAULT_CHORDS
    );
    this.sampleGenerated = magenta.sequences.mergeInstruments(xMelody);
    console.log(this.sampleGenerated);
    this.sampleGenerated.notes.map((note, index) => {
      this.sampleGenerated.notes[index].program = 26;
    });
    console.log(this.sampleGenerated);
    //this.generateBass(this.sampleGenerated);
    this.bassSample = this.sampleGenerated;
  }

  async generateBass(xNoteSequence) {
    /* const xMelody = await this.modelVAEMusic.sample(
      (this.BL_DEFAULT_BARS / this.BL_DEFAULT_STEPS) / 2, this.BL_DEFAULT_VARIATION,
      { chordProgression: this.BL_DEFAULT_CHORDS, extraControls: null },
      this.BL_DEFAULT_STEPS, this.BL_DEFAULT_QPM
    );
    console.log(this.sampleGenerated, xMelody);
    this.concatenateNoteSequence(xMelody); */
    const xMelody = await this.modelVAEMusic.similar(
      xNoteSequence, 2, 0.5, this.BL_DEFAULT_VARIATION,
      { chordProgression: this.BL_DEFAULT_CHORDS, extraControls: null },
    );
    this.concatenateNoteSequence(xMelody);
    /* this.bassSample = magenta.sequences.mergeInstruments(xMelody);
    console.log(this.bassSample);
    this.bassSample.notes.map((note, index) => {
      this.bassSample.notes[index].program = 26;
    });
    console.log(this.bassSample); */
  }

  /* async generateDrum() {
    const xDrum = await this.modelVAEDrum.sample(
      1, this.BL_DEFAULT_VARIATION, null, this.BL_DEFAULT_STEPS, this.BL_DEFAULT_QPM
    );
    this.drumSample = magenta.sequences.mergeInstruments(
      magenta.sequences.quantizeNoteSequence(xDrum[0], 4)
    );
    console.log(this.drumSample);
  }
 */
  generateChords() {
    this.chordSample = {
      quantizationInfo: { stepsPerQuarter: this.BL_DEFAULT_STEPS },
      notes: [],
      tempos: [{ time: 0, qpm: this.BL_DEFAULT_QPM }],
      totalQuantizedSteps: 1
    };
    this.BL_DEFAULT_CHORDS.map(async (xChord, xIndex) => {
      const xNotes = magenta.chords.ChordSymbols.pitches(xChord);
      xNotes.map((yNote) => {
        const zNotes = {
          pitch: yNote + 60,
          quantizedStartStep: xIndex * 16 + 1,
          quantizedEndStep: (xIndex + 1) * 16
        };
        console.log(yNote, zNotes);
        this.chordSample.notes.push(zNotes);
      });
      this.chordSample = magenta.sequences.mergeInstruments(this.chordSample);
      this.chordSample.notes.map((note, index) => {
        this.chordSample.notes[index].program = 4;
      });
      console.log(this.chordSample);
      console.log(xChord, xNotes);
    });
  }

  async concatenateNoteSequence(xNoteSequence: Array<any>) {
    this.bassSample = magenta.sequences.clone(this.sampleGenerated);
    let numSteps = this.sampleGenerated.totalQuantizedSteps;
    xNoteSequence.map((xNotes, xIndex) => {
      if (xIndex >= 0) {
        xNotes.notes.map((yNote) => {
          yNote.quantizedStartStep += numSteps;
          yNote.quantizedEndStep += numSteps;
          this.bassSample.notes.push(yNote);
          console.log(yNote, xIndex);
        });
        numSteps += xNotes.totalQuantizedSteps;
      }
      console.log(xNotes);
    });
    this.bassSample.totalQuantizedSteps = numSteps;
    this.bassSample = magenta.sequences.mergeInstruments(this.bassSample);
    console.log(this.bassSample);
    this.bassSample.notes.map((note, index) => {
      this.bassSample.notes[index].program = 81;
      console.log(this.bassSample.notes[index].program);
    });
    console.log(this.bassSample);
  }

  async mergeNoteSequence() {
    try {
      this.fullSong = magenta.sequences.clone(this.chordSample);

      /* if (this.sampleGenerated !== undefined) {
        await this.sampleGenerated.notes.map((xNotes) => {
          this.fullSong.notes.push(xNotes);
        });
      } */

      if (this.bassSample !== undefined) {
        await this.bassSample.notes.map((xNotes) => {
          this.fullSong.notes.push(xNotes);
        });
      }

      /* if (this.drumSample !== undefined) {
        await this.drumSample.notes.map((xNotes) => {
          this.fullSong.notes.push(xNotes);
        });
      } */
      console.log(this.fullSong);

    } catch (error) {
      console.log(error);
    }
  }

  playMusic() {
    //console.log(this.sampleGenerated.notes);
    if (this.audioPlayer.isPlaying()) {
      this.audioPlayer.stop();
      console.log('Done', this.audioPlayer.isPlaying());
    } else {
      this.startPlayer();
    }
  }

  startPlayer() {
    this.audioPlayer.start(this.fullSong).then(() => {
      this.startPlayer();
    });
    /* this.audioPlayer.start(this.BL_DEFAULT_MELODY).then(() => {
      this.startPlayer();
    }); */
  }

  playSample() {
    this.audioPlayer.start(this.sampleGenerated).then(() => {
      this.audioPlayer.stop();
    });
  }

}
