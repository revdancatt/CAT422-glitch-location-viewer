player = {
    
    position: {
        x: 0,
        y: 0,
        frame: 0,
        facing: 'right',
        moving: false,
        startTime: new Date(),
    },
    username: null,
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
    connected: false,
    otherUsers: {},

    init: function() {

        //  Get the username
        this.username = 'Guest' + parseInt(Math.random() * 100000, 10);

        try {
            if ('username' in localStorage && localStorage.username !== '') {
                this.username = localStorage.username.replace(/\ /g, '_').replace(/[^a-zA-Z 0-9 ]+/g,'');
            } else {
                localStorage.username = this.username;
            }
        } catch(er) {
            //Nowt
        }

        $('.newName').val(player.username);

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
                $('.player').css({
                    'background-position': -(frame * player.size.width) + 'px 0'
                });
            } else {
                $('.player').css({
                    'background-position': -(14 * player.size.width) + 'px 0'
                });
            }

            $('.player_holder').css('z-index', 9999 - player.position.y);

        }, 40);


        //  Draw the other players
        setInterval(function() {

            //  Work out where the other players are currently and where they're
            //  going towards
            var thisUser = null;
            var otherPlayerSprite = null;
            var isMoving = null;
            var frame = null;

            for (var user in player.otherUsers) {
                thisUser = player.otherUsers[user];

                isMoving = false;

                //  If we are trying to move then move now
                if (thisUser.position.x != thisUser.target.x || thisUser.position.y != thisUser.target.y) {

                    isMoving = true;

                    //  If we are within x pixels then just move them there
                    if (Math.abs(thisUser.target.x - thisUser.position.x) <= player.speed) {
                        thisUser.position.x = thisUser.target.x;
                    } else {
                        if (thisUser.position.x < thisUser.target.x) thisUser.position.x += player.speed;
                        if (thisUser.position.x > thisUser.target.x) thisUser.position.x -= player.speed;
                    }

                    //  Same for y
                    if (Math.abs(thisUser.target.y - thisUser.position.y) <= player.speed) {
                        thisUser.position.y = thisUser.target.y;
                    } else {
                        if (thisUser.position.y < thisUser.target.y) thisUser.position.y += player.speed;
                        if (thisUser.position.y > thisUser.target.y) thisUser.position.y -= player.speed;
                    }

                }

                //  Update the users position
                otherPlayer = $('#other_player_holder_' + user);
                if (otherPlayer.length === 0) {
                    var otherPlayerSprite = $('<div>').addClass('other_player_holder').attr({'id': 'other_player_holder_' + user, 'data-id': user}).append(
                        $('<div>').attr('class', 'other_player_frame').append(
                            $('<div>').attr('class', 'other_player').css('background-image', 'url(img/glitchen/root_base.png)')
                        )
                    );
                    otherPlayerSprite.append($('<div>').addClass('nameLabel').text(user));
                    $('#middleground').append(otherPlayerSprite);
                }

                otherPlayer.css({
                    'transform': 'translateX(' + (thisUser.position.x - (player.size.width/2)) + 'px) translateY(' + (control.stageHeight - thisUser.position.y - player.size.height) + 'px)',
                    'z-index': 9999 - thisUser.position.y
                });

                if (thisUser.position.facing == 'left') {
                    $('#other_player_holder_' + user + ' .other_player_frame').addClass('facingLeft');
                } else {
                    $('#other_player_holder_' + user + ' .other_player_frame').removeClass('facingLeft');
                }

                if (isMoving) {
                    frame = Math.floor((new Date() - thisUser.startTime) / 50) % 11;
                    $('#other_player_holder_' + user + ' .other_player').css('background-position', -(frame * player.size.width) + 'px 0');
                } else {
                    $('#other_player_holder_' + user + ' .other_player').css('background-position', -(14 * player.size.width) + 'px 0');
                }

            }
        }, 40);

        this.setSockets();

    },


    setSockets: function() {
        

        //  When the player has connected we can allow them to change their name
        socket.on('connect', function() {
            $('.instructions').fadeOut('slow');
            socket.emit('adduser', player.username, room.label, player.position.x, player.position.y, player.position.facing);
            player.connected = true;
            $('.newName').removeAttr('disabled');
            $('.nameChange button').removeAttr('disabled');


        });
        
        //  Don't send keypresses to the game window
        $('.nameChange').bind('keydown', function(e) {
            e.stopPropagation();
            if (e.keyCode == 13) {
                $('.nameChange button').click();
            }
        });

        //  If the user hits the change name button, then send it off to the backend
        $('.nameChange button').bind('click', function() {
            var newName = $('.newName').val().replace(/\ /g, '_').replace(/[^a-zA-Z 0-9 ]+/g,'');
            console.log(newName);
            if (newName !== '' && newName !== player.username) {
                socket.emit('changeName', newName);
            }
        });


        //  Send the position to the server
        setInterval(function() {
            //  If we aren't loaded or connected then dont do this
            if (!player.loaded) return;
            if (!player.connected) return;

            socket.emit('setPosition', {x: player.position.x, y: player.position.y, facing: player.position.facing});

        }, 333);

        socket.on('changeName', function (oldName, newName) {

            //  If the oldName was the player, then we update the player
            //  name so nothing funky goes on
            if (player.username == oldName) {
                player.username = newName;
                $('.player_holder .nameLabel').text(newName.replace(/_/g, ' '));
                //  Just incase we've gotten the player as a new
                //  other player, due to timing kill it
                setTimeout(function() {
                    $('#other_player_holder_' + newName).remove();
                }, 200);

                //  Store the name
                try {
                    localStorage.username = newName;
                } catch(er) {
                    //Nowt
                }

            } else {
                //  Try and swap the id on the hodler
                $('#other_player_holder_' + oldName).attr('id', 'other_player_holder_' + newName);
                $('#other_player_holder_' + newName + ' .nameLabel').attr('data-id', newName).text(newName.replace(/_/g, ' '));
                delete player.otherUsers[oldName];
                setTimeout(function() {
                    console.log('Removing #other_player_holder_' + oldName);
                    $('#other_player_holder_' + oldName).remove();
                }, 200);
            }

        });

        /*
        //  If a name has been changed we handle that here
        socket.io('changeName', function(oldName, newName) {

            //  If the oldName was the player, then we update the player
            //  name so nothing funky goes on
            if (player.username == oldName) {
                $('.player_holder .nameLabel').text(newName);
                //  Just incase we've gotten the player as a new
                //  other player, due to timing kill it
                setTimeout(function() {
                    $('#other_player_holder_' + newName).remove();
                }, 200)
            }

            //  Check to make sure the old glitch doesn't exists somehow
            //  and if it does kill it
            $('#other_player_holder_' + oldName).remove();

        });
        */

        //  On getting positions back from the server
        socket.on('positions', function (users) {

            for (var user in users) {
                if (user != player.username) {
                    if (user in player.otherUsers) {
                        player.otherUsers[user].target = {
                            x: users[user].x,
                            y: users[user].y,
                            facing: users[user].facing
                        };
                        player.otherUsers[user].position.facing = users[user].facing;
                    } else {
                        player.otherUsers[user] = {
                            position: {
                                x: users[user].x,
                                y: users[user].y,
                                facing: users[user].facing
                            },
                            target: {
                                x: users[user].x,
                                y: users[user].y,
                                facing: users[user].facing
                            },
                            startTime: new Date()
                        };
                    }
                }
            }
        });

        socket.on('leaveRoom', function(userId) {
            delete player.otherUsers[userId];
            $('#other_player_holder_' + userId).remove();
        });


        //  Localchat
        $('.localChat input').bind('keydown', function(e) {
            e.stopPropagation();
            if (e.keyCode == 13) {
                socket.emit('localChat', $('.localChat input').val());
                $('.localChat input').val('');
            }
        });

        socket.on('localChat', function (username, msg) {
            console.log(username + ': ' + msg);
            var strong = $('<strong>').text(username + ': ');
            var li = $('<li>').text(msg);
            li.prepend(strong);
            $('.localChat ul').append(li);

            //  Count the amount of li so we can remove some if we have too many
            while ($('.localChat li').length > 100) {
                $($('.localChat li')[0]).remove();
            }
        });

        //  globalChat
        $('.globalChat input').bind('keydown', function(e) {
            e.stopPropagation();
            if (e.keyCode == 13) {
                socket.emit('globalChat', $('.globalChat input').val());
                $('.globalChat input').val('');
            }
        });

        socket.on('globalChat', function (username, msg) {
            console.log(username + ': ' + msg);
            var strong = $('<strong>').text(username + ': ');
            var li = $('<li>').text(msg);
            li.prepend(strong);
            $('.globalChat ul').append(li);

            //  Count the amount of li so we can remove some if we have too many
            while ($('.globalChat li').length > 100) {
                $($('.globalChat li')[0]).remove();
            }
        });

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