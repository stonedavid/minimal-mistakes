---
layout: single
author_profile: true
comments: true
---

Ever since Andrej Karpathy published his fantastic [RNN implementation](https://github.com/karpathy/char-rnn) last year, there have been a [lot](https://medium.com/@samim/obama-rnn-machine-generated-political-speeches-c8abd18a2ea0#.o3mgc438b) of [great](https://www.gwern.net/RNN%20metadata) examples  [using](https://www.csail.mit.edu/deepdrumpf) it to generate text. 

As Karpathy demonstrated in his inital [post](http://karpathy.github.io/2015/05/21/rnn-effectiveness/), char-rnn works on any data as long as it's munged into ascii, including HTML or LaTeX. Algorithmic composition is one of my main areas of interest, and I've been champing at the bit to try using deep learning to generate music. A [couple](https://maraoz.com/2016/02/02/abc-rnn/) [examples](http://www.hexahedria.com/2015/08/03/composing-music-with-recurrent-neural-networks/) of this already exist, but I figured I'd try my hand anyway and see if I could get something a little different. 

I'd seen people try training it on raw MIDI hexes, which I was shocked to see actually generated parseable files, if not any comprehensible 'music'. There are numerous examples using the [Nottingham](http://abc.sourceforge.net/NMD/) dataset, which is a small corpus of folk songs notated in abc notation, as well as the [piano-midi.de](http://www.piano-midi.de) set of classical piano pieces. One thing I know for sure about deep learning, is that the more data the better, and I love trying to amass enormous datasets for training networks.

So I opted to grab the huge zip archives from [kunstderfuge](http://www.kunstderfuge.com), which are free with a subscription, and parse them down into the densest possible character based representation. 

***

## MIDI Munging ##
<br/>
MIDI is an ancient protocol for rapid communication between synthesizers. MIDI formatted files require a sequencer for playback or recording, and they are basically compiled down to binary for storage and transmission. Open up a .mid file in Sublime Text and you should see something like:

```
4d54 6864 0000 0006 0000 0001 0078 4d54
726b 0000 2217 00ff 0313 476f 6c64 6265
7267 2056 6172 6961 7469 6f6e 7300 ff03
0b56 6172 6961 7469 6f6e 2031 00ff 0122
```

Beautiful! But there's actually about a 20% overhead in the average midi file, including headers, track objects, tempo changes, control changes, etc. I wasn't so keen to spend a lot of training time just pushing the network to generate parseable midi, so this method offloads all that boilerplate into an input and output script. I used [MidiConverter](http://www.jsresources.org/examples/MidiConverter.html) to squash all the Type 1 (multi-track) files into single tracks, and then [Mido](https://mido.readthedocs.io/en/latest/) in Python to dump all the notes in one huge .csv file.

```python
from mido import MidiFile, MetaMessage
from collections import Counter
import os, math, sys

d = sys.argv[1]

s = ''

for file in os.listdir(d):

	if file.endswith('.mid'):

		midi = MidiFile(d+file)
		track = midi.tracks[0]

		meta_time = 0

		for i,m in enumerate(track):

			if m.type == 'time_signature':
				next_100_notes = [n.note%12 for n in track[i:i+500] if n.type=='note_on'][:100]
				key_center = get_key_center(next_100_notes)

			if m.type == 'note_on':
				s+='{},{},{}\n'.format(m.velocity,m.note-key_center,meta_time+m.time)
				meta_time = 0

			elif m.type == 'note_off':
				s+='{},{},{}\n'.format(0,m.note-key_center,meta_time+m.time)
				meta_time = 0

			else:
				meta_time += m.time

```

No headers, no control changes, just the plain notes. All that overhead is taken care of in the output script to format those values into actual midi events. 

The only normalization comes after the `time_signature` condition test: if there is a time signature change, it's likely that there is a new key center as well. `next_100_notes` is a list comprehension that retrieves the next 100 note-on values, mod 12. The `key_center` function uses `Counter` to compute the 7 most common notes in the next 100 notes, and returns an offset based on the estimated key center. This roughly transposes every piece to C major, more or less. 

[Hexahedria](http://www.hexahedria.com/2015/08/03/composing-music-with-recurrent-neural-networks/) generated excellent results by limiting the data to 4/4 and encoding a model for harmony, but I was curious to see if the vanilla RNN could generate those structures implicitly. Worst case scenario, the music would be a little weird, but I like weird music anyway.

***

## Results ##
<br/>

After some experimentation with hyperparameters, char-rnn started to deliver:

##### Trained on J. S. Bach #####
<audio id='bach' src='../assets/data/JSB_aac.m4a' controls></audio>

Clearly, this won't be winning any Grammys. Still, I'm amazed at the consistent contrapuntal texture in the Bach example, trading motion back-and-forth between two independent lines. It stays identifiably in G major throughout, sometimes clearly outlining the harmony and often slipping into some strange alterations. It's clearly "Bachian", if Bach had suffered some catastrophic injury that limited his attention span to about two-and-a-half seconds.

##### Trained on L. v. Beethoven #####
<audio id='lvb' src='../assets/data/LVB_aac.m4a' controls></audio>

I like this even more than the Bach, because of how much more dynamic it is. You might be familiar with the history of "[dynamic markings](https://en.wikipedia.org/wiki/Dynamics_(music)#Relative_loudness)" in music, or explicit instructions for volume. Bach wrote for keyboard instruments that had non-existent dynamic range (harpsichord) or extremely limited (clavichord and organ). By Beethoven's day, the piano was nearly perfected and could execute a wide range of volumes -- Beethoven is famous (infamous) for his attention to detail with respect to dynamic markings. So, while the Bach MIDI has each note encoded at full velocity, the Beethoven library is full of *crescendi* and *decrescendi*, explosive *sforzandi* and abrupt *subito piani*.

The inclusion of dynamics makes for much more "human" sounding piece, and the RNN is able to maintain a smooth *crescendo* throughout the first half of the sample. The *subito piano* in the last few moments is very characteristic of Beethoven as well. It's a stretch, but this interpretation of Beethoven, famous resident of Vienna, reminds me of the deconstructed harmonic language of the 20th century Viennese school, epitomized by Alban Berg:

***
<iframe width="420" height="315" src="https://www.youtube.com/embed/G7LzU9hnM6Y" frameborder="0" allowfullscreen></iframe>
***
Dense chords in novel juxtapositions, a sense of counterpoint in the complexity, unified by romantic phrasing and dynamics. Of course, a huge element of both Beethoven and Berg's compositions is a thematic and melodic unity over very long time-spans. RNNs like this still can't preserve a melodic cell and have it re-enter the scene at some transformative moment. In that sense, although they are a dramatic advance over simple Markov chains, sequences generated by RNNs seem to be of essentially the same type.

It's still shocking to see an RNN build all the rules for rhythm and harmony from scratch, and the style it settles on can be revealing about the prototypical gestures of the training material. That quality is what I think makes some of the RNNs trained on text so funny -- they're almost like caricatures, capturing and exaggerating distinguishing features. Next post I'll dive into training the char-rnn to write some snappy lyrics to go with the music...