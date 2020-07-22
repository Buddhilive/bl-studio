import { Component, OnInit } from '@angular/core';
import * as magenta from '@magenta/music/es6';

@Component({
  selector: 'app-trios',
  templateUrl: './trios.component.html',
  styleUrls: ['./trios.component.scss']
})
export class TriosComponent implements OnInit {

  model = new magenta.MusicVAE('assets/checkpoints/groovae_4bar');
  modelRnn = new magenta.MusicRNN('https://storage.googleapis.com/magentadata/js/checkpoints/music_rnn/chord_pitches_improv');
  //audioplayer = new mm.SoundFontPlayer('https://storage.googleapis.com/download.magenta.tensorflow.org/soundfonts_js/sgm_plus');
  player = new magenta.Player();
  sampleGenerated: any;
  chords = ['Bm', 'Bbm', 'Gb7', 'F7', 'Ab', 'Ab7', 'G7', 'Gb7', 'F7', 'Bb7', 'Eb7', 'AM7'];
  Melody1 = {
    notes: [
      { pitch: 60, quantizedStartStep: 0, quantizedEndStep: 2 },
      { pitch: 60, quantizedStartStep: 2, quantizedEndStep: 4 },
      { pitch: 67, quantizedStartStep: 4, quantizedEndStep: 6 },
      { pitch: 67, quantizedStartStep: 6, quantizedEndStep: 8 },
      { pitch: 69, quantizedStartStep: 8, quantizedEndStep: 10 },
      { pitch: 69, quantizedStartStep: 10, quantizedEndStep: 12 },
      { pitch: 67, quantizedStartStep: 12, quantizedEndStep: 16 },
      { pitch: 65, quantizedStartStep: 16, quantizedEndStep: 18 },
      { pitch: 65, quantizedStartStep: 18, quantizedEndStep: 20 },
      { pitch: 64, quantizedStartStep: 20, quantizedEndStep: 22 },
      { pitch: 64, quantizedStartStep: 22, quantizedEndStep: 24 },
      { pitch: 62, quantizedStartStep: 24, quantizedEndStep: 26 },
      { pitch: 62, quantizedStartStep: 26, quantizedEndStep: 28 },
      { pitch: 60, quantizedStartStep: 28, quantizedEndStep: 32 }
    ],
    quantizationInfo: { stepsPerQuarter: 1 },
    tempos: [{ time: 0, qpm: 120 }],
    totalQuantizedSteps: 32
  };

  constructor() { }

  ngOnInit() {
    this.model.initialize();
    this.modelRnn.initialize();
    //this.player.start(this.Melody1);
  }

  playMusic() {
    console.log('generating music');
    this.player.stop();
    this.model.sample(1)
      .then(samples => {
        console.log(samples);
        this.sampleGenerated = samples[0];
        this.player.resumeContext();
        this.player.start(samples[0]);
      });
  }

  async generateSamples() {
    try {
      console.log('generating music');
      const seq = {
        quantizationInfo: { stepsPerQuarter: 1 },
        notes: [],
        totalQuantizedSteps: 1
      };
      this.player.stop();
      const qns = magenta.sequences.quantizeNoteSequence(this.Melody1, 4);
      this.sampleGenerated = await this.modelRnn.continueSequence(seq, 64, 0.9, ['CMaj7', 'GMaj7', 'AMaj7', 'FMaj7']);
      console.log(this.sampleGenerated);
      this.player.resumeContext();
      this.player.start(this.sampleGenerated);
    } catch (error) {
      console.log(error);
    }
  }

  downloadMIDI() {
    console.log(magenta.sequences.isQuantizedSequence(this.sampleGenerated));
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

}
