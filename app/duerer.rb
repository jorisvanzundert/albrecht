require 'sinatra'
require 'logger'
require 'sinatra/reloader'

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

  get '/test' do
    headers 'Access-Control-Allow-Origin' => '*'
    "dit is alleen om te testen"
    # erb :reynaert
  end
