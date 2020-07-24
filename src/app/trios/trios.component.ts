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
  sampleGenerated: any;
  BL_DEFAULT_QPM = 120;
  BL_DEFAULT_STEPS = 4;
  BL_DEFAULT_BARS = 16;
  BL_DEFAULT_VARIATION = 0.5;
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
  player = new magenta.Player(false, {
    run: (note) => {
      this.BLS_VISUALIZER.redraw(note);
    },
    stop: () => { }
  });
  buttonActive = true;
  readyState = false;
  errorHint: any;
  hintColor = '#ff0000';

  constructor(
    private _snackBar: MatSnackBar,
    private globalVar: GlobalVariables
  ) { }

  ngOnInit() {
    this.modelRnn.initialize().then(() => {
      this.openSnackBar('🎶 Model Initialized!');
      this.readyState = true;
    });
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
      this.player.start(this.sampleGenerated, this.BL_DEFAULT_QPM).then(() => {
        this.playButtonText = 'play_arrow';
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
      this.openSnackBar('🎹 Music Generation Started!');
      const chordsEL = this.chordProgression.nativeElement.querySelectorAll('.improvrnn__chords--key');
      chordsEL.forEach((element, elIndex) => {
        this.BL_DEFAULT_CHORDS[elIndex] = element.querySelector('input').value;
      });
      console.log(this.BL_DEFAULT_MELODY.tempos[0].qpm);
      console.log(this.BL_DEFAULT_CHORDS, this.BL_DEFAULT_QPM, this.BL_DEFAULT_BARS, this.BL_DEFAULT_STEPS, this.BL_DEFAULT_VARIATION);
      this.player.stop();
      this.sampleGenerated = await this.modelRnn.continueSequence(
        this.BL_DEFAULT_MELODY, this.BL_DEFAULT_STEPS * this.BL_DEFAULT_BARS, this.BL_DEFAULT_VARIATION, this.BL_DEFAULT_CHORDS
      );
      this.sampleGenerated = magenta.sequences.quantizeNoteSequence(
        magenta.sequences.unquantizeSequence(this.sampleGenerated, this.BL_DEFAULT_QPM),
        this.BL_DEFAULT_STEPS
      );
      console.log(this.sampleGenerated);
      this.BLS_VISUALIZER = new PianoRollCanvasVisualizer(
        this.sampleGenerated, this.pianoRollCanvas.nativeElement, this.BLS_CONFIG
      );
      this.buttonActive = false;
      this.openSnackBar('🎹 Music Generated!');
    } catch (error) {
      console.log(error);
    }
  }

  downloadMIDI() {
    this.openSnackBar('Downloaded!');
    let sampleSeq = this.sampleGenerated;
    if (!magenta.sequences.isQuantizedSequence(this.sampleGenerated)) {
      sampleSeq = magenta.sequences.quantizeNoteSequence(this.sampleGenerated, 1);
    }
    sampleSeq.notes.forEach(n => n.velocity = 100);
    const midiB = magenta.sequenceProtoToMidi(sampleSeq);
    const fileB = new Blob([midiB], { type: 'audio/midi' });
    const a = document.createElement('a');
    const urlForFile = URL.createObjectURL(fileB);
    a.href = urlForFile;
    a.download = 'buddhilive_' + Date.now() + '.mid';
    a.click();
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
      this.readyState = false;
      this.errorHint = '⛔ No Chord Provided!';
    }
    try {
      magenta.chords.ChordSymbols.pitches(theChord);
      this.readyState = true;
      this.errorHint = '';
    } catch (e) {
      this.readyState = false;
      this.errorHint = '⛔  ' + e;
    }
  }

  getTempo(newQPM: string) {
    this.BL_DEFAULT_QPM = parseInt(newQPM);
  }

}
