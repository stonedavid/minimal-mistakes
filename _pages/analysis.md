---
title: "Analysis"
layout: single
excerpt: "Music Information Retrieval and Deep Learning"
sitemap: false
author_profile: true
permalink: /analysis/
---

<script src="../assets/js/vendor/d3/d3.min.js" charset="utf-8"></script>

<style>

.chart div {
  font: 10px sans-serif;
  background-color: #AAA;
  text-align: right;
  padding: 3px;
  margin: 1px;
  color: white;
}

</style>

<div class="chart"></div>


<script type="text/javascript">


d3.csv("stats.csv", function(data) {
	data.forEach(function(d) {
		d.count = +d.count
	});

	data = data.slice(0,100);
	

	x = d3.scale.linear()
	  .domain([0,d3.max(data,function(d) {return d.count})])
	  .range([0,680])

	d3.select(".chart")
	  .selectAll("div")
	    .data(data)
	  .enter().append("div")
	    .style("width", function(d) { return x(d.count) + "px"; })
	    .text(function(d) { return d.word; });
});


</script>



Music information retrieval combines music theory, digital signal processing and statistics to identify the musical features of an audio recording.

Download the thesis defense [slides]({{ site.url }}/assets/docs/slides.pdf) as a pdf, or the full [thesis text]({{ site.url }}/assets/docs/Stone_Thesis_Final.pdf).