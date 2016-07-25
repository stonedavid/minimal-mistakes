---
layout: single
author_profile: true
comments: true
---

---
<style>
	div.venntooltip {   
	  position: absolute;           
	  text-align: center;                          
	  padding: 2px;             
	  font: 12px sans-serif;        
	  background: #EEE;   
	  border: 0px;      
	  border-radius: 8px;           
	  pointer-events: none;         
}
</style>

<script src="http://d3js.org/d3.v3.min.js" charset="utf-8"></script>
<script src="https://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js"></script>
<script src="http://code.jquery.com/ui/1.9.2/jquery-ui.js"></script>
<script src="../assets/js/vendor/venn/venn.js"></script>

{% include toc title="Contents" icon="file-text" %}

## Intro and Motivation ##
<br/>

This post is a very condensed overview of my master's thesis. In short, it was an attempt to model the relationship between underscoring and films by using deep learning. 

The motivation for this project was to improve the searchability of production music libraries, especially those including pop songs, which are often available for commercial licensing but have tags applied with the average consumer in mind, not music supervisors. Automated annotation and better search for production music could streamline a very time- and labor-intensive process and increase the chance that tracks by lesser known artists get a fair hearing by the right people.

***

## Compiling Training and Testing Data ##
<br/>

Neural networks need a lot of well-labeled data, and the more complex the network, the more data you need. The data preparation process has at least two steps:

* Collect raw data for input

* Optional: Compress data through feature extraction

* Link input data to consistent and accurate ground-truth labels

The final input data were arrays of 100 concatenated frames of the first 40 Mel-Frequency Cepstral Coefficients, comprising about 10 seconds of audio each. The use of a feature vector is not strictly necessary for a deep network: given enough training, a network will learn intermediate features (which can be superior to 'engineered' features like MFCCs) directly from spectrograms. However, spectrograms take up memory equivalent to uncompressed PCM audio, and when handling sets of data that represent hundreds of hours of audio they quickly become completely unwieldy. 

Using MFCCs allows compression on the order of 90% by keeping a few coefficients that describe the rough shape of the spectrum. In short, MFCCs generate a 'filter-excitation' model of the signal, and discard the 'excitation' component. The audio cannot be satisfactorily reconstructed from the MFCCs, but they are extremely effective for models dependent on timbre and rhythm rather than pitch.

Below is a sample of what an audio signal reconstructed from MFCCs sounds like, crossfaded with the original signal. Since the MFCC algorithm discards the upper cepstral coefficients that represent the 'excitation' component, wide-band noise must be used to excite the filter, creating a rough, whispery effect.

<audio id='MFCC' src='../assets/data/Raiders_Fade.m4a' controls></audio>
<br/>

Each tile is linked to one or more genre tags drawn from the Internet Movie Database. When dealing with multi-labeled input, there are two ways of arranging the data, depending on your network architecture:

* Link each input to a binary vector of length K, where K is the total number of possible labels.

* Duplicate the input for each label, using the duplicates to train independent binary classifiers, and aggregate the predictions of the ensemble.

I chose the second route, allowing for a more thorough use of the data at the expense of increased training time. 

The ground-truth labels have some interesting characteristics, with a high degree of overlap between some labels and none between others. Some label sets are very large, especially "Drama". In the interactive plot below, note how some labels are nearly completely subsets of "Drama".

<h3>Tag Overlaps</h3>
 
<figure class='half'>
<select id='dd1' onchange='renderVenn()'>
  <option value="N"></option>
  <option value="Action">Action</option>
  <option value="Adventure">Adventure</option>
  <option value="Comedy">Comedy</option>
  <option value="Crime">Crime</option>
  <option value="Drama">Drama</option>
  <option value="Fantasy">Fantasy</option>
  <option value="Musical">Musical</option>
  <option value="Romance">Romance</option>
  <option value="Sci-Fi">Sci-Fi</option>
  <option value="Thriller">Thriller</option>
</select>

<select id='dd2' onchange='renderVenn()'>
  <option value="N"></option>
  <option value="Action">Action</option>
  <option value="Adventure">Adventure</option>
  <option value="Comedy">Comedy</option>
  <option value="Crime">Crime</option>
  <option value="Drama">Drama</option>
  <option value="Fantasy">Fantasy</option>
  <option value="Musical">Musical</option>
  <option value="Romance">Romance</option>
  <option value="Sci-Fi">Sci-Fi</option>
  <option value="Thriller">Thriller</option>
</select>

