import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import * as magenta from '@magenta/music/es6';
import { MatSnackBar } from '@angular/material/snack-bar';
import { PianoRollCanvasVisualizer } from '@magenta/music/es6';
import { GlobalVariables } from '../shared/global.variables';
@Component({
  selector: 'app-trios',
  templateUrl: './trios.component.html',
  styleUrls: ['./trios.component.scss']
})
export class TriosComponent implements OnInit {

  @ViewChild('chordProgression', { static: false }) chordProgression: ElementRef;
  @ViewChild('pianoRollCanvas', { static: false }) pianoRollCanvas: ElementRef;

  modelRnn = new magenta.MusicRNN(this.globalVar.MODEL_IMPROV_RNN);
  modelVAEMusic = new magenta.MusicVAE(this.globalVar.MODEL_VAE_MELODY);
  sampleGenerated: any;
  BL_DEFAULT_QPM = 120;
  BL_DEFAULT_STEPS = 4;
  BL_DEFAULT_BARS = 16;
  BL_DEFAULT_VARIATION = 0.8;
  BL_DEFAULT_CHORDS = ['C', 'G', 'Am', 'F'];
  BL_DEFAULT_MELODY = {
    quantizationInfo: { stepsPerQuarter: this.BL_DEFAULT_STEPS },
    notes: [],
    tempos: [{ time: 0, qpm: this.BL_DEFAULT_QPM }],
    totalQuantizedSteps: 1
  };
  BLS_CONFIG = {
    noteRGB: '73, 109, 145',
    activeNoteRGB: '255, 111, 0',
  };
  BLS_VISUALIZER = new PianoRollCanvasVisualizer(
    this.BL_DEFAULT_MELODY, document.createElement('canvas'), this.BLS_CONFIG
  );
  playButtonText = 'play_arrow';
  /* player = new magenta.Player(false, {
    run: (note) => {
      this.BLS_VISUALIZER.redraw(note);
    },
    stop: () => { }
  }); */
  player = new magenta.SoundFontPlayer('https://storage.googleapis.com/magentadata/js/soundfonts/sgm_plus');
  buttonActive = true;
  readyStateRNN = false;
  readyStateVAE = false;
  errorHint: any;
  hintColor = '#ff0000';
  chordSample: any;
  fullSong: any;
  minPitch = 48;
  maxPitch = 83;
  processProgress = false;
  PROGRESS_DATA = '';

  constructor(
    private _snackBar: MatSnackBar,
    private globalVar: GlobalVariables
  ) { }

  ngOnInit() {
    this.modelRnn.initialize().then(() => {
      /* this.openSnackBar('🎶 Model Initialized!'); */
      this.PROGRESS_DATA = '🎶 Model Initialized!';
      this.readyStateRNN = true;
    });
    this.modelVAEMusic.initialize().then(() => {
      this.PROGRESS_DATA = '🎶 Model Initialized!';
      this.readyStateVAE = true;
    });
    this.generateChords();
  }

  playMusic() {
    this.player.resumeContext();
    if (this.player.getPlayState() === 'started') {
      this.player.pause();
      this.playButtonText = 'play_arrow';
    } else if (this.player.getPlayState() === 'paused') {
      this.player.resume();
      this.playButtonText = 'pause';
    } else if (this.player.getPlayState() === 'stopped') {
      this.player.start(this.fullSong, this.BL_DEFAULT_QPM).then(() => {
        /* this.playButtonText = 'play_arrow'; */
        this.playMusic();
      });
      this.playButtonText = 'pause';
    }
    //console.log(this.player.getPlayState());
  }

  stopMusic() {
    this.playButtonText = 'play_arrow';
    this.player.stop();
  }

