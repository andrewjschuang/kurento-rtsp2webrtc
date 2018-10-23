/*
* (C) Copyright 2014 Kurento (http://kurento.org/)
*
* All rights reserved. This program and the accompanying materials
* are made available under the terms of the GNU Lesser General Public License
* (LGPL) version 2.1 which accompanies this distribution, and is available at
* http://www.gnu.org/licenses/lgpl-2.1.html
*
* This library is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
* Lesser General Public License for more details.
*
*/

function getopts(args, opts)
{
  var result = opts.default || {};
  args.replace(
      new RegExp("([^?=&]+)(=([^&]*))?", "g"),
      function($0, $1, $2, $3) { result[$1] = $3; });

  return result;
};

var args = getopts(location.search,
{
  default:
  {
    ws_uri: 'ws://' + location.hostname + ':8888/kurento',
    hat_uri: 'https://vignette.wikia.nocookie.net/liberproeliis/images/d/dc/Wing_mario_hat_copie_by_banjo2015-d8lf6e9.png/revision/latest?cb=20170407135810&path-prefix=pt-br',
    ice_servers: undefined
  }
});

if (args.ice_servers) {
  // console.log("Use ICE servers: " + args.ice_servers);
  kurentoUtils.WebRtcPeer.prototype.server.iceServers = JSON.parse(args.ice_servers);
} else {
  // console.log("Use freeice")
}


