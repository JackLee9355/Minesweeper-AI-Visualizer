importScripts('./minesweeper.js');

function initializeRulesFromBoard(board, useOverallRule) {
    let rules = [];
    let unrevealed = [];
    let remainingMines = board.mines;
    for (let row = 0; row < board.rows; row++) {
        for (let col = 0; col < board.cols; col++) {
            let loc = board.arr[row][col];
            if ((loc.isRevealed && loc.isMine) || loc.isMarked) {
                remainingMines--;
            }

            if (loc.isRevealed && !loc.isMine) {
                let minesInRule = loc.adjacentMines;
                let locsInRule = [];
                board.getAdjacentSquares(loc).forEach(adjLoc => {
                    if ((adjLoc.isRevealed && adjLoc.isMine) || adjLoc.isMarked) {
                        minesInRule--;
                    } else if (!adjLoc.isRevealed) {
                        locsInRule.push(adjLoc);
                    }
                });
                if (minesInRule < 0) {
                    console.log('More mines adjacent to ' + row + ', ' + col + ' than is valid. Abandoning rule.');
                } else if (locsInRule.length != 0) {
                    rules.push(new Rule(minesInRule, locsInRule, 0, loc));
                }
            } else {
                unrevealed.push(loc);
            }
        }
    }

    // This rule is deduced from the total number of mines.
    // This rule causes the AI to use exponentially more compute power in generations past the first.
    if (useOverallRule) {
        rules.push(new Rule(remainingMines, unrevealed, 0));
    }
    console.log('Finished calculating generation 0 rules.');

    return rules;
}

function calculateNewGenerationsRules(rules, currentGen) {
    let newRules = [];
    rules.forEach(rule => {
        rules.forEach(otherRule => {
            if (rule.generation != currentGen - 1 && otherRule.generation != currentGen - 1) {
                return; // This potential rule was already calculated in a previous generation.
            }
            let newRule = rule.getPotentialNewRule(otherRule, currentGen);
            if (newRule != null && newRule.locations.length > 0) {
                // These two four loops prevent duplicate rules from entering the list.
                for (let i = 0; i < newRules.length; i++) {
                    if (newRules[i].equivalentRule(newRule)) {
                        return;
                    }
                }
                for (let i = 0; i < rules.length; i++) {
                    if (rules[i].equivalentRule(newRule)) {
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

onmessage = function (msg) {
    if (msg.data.action == 'START') {
        let board = new Board(msg.data.boardArr);
        let maxDepth = msg.data.maxDepth;
        console.log('Starting AI with a max depth of ' + maxDepth);
        let rules = initializeRulesFromBoard(board, msg.data.useOverallRule);
        Rule.addRulesToBoard(board, rules);
        postMessage({
            action: 'NEW_RULES',
            boardArr: board.arr,
            currentDepth: 0
        })
        for (let currentGen = 1; currentGen <= maxDepth; currentGen++) {
            calculateNewGenerationsRules(rules, currentGen);
            Rule.addRulesToBoard(board, rules);
            postMessage({
                action: 'NEW_RULES',
                boardArr: board.arr,
                currentDepth: currentGen
            })
            // sleep(3000);
        }
    }
    console.log('AI finished.');
    postMessage({
        action: 'FINISH'
    });
}