importScripts('./minesweeper.js');

function initializeRulesFromBoard(board, useOverallRule) { 
    let rules = [];
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
                    rules.push(new Rule(minesInRule, locsInRule, loc));
                }
            } else {
                unrevealed.push(loc);
            }
        }
    }
    
    // This rule is deduced from the total number of mines.
    // This rule causes the AI to use exponentially more compute power in generations past the first.
    if(useOverallRule) {
        rules.push(new Rule(remainingMines, unrevealed));
    }
    console.log('Finished calculating generation 0 rules.');

    return rules;
}

function calculateNewGenerationsRules(rules) {
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

    return rules;
}

class Rule {

    constructor(mines, locations, parentSquare = null, primaryParent = null, secondaryParent = null, presorted = false) {
        this.mines = mines;
        this.locations = locations;
        this.generation = currentGen;
        // parentSquare, primaryParent, and secondaryParent should only all be null for the parent rule.
        this.parentSquare = parentSquare;
        this.primaryParent = primaryParent;
        this.secondaryParent = secondaryParent
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

        return newLocations.length > 0 ? new Rule(newMines, newLocations, null, this, otherRule, true) : null;
    }
}

function addRulesToBoard(board, rules) {

    return board;
}

//TODO: Delete this. It's a bad idea.
function sleep(delay) {
    var start = new Date().getTime();
    while (new Date().getTime() < start + delay);
}

onmessage = function(msg) {
    if(msg.data.action == 'START') {
        let board = new Board(msg.data.boardArr);
        let maxDepth = msg.data.maxDepth;
        console.log('Starting AI with a max depth of ' + maxDepth);
        let rules = initializeRulesFromBoard(board, useOverallRule);
        addRulesToBoard(board, rules);
        postMessage({action:'NEW_RULES', boardArr:board.arr, currentDepth:currentGen})
        for(let currentGen = 1; currentGen <= maxDepth; currentGen++) {
            calculateNewGenerationsRules(rules);
            addRulesToBoard(board, rules);
            postMessage({action:'NEW_RULES', boardArr:board.arr, currentDepth:currentGen})
            sleep(3000);
        }
    }
    console.log('AI finished.')
    postMessage({action:'FINISH'});
}