<select id='dd3' onchange='renderVenn()'>
  <option value="N"></option>
  <option value="Action">Action</option>
  <option value="Adventure">Adventure</option>
  <option value="Comedy">Comedy</option>
  <option value="Crime">Crime</option>
  <option value="Drama">Drama</option>
  <option value="Fantasy">Fantasy</option>
  <option value="Musical">Musical</option>
  <option value="Romance">Romance</option>
  <option value="Sci-Fi">Sci-Fi</option>
  <option value="Thriller">Thriller</option>
</select>
</figure>

<figure id='venn'></figure>

This was probably a clue that the "Drama" tag carried almost no information, but I couldn't set it aside without losing a ton of soundtracks that were only tagged as Dramas, so I went ahead and included them anyway.

## Deep Learning and ConvNets ##
<br/>

There are a ton of excellent tutorials on the basic inner workings of neurals networks, so I'll try not to retread to much here. I'd like to focus on convolutional networks and how the same properties that give CNNs the ability to recognize rotated, flipped, and scaled images is useful for audio, too. 

One of the biggest problems with using a fully-connected network for audio analysis is that it cannot encode any time-dependent information. Even if you try to use concatenated frames as feature 'tiles', any connections between adjacent pixels are destroyed in the process of unraveling the tile into an input vector. At best, long-term features could be generated by pooling across frames, but no sequential information is preserved.

Convolution networks work around this by changing the way that the neurons sum their inputs. Instead of summing a weighted vector from the entire input layer, the neuron in a convolutional network only 'looks' at a small region of the input with a correspondingly small set of weights (the kernel), and encodes a 'stack' of activations for each kernel position. In between layers, data is down-sampled ('max-pooled'), so each successive layer 'sees' a larger portion of the image and detects more complex combinations of earlier kernel activations.

A convolutional layer is agnostic to transformations of the data, so neurons activate in the presence of a feature independent of its precise position and orientation. At the same time, spatial relationships between intermediate features combine in higher level features, encoding sequences through frames and across cepstral bins.

<figure class='half'>
	<img src='../images/sloth.jpg'>
	<img src='../images/spect.png'>
	<figcaption>Two-dimensional inputs: (l) a photo of a sloth in a bucket, (r) concatenated STFTs</figcaption>
</figure>

## Implementation in Python ##

The convolutional networks were created with Theano, an open-source machine learning library for Python, with most of the scripting done with the Lasagne and Nolearn wrappers for Theano. My implementation was heavily informed by Daniel Nouri's excellent tutorial on building an ensemble of specialist deep networks.

First we define our network hyperparameters. The net has 8 layers total: 1 input layer, 4 convolutional layers, 2 fully-connected layers, and a single neuron on the output layer.

```python
epochs = 1000
dropout1 = .1
dropout2 = .2
dropout3 = .3
dropout4 = .4
dropout5 = .5
c1 = 32
c2 = 64
c3 = 128
c4 = 256
h5 = 50
h6 = 50
batch = 1200
rate = .01
momentum = .9
```

Then we create a neural network instance with a single call to nolearn.Lasagne.NeuralNet, using our previously defined hyperparameters. There is a dropout layer in between each layer to regularize the neurons and prevent overfitting. `regression = True` so that we can directly look at the activation of the output layer. This will be important later as a confidence ranking.

```python
CNN = NeuralNet(
layers=[ 
    ('input', layers.InputLayer),
    
    ('conv1', Conv2DLayer),
    ('pool1', MaxPool2DLayer),
    ('dropout1', layers.DropoutLayer),
    
    ('conv2', Conv2DLayer),
    ('pool2', MaxPool2DLayer),
    ('dropout2', layers.DropoutLayer),
    
    ('conv3', Conv2DLayer),
    ('pool3', MaxPool2DLayer),
    ('dropout3', layers.DropoutLayer),
    
    ('conv4', Conv2DLayer),
    ('pool4', MaxPool2DLayer),
    ('dropout4', layers.DropoutLayer),
    
    ('hidden5', layers.DenseLayer),
    ('dropout5', layers.DropoutLayer),
    
    ('hidden6', layers.DenseLayer),
    
    ('output', layers.DenseLayer),
    ],

# Hyperparameters

input_shape=(None, 1, 40, 100),
conv1_num_filters = c1, conv1_filter_size = (5, 5), pool1_pool_size = (2, 2),
dropout1_p = dropout1,
conv2_num_filters = c2, conv2_filter_size = (4, 4), pool2_pool_size = (2, 2),
dropout2_p = dropout2,
conv3_num_filters = c3, conv3_filter_size = (2, 2), pool3_pool_size = (2, 2),
dropout3_p = dropout3,
conv4_num_filters = c4, conv4_filter_size = (2, 2), pool4_pool_size = (2, 2),
dropout4_p = dropout4,
hidden5_num_units = h5,
dropout5_p = dropout5, 
hidden6_num_units = h6,
output_num_units = 1, 
output_nonlinearity = sigmoid,

update  nesterov_momentum,
update_learning_rate = theano.shared(float32(rate)),
update_momentum = theano.shared(float32(momentum),
on_epoch_finished = [
    AdjustVariable('update_learning_rate', start = 0.01, stop = 0.0001),
    AdjustVariable('update_momentum', start = 0.9, stop = 0.999),
    EarlyStopping(patience = 30),
    ],
batch_iterator_train = BatchIterator(batch_size = batch),
regression = True, 
max_epochs = epochs,  
verbose = 1,
)
```

