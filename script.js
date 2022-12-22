const canvas = document.querySelector("canvas");
const width = canvas.width = window.innerWidth
const height = canvas.height = window.innerHeight
const ctx = canvas.getContext("2d")

// PARAMETERS
const close_button = document.querySelector(".close_button")
const parameters = document.querySelector(".parameters")
const run_button = document.querySelector(".run_button");
// sliders
const speed_slider = document.querySelector(".speed")
const speed_output = document.querySelector("#speed")
const max = speed_slider.max
const res_slider = document.querySelector(".resolution")
const res_output = document.querySelector("#resolution")


// INITIAL SCREEN
ctx.fillStyle = "rgb(0,0,0)"
ctx.fillRect(0,0,width,height)

var cells_matrix 
var COLS,ROWS, num_cells, speed, CELL_HEIGHT, CELL_WIDTH

function init(){

    // INITIAL VALUES
    num_cells = document.querySelector(".num_cells").value
    // ROWS = document.querySelector(".num_rows").value
    // COLS = document.querySelector(".num_cols").value
    speed = document.querySelector(".speed").value
    resolution = document.querySelector(".resolution").value
    ROWS = Math.floor(height*(resolution/100.0))
    COLS = Math.floor(width*(resolution/100))
    CELL_WIDTH = width/COLS
    CELL_HEIGHT = height/ROWS

    gen_cells()
    
}

const ALIVE_COLOR = "rgb(255,255,255)"
const DEAD_COLOR = "rgb(0,0,0)"

const STEPS = 10

class Cell {
    
    constructor(x,y){
        this.x = x
        this.y = y
        this.alive = 0
        this.color = DEAD_COLOR
    }
    
    draw() {
        this.color = DEAD_COLOR
        if (this.alive===1) {
            this.color = ALIVE_COLOR
        }
        ctx.fillStyle = this.color
        ctx.fillRect(this.x*CELL_WIDTH,this.y*CELL_HEIGHT,CELL_WIDTH,CELL_HEIGHT)
    }

    neighbor_count(){
        let x = this.x
        let y = this.y
        let indices = [
            [y,     x-1 ],  // W
            [y-1,   x-1 ],  // NW
            [y-1,   x   ],  // N
            [y-1,   x+1 ],  // NE
            [y,     x+1 ],  // E
            [y+1,   x+1 ],  // SE
            [y+1,   x   ],  // S
            [y+1,   x-1 ],  // SW
        ]
        indices = indices.filter(index => index[0]>=0 && index[0]<ROWS && index[1]>=0 && index[1]<COLS);
        let ctr = 0
        for (let i = 0; i < indices.length; i++) {
            const index = indices[i];
            if (cells_matrix[index[0]][index[1]].alive===1){
                ctr += 1
            }   
        }
        return ctr
    }
    
    update() {
        let ctr = this.neighbor_count()
        if (this.alive==1){
            if (ctr<2){ // UNDERPOPULATION
                this.alive = 0
            } else if(ctr==2 || ctr==3){
                this.alive = 1
            } else if(ctr>3) { // OVERPOPULATION
                this.alive = 0
            }
        } else if (this.alive===0){ // REPRODUCTION
            if(ctr===3){
                this.alive = 1
            }
        }
    }

    revive() {
        this.alive=1
    }

    kill() {
        this.alive=0
    }

} 



function gen_cells(){
    cells_matrix = []
    for (let i = 0; i < ROWS; i++) {
        cells_matrix[i] = []
        for (let j = 0; j < COLS; j++) {
            let cell = new Cell(j,i)
            cells_matrix[i][j] = cell
        }
    }
}

// function kill_all(cells){
//     cells.forEach(cell=>cell.kill())
// }

function resize_cells(res){
    
    
    let old_ROWS = ROWS
    let old_COLS = COLS
    
    resolution = res
    ROWS = Math.floor(height*(resolution/100.0))
    COLS = Math.floor(width*(resolution/100))
    CELL_WIDTH = width/COLS
    CELL_HEIGHT = height/ROWS
    
    
    // if shrinking, bound is new value, if growing, bound is old value
    let row_bound = (old_ROWS <= ROWS) ? old_ROWS : ROWS
    let col_bound = (old_COLS <= COLS) ? old_COLS : COLS

    var old_cells_matrix = cells_matrix
    // generate new cells
    gen_cells()

    // fill with old
    for (let i = 0; i < row_bound; i++) {
        for (let j = 0; j < col_bound; j++) {
            cells_matrix[i][j] = old_cells_matrix[i][j]
        }
    }
}


function revive_random(){
    let blacklist = []
    for (let i = 0; i < num_cells; i++) {
        if (blacklist.length>=COLS*ROWS){
            console.log("ERROR: too many cells")
            return;
        }
        let index = [Math.floor(Math.random()*ROWS), Math.floor(Math.random()*COLS)]
        while(blacklist.includes(index)){
            index = [Math.floor(Math.random()*ROWS), Math.floor(Math.random()*COLS)]
        }
        blacklist.push(index)
        let cell = cells_matrix[index[0]][index[1]]
        cell.revive()
    }
}




function run() {
    init()
    revive_random()    
    loop()
}

var count = 0


function loop() {

    speed = max - (speed_slider.value-1)   

    let res = res_slider.value
    while(res_slider.value!==resolution){resize_cells(res_slider.value)}
    
    if(count%speed==0){
        
        //background
        ctx.fillStyle = "rgb(0,0,0)"
        ctx.fillRect(0,0,width,height)

        //cells
        for (let i = 0; i < ROWS; i++) {
            for (let j = 0; j < COLS; j++) {
                cells_matrix[i][j].draw()
                cells_matrix[i][j].update()
            }
        }

        count=0        
    }

    count++
    requestAnimationFrame(loop)
}

run_button.onclick = run
run()


// FORMATTING

close_button.onclick = function () {
    parameters.style.display = "None"
}

canvas.onclick = function () {
    parameters.style.display = "flex"
}



function res_text_update() {
    res_output.innerText = res_slider.value + "%"
}

res_text_update()
res_slider.onchange = res_text_update


function speed_text_update() {
    speed_output.innerText = max - speed_slider.value
}
speed_slider.onchange = speed_text_update



// Initial display
speed_text_update()