importScripts('./minesweeper.js');

let board = null;
let maxDepth = 1;
let rules = [];
let currentGen = 0;

function initializeRulesFromBoard() { 
    rules = [];
    currentGen = 0;
    let unrevealed = [];
    let remainingMines = board.mines;
    for(let row = 0; row < board.rows; row++) {
        for(let col = 0; col < board.cols; col++) {
            let loc = board.arr[row][col];
            if((loc.isRevealed && loc.isMine) || loc.isMarked) {
                remainingMines--;
            }

            if(loc.isRevealed) {
                let minesInRule = loc.adjacentMines;
                let locsInRule = [];
                board.getAdjacentSquares(loc).forEach(adjLoc => {
                    if((adjLoc.isRevealed && adjLoc.isMine) || adjLoc.isMarked) {
                        minesInRule--;
                    } else if (!adjLoc.isRevealed) {
                        locsInRule.push(adjLoc);
                    }
                });
                if(minesInRule < 0) {
                    console.log('More mines adjacent to ' + row + ', ' + col + ' than is valid. Abandoning rule.');
                } else if(locsInRule.length != 0) {
                    rules.push(new Rule(minesInRule, locsInRule));
                }
            } else {
                unrevealed.push(loc);
            }
        }
    }
    // This rule is deduced from the total number of mines.
    rules.push(new Rule(remainingMines, unrevealed));
    currentGen = 1;
    console.log('Finished calculating generation 0 rules.');
}

function calculateNewGenerationsRules() {
    let newRules = [];
    rules.forEach(rule => {
        rules.forEach(otherRule => {
            if(rule.generation != currentGen - 1 && otherRule.generation != currentGen - 1) {
                return; // This potential rule was already calculated in a previous generation.
            }
            let newRule = rule.getPotentialNewRule(otherRule);
            if(newRule != null && newRule.locations.length > 0) {
                // These two four loops prevent duplicate rules from entering the list.
                for(let i = 0; i < newRules.length; i++) {
                    if(newRules[i].hash == newRule.hash) {
                        return;
                    }
                }
                for(let i = 0; i < rules.length; i++) {
                    if(rules[i].hash == newRule.hash) {
                        return;
                    }
                }
                newRules.push(newRule)
            }
        });
    });
    newRules.forEach(rule => {
        rules.push(rule);
    });
    console.log('Finished calculating generation ' + currentGen + ' rules.');
}

function updateBoardOdds() {
    rules.forEach(rule => {
        let ruleOdds = rule.mines / parseFloat(rule.locations.length);
        rule.locations.forEach(location => {
            if(location.odds == null || location.odds > ruleOdds) {
                location.odds = ruleOdds;
                board.arr[location.row][location.col].odds = ruleOdds;
            }
        });
    });
}

class Rule {

    constructor(mines, locations, presorted = false) {
        this.mines = mines;
        this.locations = locations;
        this.generation = currentGen;
        if(!presorted) {
            this.locations.sort(Location.compareLocations);
        }
        this.updateHash();
    }

    updateHash() {
        let hash = String(this.mines).padStart(String(board.mines).length, '0');
        this.locations.forEach(location => {
            hash += String(location.row).padStart(String(board.rows).length, '0') + String(location.col).padStart(String(board.cols).length, '0');
        });
        this.hash = hash;
    }

    getPotentialNewRule(otherRule) {
        if(otherRule.locations.length > this.locations.length) {
            return null;
        }

        let newMines = this.mines - otherRule.mines;
        let newLocations = [];
        let locIndex = 0;
        let otherLocIndex = 0;
        let otherLocations = otherRule.locations;

        while(otherLocIndex < otherLocations.length) {

            if(locIndex >= this.locations.length) {
                return null;
            }

            let comparison = Location.compareLocations(this.locations[locIndex], otherLocations[otherLocIndex]);

            if(comparison == -1) {
                newLocations.push(this.locations[locIndex]);
                locIndex++;
            }else if(comparison == 1) {
                return null;
            } else if(comparison == 0) {
                locIndex++;
                otherLocIndex++;
            }
        }
        while(locIndex < this.locations.length) {
            newLocations.push(this.locations[locIndex])
            locIndex++;
        }

        return newLocations.length > 0 ? new Rule(newMines, newLocations, true) : null;
    }
}

function sleep(delay) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
}

onmessage = function(msg) {
    if(msg.data.action == 'START') {
        board = new Board(msg.data.boardArr);
        maxDepth = msg.data.maxDepth;
        console.log('Starting AI with a max depth of ' + maxDepth);
        initializeRulesFromBoard();
        for(; currentGen <= maxDepth; currentGen++) {
            calculateNewGenerationsRules();
            updateBoardOdds();
            postMessage({action:'UPDATE_ODDS', boardArr:board.arr, currentDepth:currentGen})
            sleep(3000);
        }
        console.log('Ai finished.')
        postMessage({action:'FINISH'});
    }
}