# Minesweeper-AI-Visualizer

[View this project here!](https://jacklee9355.github.io/Minesweeper-AI-Visualizer/)

This is a personal project to visualize a minesweeper AI. I previously made a proof of concept for this AI in Java.

The entire project runs on the client browsers. This was primarily done to ease hosting and to demonstrate/learn fundamental Javascript skills, particularly web workers. However, this means a tech-savvy user could easily cheat by using inspect element. This does not concern me much. The primary purpose of this project is to show off the AI, not create a competitive game of Minesweeper.

A note on the "Overall Rule" option. This option is referring to the fact that the AI can deduce how many mines are in all remaining squares from the total number of mines. This causes the AI to use exponentially more compute power and will likely not make a difference in the end result. The only time when you should consider turning this on is if you are using a super computer or have only a few unrevealed/marked squares remaining.

There are few features that I am still planning to implement to improve the user experience. 
