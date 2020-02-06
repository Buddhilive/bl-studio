//Magenta models initializing
const musicEngine = new mm.MusicVAE('https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/multitrack_chords');
const modelEngine = new mm.MusicVAE('https://storage.googleapis.com/magentadata/js/checkpoints/music_vae/mel_2bar_small');

/* const musicEngine = new mm.MusicVAE('../../checkpoints/multitrack_chords');
const modelEngine = new mm.MusicVAE('../../checkpoints/mel_2bar_small'); */

//Initializing Elements Variables
const chordProgSelector = document.querySelectorAll('.chords');
const statusText = document.querySelector('.status-text');
const btnShuffle = document.querySelector('#btnShuffle');
const btnGenerate = document.querySelector('#btnGenerate');
const btnPlay = document.querySelector('#btnPlay');
const btnSave = document.querySelector('#btnSave');
const btnMerge = document.querySelector('#btnMerge');
const btnProceed = document.querySelector('#btnProceed');
const btnNew = document.querySelector('#btnNew');
const btnSkip = document.querySelector('#btnSkip');
const stepSections = document.querySelectorAll('.bl-controllers--wrapper');

//Global Variables
let encodedMusic;
let genSeq = [];
let generatedMusic;
let playSample;
let randomNum = 1;
let theChords = [];
const audioPlayer = new mm.SoundFontPlayer('https://storage.googleapis.com/download.magenta.tensorflow.org/soundfonts_js/sgm_plus');
const melodySamplesArray = [Melody1, Melody2, Melody3, Melody4, Melody5];
let melodySample = Melody1;

const chordProgressions = ['F', 'Dm', 'Bb', 'C'];

//assign onclick functions to butons
btnProceed.onclick = getChordProgression;
btnShuffle.onclick = generateSample;
btnGenerate.onclick = generateMultiChords;
btnMerge.onclick = mergeSequences;
btnPlay.onclick = playSequence;
btnSave.onclick = saveSequence;
btnNew.onclick = reinitializeTool;
btnSkip.onclick = skipToDownload;

Promise.all([musicEngine.initialize(), modelEngine.initialize()]).then(() => {
    console.log('Loaded!');
    statusText.style.display = 'none';
    stepSections[0].style.display = 'block';
    document.querySelector('.step-status-text1').innerHTML = 'Ready!';
    document.querySelector('.splash-screen').style.display = 'none';
});

/* 
Here goes the main functions
 */

//Load chord default progressions at initialization
function setChordProgression() {
    chordProgSelector.forEach((elmnt, indx) => {
        elmnt.value = chordProgressions[indx];
    });
}

//Get chord progressions
function getChordProgression() {
    theChords = [];
    chordProgSelector.forEach((elmnt, indx) => {
        try {
            mm.chords.ChordSymbols.pitches(elmnt.value);
            theChords.push(elmnt.value);
        } catch (error) {
            document.querySelector('.step-status-text1').innerHTML = 'Invalid Chord: "' + elmnt.value + '"';
        }
    });

    for (let i = 0; i < 9; i++) {
        for (let j = 0; j < 4; j++) {
            theChords.push(theChords[j]);
        }
    }

    if (theChords.length == 40) {
        //document.querySelector('.step-status-text2').innerHTML = 'Chord Progressions Set!'
        stepSections[1].style.display = 'block';
        stepSections[0].style.display = 'none';
    }
}

//Generate sample
function generateSample() {
    randomNum = Math.floor((Math.random() * 5));
    melodySample = melodySamplesArray[randomNum];
    try {
        modelEngine.encode([melodySample]).then(sample => {
            console.log("Encoding", sample);
            encodedMusic = sample;
        }).then(() => {
            document.querySelector('.step-status-text3').innerHTML = 'Music Generating...'
            document.querySelector('.step-status-text3').classList.add('processing');
            document.querySelector('.step-status-text3').style.display = 'none';
            stepSections[2].style.display = 'block';
            stepSections[1].style.display = 'none';
        });
    } catch (error) {
        document.querySelector('.step-status-text2').innerHTML = 'Oops something went wrong. Error: ' + error;
    }

}

/* 
This is the main function that generates melody
 */
