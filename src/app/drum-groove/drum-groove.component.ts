import { Component, OnInit } from '@angular/core';
import * as magenta from '@magenta/music/es6';
import { MatSnackBar } from '@angular/material/snack-bar';
import { GlobalVariables } from '../shared/global.variables';

@Component({
  selector: 'app-drum-groove',
  templateUrl: './drum-groove.component.html',
  styleUrls: ['./drum-groove.component.scss']
})
export class DrumGrooveComponent implements OnInit {

  modelVEA = new magenta.MusicVAE(this.globalVar.MODEL_DRUM_GROOVE);
  sampleGenerated: any;
  BL_DEFAULT_QPM = 120;
  BL_DEFAULT_STEPS = 4;
  BL_DEFAULT_BARS = 16;
  BL_DEFAULT_VARIATION = 0.5;
  playButtonText = 'play_arrow';
  player = new magenta.Player();
  buttonActive = true;
  readyState = false;
  errorHint: any;
  hintColor = '#ff0000';

  constructor(
    private _snackBar: MatSnackBar,
    private globalVar: GlobalVariables
  ) { }

  ngOnInit() {
    this.modelVEA.initialize().then(() => {
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
      this.player.start(this.sampleGenerated).then(() => {
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
      const drumSamples = await this.modelVEA.sample(1, this.BL_DEFAULT_VARIATION);
      //this.sampleGenerated = magenta.sequences.quantizeNoteSequence(drumSamples[0], 1);
      this.sampleGenerated = drumSamples[0];
      this.buttonActive = false;
      console.log(this.sampleGenerated, drumSamples);
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

}
