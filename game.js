


class Cell {
    // x and y are indices indicating width and height index on screen from top left corner
    constructor(x,y){
        this.x = x
        this.y = y
        this.alive = 0
        this.color = DEAD_COLOR
        this.neighbor_count = 0
    }
    
    draw(ctx) {
        this.color = DEAD_COLOR
        if (this.alive===1) {
            this.color = ALIVE_COLOR
        }
        ctx.fillStyle = this.color
        screenX = this.x*CELL_WIDTH
        screenY = this.y*CELL_HEIGHT
        ctx.fillRect(screenX,screenY,CELL_WIDTH,CELL_HEIGHT)
        if (debug){
            ctx.fillStyle = "rgb(0,0,0)"
            ctx.fillText(this.neighbor_count,screenX+CELL_WIDTH/2,screenY+CELL_HEIGHT/2)
        }
    }
    
    // apply game rules
    update() {
        let state_changed = false
        if (this.alive==1){
            if (this.neighbor_count<2){ // UNDERPOPULATION
                this.alive = 0
                state_changed = true
            } else if(this.neighbor_count==2 || this.neighbor_count==3){
                this.alive = 1
            } else if(this.neighbor_count>3) { // OVERPOPULATION
                this.alive = 0
                state_changed = true
            }
        } else if (this.alive===0){ // REPRODUCTION
            if(this.neighbor_count===3){
                this.alive = 1
                state_changed = true
            }
        }
        return state_changed
    }
    
    revive() {
        this.alive=1
    }
    
    kill() {
        this.alive=0
    }
    
} 

class Game_of_life {

    constructor(config){
        this.rows = config.rows 
        this.cols = config.cols
        this.mode = config.mode || "random"
        this.cells_matrix = config.cells_matrix || []
        this.num_cells = 0
        
        if (this.cells_matrix.length==0){
            this.init_matrix()
            if (this.mode==="random"){
                this.generate_random()
            }
        } else {
            this.update_all_neighbors()
        }
    }

    init_matrix(){
        this.cells_matrix = []
        this.num_cells = 0
        // confusion: rows are height, cols are width
        for (let i = 0; i < this.rows; i++) {
            this.cells_matrix[i] = []
            for (let j = 0; j < this.cols; j++) {
                let cell = new Cell(j,i)
                this.cells_matrix[i][j] = cell 
            }
        }
    }

    // random mode
    generate_random(){
        // blacklists cells that have already been revived
        let blacklist = []
        let num_cells = Math.random()*this.cols*this.rows*INITIAL_NUM_CELLS_PROPORTION_MAXIMUM
        for (let i = 0; i < num_cells; i++) {
            if (blacklist.length>=this.cols*this.rows){
                console.log("ERROR: too many cells")
                return;
            }
            let index = [Math.floor(Math.random()*this.rows), Math.floor(Math.random()*this.cols)]
            let cell = this.cells_matrix[index[0]][index[1]]
            while(blacklist.includes(index) || cell.alive===1){
                index = [Math.floor(Math.random()*this.rows), Math.floor(Math.random()*this.cols)]
                cell = this.cells_matrix[index[0]][index[1]]
            }
            blacklist.push(index)
            cell.revive()
            this.num_cells++
            this.notify_neighbors(index[0],index[1])
            if (this.num_cells>=this.cols*this.rows){
                console.log("ERROR: too many cells")
                return;
            }
        }
    }

    // update all cells
    update_all_neighbors(){
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++){
                this.update_neighbors(i,j)
            }
        }
    } 

    // update surrounding cells 
    // i and j are indices of cell to update where i is height and j is width
    update_neighbors(i,j){
        let cell = this.cells_matrix[i][j]
        if (cell.alive===1){
            // all possible neighbor indices
            let indices = [
                [i,     j-1 ],  // W
                [i-1,   j-1 ],  // NW
                [i-1,   j   ],  // N
                [i-1,   j+1 ],  // NE
                [i,     j+1 ],  // E
                [i+1,   j+1 ],  // SE
                [i+1,   j   ],  // S
                [i+1,   j-1 ],  // SW
            ]
            // validate legitimate indices
            indices = indices.filter(index => index[0]>=0 && index[0]<this.rows && index[1]>=0 && index[1]<this.cols);
            // increment neighbor count of all valid neighbors
            for (let k = 0; k < indices.length; k++) {
                const index = indices[k];
                this.cells_matrix[index[0]][index[1]].neighbor_count += 1
            }
        }
    }

    // update all neighboring cells subject to a neighboring state change
    notify_neighbors(i,j){
        let cell = this.cells_matrix[i][j]
        // all possible neighbor indices
        let indices = [
            [i,     j-1 ],  // W
            [i-1,   j-1 ],  // NW
            [i-1,   j   ],  // N
            [i-1,   j+1 ],  // NE
            [i,     j+1 ],  // E
            [i+1,   j+1 ],  // SE
            [i+1,   j   ],  // S
            [i+1,   j-1 ],  // SW
        ]
        // validate legitimate indices
        indices = indices.filter(index => index[0]>=0 && index[0]<this.rows && index[1]>=0 && index[1]<this.cols);
        // increment value depends on whether cell is alive or dead
        let incr = cell.alive===1 ? 1 : -1
        // increment neighbor count of all valid neighbors
        for (let k = 0; k < indices.length; k++) {
            const index = indices[k];
            this.cells_matrix[index[0]][index[1]].neighbor_count += incr
        }
    }

    // update all cells states and neighbors
    update(){
        //cells
        for (let i = 0; i < ROWS; i++) {
            for (let j = 0; j < COLS; j++) {
                this.cells_matrix[i][j].draw(ctx)
                let state_changed = this.cells_matrix[i][j].update()
                if (state_changed){
                    this.notify_neighbors(i, j)
                }
            }
        }
    }

    draw(ctx){
        //cells
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++){
                this.cells_matrix[i][j].draw(ctx)
            }
        }
    }

    resize_cells(res){
    
        let old_ROWS = ROWS
        let old_COLS = COLS
        
        resolution = res
        ROWS = Math.floor(height*(resolution/100.0))
        COLS = Math.floor(width*(resolution/100))
        this.cols = COLS
        this.rows = ROWS
        CELL_WIDTH = width/COLS
        CELL_HEIGHT = height/ROWS
        
        
        // if shrinking, bound is new value, if growing, bound is old value
        let row_bound = (old_ROWS <= ROWS) ? old_ROWS : ROWS
        let col_bound = (old_COLS <= COLS) ? old_COLS : COLS
    
        var old_cells_matrix = this.cells_matrix

        // create new matrix
        this.init_matrix()
        
        // fill with old
        for (let i = 0; i < row_bound; i++) {
            for (let j = 0; j < col_bound; j++) {
                this.cells_matrix[i][j] = old_cells_matrix[i][j]
            }
        }
    }

    change_mode(mode){
        if (mode === 'draw' && this.mode !== 'draw'){
            // this.init_matrix()
        }
        this.mode = mode
    }

    // function to export current state of grid as text file
    export(){
        // first row is rows and cols
        let data = this.rows + ' ' + this.cols + '\n'
        for (let i = 0; i < this.rows; i++) {
            for (let j = 0; j < this.cols; j++){
                data += this.cells_matrix[i][j].alive
            }
            data += '\n'
        }
        download("export.txt",data)
    }

}
