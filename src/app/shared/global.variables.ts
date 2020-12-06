import { environment } from '../../environments/environment';
export class GlobalVariables {
  MODEL_IMPROV_RNN = environment.improv_rnn;
  MODEL_VAE_MELODY = environment.mel_chords;
  MODEL_DRUM_GROOVE = environment.drum_groove;
  MODEL_VAE_DRUMS = environment.drumskit;
  MODEL_MIDIME = environment.onset_frames;
}
