import { Component, OnInit } from '@angular/core';
import * as magenta from '@magenta/music/es6';
import { GlobalVariables } from '../shared/global.variables';

@Component({
  selector: 'app-voice-key',
  templateUrl: './voice-key.component.html',
  styleUrls: ['./voice-key.component.scss']
})
export class VoiceKeyComponent implements OnInit {

  readyState = false;
  midiMe = new magenta.OnsetsAndFrames(this.globalVar.MODEL_MIDIME);
  audioBlob: any;
  audioPlayer = new magenta.Player();

  playButtonText = 'play_arrow';
  buttonActive = true;

  BL_VOICE_MELODY: any;

  constructor(
    private globalVar: GlobalVariables
  ) { }

  ngOnInit() {
    this.midiMe.initialize().then(() => {
      this.readyState = true;
    });
  }

  async transformAudio(event) {
    this.audioBlob = await this.globalVar.uploadFile(event);
    console.log(this.audioBlob);
    this.BL_VOICE_MELODY = await this.midiMe.transcribeFromAudioURL(this.audioBlob);
    this.buttonActive = false;
  }

  downloadMIDI() {
    const midiB = magenta.sequenceProtoToMidi(this.BL_VOICE_MELODY);
    this.globalVar.download(midiB, 'audio/midi', 'voicekey');
  }

  startPlayer() {
    this.audioPlayer.resumeContext();
    if (this.audioPlayer.getPlayState() === 'started') {
      this.audioPlayer.stop();
      this.playButtonText = 'play_arrow';
    } else if (this.audioPlayer.getPlayState() === 'paused') {
      this.audioPlayer.resume();
      this.playButtonText = 'stop';
    } else if (this.audioPlayer.getPlayState() === 'stopped') {
      this.audioPlayer.start(this.BL_VOICE_MELODY).then(() => {
        /* this.playButtonText = 'play_arrow'; */
        this.startPlayer();
      });
      this.playButtonText = 'stop';
    }
  }
}
