const canvas = document.querySelector("canvas");
const width = canvas.width = window.innerWidth
const height = canvas.height = window.innerHeight

const ctx = canvas.getContext("2d")

const ALIVE_COLOR = "rgb(255,255,255)"
const DEAD_COLOR = "rgb(0,0,0)"
const COLS = 80
const ROWS = 50
const CELL_WIDTH = width/COLS
const CELL_HEIGHT = height/ROWS

// MATRIX CONTAINING CELLS
const cell_array = new Array(ROWS)
for (let i = 0; i < ROWS; i++) {
    cell_array[i] = new Array(COLS)
}

const STEPS = 10

class Cell {
    
    constructor(x,y){
        this.x = x
        this.y = y
        this.alive = 0
        this.color = DEAD_COLOR
    }
    
    draw() {
        // ctx.beginPath()
        this.color = DEAD_COLOR
        if (this.alive===1) {
            this.color = ALIVE_COLOR
        }
        ctx.fillStyle = this.color
        ctx.fillRect(this.x*CELL_WIDTH,this.y*CELL_HEIGHT,CELL_WIDTH,CELL_HEIGHT)
        // ctx.fill()
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
            if (cell_array[index[0]][index[1]]===1){
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
        cell_array[this.y][this.x]=this.alive
    }

    revive() {
        this.alive=1
        cell_array[this.y][this.x] = 1
    }

} 



function gen_cells(){
    const cells = []
    for (let i = 0; i < cell_array.length; i++) {
        const r = cell_array[i];
        for (let j = 0; j < r.length; j++) {
            cells.push(new Cell(j,i))
        }
    }
    return cells
}


function revive_random(num, cells_){
    let blacklist = []
    for (let i = 0; i < num; i++) {
        if (blacklist.length>=COLS*ROWS){
            console.log("ERROR: too many cells")
            return;
        }
        let index = Math.floor(Math.random()*COLS*ROWS)
        while(blacklist.includes(index)){
            index = Math.floor(Math.random()*COLS*ROWS)
        }
        blacklist.push(index)
        let cell = cells_[index]
        cell.revive()
    }
}

const cells = gen_cells()
revive_random(200,cells)

// midX = width/2.0-CELL_WIDTH/2.0
// midY = height/2.0-CELL_HEIGHT/2.0
// const cell = new Cell(midX,midY)

// const cells = random_cells(200)



let count = 0

function loop() {
    
    if(count%20==0){
        
        //background
        ctx.fillStyle = "rgb(0,0,0)"
        ctx.fillRect(0,0,width,height)

        //cells
        cells.forEach(cell => {
            cell.draw()
            cell.update()            
        });

        count=0        
    }

    count++
    requestAnimationFrame(loop)
}

// function loop(){
//     ctx.fillStyle = "rgb(0,0,0)"
//     ctx.fillRect(0,0,width,height)
//     for (const cell of cells) {
//         cell.draw()
//         cell.update()
//     }

// }

loop()

