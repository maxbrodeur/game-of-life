var game
var COLS, ROWS, CELL_HEIGHT, CELL_WIDTH
var resolution, fps, mode
var running = false
var last = Date.now() + 1
debug = false
let game_reader = new FileReader();

const canvas = document.querySelector("canvas");
const width = canvas.width = window.innerWidth
const height = canvas.height = window.innerHeight
const ctx = canvas.getContext("2d")

// PARAMETERS
const close_button = document.querySelector(".close_button")
const export_button = document.querySelector(".export_button")
const import_button = document.querySelector(".import_button")
const parameters = document.querySelector(".parameters")
const menu = document.querySelector(".menu")
const run_button = document.querySelector(".run_button");
const stop_button = document.querySelector(".stop_button");
const clear_button = document.querySelector(".clear_button");
const fps_value = document.querySelector(".fps")
const res_value = document.querySelector(".resolution")
const mode_value = document.querySelector("#mode")
const preset_value = document.querySelector("#preset")

// INITIAL SCREEN
ctx.fillStyle = "rgb(0,0,0)"
ctx.fillRect(0,0,width,height)

// CONSTANTS
const ALIVE_COLOR = "rgb(255,255,255)"
const DEAD_COLOR = "rgb(0,0,0)"
const INITIAL_NUM_CELLS_PROPORTION_MAXIMUM = 0.30

// DRAWING EVENT LISTENERS
var in_parameters = false
var draw_state = false
var shift_state = false
// detect shift key for drawing without menu
document.addEventListener("keydown", function(event){
    if (event.key==="Shift"){
        shift_state = true
    }   
}, false);
document.addEventListener("keyup", function(event){
    if (event.key==="Shift"){
        shift_state = false
    }
}, false);

parameters.addEventListener("mousein", function(event){
    in_parameters = true
    draw_state = false
}, false);
parameters.addEventListener("mouseout", function(event){
    in_parameters = false
}, false);
canvas.addEventListener("mousedown", function(event){draw_state = true}, false);
canvas.addEventListener("mouseup", function(event){draw_state = false}, false);
canvas.addEventListener("mousemove", function(event){
    if (draw_state && !in_parameters) {
        draw_mode(event)
    }
}, false);
canvas.addEventListener("mouseout", function(event){draw_state = false}, false);
canvas.addEventListener("click", function(event){
    if (!in_parameters) {
        draw_mode(event)
    }
    if (menu.style.display==="none" && !shift_state){
        menu.style.display = "flex"
    }
}, false);


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

// function to download custom text file
function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

// function to read custom text file
game_reader.onload = _ => {
    let data = game_reader.result
    let lines = data.split('\n')
    let dims = lines[0].split(' ')
    let rows = parseInt(dims[0])
    let cols = parseInt(dims[1])
    ROWS = rows
    COLS = cols
    CELL_WIDTH = width/COLS
    CELL_HEIGHT = height/ROWS
    resolution = (ROWS/height)*100
    res_value.value = resolution
    resolution = res_value.value

    // create new matrix
    let cells_matrix = new Array(ROWS)
    for (let i = 0; i < ROWS; i++) {
        cells_matrix[i] = new Array(COLS)
        let line = lines[i+1]
        for (let j = 0; j < COLS; j++) {
            cells_matrix[i][j] = new Cell(j, i)
            cells_matrix[i][j].alive = parseInt(line[j])
        }
    }

    config = {
        rows: ROWS,
        cols: COLS,
        mode: mode,
        cells_matrix: cells_matrix
    }
    game = new Game_of_life(config)
    game.update_all_neighbors()
};



// function to import state of grid from text file
function import_game(){     
    let input = document.createElement('input');
    input.type = 'file';

    input.onchange = _ => {
            // you can use this method to get file and perform respective operations
                let files =   Array.from(input.files);
                console.log(files);
                for (let i = 0; i < files.length; i++) {
                    const file = files[i];
                    game_reader.readAsText(file);
                }
    };
    input.click();
}

function draw_mode(event){
    if (mode === 'draw'){
        let rect = canvas.getBoundingClientRect();
        let x = event.clientX - rect.left;
        let y = event.clientY - rect.top;
        let i = Math.floor(y/CELL_HEIGHT)
        let j = Math.floor(x/CELL_WIDTH)
        if (game.cells_matrix[i][j].alive !== 1){
            game.cells_matrix[i][j].revive()
            game.notify_neighbors(i,j)
        }
    }
}

// INITIALIZE
function init(){

    // INITIAL VALUES
    running = true
    mode = mode_value.value
    if (mode === 'random'){
        res_value.value = Math.random()*10
    } 

    if (mode === 'presets'){
        preset_value.style.display = 'flex'
        preset = preset_value.value
        file = './demo.txt'
        if (preset === 'demo'){
            file = './demo.txt'
        }
        fetch(file)
        .then(response => response.text())
        .then(data => {
          console.log(data);
        })
        .catch(error => {
          console.error('Error loading file:', error);
        });
    } else {
        preset_value.style.display = 'none'
    }

    fps = fps_value.value
    res_value.value = Math.floor(res_value.value)
    resolution = res_value.value
    ROWS = Math.floor(height*(resolution/100.0))
    COLS = Math.floor(width*(resolution/100.0))
    CELL_WIDTH = width/COLS
    CELL_HEIGHT = height/ROWS

    const config = {
        rows: ROWS,
        cols: COLS,
        mode: mode
    };
    game = new Game_of_life(config);

}

function run() {
    loop();
}

function loop() {

    while(res_value.value!==resolution){
        game.resize_cells(res_value.value); 
        res_value.value = Math.floor(res_value.value); 
        resolution = res_value.value
    }
    while(fps_value.value!==fps){fps = fps_value.value}
    while(mode_value.value!==mode){
        mode = mode_value.value; 
        game.change_mode(mode);
        if (mode === 'presets'){
            preset_value.style.display = 'flex';
        } else {
            preset_value.style.display = 'none';
        }
    }
    
    // background
    ctx.fillStyle = "rgb(0,0,0)"
    ctx.fillRect(0,0,width,height)
    
    current_interval = Date.now() - last
    // if fps is too high, wait
    // time is in ms, so 1000/fps is the time in ms between frames
    // Quote from stack overflow: All you can control is when you're going to skip a frame. A 60 fps monitor always draws at 16ms intervals. 
    if (current_interval > 1000/fps && running) {
        last = Date.now()
        game.update()
    }

    game.draw(ctx)
    
    requestAnimationFrame(loop)
}

run_button.onclick = function () {
    running = true
    if (mode === 'random'){
        game.generate_random()
    }
}

init()
run()


// FORMATTING

close_button.onclick = function () {
    menu.style.display = "None"
}

stop_button.onclick = function () {
    running = false
}

clear_button.onclick = function () {
    game.init_matrix()
}

export_button.onclick = function () {
    game.export()
}

import_button.onclick = function () {
    import_game()
}

