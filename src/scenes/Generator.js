// src/scenes/Generator.js
import { createNoise2D } from 'simplex-noise';
import alea from 'alea';
import tracery from 'tracery-grammar';


const TILE = 16;
const W = 20, H = 15;      
const MIN_SCALE = 4, MAX_SCALE = 64;

export default class Generator extends Phaser.Scene {
  constructor(){ 
    super('Generator');
    this.placeGroup = null;
   }

  preload(){
    // 16×16 tileset image from the Kenny pack
    this.load.spritesheet(
      'terrain',
      'assets/terrain.png',
      {
        frameWidth: 16,
        frameHeight: 16,
        margin: 0,
        spacing: 0
      }
    );
    this.load.image('player', 'assets/player.png');

  }

  create(){
    this.scaleExp = 3;      
    this.makeNewSeed();

    this.input.keyboard.on('keydown-R', ()=>{
      this.makeNewSeed(true);
    });

    this.input.keyboard.on('keydown-PERIOD', ()=>this.zoom(+1));   // ， key to reload map
    this.input.keyboard.on('keydown-COMMA', ()=>this.zoom(-1));    // . key to reload map
    

        // limit the world in the map
        this.physics.world.setBounds(0, 0, W * TILE, H * TILE);
        this.cameras.main.setBounds(0, 0, W * TILE, H * TILE);
    
        // create a player，replace the index
        this.player = this.physics.add
          .sprite((W/2)*TILE, (H/2)*TILE, 'player')
          .setDepth(10)
          .setCollideWorldBounds(true)
          .setDisplaySize(TILE,TILE);
    
        // get the curosr
        this.cursors = this.input.keyboard.createCursorKeys();
    
        // camera follows the player
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

        this.placeGroup = this.add.group();

        this.redraw();
  }

  update(){
    if (!this.player) return;
    const speed = 100;
    this.player.setVelocity(0);

    // control speed
    if (this.cursors.left.isDown)  this.player.setVelocityX(-speed);
    if (this.cursors.right.isDown) this.player.setVelocityX( speed);
    if (this.cursors.up.isDown)    this.player.setVelocityY(-speed);
    if (this.cursors.down.isDown)  this.player.setVelocityY( speed);

    // can not go into the water
    const tx = Math.floor(this.player.x / TILE);
    const ty = Math.floor(this.player.y / TILE);
    const tileIdx = this.map.getTileAt(tx, ty).index;
    if (tileIdx === 3263) {  // water index
      this.player.setVelocity(0);
    }
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

  //----------map creation ---------- 
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
              break;     
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



    // clear name objects
this.placeGroup.clear(true, true);

// define a list of names
const grammar = {
  origin: ["Porter College","MH Library","Okes Dinning hall","S&E Library","East Field"]
};
const g = tracery.createGrammar(grammar);

// randorm select 5 areas
for (let i = 0; i < 5; i++) {
  // select a center
  const x = Phaser.Math.Between(0, W - 1) * TILE + TILE / 2;
  const y = Phaser.Math.Between(0, H - 1) * TILE + TILE / 2;
  const name = g.flatten("#origin#");  // select a name

  const txt = this.add.text(x, y, name, {
    fontSize: "12px",
    color: "#222",
    backgroundColor: "rgba(255,255,255,0.7)"
  })
    .setOrigin(0.5)
    .setDepth(20);

  this.placeGroup.add(txt);
}

  }
}
