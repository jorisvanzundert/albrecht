images_dir = File.join( File.dirname(__FILE__), 'pictures/originals/' )
puts images_dir
image_file_names = Dir.glob( images_dir << '*.JPG' )
image_file_names.each do |image_file_name|
  image_name = File.basename( image_file_name, ".JPG" )
  puts "converting #{image_name}"
  `convert #{image_file_name} -define tiff:tile-geometry=256x256 -compress jpeg 'ptif:./pictures/pyramidic_tifs/#{image_name}.tif'`
  `exiftool -overwrite_original -tagsFromFile #{image_file_name} -All:All --IFD1:All ./pictures/pyramidic_tifs/#{image_name}.tif`
end
