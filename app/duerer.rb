require 'sinatra'
require 'logger'
require 'sinatra/reloader'
require 'exifr/tiff'
require 'json'

  ::Logger.class_eval { alias :write :'<<' }
  access_log = ::File.join(::File.dirname(::File.expand_path(__FILE__)),'log','access.log')
  access_logger = ::Logger.new(access_log)
  error_logger = ::File.new(::File.join(::File.dirname(::File.expand_path(__FILE__)),'log','error.log'),"a+")
  error_logger.sync = true


  configure do
    use ::Rack::CommonLogger, access_logger
    enable :reloader
    set :public_folder, '/home/theo/WebApps/albrecht/public'
  end

  before {
    env["rack.errors"] =  error_logger
  }

  get '/' do
    'Success. Sinatra running at your convenience.'
  end

  get '/thumbnail' do
    headers 'Access-Control-Allow-Origin' => '*'
    orientations = {
      1 => [ "width:120px", "ROT=0", "HEI=90", { :width => 120, :height => 90, :rotation => 0 } ],
      6 => [ "width:67px", "ROT=90", "WID=90", { :width => 67, :height => 90, :rotation => 90 } ],
      3 => [ "width:120px", "ROT=180", "HEI=90", { :width => 120, :height => 90, :rotation => 180 } ],
      8 => [ "width:67px", "ROT=!270", "WID=90", { :width => 67, :height => 90, :rotation => 270 } ]
    }
    @thumbnails = Dir.glob( "../../images/*.tif" ).map do |file_name|
      orientation = orientations[ EXIFR::TIFF.new( file_name ).orientation.to_i ]
      data_img = orientation[3]
      data_img[ :file_name ] = File.basename( file_name )
      error_logger.write( data_img.to_json )
      "<img class=\"b-lazy thumbnail\" style=\"#{orientation[0]};height:90px;\" src=data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw== data-src=\"/iipsrv/iipsrv.fcgi?FIF=#{data_img[ :file_name ]}&#{orientation[1]}&#{orientation[2]}&CVT=jpeg\" data-img=\"#{CGI::escapeHTML( data_img.to_json )}\">"
    end
    erb :thumbnail_view
  end
