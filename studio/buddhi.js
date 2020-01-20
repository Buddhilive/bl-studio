//Magenta models initializing
/* const musicEngine = new mm.MusicVAE('https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/multitrack_chords');
const modelEngine = new mm.MusicVAE('https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_2bar_small'); */

const musicEngine = new mm.MusicVAE('checkpoints/multitrack_chords');
const modelEngine = new mm.MusicVAE('checkpoints/mel_2bar_small');

//Initializing Elements Variables
const chordProgSelector = document.querySelector('#bl-chordprogression');
const statusSpinner = document.querySelector('#bl-spinner');
const statusText = document.querySelector('.status-text');
const btnShuffle = document.querySelector('#btnShuffle');
const btnGenerate = document.querySelector('#btnGenerate');
const btnPlay = document.querySelector('#btnPlay');
const btnSave = document.querySelector('#btnSave');

//Global Variables
let encodedMusic;
let genSeq = [];
let generatedMusic;
let playSample;
let downloadSample;
let randomNum = 1;
let theChords = ["D", "Bm", "G", "A"];
const audioPlayer = initPlayerAndEffects();
const melodySamplesArray = [Melody1, Melody2, Melody3, Melody4, Melody5];
let melodySample = Melody1;
const chordProgressionsArray = [
    ['C, Am, F, G', 0],
    ['D, Bm, G, A', 1],
    ['F, Dm, Bb, C', 2],
    ['G, Am, C, D', 3]
];

const chordProgressions = [
    ['C', 'Am', 'F', 'G'],
    ['D', 'Bm', 'G', 'A'],
    ['F', 'Dm', 'Bb', 'C'],
    ['G', 'Am', 'C', 'D']
]

Promise.all([musicEngine.initialize(), modelEngine.initialize()]).then(() => {
    console.log('Loaded!');
    statusSpinner.style.visibility = "hidden";
    statusText.innerHTML = "Ready!";
    statusText.classList.remove('processing');
    btnShuffle.disabled = false;
    btnGenerate.disabled = false;
});

/* 
Here goes the main functions
 */

//Load chord progressions to the dropdown menu
chordProgSelector.setOptions(chordProgressionsArray);

//shuffle melody samples
btnShuffle.addEventListener('click', () => {
    randomNum = Math.floor((Math.random() * 5));
    melodySample = melodySamplesArray[randomNum];
});

//Save Generated Melody as MIDI
btnSave.addEventListener('click', () => {
    try {
        const midiB = mm.sequenceProtoToMidi(playSample);
        const fileB = new Blob([midiB], { type: 'audio/midi' });

        const a = document.createElement('a');
        const urlForFile = URL.createObjectURL(fileB);
        a.href = urlForFile;
        //a.innerHTML = "Download";
        a.download = 'buddhilive_' + Date.now() + '.mid';
        a.click();

    } catch (error) {
        statusText.innerHTML = "Oops! Something went wrong! Try generating again. Error: " + error;
        btnSave.disabled = true;
    }

});

//Play Generated Melody
btnPlay.addEventListener('click', () => {
    audioPlayer.start(playSample);
});

/* 
This is the main function that generates melody
 */
btnGenerate.addEventListener('click', async() => {

    let chordIndex = parseInt(chordProgSelector.getValue());
    console.log(chordIndex, typeof chordIndex);
    if (chordIndex >= 0) {
        theChords = chordProgressions[chordIndex];
    }

    statusText.innerHTML = "Sample " + randomNum + " Encoding...";
    statusText.classList.add('processing');

    await modelEngine.encode([melodySample]).then(sample => {
        console.log("Namo Buddhaya!", sample);
        statusText.innerHTML = "Latent Vector Generated..."
        encodedMusic = sample;
    });

    genSeq = [];

    theChords.map(async(chords) => {
        console.log(chords);

        statusText.innerHTML = "Melody Sample is Generating for " + chords + " Chord...";

        Promise.all([musicEngine.decode(encodedMusic, 1, [chords], 24).then(sample => {
            console.log("done", sample);
            genSeq.push(sample[0]);
        })]).then(() => {
            downloadSample = playSample;
            playSample = concatenateSequences(genSeq);
        });
    });



    statusText.innerHTML = "Melody Generation Completed!";
    statusText.classList.remove('processing');

    btnPlay.disabled = false;
    btnSave.disabled = false;
});

/* 
These functions are taken from Magenta Example
 */

//Initializing SoundFont Player
function initPlayerAndEffects() {
    const MAX_PAN = 0.2;
    const MIN_DRUM = 35;
    const MAX_DRUM = 81;

    // Set up effects chain.
    const globalCompressor = new mm.Player.tone.MultibandCompressor();
    const globalReverb = new mm.Player.tone.Freeverb(0.25);
    const globalLimiter = new mm.Player.tone.Limiter();
    globalCompressor.connect(globalReverb);
    globalReverb.connect(globalLimiter);
    globalLimiter.connect(mm.Player.tone.Master);

    // Set up per-program effects.
    const programMap = new Map();
    for (let i = 0; i < 128; i++) {
        const programCompressor = new mm.Player.tone.Compressor();
        const pan = 2 * MAX_PAN * Math.random() - MAX_PAN;
        const programPanner = new mm.Player.tone.Panner(pan);
        programMap.set(i, programCompressor);
        programCompressor.connect(programPanner);
        programPanner.connect(globalCompressor);
    }

    // Set up per-drum effects.
    const drumMap = new Map();
    for (let i = MIN_DRUM; i <= MAX_DRUM; i++) {
        const drumCompressor = new mm.Player.tone.Compressor();
        const pan = 2 * MAX_PAN * Math.random() - MAX_PAN;
        const drumPanner = new mm.Player.tone.Panner(pan);
        drumMap.set(i, drumCompressor);
        drumCompressor.connect(drumPanner);
        drumPanner.connect(globalCompressor);
    }

    // Set up SoundFont player.
    const player = new mm.SoundFontPlayer(
        'https://storage.googleapis.com/download.magenta.tensorflow.org/soundfonts_js/sgm_plus',
        globalCompressor, programMap, drumMap);
    return player;
}

//concatenate Generated Samples
function concatenateSequences(seqs) {
    try {
        const seq = mm.sequences.clone(seqs[0]);
        let numSteps = seqs[0].totalQuantizedSteps;
        for (let i = 1; i < seqs.length; i++) {
            const s = mm.sequences.clone(seqs[i]);
            s.notes.forEach(note => {
                note.quantizedStartStep += numSteps;
                note.quantizedEndStep += numSteps;
                seq.notes.push(note);
            });
            numSteps += s.totalQuantizedSteps;
        }
        seq.totalQuantizedSteps = numSteps;

        return seq;

    } catch (error) {
        statusText.innerHTML = "Oops! Something went wrong! Try generating again. Error: " + error;
    }

}