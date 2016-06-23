---
layout: single
author_profile: true
comments: true
---

---

{% include toc title="Contents" icon="file-text" %}

## Part 1: Searching for Scores ##  
<br/>
A lot of work has been done in the past few years on the problem of playlist generation and music recommendation. Pandora and Spotify are probably the first services that come to mind -- they both use user inputs to find good matches in an extensively annotated database. 

Pandora's core reason for being is that is makes excellent recommendations, and Spotify is betting that good recommendations and a (much, much, much) larger library will give it the edge over streaming services from Apple and Google. The method of annotation differs (Pandora is mostly done manually and Spotify uses [Echonest](http://the.echonest.com) for automated annotation), but the search algorithm is fundamentally the same. 

Music recommendation isn't just important for streaming services, though. Most commercial tracks (for TV, movies, and ads) are not actually bespoke compositions. They are licensed from production music libraries like [Cutting Edge](http://cuttingedge.sourceaudio.com) or [Jingle Punks](http://jinglepunks.com). Just like in streaming services, the tracks are annotated and searchable. However:

* Search is extremely limited, often based on a short list of keywords
* Most music libraries only have a few thousand tracks each -- [APM](http://www.apmmusic.com), which links dozens of disparate libraries, has ~400K. Pandora has 1m tracks at a much finer grain of analysis, and Spotify has 20m(!).

But why compare streaming services to production music in the first place? Aren't they apples and oranges? These days, not really:

<figure class='align-right'>
	<img src='../images/pink_moon.jpg'>
	<figcaption>VW's <i>Milky Way</i></figcaption>
</figure>

* Many projects use 'syncs', which means that they use a pre-existing recording by a performing artist. Volkswagen kicked off the modern version of this practice in 1999 with its critically lauded, internet-released [*Milky Way*](https://www.youtube.com/watch?v=0nWuCZe4lSE), featuring the music of Nick Drake. The largest production libraries are actually subsidiaries of the largest record companies, who hold the rights to their back catalogs. 

* Emerging artists are turning to syncs as a very potent marketing tool. Nick Drake sold a ton of records after being featured in that VW commercial (although he wasn't around to enjoy it, unfortunately). Think about all the bands you heard for the first time on an [Apple commercial](http://www.applemusic.info).


The line between performing artists and production music has blurred so much in the past 10 years that the real search space for production music is actually much larger than it appears. We need *better* search and *more* search, because any track, especially a newer release, is a potential backing track. 

So, how do we label tracks for use as production music?

***

## Part 2: Automated Tagging ##
<br/>
Although manual annotation, done well, still produces better recommendations than automated tagging (this highly scientific observation is based on a handful of casual conversations about Pandora's recommendations compared to Spotify), it's simply unfeasible for the project of *expanding* the search space for production music. So, the annotations must be automated.

But what sort of annotations you would ultimately want in the first place to match up music to images? Is a set of emotion and genre tags enough? Maybe, but that assumes that the user knows the particular recipe that will generate a good recommendation. In addition, music and image interact in such a way as to transform the emotional content of both media. The annotations need to have a strong link to the image content. 

So, instead of using the usual tags like emotion, energy, or genre, I set out to see if I could directly label musical samples by appropriate **film genres**. Now, if you had a developer key, you could use the Echonest API to scrape the musical tags for a track and use those features to predict the film genre. Even better, you could cut out the middle-man and use deep learning to generate a set of hidden features. All the countless, tricky relationships between the low-level features and the emotional content of the music and the stylistic content of the film could be implicitly coded into the model.

Then, someone making a Romantic-Comedy-Action-Horror film could just drop in those search terms and get a select few tracks that would fit well with the project.

---

### *"Wait, Movies? I Thought We Were Talking About Commercials!"* ###
<br/>
I admit it's a little hand-wavy to just jump from a lot of talk about commercial syncs and then propose to build a model to tag music by film genre. To that point, this model is more a proof-of-concept or proof-by-analogy that music-image interactions can be predicted by deep nets. I picked out film music as the dataset for two reasons:

* Film music is a well-defined category, easy to access, and most importantly, extremely plentiful
* Film genres are also well defined, and IMDB and Wikipedia allow for building a large dataset with consistent labels

Conceivably, although it would be much trickier to build and label, you could amass a dataset of music from commercials and then label them on product categories and film style.{: .notice--primary} 

***

## Part 3: Deep Learning and Convolutional Nets ##
<br/>
By now, everyone and their grandmother have seen what convolutional deep nets can do with image datasets. But what about other media? Can CNNs be effective classifiers for audio?

In fact, CNNs have set benchmarks in a wide array of audio classification tasks, notably phoneme tagging and speech transcription, by essentially treating tiled spectrograms as images. The same convolution trick that gives CNNs the ability to recognize rotated, flipped, and scaled images is useful for audio, too. 

We want the network to recognize sound events independent of where exactly they fall in the spectrogram, especially along the time-axis. Plus, a CNN builds up a hierarchy of complex that shapes could represent higher-level musical events. A fully-connected deep network, on the other hand, can't really be trained on two-dimensional data, since the input matrix is 'unwrapped' into a long vector, destroying the relationships between adjacent pixels.

<figure class='half'>
	<img src='../images/sloth.jpg'>
	<img src='../images/spect.png'>
	<figcaption>Two-dimensional inputs: (l) a photo of a sloth in a bucket, (r) concatenated STFTs</figcaption>
</figure>




