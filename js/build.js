var game = new Phaser.Game(800, 600, Phaser.AUTO, 'container', { preload: preload, create: create, update: update, render: render });

function preload() {
  for (var i = 1; i <= 8; i++) {
    game.load.image('p' + i, 'assets/p' + i + '.png');
  }

  //  Load our physics data exported from PhysicsEditor
  game.load.physics('physicsData', 'assets/puzzle2.json');

}

function pxmi(v) {
  return v * -0.05;
}

function ipxmi(v) {
  return v * -20;
}

var p = [];
var selection = {
  body: null
, nullBody: null
, constraint: null
, mousePoint: Phaser.Physics.P2.vec2.create()
, bodyPoint: {x: 0, y: 0}
}

function create() {
  // Enable p2 physics
  game.physics.startSystem(Phaser.Physics.P2JS);
  // Set background
  game.stage.backgroundColor = '#FFFFFF';

  // No Gravity
  game.physics.p2.gravity.y = 0;

  //  Make things a bit more bouncey
  game.physics.p2.defaultRestitution = 0.8;

  // Add sprites
  for (var i = 1; i <= 8; i++) {
    p[i-1] = game.add.sprite(200 * ((i % 3) + 1), 100 * ((i % 4) + 1), 'p'+i);
  }

  //  Enable the physics bodies on all the sprites and turn on the visual debugger
  game.physics.p2.enable(p.slice(), true);

  //  Clear the shapes and load the polygons from the physicsData JSON file in the cache
  for (var i = 1; i <= 8; i++) {
    p[i-1].body.clearShapes()
    p[i-1].body.loadPolygon('physicsData', 'p'+i);
    p[i-1].body.damping = 1
    p[i-1].body.applyDamping(true)

    p[i-1].inputEnabled = true
    p[i-1].input.useHandCursor = true
  }

  /**
   * Handling mouse actions
   */
  game.input.mouse.mouseDownCallback = function() {
    // console.log(arguments)
    handleMouseDown.apply(null, arguments)
  }

  game.input.mouse.mouseMoveCallback = function() {
    // console.log(arguments)
    handleMouseMove.apply(null, arguments)
  }

  game.input.mouse.mouseUpCallback = function() {
    // console.log(arguments)
    handleMouseUp.apply(null, arguments)
  }

  // Add null body for selection
  selection.nullBody = new Phaser.Physics.P2.Body(game)

  function noCollisions(bodyA, bodyB) {
    return false;
  }
  // Disable any collisions
  game.physics.p2.setPostBroadphaseCallback(noCollisions, this);
}

function update() {
  for (var i = 1; i <= 8; i++) {
    p[i-1].body.fixedRotation = true
  }
  if (selection.nullBody !== null) {
    selection.nullBody.fixedRotation = true
  }
}

function render() {
}

function handleMouseDown(ev) {
  Phaser.Physics.P2.vec2.set(selection.mousePoint, ev.pageX, ev.pageY)

  var hits = game.physics.p2.hitTest(new Phaser.Point(selection.mousePoint[0], selection.mousePoint[1]), p.slice(), 2, true)

  // Remove old objects if any
  handleMouseUp()

  if (hits.length > 0) {
    selection.body = hits[0]
    game.physics.p2.addBody(selection.nullBody)
    selection.nullBody.static = true

    Phaser.Physics.P2.vec2.set(selection.mousePoint, ipxmi(selection.body.position[0]), ipxmi(selection.body.position[1]))

    selection.bodyPoint.x = (selection.body.position[0]) - pxmi(ev.pageX)
    selection.bodyPoint.y = (selection.body.position[1]) - pxmi(ev.pageY)

    // Create constraint
    selection.constraint =  game.physics.p2.createRevoluteConstraint(selection.nullBody, selection.mousePoint, selection.body, [0, 0]);
  }
}

function handleMouseMove(ev) {
  if (selection.body !== null && selection.constraint !== null) {
    Phaser.Physics.P2.vec2.set(selection.mousePoint, pxmi(ev.pageX) + selection.bodyPoint.x, pxmi(ev.pageY) + selection.bodyPoint.y)

    // Wake up bodies
    selection.constraint.bodyA.wakeUp();
    selection.constraint.bodyB.wakeUp();
  }
}

function handleMouseUp(ev) {
  if (selection.constraint !== null) {
    // Remove constraint
    game.physics.p2.removeConstraint(selection.constraint)
    selection.constraint = null
  }

  if (selection.nullBody !== null) {
    // Remove null body
    game.physics.p2.removeBody(selection.nullBody)
  }

  if (selection.body !== null) {
    selection.body = null
  }
}
