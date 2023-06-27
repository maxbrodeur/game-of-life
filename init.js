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
const preset_parameter = document.querySelector(".preset")

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
    if ((menu.style.display==="none" || menu.style.display==='') && !shift_state){
        menu.style.display = "flex"
    }
}, false);


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

// function to load state of grid from text file
function load_game(data){
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
    return config

}

// function to read custom text file
game_reader.onload = _ => {
    let data = game_reader.result
    config = load_game(data)
    game = new Game_of_life(config)
};


// function to import state of grid from text file
function import_game(){     
    let input = document.createElement('input');
    input.type = 'file';

    input.onchange = _ => {
            // you can use this method to get file and perform respective operations
                let files =   Array.from(input.files);
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

// FORMATTING

run_button.onclick = function () {
    running = true
    if (mode === 'random'){
        game.generate_random()
    }
    if (mode === 'presets'){
        init()
    }
}


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

