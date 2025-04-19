// src/scenes/Generator.js
import { createNoise2D } from 'simplex-noise';
import alea from 'alea';

const TILE = 16;
const W = 20, H = 15;      
const MIN_SCALE = 4, MAX_SCALE = 64;

export default class Generator extends Phaser.Scene {
  constructor(){ super('Generator'); }

  preload(){
    // 16×16 tileset image from the Kenny pack
    this.load.image('terrain', 'assets/terrain.png');
  }

  create(){
    this.scaleExp = 3;      
    this.makeNewSeed();

    this.input.keyboard.on('keydown-R', ()=>{
      this.makeNewSeed(true);
    });

    this.input.keyboard.on('keydown-PERIOD', ()=>this.zoom(+1));   // '>' key
    this.input.keyboard.on('keydown-COMMA', ()=>this.zoom(-1));    // '<' key
    
    
    this.redraw();
  }

  makeNewSeed(regenerate=false){
    // alea lets us reproducibly re‑seed simplex‑noise
    this.noise2D = createNoise2D(alea(Date.now().toString()));
    if(regenerate) this.redraw();
  }

  zoom(dir){                 // dir = ±1
    this.scaleExp = Phaser.Math.Clamp(this.scaleExp+dir,
                                      Math.log2(MIN_SCALE),
                                      Math.log2(MAX_SCALE));
    this.redraw();
  }

  /* ---------- core map creation ---------- */
  redraw(){
    const scale = 2 ** this.scaleExp;       // pixels per sample

    // build a JS 2‑D array of tile indices
    const grid = [];
    for(let y=0; y<H; y++){
      const row=[];
      for(let x=0; x<W; x++){
        // centre the noise
        const nx = (x - W/2) / scale;
        const ny = (y - H/2) / scale;
        const v = (this.noise2D(nx,ny)+1)/2;      // [0,1]

        // index from terrain.png
        row.push(
          v < 0.25 ? 3263      // water
        : v < 0.35 ? 300       // grass
        : v < 0.60 ? 1388       // land
        : v < 0.80 ? 17         // beach
        : v < 0.90 ? 52         // grey land
                      : 1633); // snow
      }
      grid.push(row);
    }

      // -------Transition tiles
  const WATER = 3263;
  const BEACH =   17;
  // copy baseGrid to detect neighbour
  const baseGrid = grid.map(r => r.slice());

  for(let y = 0; y < H; y++){
    for(let x = 0; x < W; x++){
      if (baseGrid[y][x] === WATER) {
        // four directions, up, r, down ,l
        const dirs = [[-1,0],[0,1],[1,0],[0,-1]];
        for (const [dy,dx] of dirs) {
          const ny = y + dy, nx = x + dx;
          if (ny >= 0 && ny < H && nx >= 0 && nx < W) {
            // change the neighbour of water to beach
            if (baseGrid[ny][nx] !== WATER) {
              grid[y][x] = BEACH;
              break;        // change the neighbour of sand to sand, quit
            }
          }
        }
      }
    }
  }


    // create Phaser tilemap
    if(!this.map){
      this.map = this.make.tilemap({ data:grid, tileWidth:TILE, tileHeight:TILE });
      const ts = this.map.addTilesetImage('terrain');
      this.layer = this.map.createLayer(0, ts, 0, 0);
    }else{
      for (let y = 0; y < H; y++) {
        for (let x = 0; x < W; x++) {
          // change the tile at (x,y) to a new index
          this.map.putTileAt(grid[y][x], x, y);
        }
      }
    }
  }
}
