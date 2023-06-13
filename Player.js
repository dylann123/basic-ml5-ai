class Player {
    /**
     * 
     * @param {int} x x position
     * @param {int} y y position
     * @param {int} width width
     * @param {int} height height
     */
    constructor(x, y, width, height) {
        this.x = x;
        this.y = y;
        this.width = width;
        this.height = height;
        this.yVelocity = 0;
        this.speed = 5;
        this.canJump = true;
        this.timesJumped = 0

        this.JUMP_STRENGTH = 10;
        this.PLAYER_X = 250;


        document.addEventListener("keydown", (e) => {
            if ((e.key == " " || e.key == "ArrowUp" || e.key == "w") && this.canJump) {
                this.jump();
            }
        })
    }

    jump() {
        if(!this.canJump) return
        this.yVelocity = this.JUMP_STRENGTH;
        this.canJump = false;
        this.timesJumped++;
    }

    tick() {
        this.yVelocity -= 1;
        this.y -= this.yVelocity;
        this.x += this.speed;
    }

    floor() {
        this.y += this.yVelocity
        this.yVelocity = 0;
        this.canJump = true;
    }
}  