async function generateMultiChords() {
    genSeq = [];
    try {
        theChords.map((chords, index) => {
            console.log(chords + " at " + index);
            musicEngine.decode(encodedMusic, 1, [chords], 24).then(sample => {
                console.log("Done", sample);
                genSeq.push(sample[0]);
            });
        });

        //document.querySelector('.step-status-text4').innerHTML = 'Music Sequences Generated!'
        stepSections[3].style.display = 'block';
        stepSections[2].style.display = 'none';
    } catch (error) {
        document.querySelector('.step-status-text3').innerHTML = 'Oops something went wrong. Error: ' + error;
    }

}

//concatenate Generated Samples
async function mergeSequences() {
    try {
        const tempseq = mm.sequences.clone(genSeq[0]);
        let numSteps = genSeq[0].totalQuantizedSteps;
        for (let i = 1; i < genSeq.length; i++) {
            const seqZ = mm.sequences.clone(genSeq[i]);
            seqZ.notes.forEach((note, index) => {
                if (note.pitch > 10) {
                    note.quantizedStartStep += numSteps;
                    note.quantizedEndStep += numSteps;
                    tempseq.notes.push(note);
                } else {
                    console.log(note.pitch + " ignored!");
                }

            });
            numSteps += seqZ.totalQuantizedSteps;
        }
        tempseq.totalQuantizedSteps = numSteps;

        playSample = tempseq;

        //document.querySelector('.step-status-text5').innerHTML = 'Sequences Merged Successfully!'
        stepSections[4].style.display = 'block';
        stepSections[3].style.display = 'none';

    } catch (error) {
        document.querySelector('.step-status-text4').innerHTML = 'Oops something went wrong. Error: ' + error;
    }

}

//Refining Sequences
function refineSequences(sequenz) {
    const instrumentSeq = mm.sequences.mergeInstruments(sequenz);
    const unquantizedSeq = mm.sequences.unquantizeSequence(instrumentSeq);
    unquantizedSeq.ticksPerQuarter = 24;
    return unquantizedSeq;
}

//Play Generated Melody
function playSequence() {
    document.querySelector('.step-status-text5').innerHTML = 'Player Initializing...'
    document.querySelector('.step-status-text5').classList.add('processing');
    if (audioPlayer.isPlaying()) {
        audioPlayer.stop();
        btnPlay.innerHTML = '<i class="material-icons">play_arrow</i> Replay';
        document.querySelector('.step-status-text5').innerHTML = 'Player Stoped';
    } else {
        audioPlayer.loadSamples(playSample).then(() => {
            btnPlay.innerHTML = '<i class="material-icons">stop</i> Stop';
            document.querySelector('.step-status-text5').innerHTML = 'Playing...';
            audioPlayer.start(playSample).then(() => {
                document.querySelector('.step-status-text5').innerHTML = 'Played!'
                btnPlay.innerHTML = '<i class="material-icons">play_arrow</i> Replay';
                stepSections[5].style.display = 'block';
                stepSections[4].style.display = 'none';
            });
        });
    }
}

//Skip to download
function skipToDownload() {
    stepSections[5].style.display = 'block';
    stepSections[4].style.display = 'none';
}

//Save Generated Melody as MIDI
function saveSequence() {
    try {
        const midiB = mm.sequenceProtoToMidi(playSample);
        const fileB = new Blob([midiB], { type: 'audio/midi' });

        const a = document.createElement('a');
        const urlForFile = URL.createObjectURL(fileB);
        a.href = urlForFile;
        //a.innerHTML = "Download";
        a.download = 'buddhilive_' + Date.now() + '.mid';
        a.click();
        document.querySelector('.step-status-text6').innerHTML = "Downloaded!";
    } catch (error) {
        document.querySelector('.step-status-text6').innerHTML = "Oops! Something went wrong! Try generating again. Error: " + error;
        btnSave.disabled = true;
    }
}

//Reinitialize
function reinitializeTool() {
    for (let i = 1; i <= 6; i++) {
        document.querySelector('.step-status-text' + i).innerHTML = "";
    }
    stepSections.forEach((elmnt, index) => {
        if (index == 4 || index == 5) {
            elmnt.classList.add('disable-step');
        }
    });
    stepSections[0].style.display = 'block';
    stepSections[5].style.display = 'none';
}

function displayMessage() {
    setTimeout(() => {
        document.querySelector('.step-status-text3').innerHTML = 'Music Sequences Generating!'
        document.querySelector('.step-status-text3').classList.add('processing');
    }, 30000);
}


window.onload = () => {
    setChordProgression();
}