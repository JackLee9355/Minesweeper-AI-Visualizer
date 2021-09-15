class Location {

    constructor(row, col, isMine = false, adjacentMines = 0, isRevealed = false, isMarked = false) {
        this.row = row;
        this.col = col;
        this.isMine = isMine;
        this.adjacentMines = adjacentMines;
        this.isRevealed = isRevealed;
        this.isMarked = isMarked;
        this.rules = [];
    }

    
    static compareLocations(loc, otherLoc) {
        if(loc.row > otherLoc.row) {
            return 1;
        }else if(loc.row == otherLoc.row) {
            if(loc.col > otherLoc.col) {
                return 1;
            } else if(loc.col == otherLoc.col) {
                return 0;
            }
        }
        return -1
    }

}

class Board {

    constructor(arr) {
        this.arr = arr;
        this.rows = arr.length;
        this.cols = arr[0].length;
        this.mines = 0;

        //Sets the mines to the correct count
        for(let col = 0; col < this.cols; col++) {
            for(let row = 0; row < this.rows; row++) {
                if(arr[row][col].isMine) {
                    this.mines++;
                }
            }
        }
    }

    distributeMines(mines) {
        let uniquePositions = this.rows * this.cols;
        let spaces = new Set();
        if(uniquePositions < mines) {
            console.log('More mines than locations on the board');
            return;
        }

        while(spaces.size < mines) {
            spaces.add(Math.floor(Math.random() * uniquePositions));
        }

        spaces.forEach(space => {
            let row = Math.floor(space / columns);
            let column = space % columns;
            this.arr[row][column].isMine = true;
        });

        this.mines = mines;
        this.updateAdjacent();
    }

    updateAdjacent() {
        // Loops through all the mines.
        for(let column = 0; column < this.cols; column++) {
            for(let row = 0; row < this.rows; row++) {
                let loc = this.arr[row][column];
                loc.adjacentMines = 0;

                this.getAdjacentSquares(loc).forEach(adjLoc => {
                    if(adjLoc.isMine) {
                        loc.adjacentMines++;
                    }
                });
            }
        }
    }

    getSquaresToReveal(location) {

        let toReveal = [];
        let toReturn = [];
        toReveal.push(location);
        while(toReveal.length > 0) {
            let currentLoc = toReveal.pop();
            toReturn.push(currentLoc);
            currentLoc.isRevealed = true;
            if(!currentLoc.isMine) {

                // Start a BFS to reveal mines adjacent to 0 squares.
                if(currentLoc.adjacentMines == 0) {

                    this.getAdjacentSquares(currentLoc).forEach(adjLoc => {
                        if(!adjLoc.isRevealed) {
                            toReveal.push(adjLoc);
                        }
                    });
                }
            }
        }

        return toReturn;
    }

    getAdjacentSquares(location) {
        let row = location.row;
        let column = location.col;
        let toReturn = [];
        [-1, 0, 1].forEach(rowChange => {
            [-1, 0, 1].forEach(columnChange => {
                let rowToCheck = row + rowChange;
                let columnToCheck = column + columnChange;

                if((rowChange == 0 && columnChange == 0) || !this.withinBoard(rowToCheck, columnToCheck)) {
                    return;
                }

                toReturn.push(this.arr[rowToCheck][columnToCheck]);
            });
        });

        return toReturn;
    }

    withinBoard(row, column) {
        return 0 <= row && row < this.rows && 0 <= column && column < this.cols;
    }

}

class Rule {

    static boardRows = 0;
    static boardColumns = 0;

    constructor(mines, locations, currentGen = 0, parentSquare = null, primaryParent = null, secondaryParent = null, presorted = false) {
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
    }

    equivalentRule(otherRule) {
        if(this.mines != otherRule.mines || this.locations.length != otherRule.locations.length) {
            return false;
        }

        for(let i = 0; i < this.locations.length; i++) {
            if(!otherRule.locations.includes(this.locations[i])) {
                return false;
            }
        }

        return true;
    }

    isSafe() {
        Rule.isSafe(this);
    }

    isDangerous() {
        Rule.isDangerous(this);
    }

    getPotentialNewRule(otherRule, currentGen) {
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

        return newLocations.length > 0 ? new Rule(newMines, newLocations, currentGen, null, this, otherRule, true) : null;
    }

    static isSafe(rule) {
        return rule.mines == 0;
    }

    static isDangerous(rule) {
        return rule.mines == rule.locations.length;
    }

    static addRulesToBoard(board, rules) {
        for(let row = 0; row < board.rows; row++) {
            for(let col = 0; col < board.cols; col++) {
                let loc = board.arr[row][col];
                loc.rules = [];
                rules.forEach(rule => {
                    if(rule.locations.includes(loc)) {
                        loc.rules.push(rule);
                    }
                });
            }
        }
        return board;
    }   
}