<script>

document.getElementById('dd1').value = 'Romance';
document.getElementById('dd2').value = 'Comedy';
document.getElementById('dd3').value = 'Drama';

var tooltip = d3.select("body").append("div")
		    .attr("class", "venntooltip")
		    .style('opacity',0);

var venn_chart = venn.VennDiagram();
renderVenn();

d3.select(window).on('resize', renderVenn); 

function renderVenn() {
	d3.json('../assets/data/tag_sets.json', function(error,master_set) {

		function updateSets() {
			sets = [];
			fields = [document.getElementById('dd1').value,document.getElementById('dd2').value,document.getElementById('dd3').value];
			
			master_set.forEach(function(e,i) {
				if(e.sets.every(function(val) { return fields.indexOf(val) >= 0; })) {
					sets.push(e);
				};
			});
			d3.select("#venn").datum(sets).call(venn_chart);
			d3.select('#venn').select('svg')
				.attr('width','100%')
				.attr('height','100%')
				.attr('viewBox','0 0 600 400');
		}

		updateSets();

		var div = d3.select("#venn");

		div.selectAll("path")
    		.style("stroke-opacity", 0)
    		.style("stroke", "#fff")
    		.style("stroke-width", 0);

		div.selectAll("g")
		    .on("mouseover", function(d, i) {
		        venn.sortAreas(div, d);

		        tooltip.transition().duration(400).style("opacity", .9);

		        tooltip.text(d.size+' films in '+d.sets.join(' + '));


		        var selection = d3.select(this).transition("tooltip").duration(400);
		        selection.select("path")
		            .style("stroke-width", '5px')
		            .style("stroke-color", 'white')
		            .style("fill-opacity", d.sets.length == 1 ? .4 : .1)
		            .style("stroke-opacity", 1);
		    })

		    .on("mousemove", function() {
		        tooltip.style("left", (d3.event.pageX) + "px")
		               .style("top", (d3.event.pageY - 28) + "px");
		    })

		    .on("mouseout", function(d, i) {
		        tooltip.transition().duration(400).style("opacity", 0);
		        var selection = d3.select(this).transition("tooltip").duration(400);
		        selection.select("path")
		            .style("stroke-width", '0px')
		            .style("fill-opacity", d.sets.length == 1 ? .25 : .0)
		            .style("stroke-opacity", 0);
		    });
	});

};

</script>

<h2>Genre Predictions</h2>
<p>Here is a visualization of the film genres predicted on the held-out dataset of 300 tracks</p>
<div id='chart' class='align-center'></div>
<audio id='audio'></audio>
<h3 id='d3_title' style='margin-left: 15px;margin-right: 15px; margin-top: 0px; margin-bottom: 0px;'></h3>
<h4 id='play_btn' style='margin-left: 15px;margin-top: 10px;cursor: pointer;'>Play</h4>
    


<script type="text/javascript">  

console.log('script running');

var audio = document.getElementById('audio');

var url = '../assets/data/pooling_dict.json'
	, margin = {top: 30, right: 10, bottom: 30, left: 10}
	, width = parseInt(d3.select('#chart').style('width'), 10)
	, width = width - margin.left - margin.right
	, height = 200 
	, barHeight = 20
	, spacing = 3
	, percent = d3.format('%')
	, i = 0
	, genres = ['Action','Adventure','Comedy','Crime','Drama','Fantasy','Musical','Romance','Sci-Fi','Thriller'];


var x = d3.scale.linear()
	.range([0, width])
	.domain([0, 1.0]); 

var y = d3.scale.ordinal();

var xAxis = d3.svg.axis()
	.scale(x)
	.tickFormat(percent);


var filmFn = function(d) {return d.Film};
var predFn = function(d) {return d.Predictions};
var targFn = function(d) {return d.Targets};
var cueFn = function(d) {return d.Cue};
var compFn = function(d) {return d.Composer};
var yearFn = function(d) {return parseInt(d.year)};


var chart = d3.select('#chart').append('svg')
	.style('width', (width + margin.left + margin.right) + 'px')
	.append('g')
	.attr('transform', 'translate(' + [margin.left, margin.top] + ')');



