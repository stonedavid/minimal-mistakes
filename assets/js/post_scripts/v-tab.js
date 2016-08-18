// TODO write a random rhythm generator that returns a list of durations that sums to the given length
// all note lengths are powers of 2! up to 4
var randRhythm = function(){

	var rhythmDict = {
		1: 'w',
		0.5: 'h',
		0.25: 'q',
		0.125: 'e'
	};

	var totalDuration = 0,durations = [];

	while (totalDuration!=1) {

		if (totalDuration>1) {
			durations.pop();
			denominator = Math.pow(2,(Math.floor(Math.random() * 4)))
			durations.push(1/denominator)
			totalDuration=durations.reduce( ( a, b ) => a + b, 0);
			continue
		}
		denominator = Math.pow(2,(Math.floor(Math.random() * 4)))
		durations.push(1/denominator)
		totalDuration=durations.reduce( ( a, b ) => a + b, 0);

	};

	return durations.map(function(e) {return rhythmDict[e]});
};

//TODO!!! figure out loop to assign durations and generate random note value

var randNotes = function(){
	var rhythms = randRhythm();
	var notes = [];
	rhythms.forEach(function(e) {notes.push(
		new Vex.Flow.StaveNote({ keys: ["c/5"], duration: e }))});
	return notes;
}

// TODO Make wrapper function to draw grand staff?
// Formatter.getMinTotalWidth() will automatically calculate width of a voice

var VF = Vex.Flow

var canvas = $("div canvas")[0];
var renderer = new VF.Renderer(canvas,
VF.Renderer.Backends.CANVAS);

var ctx = renderer.getContext();

canvas.width = 800;
canvas.height = 600;

var renderer = new Vex.Flow.Renderer(canvas, Vex.Flow.Renderer.Backends.CANVAS);
var ctx = renderer.getContext();
ctx.clearRect(0, 0, canvas.width, canvas.height);

var start = 50;
var width = 250;

function grandStaffMeasure(ctx,x,y,width,brace=false,clefs=false) {
	var treble = new Vex.Flow.Stave(x, y, width);
	var bass = new Vex.Flow.Stave(x, 80, width);

	if (clefs) {	
		treble.addClef("treble");
		bass.addClef("bass");
	};

	treble.setContext(ctx).draw();
	bass.setContext(ctx).draw();

	if (brace) {
		var brace = new Vex.Flow.StaveConnector(treble, bass);
		brace.setType(Vex.Flow.StaveConnector.type.BRACKET);
		brace.setContext(ctx).draw();
	} else {
		var startBar = new Vex.Flow.StaveConnector(treble, bass);
		startBar.setType(Vex.Flow.StaveConnector.type.SINGLE);
		startBar.setContext(ctx).draw();
	};

	return { treble:treble , bass:bass }
};

// Generating notes

var notesTreble = randNotes();

var notesBass = [
  new Vex.Flow.StaveNote({ keys: ["c/3"], duration: "h", clef: "bass" }),
  new Vex.Flow.StaveNote({ keys: ["g/3"], duration: "h", clef: "bass" })
];

// Helper function for making voices?

function create_4_4_voice(staff) {
  return new Vex.Flow.Voice({
    num_beats: 4,
    beat_value: 4,
    resolution: Vex.Flow.RESOLUTION
  });
}



// Convert note lists into voice objects

var voiceTreble = create_4_4_voice().addTickables(notesTreble);
var voiceBass = create_4_4_voice().addTickables(notesBass);

// Just generating the staves

var gStaff1 = grandStaffMeasure(ctx,start,0,width,clefs=true,brace=true)
var treble1 = gStaff1.treble
var bass1 = gStaff1.bass

var gStaff2 = grandStaffMeasure(ctx,start+width,0,width)
var treble2 = gStaff2.treble
var bass2 = gStaff2.bass

// Formatter aligns voices width-wise

var formatter = new Vex.Flow.Formatter()
  .joinVoices([voiceTreble, voiceBass]);

formatter.joinVoices([voiceTreble]);
formatter.joinVoices([voiceBass]);
formatter.formatToStave([voiceTreble, voiceBass], treble1, {align_rests: true});
formatter.formatToStave([voiceTreble, voiceBass], treble2, {align_rests: true});

var max_x = Math.max(treble1.getNoteStartX(), bass1.getNoteStartX());
treble1.setNoteStartX(max_x);
bass1.setNoteStartX(max_x);

// Draw them on the staves

voiceTreble.draw(ctx, treble1);
voiceBass.draw(ctx, bass1);
voiceTreble.draw(ctx, treble2);
voiceBass.draw(ctx, bass2);