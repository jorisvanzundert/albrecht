// ref https://github.com/WICG/EventListenerOptions/pull/30
function isPassive() {
    var supportsPassiveOption = false;
    try {
        addEventListener("test", null, Object.defineProperty({}, 'passive', {
            get: function () {
                supportsPassiveOption = true;
            }
        }));
    } catch(e) {}
    return supportsPassiveOption;
}

function updatePosition() {
  var iscroll_event = new CustomEvent( 'scroll', { detail: "custom scroll event initiated by blazy-iscroll-uitils.js" } );
  document.getElementById( 'scroller' ).dispatchEvent( iscroll_event );
}

var i_scroller;
var lazy_loader;
var osd_viewer;

function document_loaded() {
  document.addEventListener('touchmove', function(e) { e.preventDefault(); }, isPassive() ? {
    capture: false,
    passive: false
  } : false);
  i_scroller = new IScroll('#wrapper', { scrollX: true, scrollY: false, probeType: 3, mouseWheel: true, tap: true });
  i_scroller.on('scroll', updatePosition);
  i_scroller.on('scrollEnd', updatePosition);
  lazy_loader = new Blazy( { container: "#scroller" } );
  document.querySelectorAll(".b-lazy.thumbnail").forEach( function( element ) {
    element.addEventListener( 'tap', function() {
      var image_data = JSON.parse( this.getAttribute('data-img') );
      // Next line is just bragging about how good my JavaScript is, I guess.
      // It uses the opacity of the image at location 0 in the stack to determine whether the image
      // at index 0 or 1 needs to be replaced—the one with opacity NOT 1 should be replaced.
      // The corner case is if a user hits another thumbnail to be loaded while we're still in the fading process,
      // in which case the image at index 1 will always be replaced by the new image and that will continue to fade in.
      var image_index = Math.floor( osd_viewer.world.getItemAt(0).getOpacity() )
      console.log( osd_viewer.world.getItemAt(0).getOpacity() );
      console.log( 'i: ' + image_index );
      console.log( 't: ' + osd_viewer.world.getItemCount() );
      osd_viewer.addTiledImage({
        tileSource: '/iipsrv/iipsrv.fcgi?IIIF=' + image_data.file_name + '/info.json',
        degrees: image_data.rotation,
        opacity: 0,
        index: image_index,
        replace: true,
        success: function( evt_obj ) {
          var target_width = 668;
          if( image_data.width != 120 ){
            target_width = 376;
          }
          resize_viewer( evt_obj.item, target_width );
          fade( evt_obj.item, 1 );
          fade( osd_viewer.world.getItemAt( Number( !image_index ) ), 0 );
        }
      });
    }, false );
  });
  osd_viewer = new OpenSeadragon({
    id: "viewer",
    prefixUrl: "js/openseadragon-bin-2.3.1/images/",
    sequenceMode: false,
    showZoomControl: false,
    showFullPageControl: false,
    showHomeControl: false,
    viewportMargins: {top: 0, left: 0, right: 0, bottom: 0},
    visibilityRatio: 1,
    autoResize: false,
    preserveImageSizeOnResize: false,
    minZoomLevel: 1,
    constrainDuringPan: true,
    tileSources: [ "/iipsrv/iipsrv.fcgi?IIIF=IMG_0805.tif/info.json" ]
  });
}


var resize_viewer = function( osd_image, target_width ) {
  var current_width = Number( document.getElementById('viewer').style.width.match( /^\d+/ ) );
  var step = ( target_width - current_width ) / 100;
  if (step === 0) {
    return;
  }
  var frame = function() {
    current_width += step;
    if ((step > 0 && current_width >= target_width) || (step < 0 && current_width <= target_width)) {
      document.getElementById('viewer').style.width = target_width.toString() + 'px';
      console.log( 'done' );
      return;
    }
    document.getElementById('viewer').style.width = current_width.toString() + 'px';
    if( step < 0 ) {
      osd_image.viewport.fitHorizontally(true); console.log( 'vfit' );
    } else {
      osd_image.viewport.fitHorizontally(true); console.log( 'hfit' );
    }
    OpenSeadragon.requestAnimationFrame(frame);
  }
  OpenSeadragon.requestAnimationFrame(frame);
}

// Okay, what ought to work is step wise:
//   viewport.resize({x,y})
//   viewport.fitHorizontally()
//
var fade = function( osd_image, targetOpacity ) {
  var currentOpacity = osd_image.getOpacity();
  var step = (targetOpacity - currentOpacity) / 100;
  if (step === 0) {
    return;
  }
  var frame = function() {
    currentOpacity += step;
    if ((step > 0 && currentOpacity >= targetOpacity) || (step < 0 && currentOpacity <= targetOpacity)) {
      osd_image.setOpacity(targetOpacity);
      return;
    }
    osd_image.setOpacity(currentOpacity);
    OpenSeadragon.requestAnimationFrame(frame);
  };
  OpenSeadragon.requestAnimationFrame(frame);
};
