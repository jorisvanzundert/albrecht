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
      osd_viewer.setVisible( false );
      osd_viewer.close();
      osd_viewer.open({
        tileSource: '/iipsrv/iipsrv.fcgi?IIIF=' + image_data.file_name + '/info.json',
        degrees: image_data.rotation,
        opacity: 0,
        success: fade
      });
      var min_zoom_level = 1.0;
      if( image_data.width == 120 ){
        document.getElementById( 'viewer' ).style.width = "668px";
      } else {
        document.getElementById( 'viewer' ).style.width = "376px";
        var min_zoom_level = 1/0.75;
      }
      osd_viewer.viewport.minZoomLevel = min_zoom_level;
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
    autoResize: true,
    minZoomLevel: 1,
    constrainDuringPan: true,
    tileSources: [ "/iipsrv/iipsrv.fcgi?IIIF=IMG_0805.tif/info.json" ]
  });
}

var fade = function( evt_obj ) {
  targetOpacity = 1;
  image = evt_obj.item;
  var currentOpacity = image.getOpacity();
  osd_viewer.setVisible( true );
  var step = (targetOpacity - currentOpacity) / 50;
  if (step === 0) {
    return;
  }
  var frame = function() {
    currentOpacity += step;
    if ((step > 0 && currentOpacity >= targetOpacity) || (step < 0 && currentOpacity <= targetOpacity)) {
      image.setOpacity(targetOpacity);
      return;
    }
    image.setOpacity(currentOpacity);
    OpenSeadragon.requestAnimationFrame(frame);
  };
  OpenSeadragon.requestAnimationFrame(frame);
};