  async generateSamples() {
    try {
      this.buttonActive = true;
      this.processProgress = true;
      this.PROGRESS_DATA = '🎹 Music Generation Started!';
      /* Generate Random Defailt Melody */
      const chordsEL = this.chordProgression.nativeElement.querySelectorAll('.improvrnn__chords--key');
      chordsEL.forEach((element, elIndex) => {
        this.BL_DEFAULT_CHORDS[elIndex] = element.querySelector('input').value;
      });
      this.generateChords();
      const xMelody = await this.modelVAEMusic.sample(
        1, this.BL_DEFAULT_VARIATION,
        { chordProgression: this.BL_DEFAULT_CHORDS, extraControls: null },
        this.BL_DEFAULT_STEPS, this.BL_DEFAULT_QPM
      );
      console.log(xMelody[0]);
      xMelody[0].notes = await this.checkNoteRange(xMelody[0]) as Array<any>;
      console.log(this.BL_DEFAULT_CHORDS, this.BL_DEFAULT_QPM, this.BL_DEFAULT_BARS, this.BL_DEFAULT_STEPS, this.BL_DEFAULT_VARIATION);
      this.player.stop();
      /* Generate Improvision */
      this.sampleGenerated = await this.modelRnn.continueSequence(
        xMelody[0], this.BL_DEFAULT_STEPS * this.BL_DEFAULT_BARS, this.BL_DEFAULT_VARIATION, this.BL_DEFAULT_CHORDS
      );
      this.sampleGenerated.notes.map((note, index) => {
        this.sampleGenerated.notes[index].program = 26;
      });
      this.sampleGenerated = magenta.sequences.quantizeNoteSequence(
        magenta.sequences.unquantizeSequence(this.sampleGenerated, this.BL_DEFAULT_QPM),
        this.BL_DEFAULT_STEPS
      );
      console.log(this.sampleGenerated);
      this.BLS_VISUALIZER = new PianoRollCanvasVisualizer(
        this.sampleGenerated, this.pianoRollCanvas.nativeElement, this.BLS_CONFIG
      );
      this.mergeNoteSequence();
      this.buttonActive = false;
      this.PROGRESS_DATA = '🎹 Music Generated!';
      this.processProgress = false;
    } catch (error) {
      console.log(error);
    }
  }

  checkNoteRange(noteSeq: magenta.INoteSequence) {
    return new Promise((resolve, reject) => {
      resolve(noteSeq.notes.filter(note => note.pitch >= this.minPitch && note.pitch <= this.maxPitch));
    });
  }

  async mergeNoteSequence() {
    try {
      this.fullSong = magenta.sequences.clone(this.chordSample);

      if (this.sampleGenerated !== undefined) {
        await this.sampleGenerated.notes.map((xNotes) => {
          this.fullSong.notes.push(xNotes);
        });
      }
      console.log(this.fullSong);
    } catch (error) {
      console.log(error);
    }
  }

  downloadMIDI() {
    this.PROGRESS_DATA = 'Downloaded!';
    let sampleSeq = this.sampleGenerated;
    if (!magenta.sequences.isQuantizedSequence(this.sampleGenerated)) {
      sampleSeq = magenta.sequences.quantizeNoteSequence(this.sampleGenerated, 1);
    }
    sampleSeq.notes.forEach(n => n.velocity = 100);
    const midiB = magenta.sequenceProtoToMidi(sampleSeq);
    /* const fileB = new Blob([midiB], { type: 'audio/midi' });
    const a = document.createElement('a');
    const urlForFile = URL.createObjectURL(fileB);
    a.href = urlForFile;
    a.download = 'buddhilive_' + Date.now() + '.mid';
    a.click(); */
    this.globalVar.download(midiB, 'audio/midi', 'melody');
  }

  openSnackBar(message: string, durationTime = 2000) {
    this._snackBar.open(message, 'OK', {
      duration: durationTime,
      panelClass: 'message-snackbar',
      horizontalPosition: 'center',
      verticalPosition: 'top',
    });
  }

  checkChord(theChord) {
    console.log(theChord);
    if (!theChord) {
      this.errorHint = '⛔ No Chord Provided!';
    }
    try {
      magenta.chords.ChordSymbols.pitches(theChord);
      this.errorHint = '';
    } catch (e) {
      this.errorHint = '⛔  ' + e;
    }
  }

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

  getTempo(newQPM: string) {
    this.BL_DEFAULT_QPM = parseInt(newQPM);
  }

}
