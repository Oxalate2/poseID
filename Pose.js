let video;
let poseNet;
let pose;
let skeleton;

let brain;
let poseLabel = "";

let state = 'waiting';
let tergetLabel;

function keyPressed() {
    if (key == 't') {
        brain.normalizeData();
        brain.train({epochs: 50}, finished); 
    } else if (key == 's') {
        brain.saveData();
    } else {
        targetLabel = key;
        console.log(targetLabel);
        setTimeout(function() {
            console.log('collecting');
            state = 'collecting';
            setTimeout(function() {
            console.log('not collecting');
            state = 'waiting';
            }, 2000);
        }, 1000);
    }
}
function setup() {
    createCanvas(640, 480);
    video = createCapture(VIDEO);
    video.hide();
    poseNet = lm5.poseNet(video, modelLoaded);
    poseNet.on('pose', getPoses);

    let options = {
        inputs: 34,
        outputs: 4,
        task: 'classification',
        debug: true
    } 
    brain = ml5.neuralNetwork(options);

    const modelInfo = {
        model: 'model2/model.json',
        metadata: 'model2/model_meta.json',
        weights: 'model2/model.weights.bin',
    };
    brain.load(modelInfo, brainLoaded);
}

function brainLoaded() {
    console.log('pose classification ready!');
    classifyPose();
}
  
function classifyPose() {
    if (pose) {
      let inputs = [];
      for (let i = 0; i < pose.keypoints.length; i++) {
        let x = pose.keypoints[i].position.x;
        let y = pose.keypoints[i].position.y;
        inputs.push(x);
        inputs.push(y);
      }
      brain.classify(inputs, gotResult);
    } else {
      setTimeout(classifyPose, 100);
    }
    // if it doesn't detect pose then will try again every 100 ms
}
  
function gotResult(error, results) {  
    if (results[0].confidence > 0.75) {
      poseLabel = results[0].label.toUpperCase();
    }
    classifyPose();
}
  
function dataReady() {
    brain.normalizeData();
    brain.train({
      epochs: 50
    }, finished);
}
  
function finished() {
    console.log('model trained');
    brain.save();
    classifyPose();
}



/*going into the pose and getting all the x, y coords 
and putting them into the array, which is the input to
the neural network (aka brain)*/
function gotPoses(poses) {
    // console.log(poses); 
    if (poses.length > 0) {
      pose = poses[0].pose;
      skeleton = poses[0].skeleton;
      if (state == 'collecting') {
        // only happens if in collecting state
        let inputs = [];
        for (let i = 0; i < pose.keypoints.length; i++) {
          let x = pose.keypoints[i].position.x;
          let y = pose.keypoints[i].position.y;
          inputs.push(x);
          inputs.push(y);
        }
        let target = [targetLabel];
        brain.addData(inputs, target);
        /*(lines 49-57) going into the pose and getting all the 
        x, y coords and putting them into the array, 
        which is the input to the neural network (aka brain)*/
      }
    }
  }

function modelLoaded() {
    console.log('poseNet ready');
}

function draw() {
    push();
    translate(video.width, 0);
    scale(-1, 1);
    image(video, 0, 0, video.width, video.height);
  
    if (pose) {
      for (let i = 0; i < skeleton.length; i++) {
        let a = skeleton[i][0];
        let b = skeleton[i][1];
        strokeWeight(2);
        stroke(0);
  
        line(a.position.x, a.position.y, b.position.x, b.position.y);
      }
      for (let i = 0; i < pose.keypoints.length; i++) {
        let x = pose.keypoints[i].position.x;
        let y = pose.keypoints[i].position.y;
        fill(0);
        stroke(255);
        ellipse(x, y, 16, 16);
      }
    }
    pop();
  
    fill(255, 0, 255);
    noStroke();
    textSize(512);
    textAlign(CENTER, CENTER);
    text(poseLabel, width / 2, height / 2);
}