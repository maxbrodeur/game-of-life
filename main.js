
// INITIALIZE
function init(){

    // INITIAL VALUES
    running = true
    mode = mode_value.value

    if (mode === 'random'){
        res_value.value = Math.random()*10
    } 

    res_value.value = Math.floor(res_value.value)
    resolution = res_value.value
    fps = fps_value.value
    ROWS = Math.floor(height*(resolution/100.0))
    COLS = Math.floor(width*(resolution/100.0))
    CELL_WIDTH = width/COLS
    CELL_HEIGHT = height/ROWS

    var config = {
        rows: ROWS,
        cols: COLS,
        mode: mode,
    };

    if (mode === 'presets'){
        preset_value.style.display = 'flex'
        preset = preset_value.value
        file = './demo.txt'
        if (preset === 'demo'){
            file = './demo.txt'
            // file = 'https://maxbrodeur.github.io/game-of-life/demo.txt'
        }
        fetch(file)
        .then(response => response.text())
        .then(data => {
            config = load_game(data)
        })
        .catch(error => {
          console.error('Error loading file:', error);
        });
    } else {
        preset_value.style.display = 'none'
    }

    game = new Game_of_life(config);

}

function run() {
    while(game === undefined){}
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

init()
run()

