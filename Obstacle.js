class Obstacle{
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height= height;
        this.scored = false
    }

    tick(speed) {
        this.x -= speed;
    }
}