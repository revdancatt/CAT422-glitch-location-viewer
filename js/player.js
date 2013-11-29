player = {
    
    position: {
        x: 0,
        y: 0,
        frame: 0,
        facing: 'right',
        moving: false,
        startTime: new Date()
    },
    size: {
        width: 78,
        height: 119
    },
    speed: 10,
    keyControls: {
        leftPressed: false,
        rightPressed: false,
        upPressed: false,
        downPressed: false
    },
    loaded: false,

    init: function() {

        //  do stuff with the window positions
        //  and interface positions
        $(window).bind('resize', function() {
            //  Nowt
        });

        //  Capture the keys
        //  Yeah ok, so this kinda gross & not the idea way to do this, but it'll do
        //  for the moment.
        //  Normal up/down, left/right cursor and WASD controls, space for jump
        $(document).bind('keydown', function(e) {
            if (e.keyCode == 39 || e.keyCode == 68) player.keyControls.rightPressed = true;         //  cursor right || D
            if (e.keyCode == 37 || e.keyCode == 65) player.keyControls.leftPressed = true;          //  cursor left || A
            if (e.keyCode == 38 || e.keyCode == 87) player.keyControls.upPressed = true;   //  cursor up || W
            if (e.keyCode == 40 || e.keyCode == 83) player.keyControls.downPressed = true;      //  cursor down || S
            //if (e.keyCode == 32) JUMP
        });

        $(document).bind('keyup', function(e) {
            if (e.keyCode == 39 || e.keyCode == 68) player.keyControls.rightPressed = false;        //  cursor right || D
            if (e.keyCode == 37 || e.keyCode == 65) player.keyControls.leftPressed = false;         //  cursor left || A
            if (e.keyCode == 38 || e.keyCode == 87) player.keyControls.upPressed = false;  //  cursor up || W
            if (e.keyCode == 40 || e.keyCode == 83) player.keyControls.downPressed = false;     //  cursor down || S
        });


        //  This is the draw interval which draws the whole 'frame'
        //  we do this as often as possible.
        setInterval(function() {
            player.drawFrame();
        }, 10);

        //  This is the player update interval which we only
        //  care about at around 25 frames per second
        setInterval(function() {

            player.position.frame++;
            if (player.position.frame > 11) player.position.frame = 0;

            if (player.keyControls.rightPressed || player.keyControls.leftPressed || player.keyControls.upPressed || player.keyControls.downPressed) {
                player.position.moving = true;

                if (player.keyControls.rightPressed) player.position.x += player.speed;
                if (player.keyControls.leftPressed) player.position.x -= player.speed;
                if (player.keyControls.upPressed) player.position.y += player.speed;
                if (player.keyControls.downPressed) player.position.y -= player.speed;

                if (player.position.x > control.stageWidth - (player.size.width/2)) player.position.x = control.stageWidth - (player.size.width/2);
                if (player.position.x < 0) player.position.x = 0;

                if (player.position.y > control.stageHeight - (player.size.height/2)) player.position.y = control.stageHeight - (player.size.height/2);
                if (player.position.y < player.size.width/2) player.position.y = player.size.width/2;

                //  work out if the glitch needs to turn left or right
                if (player.keyControls.rightPressed && !player.keyControls.leftPressed) {
                    //  if we are turning then we need to remove the class
                    if (player.position.facing == 'left') {
                        $('.player_frame').removeClass('facingLeft');
                        player.position.facing = 'right';
                    }
                }

                if (!player.keyControls.rightPressed && player.keyControls.leftPressed) {
                    //  if we are turning then we need to add the class
                    if (player.position.facing == 'right') {
                        $('.player_frame').addClass('facingLeft');
                        player.position.facing = 'left';
                    }
                }

            } else {
                player.position.moving = false;
            }

            //  if the player is moving update the frame
            if (player.position.moving) {
                var frame = Math.floor((new Date() - player.position.startTime) / 50) % 11;
                $('.player').css('background-position', -(frame * player.size.width) + 'px 0');
            } else {
                $('.player').css('background-position', -(14 * player.size.width) + 'px 0');
            }

        }, 40);

    },

    drawFrame: function() {

        //  if the player isn't loaded then don't do any of this
        if (player.loaded === false) {
            return;
        }
        
        var middleGroundOffset = player.position.x - (control.stageHolderWidth / 2);
        if (middleGroundOffset < 0) middleGroundOffset = 0;
        if (middleGroundOffset > control.stageWidth - control.stageHolderWidth) middleGroundOffset = control.stageWidth - control.stageHolderWidth;
        var currentPercent = middleGroundOffset / (control.stageWidth - control.stageHolderWidth);

        var len = control.layersId.length;
        while (len--) {
            layerId = control.layersId[len];
            try {
                room.dynamic.layers[layerId].offset = ((room.dynamic.layers[layerId].w - control.stageHolderWidth) * -currentPercent);
                $('#' + layerId).css('transform', 'translateX(' + room.dynamic.layers[layerId].offset + 'px)' );
            } catch(er) {//nowt
            }
        }

        //  Work out the position of the player
        var newY = -(control.stageHeight - player.position.y) + (control.stageHolderHeight / 2);
        if (newY < control.stageHolderHeight - control.stageHeight) newY = control.stageHolderHeight - control.stageHeight;
        if (newY > 0) newY = 0;
        $('.stage').css('transform', 'translateY(' + newY + 'px)' );

        //  Place the player
        $('.player_holder').css({
            'transform': 'translateX(' + (player.position.x - (player.size.width/2)) + 'px) translateY(' + (control.stageHeight - player.position.y - player.size.height) + 'px)'
        });
    },

    setPosition: function(x, y) {
        this.position.x = x;
        this.position.y = y;
    }

};