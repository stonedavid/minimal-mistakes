---
layout: single
author_profile: true
comments: true
---

In my last post, I showed what char-rnn could do when fed MIDI note values and onset times. The results were interesting, but nothing you'll have stuck in your head all day. Part of the problem with modeling music as characters is that there are really so many parameters to a note. Even setting timing asides, there are 127^2 unique MIDI notes. And unfortunately, our brain doesn't give us as much leeway when interpreting musical sequences as it does with plain text.