window.addEventListener('load', function(){
  console = new Console('console', console);

  var videoInput = document.getElementById('videoInput');
  var videoOutput = document.getElementById('videoOutput');

	var address = document.getElementById('address');
  address.value = 'rtsp://admin:CPqd123$$@10.50.11.111/LiveMedia/ch1/Media1';
  
  var pipeline;
  var webRtcPeer;

  startButton = document.getElementById('start');
  startButton.addEventListener('click', start);

  stopButton = document.getElementById('stop');
  stopButton.addEventListener('click', stop);

  function start() {
  	if(!address.value){
  	  window.alert("You must set the video source URL first");
  	  return;
    }
    
  	address.disabled = true;
  	showSpinner(videoInput);
  	showSpinner(videoOutput);
    
    var options = {
      remoteVideo: videoOutput
    }
    
    webRtcPeer = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(options,
      function(error){
        if(error){
          return console.error(error);
        }

        webRtcPeer.generateOffer(onOffer);

        webRtcPeer.peerConnection.addEventListener('iceconnectionstatechange', function(event){
          if(webRtcPeer && webRtcPeer.peerConnection){
            // console.log("oniceconnectionstatechange -> " + webRtcPeer.peerConnection.iceConnectionState);
            // console.log('icegatheringstate -> ' + webRtcPeer.peerConnection.iceGatheringState);
          }
        });

        var option = {
          remoteVideo : videoInput
        }

        webRtcPeer2 = kurentoUtils.WebRtcPeer.WebRtcPeerRecvonly(option,
          function(error){
            if(error){
              return console.error(error);
            }
    
            webRtcPeer2.generateOffer(onOffer2);
    
            webRtcPeer2.peerConnection.addEventListener('iceconnectionstatechange', function(event){
              if(webRtcPeer2 && webRtcPeer2.peerConnection){
                // console.log("oniceconnectionstatechange -> " + webRtcPeer2.peerConnection.iceConnectionState);
                // console.log('icegatheringstate -> ' + webRtcPeer2.peerConnection.iceGatheringState);
              }
            });
          });
      });
  }

  function onOffer(error, sdpOffer){
    if(error) return onError(error);

  	kurentoClient(args.ws_uri, function(error, kurentoClient) {
  		if(error) return onError(error);

  		kurentoClient.create("MediaPipeline", function(error, pipeline) {
        if(error) return onError(error);
        
  			pipeline.create("PlayerEndpoint", {uri: address.value}, function(error, player){
          if(error) return onError(error);
          
          console.log('Got PlayerEndpoint');

          pipeline.create("WebRtcEndpoint", function(error, webRtcEndpoint){
            if(error) return onError(error);

            console.log('Got WebRtcEndpoint');

            setIceCandidateCallbacks(webRtcEndpoint, webRtcPeer, onError);

            webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer){
              if(error) return onError(error);

              webRtcEndpoint.gatherCandidates(onError);

              webRtcPeer.processAnswer(sdpAnswer);
            });

            pipeline.create('FaceOverlayFilter', function(error, filter){
              if(error) return onError(error);

              console.log('Got FaceOverlayFilter');

              filter.setOverlayedImage(args.hat_uri, -0.35, -1.2, 1.6, 1.6, function(error){
                if(error) return onError(error);

                console.log('Set overlay image');
              });

              player.connect(filter, function(error){
                if(error) return onError(error);
                
                console.log('player >>> filter');

                filter.connect(webRtcEndpoint, function(error){
                  if(error) return onError(error);

                  console.log('filter >>> webRtcEndpoint');

                  player.play(function(error){
                    if(error) return onError(error);

                    console.log('Player playing...');
                  });
                });
              });
            });
  			  });
  			});
  		});
  	});
  }

  function onOffer2(error, sdpOffer){
    if(error) return onError(error);

  	kurentoClient(args.ws_uri, function(error, kurentoClient) {
  		if(error) return onError(error);

  		kurentoClient.create("MediaPipeline", function(error, pipeline) {
        if(error) return onError(error);
        
  			pipeline.create("PlayerEndpoint", {uri: address.value}, function(error, player){
          if(error) return onError(error);
          
          console.log('Got PlayerEndpoint');

          pipeline.create("WebRtcEndpoint", function(error, webRtcEndpoint){
            if(error) return onError(error);

            console.log('Got WebRtcEndpoint');

            setIceCandidateCallbacks(webRtcEndpoint, webRtcPeer2, onError);

            webRtcEndpoint.processOffer(sdpOffer, function(error, sdpAnswer){
              if(error) return onError(error);

              webRtcEndpoint.gatherCandidates(onError);

              webRtcPeer2.processAnswer(sdpAnswer);
            });

            player.connect(webRtcEndpoint, function(error){
              if(error) return onError(error);
              
              console.log('player >>> webRtcEndpoint');

              player.play(function(error){
                if(error) return onError(error);
                console.log('Player playing...');
              });
            });
  			  });
  			});
  		});
  	});
  }

  function stop() {
    address.disabled = false;
    if (webRtcPeer) {
      webRtcPeer.dispose();
      webRtcPeer = null;
    }
    if (webRtcPeer2) {
      webRtcPeer2.dispose();
      webRtcPeer2 = null;
    }
    if(pipeline){
      pipeline.release();
      pipeline = null;
    }
    hideSpinner(videoInput);
    hideSpinner(videoOutput);
  }

});

function setIceCandidateCallbacks(webRtcEndpoint, webRtcPeer, onError){
  webRtcPeer.on('icecandidate', function(candidate){
    // console.log("Local icecandidate " + JSON.stringify(candidate));

    candidate = kurentoClient.register.complexTypes.IceCandidate(candidate);

    webRtcEndpoint.addIceCandidate(candidate, onError);

  });
  webRtcEndpoint.on('OnIceCandidate', function(event){
    var candidate = event.candidate;

    // console.log("Remote icecandidate " + JSON.stringify(candidate));

    webRtcPeer.addIceCandidate(candidate, onError);
  });
}

function onError(error) {
  if(error)
  {
    console.error(error);
    stop();
  }
}

function showSpinner() {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].poster = 'img/transparent-1px.png';
		arguments[i].style.background = "center transparent url('img/spinner.gif') no-repeat";
	}
}

function hideSpinner() {
	for (var i = 0; i < arguments.length; i++) {
		arguments[i].src = '';
		arguments[i].poster = 'img/webrtc.png';
		arguments[i].style.background = '';
	}
}

/**
 * Lightbox utility (to display media pipeline image in a modal dialog)
 */
$(document).delegate('*[data-toggle="lightbox"]', 'click', function(event) {
	event.preventDefault();
	$(this).ekkoLightbox();
});
