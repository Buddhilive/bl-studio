// This file can be replaced during build by using the `fileReplacements` array.
// `ng build --prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment = {
  production: false,
  improv_rnn: 'assets/checkpoints/improv_rnn',
  drum_groove: 'assets/checkpoints/groovae_4bar',
  mel_chords: 'assets/checkpoints/mel_chords',
  drumskit: 'assets/checkpoints/groovae_4bar',
  onset_frames: 'assets/checkpoints/onset_frames',
  spice: 'assets/checkpoints/spice',
  ddsp_sax: 'assets/checkpoints/ddsp'
};

/*
 * For easier debugging in development mode, you can import the following file
 * to ignore zone related error stack frames such as `zone.run`, `zoneDelegate.invokeTask`.
 *
 * This import should be commented out in production mode because it will have a negative impact
 * on performance if an error is thrown.
 */
// import 'zone.js/dist/zone-error';  // Included with Angular CLI.
