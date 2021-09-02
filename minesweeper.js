class Location {

	constructor(row, col, isMine = false, adjacentMines = 0, isRevealed = false, isMarked = false) {
		this.row = row;
		this.col = col;
		this.isMine = isMine;
		this.adjacentMines = adjacentMines;
		this.isRevealed = isRevealed;
        this.isMarked = isMarked;
        this.odds = null;
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