function load_and_render() {
	d3.json(url, function(error,d) {
		return d;
	}).get(function(err,json) {

		data = json[Math.floor(Math.random()*json.length)];

		song_title = data.Cue.slice(3,-4).replace(/_\d/g,' ');

		console.log(data.Film);

		searchAndPlay(song_title,data.Film.slice(0,10));

		y.domain(d3.range(data['Predictions'].length))
			.rangeBands([0, data['Predictions'].length * barHeight]);

		x.domain([d3.min(data.Predictions)*0.9, d3.max(data.Predictions)]);


		height = y.rangeExtent()[1];
		d3.select(chart.node().parentNode)
			.style('height', (height + margin.top + margin.bottom) + 'px');

		document.getElementById("d3_title").innerHTML = '"'+song_title+'", from '+data.Film;


		var bars = chart.selectAll('.bar')
			.data(data['Predictions'])
			.enter().append('g')
			.attr('class','bar')
			.attr('transform', function(d,i) {return 'translate(0,' + y(i) + ')'; });


		bars.append('rect')
			.attr('class','background')
			.attr('height', y.rangeBand())
			.attr('width',width);

		bars.append('rect')
			.attr('class', 'percent')
			.attr('height', y.rangeBand())
			.attr('width', function(d) {return x(d); })
			.style('fill', function(d,i) {return (data.Targets[i]) ? '#b8e0b8' : '#b8cce0'});

		bars.append('text')
        	.text(function(d,i) { return genres[i]; })
        	.attr('class', 'name')
        	.attr('y', y.rangeBand() - 5)
        	.attr('x', spacing);
	});
};


load_and_render();

var auto_step = setInterval(next, 15000);
var play_track = false;

function next() {
	$('#audio').animate({volume: 0.0}, 1000);
	setTimeout(updateData,1000);
};

document.getElementById("play_btn").addEventListener("click", function() {
	play_track = !play_track;
	if(play_track==true) {
		searchAndPlay(song_title,data.Film.slice(0,10));
		this.innerHTML = 'Mute';
		this.color = '#FFF';
	} else {
		audio.pause();
		this.innerHTML = 'Play';
		this.color ='#222';
	};
});

function updateData() {

	d3.json(url, function(error,d) {
		return d; 
	}).get(function(err,json) {

		data = json[Math.floor(Math.random()*json.length)];

		song_title = data.Cue.slice(3,-4).replace(/_\d/g,' ');

		console.log(data.Film);

		if(play_track==true) {
			searchAndPlay(song_title,data.Film.slice(0,10));
		};

		y.domain(d3.range(data['Predictions'].length))
			.rangeBands([0, data['Predictions'].length * barHeight]);

		x.domain([d3.min(data.Predictions)*0.9, d3.max(data.Predictions)]);

		height = y.rangeExtent()[1];
		d3.select(chart.node().parentNode)
			.style('height', (height + margin.top + margin.bottom) + 'px');

		document.getElementById("d3_title").innerHTML = '"'+data.Cue.slice(3,-4)+'", from '+data.Film;

		var bars = d3.selectAll('.bar')
			.data(data['Predictions']).transition();

		bars.select('.percent')
			.duration(function(d,i) {return i*300})
			.attr('width', function(d,i) {return x(d); })
			.style('fill', function(d,i) {return (data.Targets[i]) ? '#b8e0b8' : '#b8cce0'})
	});
};

d3.select(window).on('resize', resize); 

function resize() {
    width = parseInt(d3.select('#chart').style('width'), 10);
    width = width - margin.left - margin.right;


    x.range([0, width]);
    d3.select(chart.node().parentNode)
        .style('height', (y.rangeExtent()[1] + margin.top + margin.bottom) + 'px')
        .style('width', (width + margin.left + margin.right) + 'px');

    chart.selectAll('rect.background')
        .attr('width', width);

    chart.selectAll('rect.percent')
        .attr('width', function(d) { return x(d); });

};

function searchAndPlay(songName,albumName) {


    playSong(songName,albumName);

    function searchTracks(query) {
    	console.log(query);
        $.ajax({
            url: 'https://api.spotify.com/v1/search',
            data: {
                q: query,
                type: 'track'
            },
            success: function (response) {
                if (response.tracks.items.length) {
                    var track = response.tracks.items[0];
                    audio.src = track.preview_url;
                    audio.volume = 0;
                    audio.play();
                    $('audio').animate({volume: 1.0}, 2000);
                    console.log(track.name,track.album,track.artist);

                }
                else {
                	updateData();
                }
            }
        });
    };

    function playSong(songName, albumName) {
        var query = '"'+songName+'"';
        if (albumName) {
            query += ' album:' + '"'+albumName+'"';
        };

        searchTracks(query);
    };
};
