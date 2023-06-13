let player = new Player(0, 0, 20, 40);
let score = 0;
let generation = 0;
let training = false

let jumpConfidence = 0;
let noJumpConfidence = 0;

let xOfClosestObstacle = 0;

let currentJump = {
    goodJump: false,
    jumpState: -1, // -1 = no jump, 0 = in jump, 1 = jump ended
    lastJumpRelativeToObstacle: 0
}

let canvas = document.getElementsByTagName("canvas")[0];
let ctx = canvas.getContext("2d");

let mldata = [
    { nearest_obstacle_x: 1005, nearest_obstacle_height: 21, should_jump: 'false' },
    { nearest_obstacle_x: 300, nearest_obstacle_height: 22, should_jump: 'true' },
]
let mlOptions = {
    "task": "classification",
    "debug": false,
}

let nn = ml5.neuralNetwork(mlOptions)
trainNN()

function trainNN() {
    console.log("loading ml5 neural network")
    mldata.forEach((elem) => {
        const inputs = {
            nearest_obstacle_x: elem.nearest_obstacle_x,
            nearest_obstacle_height: elem.nearest_obstacle_height,
        }
        const outputs = {
            should_jump: elem.should_jump
        }
        nn.addData(inputs, outputs)
    })

    nn.normalizeData()

    let finishedTraining = () => {
        console.log("done training! starting game")
        training = false
        gameloop()
    }

    training = true
    nn.train({ epochs: 100, batchSize: 1000 }, finishedTraining)
}


let obstacles = [];
let passedObstacles = [];

let draw = () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "grey";
    ctx.fillRect(0, 0, canvas.width, canvas.height)

    ctx.fillStyle = "white";
    ctx.font = "20px Arial";
    ctx.fillText("Score: " + score, 10, 20);
    ctx.fillText("Generation: " + generation, 10, 40);
    ctx.fillText("Jump confidence: " + jumpConfidence, 10, 80)
    ctx.fillText("No jump confidence: " + noJumpConfidence, 10, 100)
    ctx.fillText("Nearest obstacle x: " + xOfClosestObstacle, 10, 120)
    ctx.fillText("Nearest obstacle height: " + obstacles[0].height, 10, 140)
    ctx.fillText("Last jump relative to obstacle: " + currentJump.lastJumpRelativeToObstacle, 10, 160)
    ctx.fillText("Times jumped: " + player.timesJumped, 10, 180)



    ctx.fillStyle = "black";
    ctx.fillRect(player.PLAYER_X, player.y, player.width, player.height);

    for (let i = 0; i < obstacles.length; i++) {
        ctx.fillStyle = "red";
        ctx.fillRect(obstacles[i].x, obstacles[i].y, obstacles[i].width, obstacles[i].height);
    }
    for (let i = 0; i < passedObstacles.length; i++) {
        ctx.fillStyle = "green";
        ctx.fillRect(passedObstacles[i].x, passedObstacles[i].y, passedObstacles[i].width, passedObstacles[i].height);
    }
}

let gameloop = () => {
    player.tick();
    if (player.y > canvas.height - player.height) {
        player.floor();
    }

    if (Math.random() < 0.01 || obstacles.length == 0) {
        let height = Math.floor(Math.random() * 30);
        obstacles.push(new Obstacle(canvas.width, canvas.height - height, 20, 10 + height));
    }

    for (let i = 0; i < obstacles.length; i++) {
        obstacles[i].tick(player.speed);
        if (obstacles[i].x < 0) {
            obstacles.splice(i, 1);
            i--;
            if (i < 0) break
        }
        if (obstacles[i].x + obstacles[i].width < player.PLAYER_X) {

            score++;
            console.log("GOOD JUMP!")
            if (currentJump.jumpState == 0) {
                currentJump.goodJump = true;
            }
            mldata.push({
                nearest_obstacle_x: currentJump.lastJumpRelativeToObstacle,
                nearest_obstacle_height: obstacles[0].height,
                should_jump: "true"
            })
            passedObstacles.push(obstacles[i])
            obstacles.splice(i, 1);
            i--;
            if (i < 0) break
        }
        if (
            player.PLAYER_X < obstacles[i].x + obstacles[i].width &&
            player.PLAYER_X + player.width > obstacles[i].x &&
            player.y < obstacles[i].y + obstacles[i].height &&
            player.y + player.height > obstacles[i].y
        ) {
            generation++;
            score = 0;
            player.timesJumped = 0;
            obstacles = [new Obstacle(canvas.width, canvas.height - 20, 20, 20)];
            if (!player.canJump) {
                console.log("BAD JUMP!")
                
            }else{
                let temp = (Math.random() * 5) + 30
                console.log("shoulda jumped at "+temp+" but didn't")
                let data = {
                    nearest_obstacle_x: xOfClosestObstacle + temp,
                    nearest_obstacle_height: obstacles[0].height,
                    should_jump: "true"
                }
                console.log(data)
                mldata.push(data)
            }
            trainNN()
        }
        draw();
    }

    for (let i = 0; i < passedObstacles.length; i++) {
        passedObstacles[i].tick(player.speed);
        if (passedObstacles[i].x < 0) {
            passedObstacles.splice(i, 1);
            i--;
            if (i < 0) break
        }
    }
    xOfClosestObstacle = obstacles[0].x;

    if ( obstacles.length == 0) {
        let height = Math.floor(Math.random() * 30);
        obstacles.push(new Obstacle(canvas.width, canvas.height - height, 20, 10 + height));
    }

    nn.classify({
        nearest_obstacle_x: obstacles[0].x,
        nearest_obstacle_height: 20,
    }, (err, results) => {
        if (err) {
            console.log(err);
            return;
        }
        if(results[0].label == "true"){
            jumpConfidence = results[0].confidence;
            noJumpConfidence = results[1].confidence;
        }else{
            jumpConfidence = results[1].confidence;
            noJumpConfidence = results[0].confidence;
        }
        if (jumpConfidence > document.getElementById("confidenceToJump").value/100) {
            if (player.canJump) {
                player.jump();
                currentJump.jumpState = 0;
            }
            currentJump.lastJumpRelativeToObstacle = obstacles[0].x;
        }
    })
    if (player.canJump && currentJump.jumpState == 0) {
        currentJump.jumpState = 1
        if (!currentJump.goodJump) {
            console.log("useless jump")
            mldata.push({
                nearest_obstacle_x: currentJump.lastJumpRelativeToObstacle,
                nearest_obstacle_height: obstacles[0].height,
                should_jump: "false"
            })
        }

        currentJump.jumpState = -1;
    }
    if (currentJump.jumpState == -1) {
        currentJump.goodJump = false;
    }

}
setInterval(() => {
    if (!training)
        window.requestAnimationFrame(gameloop);
}, 1000 / 60)

document.getElementById("confidenceToJump").addEventListener("mousemove", (e) => {
    document.getElementById("confidenceValue").innerHTML = document.getElementById("confidenceToJump").value/100;
})
