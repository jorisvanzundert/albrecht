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
var viewers = {};

function document_loaded() {
  document.addEventListener( 'touchmove', function(e) { e.preventDefault(); }, isPassive() ? {
    capture: false,
    passive: false
  } : false);
  i_scroller = new IScroll( '#wrapper', { scrollX: true, scrollY: false, probeType: 3, mouseWheel: true, tap: true });
  i_scroller.on( 'scroll', updatePosition );
  i_scroller.on( 'scrollEnd', updatePosition );
  lazy_loader = new Blazy( { container: '#scroller' } );
  document.querySelectorAll( '.b-lazy.thumbnail' ).forEach( function( element ) {
    element.addEventListener( 'tap', function() {
      var image_data = JSON.parse( this.getAttribute( 'data-img' ) );
      var osd_viewer = get_viewer_for( image_data );
      console.log( osd_viewer.world.getItemCount() );
      osd_viewer.addTiledImage( {
        tileSource: '/iipsrv/iipsrv.fcgi?IIIF=' + image_data.file_name + '/info.json',
        degrees: image_data.rotation,
        opacity: 0,
        success: function(evt_obj) {
          //if viewer.active -> viewer.addtile -> cross fade images of that viewer
          //else fade out viewer.active, fade in this viewer
          if( osd_viewer.world.getItemAt(0).getOpacity() != 0 ) {
            // we need to crossfade the two images in this viewer
            // and then we need to delete one and move the other in its place
            if( osd_viewer.world.getItemCount() > 2 ) { // item added *while* still cross fading
              osd_viewer.world.removeItem( osd_viewer.world.getItemAt(1) );
              osd_viewer.world.setItemIndex( osd_viewer.world.getItemAt(2), 1 );
            }
            fade_out_item = osd_viewer.world.getItemAt(0);
            fade_in_item = osd_viewer.world.getItemAt(1);
            fade_item( fade_out_item, 0 )
            fade_item( fade_in_item, 1, function() {
              osd_viewer.world.removeItem( fade_out_item );
              osd_viewer.world.setItemIndex( fade_in_item, 0 );
            } );
          } else {
            fade_out_osd_viewer = Object.values( viewers ).find( function( viewer ){
              return viewer.world.getItemAt(0).getOpacity() != 0
            })
            if( fade_out_osd_viewer != undefined ) { //Need to set first one still
              fade_viewer( fade_out_osd_viewer, 0 )
            }
            osd_viewer.world.getItemAt(0).setOpacity( 1.0 );
            fade_viewer( osd_viewer, 1, function() {
              if( fade_out_osd_viewer != undefined ) { //Need to set first one still
                fade_out_osd_viewer.world.getItemAt(0).setOpacity( 0 );
              }
            });
          }
        }
      } );
    }, false );
  });
}

var get_viewer_for = function( image_data ) {
  // Checks if there's a viewer html element (div) for this type of aspect ratio.
  // If not, creates element and viewer.
  var viewer_element = document.getElementById( 'viewer_' + image_data.width ) || create_element_with_viewer( image_data );
  return viewers[ 'viewer_' + image_data.width ];
}

var create_element_with_viewer = function( image_data ) {
  var viewer_container_element = document.createElement( 'div' );
  viewer_container_element.setAttribute( 'id', 'viewer_container_' + image_data.width );
  viewer_container_element.classList.add( 'viewer_container' );
  var viewer_element = document.createElement( 'div' );
  viewer_element.setAttribute( 'id', 'viewer_' + image_data.width );
  viewer_element.classList.add( 'viewer' );
  viewer_container_element.appendChild( viewer_element );
  document.getElementById( 'viewers' ).appendChild( viewer_container_element );
  var viewer_element_height = Number( window.getComputedStyle( viewer_element ).getPropertyValue( 'height' ).match( /^\d+/ )[0] );
  var viewer_element_width = ( ( image_data.width / image_data.height ) * (viewer_element_height) ).toString() + 'px';
  viewer_element.style.width = viewer_element_width;
  var min_zoom_level = 1.0;
  if( image_data.rotation == 90 || image_data.rotation == 270 ) {
    min_zoom_level = viewer_element_height/viewer_element_width;
  }
  viewers[ 'viewer_' + image_data.width ] = new OpenSeadragon( {
    id: 'viewer_' + image_data.width,
    prefixUrl: "js/openseadragon-bin-2.3.1/images/",
    sequenceMode: false,
    showZoomControl: false,
    showFullPageControl: false,
    showHomeControl: false,
    viewportMargins: {top: 0, left: 0, right: 0, bottom: 0},
    visibilityRatio: 1,
    autoResize: true,
    preserveImageSizeOnResize: true,
    minZoomLevel: min_zoom_level,
    minZoomImageRatio : 1.0,
    constrainDuringPan: true
  } );
  return viewer_element;
}

var fade_item = function( osd_image, targetOpacity, call_back ) {
  var currentOpacity = osd_image.getOpacity();
  var step = (targetOpacity - currentOpacity) / 100;
  if (step === 0) {
    return;
  }
  var frame = function() {
    currentOpacity += step;
    if ((step > 0 && currentOpacity >= targetOpacity) || (step < 0 && currentOpacity <= targetOpacity)) {
      osd_image.setOpacity(targetOpacity);
      if( call_back != undefined ) { call_back() };
      return;
    }
    osd_image.setOpacity(currentOpacity);
    OpenSeadragon.requestAnimationFrame(frame);
  };
  OpenSeadragon.requestAnimationFrame(frame);
};

var fade_viewer = function( osd_viewer, targetOpacity, call_back ) {
  var viewer_element = document.getElementById( osd_viewer.id );
  var currentOpacity = Number( viewer_element.style.opacity );
  var step = (targetOpacity - currentOpacity) / 100;
  if (step === 0) {
    return;
  }
  var frame = function() {
    currentOpacity += step;
    if ((step > 0 && currentOpacity >= targetOpacity) || (step < 0 && currentOpacity <= targetOpacity)) {
      viewer_element.style.opacity = targetOpacity;
      if( call_back != undefined ) { call_back() };
      return;
    }
    viewer_element.style.opacity = currentOpacity;
    window.requestAnimationFrame(frame);
  };
  window.requestAnimationFrame(frame);
};
