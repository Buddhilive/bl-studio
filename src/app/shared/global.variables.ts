import { resolve } from 'url';
import { environment } from '../../environments/environment';
export class GlobalVariables {
  MODEL_IMPROV_RNN = environment.improv_rnn;
  MODEL_VAE_MELODY = environment.mel_chords;
  MODEL_DRUM_GROOVE = environment.drum_groove;
  MODEL_VAE_DRUMS = environment.drumskit;
  MODEL_MIDIME = environment.onset_frames;

  /**
   * Makes data downloadable
   * @param downloadData Data to convert in to Blob
   * @param fileType Expected file type to download (eg: 'audio/midi' or 'audio/wav')
   * @param toolName Name of the component (eg: 'ToneBreaker')
   */
  download(downloadData: any, fileType: string, toolName: string) {
    const blob = new Blob([downloadData], { type: fileType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const urlForFile = URL.createObjectURL(blob);
    a.href = urlForFile;
    /* if (fileType === 'audio/midi') {
      a.download = 'buddhilive_' + toolName + '_' + Date.now() + '.midi';
    }
    if (fileType === 'audio/wav') {
      a.download = 'buddhilive_' + toolName + '_' + Date.now() + '.wav';
    } */
    const fileExtension = fileType.split('/');
    a.download = 'buddhilive_' + toolName + '_' + Date.now() + '.' + fileExtension[1];
    a.click();
  }

  /**
   *
   * @param onChangeEvent On Changed Event object from File input.
   * @returns Blob URL of the uploaded file.
   */

  uploadFile(onChangeEvent: any) {
    return new Promise((resolve, reject) => {
      const file = onChangeEvent.target.files[0];
      const reader = new FileReader();
      let filePath;
      reader.onload = async (e: any) => {
        filePath = e.target.result;
        resolve(filePath);
      };
      reader.readAsDataURL(file);
    });
  }

  /* async concatenateNoteSequence(xNoteSequence: Array<any>) {
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
  } */
}
